const mongoose = require('mongoose');
const Grievance = require('../models/Grievance');
const Department = require('../models/Department');
const StatusHistory = require('../models/StatusHistory');
const Comment = require('../models/Comment');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { generateTrackingId } = require('../services/trackingIdService');
const { ROLES, STATUSES, VALID_TRANSITIONS, ERROR_CODES } = require('../utils/constants');

/**
 * State machine transition checker
 */
function canTransition(currentStatus, newStatus) {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Notification stub (will be fully implemented in Phase 6 with Socket.IO)
 */
async function notifyStatusChange(grievance, fromStatus, toStatus, remark, actor) {
  // Stub for Phase 6 Socket.IO & notification persistence
}

/**
 * Access control helper for a grievance
 * Citizens can only see their own; officers can only see their department's; admins can see all.
 */
function canAccessGrievance(user, grievance) {
  if (user.role === ROLES.ADMIN) {
    return true;
  }
  if (user.role === ROLES.OFFICER) {
    const userDeptId = (user.department?._id || user.department)?.toString();
    const grievanceDeptId = (grievance.department?._id || grievance.department)?.toString();
    return Boolean(userDeptId && grievanceDeptId && userDeptId === grievanceDeptId);
  }
  if (user.role === ROLES.CITIZEN) {
    const citizenId = (grievance.citizen?._id || grievance.citizen)?.toString();
    return Boolean(citizenId && citizenId === user._id.toString());
  }
  return false;
}

/**
 * Format attachments to exclude the binary data buffer
 */
function stripAttachmentData(attachments) {
  if (!Array.isArray(attachments)) return [];
  return attachments.map((att) => ({
    filename: att.filename,
    mimeType: att.mimeType,
    size: att.size
  }));
}

/**
 * @desc    File a new grievance (Citizen only)
 * @route   POST /api/v1/grievances
 * @access  Citizen
 */
const createGrievance = asyncHandler(async (req, res) => {
  const { title, description, category, priority, location } = req.body;

  // 1. Department routing: category must belong to an active department
  const department = await Department.findOne({
    isActive: true,
    categoriesHandled: category
  });

  if (!department) {
    throw new AppError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'No active department handles this category'
    );
  }

  // 2. Process image attachments from Multer memoryStorage
  const attachments = (req.files || []).map((file) => ({
    filename: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    data: file.buffer
  }));

  // 3. Atomically generate tracking ID (GRV-YYYY-000001)
  const trackingId = await generateTrackingId();

  // 4. Create Grievance
  const grievance = await Grievance.create({
    trackingId,
    title,
    description,
    category,
    priority,
    location,
    attachments,
    status: STATUSES.SUBMITTED,
    citizen: req.user._id,
    department: department._id
  });

  // 5. Create initial StatusHistory entry
  await StatusHistory.create({
    grievance: grievance._id,
    fromStatus: null,
    toStatus: STATUSES.SUBMITTED,
    changedBy: req.user._id,
    remark: 'Grievance filed'
  });

  // Sanitize return object to exclude binary image data
  const resultObj = grievance.toJSON();
  resultObj.attachments = stripAttachmentData(grievance.attachments);

  return success(
    res,
    { grievance: resultObj },
    'Grievance submitted successfully',
    201
  );
});

/**
 * @desc    List grievances (role-scoped, paginated, filtered)
 * @route   GET /api/v1/grievances
 * @access  Authenticated
 */
const getGrievances = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  // Base filter based on user role
  const filter = {};
  if (req.user.role === ROLES.CITIZEN) {
    filter.citizen = req.user._id;
  } else if (req.user.role === ROLES.OFFICER) {
    filter.department = req.user.department?._id || req.user.department;
  }

  // Additional query filters
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.category) {
    filter.category = req.query.category;
  }
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }
  if (req.query.escalated !== undefined) {
    filter.escalated = req.query.escalated === 'true';
  }

  // Date range filter
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) {
      filter.createdAt.$gte = new Date(req.query.from);
    }
    if (req.query.to) {
      filter.createdAt.$lte = new Date(req.query.to);
    }
  }

  // Search filter
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [{ title: searchRegex }, { trackingId: searchRegex }];
  }

  const [grievances, total] = await Promise.all([
    Grievance.find(filter)
      .select('-attachments.data')
      .populate('citizen', 'name email')
      .populate('department', 'name')
      .populate('assignedOfficer', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Grievance.countDocuments(filter)
  ]);

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1
  };

  return success(
    res,
    { grievances },
    'Grievances retrieved successfully',
    200,
    pagination
  );
});

