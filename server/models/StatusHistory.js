const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  grievance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grievance',
    required: true,
    index: true
  },
  fromStatus: {
    type: String,
    default: null
  },
  toStatus: {
    type: String,
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remark: {
    type: String,
    required: [true, 'Remark is required'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

statusHistorySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const StatusHistory = mongoose.model('StatusHistory', statusHistorySchema);

module.exports = StatusHistory;
