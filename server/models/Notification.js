const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must belong to a user']
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    grievance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

// Compound index for querying user unread notifications efficiently (README Index table)
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