/**
 * Shared helper to load grievance details, status history, and comments
 */
async function loadGrievanceDetails(query, user) {
  const grievance = await Grievance.findOne(query)
    .populate('citizen', 'name email phone')
    .populate('department', 'name')
    .populate('assignedOfficer', 'name email');

  if (!grievance) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  // Enforce access control rule: 404 if not authorized (do not reveal existence)
  if (!canAccessGrievance(user, grievance)) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  // Query status timeline (oldest to newest)
  const statusHistory = await StatusHistory.find({ grievance: grievance._id })
    .populate('changedBy', 'name role')
    .sort({ timestamp: 1 });

  // Query comments: staff-only internal notes are strictly filtered out for citizens
  const commentFilter = { grievance: grievance._id };
  if (user.role === ROLES.CITIZEN) {
    commentFilter.isInternal = false;
  }

  const comments = await Comment.find(commentFilter)
    .populate('author', 'name role')
    .sort({ timestamp: 1 });

  const grievanceObj = grievance.toJSON();
  grievanceObj.attachments = stripAttachmentData(grievance.attachments);

  return {
    grievance: grievanceObj,
    statusHistory,
    comments
  };
}

/**
 * @desc    Get grievance details by MongoDB ObjectId
 * @route   GET /api/v1/grievances/:id
 * @access  Authenticated
 */
const getGrievanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  const details = await loadGrievanceDetails({ _id: id }, req.user);
  return success(res, details, 'Grievance details retrieved', 200);
});

/**
 * @desc    Track grievance by tracking ID
 * @route   GET /api/v1/grievances/track/:trackingId
 * @access  Authenticated
 */
const getGrievanceByTrackingId = asyncHandler(async (req, res) => {
  const { trackingId } = req.params;
  const details = await loadGrievanceDetails({ trackingId: trackingId.trim() }, req.user);
  return success(res, details, 'Grievance details retrieved', 200);
});

/**
 * @desc    Stream attachment binary with appropriate Content-Type
 * @route   GET /api/v1/grievances/:id/attachments/:index
 * @access  Authenticated
 */
const streamAttachment = asyncHandler(async (req, res) => {
  const { id, index } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  const grievance = await Grievance.findById(id);
  if (!grievance) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  if (!canAccessGrievance(req.user, grievance)) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  const fileIndex = parseInt(index, 10);
  if (
    isNaN(fileIndex) ||
    fileIndex < 0 ||
    !grievance.attachments ||
    fileIndex >= grievance.attachments.length
  ) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Attachment not found');
  }

  const attachment = grievance.attachments[fileIndex];

  res.set('Content-Type', attachment.mimeType);
  res.set('Content-Length', attachment.size);
  res.set('Content-Disposition', `inline; filename="${attachment.filename}"`);
  return res.send(attachment.data);
});

/**
 * @desc    Update grievance status (Officer, Admin)
 * @route   PATCH /api/v1/grievances/:id/status
 * @access  Officer (same department), Admin
 */
