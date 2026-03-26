import mongoose from 'mongoose';

const inductionSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
    // unique: true // temporarily disabled by admin
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    enum: [
      'Computer Science and Engineering', 'Computer Science and Engineering (CSE)', 'CSE',
      'Information Technology', 'Information Technology (IT)', 'IT',
      'Electronics and Communication Engineering', 'Electronics and Communication Engineering (ECE)', 'ECE',
      'Electrical Engineering', 'Electrical Engineering (EE)', 'EE',
      'Mechanical Engineering', 'Mechanical Engineering (ME)', 'ME',
      'Civil Engineering', 'Civil Engineering (CE)', 'CE',
      'Chemical Engineering', 'Chemical Engineering (CHE)', 'CHE',
      'Internet of Things', 'Internet of Things (IoT)', 'IoT'
    ],
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    trim: true
  },
  techStack: {
    type: String,
    trim: true
  },
  domains: [{
    type: String,
    enum: ['Web Dev', 'AI/ML', 'Cybersecurity', 'Management', 'UI/UX', 'Competitive Programming']
  }],
  projects: {
    type: String,
    trim: true
  },
  githubId: {
    type: String,
    trim: true
  },
  linkedinUrl: {
    type: String,
    trim: true
  },
  whyJoin: {
    type: String,
    required: [true, 'This field is required'],
    trim: true
  },
  interestingFact: {
    type: String,
    trim: true
  },
  otherClubs: {
    type: String,
    trim: true
  },
  residenceType: {
    type: String,
    required: [true, 'Please select hosteler or day scholar'],
    enum: ['Hosteler', 'Day Scholar']
  },
  codeforcesId: {
    type: String,
    trim: true
  },
  codechefId: {
    type: String,
    trim: true
  },
  hackerrankId: {
    type: String,
    trim: true
  },
  resumeUrl: {
    type: String,
    trim: true
  },
  strengths: {
    type: String,
    trim: true
  },
  weaknesses: {
    type: String,
    trim: true
  },
  techSkills: {
    type: String,
    trim: true
  },
  softSkills: {
    type: String,
    trim: true
  },
  leetcodeId: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['applied', 'shortlisted_online', 'shortlisted_offline', 'selected', 'rejected'],
    default: 'applied'
  }
}, {
  timestamps: true
});

// Indexes
inductionSchema.index({ status: 1 });
inductionSchema.index({ branch: 1 });

const Induction = mongoose.model('Induction', inductionSchema);

export default Induction;
