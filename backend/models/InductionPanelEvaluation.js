import mongoose from 'mongoose';

const inductionPanelEvaluationSchema = new mongoose.Schema(
  {
    panel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InductionPanel',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Induction',
      required: true,
    },
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 10,
      required: false,
    },
    technicalSkills: {
      type: Number,
      min: 1,
      max: 10,
      required: false,
    },
    softSkills: {
      type: Number,
      min: 1,
      max: 10,
      required: false,
    },
    recommendation: {
      type: String,
      enum: ['hold', 'shortlisted_offline', 'selected', 'rejected'],
      default: 'hold',
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    review: {
      type: String,
      trim: true,
      default: '',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

inductionPanelEvaluationSchema.index({ panel: 1, student: 1, evaluator: 1 }, { unique: true });
inductionPanelEvaluationSchema.index({ panel: 1, student: 1 });

const InductionPanelEvaluation = mongoose.model('InductionPanelEvaluation', inductionPanelEvaluationSchema);

export default InductionPanelEvaluation;
