const mongoose = require('mongoose');
const { STATUSES, PRIORITIES } = require('../utils/constants');

const attachmentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    data: {
      type: Buffer,
      required: true
    }
  },
  { _id: false }
);

const grievanceSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be between 5 and 200 characters'],
      maxlength: [200, 'Title must be between 5 and 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be between 10 and 2000 characters'],
      maxlength: [2000, 'Description must be between 10 and 2000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    priority: {
      type: String,
      enum: Object.values(PRIORITIES),
      default: PRIORITIES.MEDIUM
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      minlength: [3, 'Location must be at least 3 characters'],
      maxlength: [300, 'Location cannot exceed 300 characters']
    },
    attachments: {
      type: [attachmentSchema],
      default: []
    },
    status: {
      type: String,
      enum: Object.values(STATUSES),
      default: STATUSES.SUBMITTED
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        trim: true
      }
    },
    escalated: {
      type: Boolean,
      default: false
    },
    reopenCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes matching README specifications
grievanceSchema.index({ status: 1 });
grievanceSchema.index({ department: 1, status: 1 });
grievanceSchema.index({ citizen: 1 });

grievanceSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Grievance = mongoose.model('Grievance', grievanceSchema);

module.exports = Grievance;
