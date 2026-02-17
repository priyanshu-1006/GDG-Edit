import mongoose from 'mongoose';

const immerseEmailLogSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true,
  },
  recipientName: {
    type: String,
    default: null,
  },
  recipientType: {
    type: String,
    enum: ['company', 'student', 'sponsor', 'speaker', 'other'],
    default: 'other',
  },
  subject: {
    type: String,
    required: true,
  },
  htmlContent: {
    type: String,
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'queued', 'delivered', 'opened', 'clicked', 'bounced'],
    default: 'sent',
  },
  messageId: {
    type: String,
  },
  error: {
    type: String,
  },
  category: {
    type: String,
    enum: ['sponsor_outreach', 'student_notification', 'registration_confirmation', 
           'event_reminder', 'follow_up', 'general', 'bulk'],
    default: 'general',
  },
  templateUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImmerseEmailTemplate',
    default: null,
  },
  contactRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImmerseContact',
    default: null,
  },
  // Bulk email campaign tracking
  campaignId: {
    type: String,
    default: null,
  },
  campaignName: {
    type: String,
    default: null,
  },
  // Metadata for additional info
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  // Tracking events
  openedAt: {
    type: Date,
    default: null,
  },
  clickedAt: {
    type: Date,
    default: null,
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImmerseAdmin',
  },
  sentAt: {
    type: Date,
    default: Date.now,
  }
});

// Indexes for faster searching
immerseEmailLogSchema.index({ recipient: 1 });
immerseEmailLogSchema.index({ sentAt: -1 });
immerseEmailLogSchema.index({ status: 1 });
immerseEmailLogSchema.index({ category: 1 });
immerseEmailLogSchema.index({ campaignId: 1 });

const ImmerseEmailLog = mongoose.model('ImmerseEmailLog', immerseEmailLogSchema);

export default ImmerseEmailLog;
