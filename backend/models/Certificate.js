import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Changed to allow external recipients
  },
  recipientName: {
    type: String,
    required: false // Populated from User if empty, or manual input
  },
  recipientEmail: {
    type: String,
    required: false
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: false, // Changed to false to allow custom events
  },
  customEventName: {
    type: String,
    required: false // Used if event is not selected
  },
  certificateUrl: {
    type: String,
    required: true, // Points to final cert OR template if dynamic
  },
  isDynamic: {
    type: Boolean,
    default: false
  },
  positioning: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    fontSize: { type: Number, default: 16 },
    color: { type: String, default: '#000000' }
  },
  certificateCode: {
    type: String,
    required: true,
    unique: true,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound unique index
certificateSchema.index({ user: 1, event: 1 }, { unique: true });

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
