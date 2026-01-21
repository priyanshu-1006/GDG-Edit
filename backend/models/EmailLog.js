
import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
    recipient: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['sent', 'failed', 'queued'],
        default: 'sent',
    },
    messageId: {
        type: String,
    },
    error: {
        type: String,
    },
    type: {
        type: String,
        enum: ['welcome', 'registration', 'qualification', 'general', 'alert', 'other'],
        default: 'other',
    },
    metadata: {
        type: Map,
        of: String, // Store eventId, userId, etc.
    },
    sentAt: {
        type: Date,
        default: Date.now,
    }
});

// Index for faster searching
emailLogSchema.index({ recipient: 1 });
emailLogSchema.index({ sentAt: -1 });

const EmailLog = mongoose.model('EmailLog', emailLogSchema);

export default EmailLog;
