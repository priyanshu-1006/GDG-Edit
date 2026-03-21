import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    college: {
        type: String,
        trim: true
    },
    year: {
        type: String,
        enum: ['1st', '2nd', '3rd', '4th', '5th', 'Other'],
    },
    branch: {
        type: String,
        trim: true
    },
    isLeader: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const immerseRegistrationSchema = new mongoose.Schema({
    // Event Reference
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ImmerseEvent',
        required: true
    },
    eventSlug: {
        type: String,
        required: true
    },
    
    // Registration Type
    registrationType: {
        type: String,
        enum: ['individual', 'team'],
        required: true
    },
    
    // Team Details (if team registration)
    teamName: {
        type: String,
        trim: true
    },
    teamMembers: [teamMemberSchema],
    
    // Individual / Leader Details
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    college: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: String,
        enum: ['1st', '2nd', '3rd', '4th', '5th', 'Other'],
        required: true
    },
    branch: {
        type: String,
        required: true,
        trim: true
    },
    
    // Additional Info
    experience: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    previousParticipation: {
        type: Boolean,
        default: false
    },
    dietaryPreference: {
        type: String,
        enum: ['veg', 'non-veg', 'vegan', 'none'],
        default: 'none'
    },
    tshirtSize: {
        type: String,
        enum: ['S', 'M', 'L', 'XL', 'XXL'],
    },
    
    // For hackathon specific
    projectIdea: {
        type: String,
        trim: true
    },
    techStack: [{
        type: String
    }],
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'waitlisted', 'cancelled', 'attended', 'no-show'],
        default: 'pending'
    },
    
    // Payment (if applicable)
    paymentStatus: {
        type: String,
        enum: ['not_required', 'pending', 'completed', 'refunded'],
        default: 'not_required'
    },
    paymentId: {
        type: String
    },
    
    // Communication
    emailSent: {
        confirmation: { type: Boolean, default: false },
        reminder: { type: Boolean, default: false },
        certificate: { type: Boolean, default: false }
    },
    
    // Check-in
    checkedIn: {
        type: Boolean,
        default: false
    },
    checkInTime: {
        type: Date
    },
    
    // Unique Registration ID
    registrationId: {
        type: String,
        unique: true
    },
    
    // Notes
    adminNotes: {
        type: String
    },
    
    // Source tracking
    source: {
        type: String,
        default: 'website'
    }
}, {
    timestamps: true
});

// Generate unique registration ID before saving
immerseRegistrationSchema.pre('save', async function(next) {
    if (!this.registrationId) {
        const prefix = this.eventSlug.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.registrationId = `IMM-${prefix}-${timestamp}${random}`;
    }
    next();
});

// Index for faster queries
immerseRegistrationSchema.index({ event: 1, email: 1 }, { unique: true });
immerseRegistrationSchema.index({ eventSlug: 1, status: 1 });
immerseRegistrationSchema.index({ email: 1 });

const ImmerseRegistration = mongoose.model('ImmerseRegistration', immerseRegistrationSchema);

export default ImmerseRegistration;