const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, remark } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  const grievance = await Grievance.findById(id);
  if (!grievance) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  // Access check: officers can only update grievances of their own department
  if (!canAccessGrievance(req.user, grievance)) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  // State machine enforcement
  // 1. REOPENED is never allowed via this endpoint (only citizen /reopen)
  if (status === STATUSES.REOPENED) {
    throw new AppError(
      400,
      ERROR_CODES.INVALID_TRANSITION,
      'Invalid status transition'
    );
  }

  // 2. Validate allowed status transition
  if (!canTransition(grievance.status, status)) {
    throw new AppError(
      400,
      ERROR_CODES.INVALID_TRANSITION,
      'Invalid status transition'
    );
  }

  const previousStatus = grievance.status;

  // On SUBMITTED -> UNDER_REVIEW, if no officer assigned, assign to acting officer
  if (
    previousStatus === STATUSES.SUBMITTED &&
    status === STATUSES.UNDER_REVIEW &&
    !grievance.assignedOfficer
  ) {
    grievance.assignedOfficer = req.user._id;
  }

  // Set resolvedAt when status moves to RESOLVED
  if (status === STATUSES.RESOLVED) {
    grievance.resolvedAt = new Date();
  }

  grievance.status = status;
  await grievance.save();

  // Create audit trail entry
  const historyEntry = await StatusHistory.create({
    grievance: grievance._id,
    fromStatus: previousStatus,
    toStatus: status,
    changedBy: req.user._id,
    remark: remark.trim()
  });

  // Call notification hook (stub in Phase 5, wired to Socket.IO in Phase 6)
  await notifyStatusChange(grievance, previousStatus, status, remark, req.user);

  const populatedGrievance = await Grievance.findById(grievance._id)
    .select('-attachments.data')
    .populate('citizen', 'name email')
    .populate('department', 'name')
    .populate('assignedOfficer', 'name');

  return success(
    res,
    { grievance: populatedGrievance, statusHistory: historyEntry },
    'Grievance status updated successfully',
    200
  );
});

/**
 * @desc    Assign or reassign grievance to department or officer (Admin only)
 * @route   PATCH /api/v1/grievances/:id/assign
 * @access  Admin
 */
const assignGrievance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { department, assignedOfficer } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  const grievance = await Grievance.findById(id);
  if (!grievance) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  let targetDeptId = grievance.department;

  let deptName = null;
  let officerName = null;

  // If department reassigned, verify it exists and is active
  if (department) {
    const deptDoc = await Department.findById(department);
    if (!deptDoc || !deptDoc.isActive) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'Specified department does not exist or is inactive'
      );
    }
    targetDeptId = deptDoc._id;
    deptName = deptDoc.name;
    grievance.department = targetDeptId;
  }

  // If officer assigned, verify officer exists, is active, and belongs to target department
  if (assignedOfficer !== undefined) {
    if (assignedOfficer === null) {
      grievance.assignedOfficer = null;
    } else {
      const officer = await User.findById(assignedOfficer);
      if (!officer || !officer.isActive || officer.role !== ROLES.OFFICER) {
        throw new AppError(
          400,
          ERROR_CODES.VALIDATION_ERROR,
          'Specified officer does not exist, is inactive, or is not an officer'
        );
      }
      if (officer.department.toString() !== targetDeptId.toString()) {
        throw new AppError(
          400,
          ERROR_CODES.VALIDATION_ERROR,
          'Assigned officer does not belong to the grievance department'
        );
      }
      officerName = officer.name;
      grievance.assignedOfficer = officer._id;
    }
  }

  await grievance.save();

  // Create audit trail entry for reassignment (fromStatus === toStatus)
  const auditDetails = [];
  if (deptName) auditDetails.push(`department: ${deptName}`);
  if (officerName) auditDetails.push(`officer: ${officerName}`);
  const remark = auditDetails.length > 0 
    ? `Reassigned to ${auditDetails.join(', ')} by admin` 
    : 'Reassigned by admin';

  await StatusHistory.create({
    grievance: grievance._id,
    fromStatus: grievance.status,
    toStatus: grievance.status,
    changedBy: req.user._id,
    remark
  });

  const populatedGrievance = await Grievance.findById(grievance._id)
    .select('-attachments.data')
    .populate('citizen', 'name email')
    .populate('department', 'name')
    .populate('assignedOfficer', 'name');

  return success(
    res,
    { grievance: populatedGrievance },
    'Grievance reassigned successfully',
    200
  );
});

