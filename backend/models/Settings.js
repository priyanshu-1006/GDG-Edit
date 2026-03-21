import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // Global flag to enable/disable new induction registration submissions
  isInductionOpen: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Settings is intended to be a single-document collection. 
// Standard practice is to always query/upsert the first document.
export default mongoose.model('Settings', settingsSchema);
