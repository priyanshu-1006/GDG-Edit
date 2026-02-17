import mongoose from 'mongoose';

const immerseEmailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    unique: true,
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['sponsor', 'student', 'speaker', 'general', 'follow_up', 'confirmation', 'reminder'],
    default: 'general',
  },
  htmlContent: {
    type: String,
    required: [true, 'HTML content is required'],
  },
  // Variables that can be replaced in the template
  // Example: {{name}}, {{companyName}}, {{eventDate}}
  variables: [{
    type: String,
    trim: true,
  }],
  // Preview text (shown in email clients)
  previewText: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  lastUsed: {
    type: Date,
    default: null,
  },
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
immerseEmailTemplateSchema.index({ category: 1 });
immerseEmailTemplateSchema.index({ isActive: 1 });

// Update updatedAt on save
immerseEmailTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ImmerseEmailTemplate = mongoose.model('ImmerseEmailTemplate', immerseEmailTemplateSchema);

export default ImmerseEmailTemplate;
