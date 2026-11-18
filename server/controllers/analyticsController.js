const Grievance = require('../models/Grievance');
const Department = require('../models/Department');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { STATUSES } = require('../utils/constants');

/**
 * @desc    Get summary dashboard metrics (total, byStatus, overdue, escalated)
 * @route   GET /api/v1/analytics/summary
 * @access  Admin only
 */
const getSummary = asyncHandler(async (req, res) => {
  const escalationDays = parseInt(process.env.ESCALATION_DAYS, 10) || 7;
  const cutoffDate = new Date(Date.now() - escalationDays * 24 * 60 * 60 * 1000);

  const [total, statusAgg, overdue, escalated] = await Promise.all([
    Grievance.countDocuments(),
    Grievance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Grievance.countDocuments({
      status: { $nin: [STATUSES.RESOLVED, STATUSES.REJECTED] },
      createdAt: { $lte: cutoffDate }
    }),
    Grievance.countDocuments({ escalated: true })
  ]);

  // Initialize all known statuses with 0
  const byStatus = Object.values(STATUSES).reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});

  statusAgg.forEach((item) => {
    if (byStatus[item._id] !== undefined) {
      byStatus[item._id] = item.count;
    }
  });

  return success(
    res,
    {
      total,
      byStatus,
      overdue,
      escalated
    },
    'Analytics summary retrieved successfully',
    200
  );
});

/**
 * @desc    Get grievance counts grouped by category
 * @route   GET /api/v1/analytics/by-category
 * @access  Admin only
 */
const getByCategory = asyncHandler(async (req, res) => {
  const categories = await Grievance.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    {
      $project: {
        _id: 0,
        category: '$_id',
        count: 1
      }
    }
  ]);

  return success(
    res,
    { categories },
    'Analytics by category retrieved successfully',
    200
  );
});

/**
 * @desc    Get average resolution time (hours) per department for resolved grievances
 * @route   GET /api/v1/analytics/resolution-time
 * @access  Admin only
 */
const getResolutionTime = asyncHandler(async (req, res) => {
  const departments = await Grievance.aggregate([
    {
      $match: {
        status: STATUSES.RESOLVED,
        resolvedAt: { $exists: true, $ne: null }
      }
    },
    {
      $project: {
        department: 1,
        resolutionHours: {
          $divide: [
            { $subtract: ['$resolvedAt', '$createdAt'] },
            1000 * 60 * 60
          ]
        }
      }
    },
    {
      $group: {
        _id: '$department',
        resolvedCount: { $sum: 1 },
        avgResolutionHours: { $avg: '$resolutionHours' }
      }
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'deptDoc'
      }
    },
    { $unwind: '$deptDoc' },
    {
      $project: {
        _id: 0,
        departmentId: '$_id',
        departmentName: '$deptDoc.name',
        resolvedCount: 1,
        avgResolutionHours: { $round: ['$avgResolutionHours', 1] }
      }
    },
    { $sort: { avgResolutionHours: 1 } }
  ]);

  return success(
    res,
    { departments },
    'Resolution time analytics retrieved successfully',
    200
  );
});

module.exports = {
  getSummary,
  getByCategory,
  getResolutionTime
};
