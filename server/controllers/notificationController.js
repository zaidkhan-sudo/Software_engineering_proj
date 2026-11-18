const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { ERROR_CODES } = require('../utils/constants');

/**
 * @desc    Get paginated notifications for current user with unread count
 * @route   GET /api/v1/notifications
 * @access  Authenticated
 */
const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id };

  const [notifications, totalDocs, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('grievance', 'trackingId title status'),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false })
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
    { notifications, unreadCount },
    'Notifications retrieved successfully',
    200,
    pagination
  );
});

/**
 * @desc    Mark all user's notifications as read
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Authenticated
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  return success(
    res,
    { modifiedCount: result.modifiedCount },
    'All notifications marked as read',
    200
  );
});

/**
 * @desc    Mark a specific notification as read (own only)
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Authenticated
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Notification not found');
  }

  const notification = await Notification.findOne({
    _id: id,
    user: req.user._id
  });

  if (!notification) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Notification not found');
  }

  notification.isRead = true;
  await notification.save();

  return success(
    res,
    { notification },
    'Notification marked as read',
    200
  );
});

module.exports = {
  getNotifications,
  markAllAsRead,
  markAsRead
};
