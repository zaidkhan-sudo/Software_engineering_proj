const Notification = require('../models/Notification');
const User = require('../models/User');
const { ROLES } = require('../utils/constants');

let socketIO = null;

/**
 * Initialize Socket.IO instance for notification delivery
 * @param {object} io - Socket.IO Server instance
 */
const init = (io) => {
  socketIO = io;
};

/**
 * Deliver persistent notification and real-time Socket.IO event to a user
 * @param {string|mongoose.Types.ObjectId} userId - Recipient user ID
 * @param {object} options
 * @param {string} options.message - Notification message text
 * @param {string|mongoose.Types.ObjectId} [options.grievanceId] - Optional associated grievance ID
 * @param {string} [options.event] - Optional custom socket event name (e.g. 'status-update')
 * @param {object} [options.payload] - Optional payload for custom socket event
 * @returns {Promise<object|null>} Created notification document
 */
const notifyUser = async (userId, { message, grievanceId = null, event = null, payload = null }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      message,
      grievance: grievanceId
    });

    if (socketIO) {
      const room = `user:${userId.toString()}`;
      
      // Standard notification event for badges and lists
      socketIO.to(room).emit('notification', {
        _id: notification._id,
        user: notification.user,
        message: notification.message,
        grievance: notification.grievance,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      });

      // Custom real-time event (e.g. 'status-update' for active grievance views)
      if (event && payload) {
        socketIO.to(room).emit(event, payload);
      }
    }

    return notification;
  } catch (err) {
    console.error('Error in notifyUser:', err.message);
    return null;
  }
};

/**
 * Deliver persistent notification and real-time event to all active admins
 * @param {object} options
 * @param {string} options.message - Notification message text
 * @param {string|mongoose.Types.ObjectId} [options.grievanceId] - Optional grievance ID
 * @param {string} [options.event] - Optional socket event name
 * @param {object} [options.payload] - Optional socket payload
 */
const notifyAdmins = async ({ message, grievanceId = null, event = null, payload = null }) => {
  try {
    const admins = await User.find({ role: ROLES.ADMIN, isActive: true }).select('_id');
    if (!admins.length) return [];

    const docs = admins.map((admin) => ({
      user: admin._id,
      message,
      grievance: grievanceId
    }));

    const notifications = await Notification.insertMany(docs);

    if (socketIO) {
      socketIO.to('admins').emit('notification', {
        message,
        grievance: grievanceId,
        createdAt: new Date()
      });

      if (event && payload) {
        socketIO.to('admins').emit(event, payload);
      }
    }

    return notifications;
  } catch (err) {
    console.error('Error in notifyAdmins:', err.message);
    return [];
  }
};

module.exports = {
  init,
  notifyUser,
  notifyAdmins
};
