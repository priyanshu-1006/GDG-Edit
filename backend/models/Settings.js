import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // Global flag to enable/disable new induction registration submissions
  isInductionOpen: { 
    type: Boolean, 
    default: true 
  },
  // Controls whether the homepage induction apply promo section is visible
  showInductionApplySection: {
    type: Boolean,
    default: true,
  },
  piRound: {
    type: String,
    enum: ['shortlisted_online', 'shortlisted_offline'],
    default: 'shortlisted_online',
  },
  isPiStarted: {
    type: Boolean,
    default: false,
  },
  piStartedAt: {
    type: Date,
    required: false,
  },
  piStartedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
}, { timestamps: true });

// Settings is intended to be a single-document collection. 
// Standard practice is to always query/upsert the first document.
export default mongoose.model('Settings', settingsSchema);