/**
 * @desc    Add comment or internal note to grievance
 * @route   POST /api/v1/grievances/:id/comments
 * @access  Authenticated (with access to grievance)
 */
const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text, isInternal } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  const grievance = await Grievance.findById(id);
  if (!grievance || !canAccessGrievance(req.user, grievance)) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  // Citizens can NEVER create internal comments
  const safeIsInternal =
    req.user.role === ROLES.CITIZEN ? false : Boolean(isInternal);

  const comment = await Comment.create({
    grievance: grievance._id,
    author: req.user._id,
    text: text.trim(),
    isInternal: safeIsInternal
  });

  const populatedComment = await Comment.findById(comment._id).populate(
    'author',
    'name role'
  );

  return success(
    res,
    { comment: populatedComment },
    'Comment added successfully',
    201
  );
});

/**
 * @desc    Submit rating and feedback for resolved grievance (Citizen only)
 * @route   POST /api/v1/grievances/:id/feedback
 * @access  Citizen (own grievance)
 */
const addFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  const grievance = await Grievance.findById(id);
  if (!grievance || grievance.citizen.toString() !== req.user._id.toString()) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  // Feedback can only be provided when status is RESOLVED
  if (grievance.status !== STATUSES.RESOLVED) {
    throw new AppError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Feedback can only be submitted for resolved grievances'
    );
  }

  // Feedback can only be provided once
  if (grievance.feedback && grievance.feedback.rating) {
    throw new AppError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Feedback has already been submitted for this grievance'
    );
  }

  grievance.feedback = {
    rating: Number(rating),
    comment: comment ? comment.trim() : ''
  };

  await grievance.save();

  return success(
    res,
    { feedback: grievance.feedback },
    'Feedback submitted successfully',
    200
  );
});

/**
 * @desc    Reopen a resolved or rejected grievance (Citizen only, max once)
 * @route   POST /api/v1/grievances/:id/reopen
 * @access  Citizen (own grievance)
 */
const reopenGrievance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  const grievance = await Grievance.findById(id);
  if (!grievance || grievance.citizen.toString() !== req.user._id.toString()) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Grievance not found');
  }

  // Strict "reopen once" rule (TC-10)
  if (grievance.reopenCount >= 1) {
    throw new AppError(
      403,
      ERROR_CODES.FORBIDDEN,
      'Grievance can only be reopened once'
    );
  }

  // Only RESOLVED or REJECTED grievances can be reopened
  if (
    grievance.status !== STATUSES.RESOLVED &&
    grievance.status !== STATUSES.REJECTED
  ) {
    throw new AppError(
      400,
      ERROR_CODES.INVALID_TRANSITION,
      'Only resolved or rejected grievances can be reopened'
    );
  }

  const previousStatus = grievance.status;
  grievance.status = STATUSES.REOPENED;
  grievance.reopenCount += 1;
  grievance.resolvedAt = null;

  await grievance.save();

  // Record StatusHistory entry with citizen's reopen reason
  await StatusHistory.create({
    grievance: grievance._id,
    fromStatus: previousStatus,
    toStatus: STATUSES.REOPENED,
    changedBy: req.user._id,
    remark: reason.trim()
  });

  // Call notification hook (stub in Phase 5, wired to Socket.IO in Phase 6)
  await notifyStatusChange(
    grievance,
    previousStatus,
    STATUSES.REOPENED,
    reason,
    req.user
  );

  const populatedGrievance = await Grievance.findById(grievance._id)
    .select('-attachments.data')
    .populate('citizen', 'name email')
    .populate('department', 'name')
    .populate('assignedOfficer', 'name');

  return success(
    res,
    { grievance: populatedGrievance },
    'Grievance reopened successfully',
    200
  );
});

module.exports = {
  createGrievance,
  getGrievances,
  getGrievanceById,
  getGrievanceByTrackingId,
  streamAttachment,
  updateStatus,
  assignGrievance,
  addComment,
  addFeedback,
  reopenGrievance,
  canAccessGrievance,
  notifyStatusChange
};
