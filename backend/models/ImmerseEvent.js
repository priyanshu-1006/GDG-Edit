import mongoose from 'mongoose';

const immerseEventSchema = new mongoose.Schema({
    // Basic Info
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Event name is required'],
        trim: true
    },
    tagline: {
        type: String,
        trim: true
    },
    icon: {
        type: String, // Emoji or icon name
        default: '🚀'
    },
    description: {
        type: String,
        required: true
    },
    
    // Event Type & Category
    eventType: {
        type: String,
        enum: ['hackathon', 'competition', 'workshop', 'ideathon', 'challenge'],
        required: true
    },
    
    // Detailed Content
    overview: {
        type: String
    },
    objectives: [{
        type: String
    }],
    focusAreas: [{
        type: String
    }],
    evaluationCriteria: [{
        type: String
    }],
    challengeScope: [{
        type: String
    }],
    outcomes: [{
        type: String
    }],
    
    // Participation Details
    participationType: {
        type: String,
        enum: ['individual', 'team', 'both'],
        default: 'both'
    },
    teamSize: {
        min: { type: Number, default: 1 },
        max: { type: Number, default: 4 }
    },
    
    // Registration Settings
    registrationOpen: {
        type: Boolean,
        default: true
    },
    registrationDeadline: {
        type: Date
    },
    maxParticipants: {
        type: Number,
        default: 0 // 0 means unlimited
    },
    registrationCount: {
        type: Number,
        default: 0
    },
    
    // Schedule
    eventDate: {
        type: Date
    },
    startTime: {
        type: String
    },
    endTime: {
        type: String
    },
    venue: {
        type: String
    },
    
    // Prizes & Rewards
    prizes: [{
        position: String,
        reward: String,
        description: String
    }],
    
    // Theme Integration
    themeSymbol: {
        type: String // What this event symbolizes in the INTERSTELLAR theme
    },
    
    // Display Settings
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    
    // Styling
    gradientColors: {
        from: { type: String, default: '#4f46e5' },
        to: { type: String, default: '#7c3aed' }
    },
    
    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ImmerseAdmin'
    }
}, {
    timestamps: true
});

// Index for faster queries
immerseEventSchema.index({ slug: 1 });
immerseEventSchema.index({ isActive: 1, order: 1 });

const ImmerseEvent = mongoose.model('ImmerseEvent', immerseEventSchema);

export default ImmerseEvent;
