import mongoose from 'mongoose';

const immerseContactSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['company', 'student', 'sponsor', 'speaker', 'other'],
    required: true,
  },
  // Common fields
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    default: null,
  },
  // Company specific fields
  companyName: {
    type: String,
    default: null,
  },
  designation: {
    type: String,
    default: null,
  },
  website: {
    type: String,
    default: null,
  },
  industry: {
    type: String,
    default: null,
  },
  // Student specific fields
  college: {
    type: String,
    default: null,
  },
  year: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  branch: {
    type: String,
    default: null,
  },
  registrationId: {
    type: String,
    default: null,
  },
  // Sponsor specific fields
  sponsorTier: {
    type: String,
    enum: ['platinum', 'gold', 'silver', 'bronze', 'partner', null],
    default: null,
  },
  sponsorAmount: {
    type: Number,
    default: null,
  },
  // Email tracking
  emailsSent: {
    type: Number,
    default: 0,
  },
  lastEmailSent: {
    type: Date,
    default: null,
  },
  emailStatus: {
    type: String,
    enum: ['active', 'unsubscribed', 'bounced'],
    default: 'active',
  },
  // Tags for grouping
  tags: [{
    type: String,
    trim: true,
  }],
  // Notes
  notes: {
    type: String,
    default: null,
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'contacted', 'interested', 'confirmed', 'declined', 'registered'],
    default: 'pending',
  },
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImmerseAdmin',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Index for faster searching
immerseContactSchema.index({ email: 1 });
immerseContactSchema.index({ type: 1 });
immerseContactSchema.index({ status: 1 });
immerseContactSchema.index({ tags: 1 });

// Update updatedAt on save
immerseContactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ImmerseContact = mongoose.model('ImmerseContact', immerseContactSchema);

export default ImmerseContact;
