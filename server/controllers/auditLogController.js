const mongoose = require('mongoose');
const StatusHistory = require('../models/StatusHistory');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

/**
 * @desc    Get paginated system-wide audit logs (StatusHistory entries)
 * @route   GET /api/v1/audit-logs
 * @access  Admin only
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};

  // Filter by specific grievance
  if (req.query.grievance && mongoose.Types.ObjectId.isValid(req.query.grievance)) {
    filter.grievance = req.query.grievance;
  }

  // Filter by actor who changed status
  if (req.query.changedBy && mongoose.Types.ObjectId.isValid(req.query.changedBy)) {
    filter.changedBy = req.query.changedBy;
  }

  // Optional date range filter on timestamp
  if (req.query.from || req.query.to) {
    filter.timestamp = {};
    if (req.query.from) {
      const fromDate = new Date(req.query.from);
      if (!isNaN(fromDate.getTime())) {
        filter.timestamp.$gte = fromDate;
      }
    }
    if (req.query.to) {
      const toDate = new Date(req.query.to);
      if (!isNaN(toDate.getTime())) {
        filter.timestamp.$lte = toDate;
      }
    }
  }

  const [auditLogs, totalDocs] = await Promise.all([
    StatusHistory.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('changedBy', 'name role')
      .populate('grievance', 'trackingId title'),
    StatusHistory.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalDocs / limit) || 1;

  const pagination = {
    page,
    limit,
    totalDocs,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };

  return success(
    res,
    { auditLogs },
    'Audit logs retrieved successfully',
    200,
    pagination
  );
});

module.exports = {
  getAuditLogs
};
