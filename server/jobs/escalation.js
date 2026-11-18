const cron = require('node-cron');
const Grievance = require('../models/Grievance');
const notificationService = require('../services/notificationService');
const { STATUSES } = require('../utils/constants');

/**
 * Scan for unresolved grievances older than ESCALATION_DAYS and flag them as escalated.
 * Notifies administrators of each escalated grievance.
 * @returns {Promise<{ escalatedCount: number }>}
 */
const runEscalation = async () => {
  const escalationDays = parseInt(process.env.ESCALATION_DAYS, 10) || 7;
  const cutoffDate = new Date(Date.now() - escalationDays * 24 * 60 * 60 * 1000);

  // Eligible statuses: SUBMITTED, UNDER_REVIEW, IN_PROGRESS, REOPENED
  const eligibleStatuses = [
    STATUSES.SUBMITTED,
    STATUSES.UNDER_REVIEW,
    STATUSES.IN_PROGRESS,
    STATUSES.REOPENED
  ];

  const overdueGrievances = await Grievance.find({
    status: { $in: eligibleStatuses },
    escalated: false,
    createdAt: { $lte: cutoffDate }
  });

  let escalatedCount = 0;

  for (const grievance of overdueGrievances) {
    grievance.escalated = true;
    await grievance.save();
    escalatedCount += 1;

    // Notify admins persistent & real-time
    await notificationService.notifyAdmins({
      message: `Grievance ${grievance.trackingId} escalated (overdue > ${escalationDays} days)`,
      grievanceId: grievance._id,
      event: 'grievance-escalated',
      payload: {
        trackingId: grievance.trackingId,
        status: grievance.status,
        message: `Escalated after ${escalationDays} days without resolution`
      }
    });
  }

  return { escalatedCount };
};

/**
 * Schedule in-process cron job to run every 6 hours ("0 * / 6 * * *")
 */
const scheduleEscalation = () => {
  cron.schedule('0 */6 * * *', async () => {
    console.log('[cron] Running scheduled grievance auto-escalation job...');
    try {
      const result = await runEscalation();
      console.log(`[cron] Auto-escalation completed. Escalated count: ${result.escalatedCount}`);
    } catch (err) {
      console.error('[cron] Auto-escalation job encountered an error:', err.message);
    }
  });
  console.log('[cron] Auto-escalation job scheduled (0 */6 * * *)');
};

module.exports = {
  runEscalation,
  scheduleEscalation
};
