import mongoose from 'mongoose';

const panelStudentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Induction',
      required: true,
    },
    sequence: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    isFinalized: {
      type: Boolean,
      default: false,
    },
    finalStatus: {
      type: String,
      enum: ['applied', 'shortlisted_online', 'shortlisted_offline', 'selected', 'rejected', null],
      default: null,
    },
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    finalizedAt: {
      type: Date,
      required: false,
    },
    finalNote: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false },
);

const inductionPanelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    students: [panelStudentSchema],
    piStarted: {
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
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

inductionPanelSchema.index({ name: 1 });
inductionPanelSchema.index({ members: 1 });
inductionPanelSchema.index({ 'students.student': 1 });

const InductionPanel = mongoose.model('InductionPanel', inductionPanelSchema);

export default InductionPanel;
