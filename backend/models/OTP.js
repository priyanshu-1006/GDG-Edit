import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 120, // Auto-delete after 2 minutes (120 seconds)
  },
});

// Ensure only one active OTP per email at a time
otpSchema.index({ email: 1 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
