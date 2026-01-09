import mongoose from 'mongoose';

const coreTeamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  role: {
    type: String,
    required: [true, 'Role is required'], // e.g., "Web Dev Team", "Lead"
    trim: true,
  },
  position: {
    type: String, // e.g., "GDG Lead" - used for specific filtering
    trim: true,
  },
  badge: {
    type: String, // e.g., "Web Developer", "Designer"
    trim: true,
  },
  year: {
    type: String, // e.g., "2024"
  },
  image: {
    type: String,
    default: "https://res.cloudinary.com/ddf4mvmbe/image/upload/v1759042667/GDG_Logo.svg" // Default placeholder
  },
  social: {
    linkedin: String,
    twitter: String,
    github: String,
    instagram: String
  },
  category: {
    type: String, // Helper for filtering: "lead", "core", "organizer", "volunteer"
    default: 'core'
  },
  visible: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
});

const CoreTeamMember = mongoose.model('CoreTeamMember', coreTeamMemberSchema);

export default CoreTeamMember;
