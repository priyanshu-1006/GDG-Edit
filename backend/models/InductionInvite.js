import mongoose from 'mongoose';

const inductionInviteSchema = new mongoose.Schema(
  {
    inviteId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
    usedByEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Induction',
      required: false,
    },
    expiresAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

inductionInviteSchema.index({ inviteId: 1, token: 1 }, { unique: true });
inductionInviteSchema.index({ isUsed: 1, isActive: 1, createdAt: -1 });

const InductionInvite = mongoose.model('InductionInvite', inductionInviteSchema);

export default InductionInvite;
