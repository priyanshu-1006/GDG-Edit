import mongoose from 'mongoose';

const inductionAdvancementRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Induction',
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedByName: {
    type: String,
    required: true
  },
  requestedByRole: {
    type: String,
    required: true,
    enum: ['event_manager', 'admin']
  },
  currentStatus: {
    type: String,
    required: true
  },
  targetStatus: {
    type: String,
    required: true,
    enum: ['shortlisted_online', 'shortlisted_offline', 'selected', 'rejected']
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedByName: {
    type: String
  },
  reviewedAt: {
    type: Date
  },
  reviewNote: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index for efficient queries
inductionAdvancementRequestSchema.index({ student: 1, status: 1 });
inductionAdvancementRequestSchema.index({ requestedBy: 1, status: 1 });
inductionAdvancementRequestSchema.index({ status: 1, createdAt: -1 });

const InductionAdvancementRequest = mongoose.model('InductionAdvancementRequest', inductionAdvancementRequestSchema);

export default InductionAdvancementRequest;
