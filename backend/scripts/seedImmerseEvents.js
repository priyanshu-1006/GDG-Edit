/**
 * Seed IMMERSE 2026 Events
 * Run: node scripts/seedImmerseEvents.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ImmerseEvent from '../models/ImmerseEvent.js';

dotenv.config();

const events = [
    {
        slug: 'stellar-genesis',
        name: 'Stellar Genesis',
        tagline: 'Flagship Hackathon',
        icon: '🔥',
        description: 'The premier innovation challenge of IMMERSE 2026, designed to push participants beyond conventional thinking and inspire the creation of impactful technology-driven solutions.',
        eventType: 'hackathon',
        overview: 'Stellar Genesis is the premier innovation challenge of IMMERSE 2026, designed to push participants beyond conventional thinking and inspire the creation of impactful technology-driven solutions. This hackathon encourages teams to identify real-world problems and transform ideas into scalable prototypes within a high-energy collaborative environment.',
        objectives: [
            'Identify meaningful real-world challenges',
            'Design innovative and feasible solutions',
            'Develop functional prototypes',
            'Demonstrate creativity & technical excellence',
            'Present solutions to a judging panel'
        ],
        focusAreas: [
            'Artificial Intelligence',
            'Web & App Solutions',
            'Smart Systems',
            'Automation & Productivity',
            'Open Innovation'
        ],
        evaluationCriteria: [
            'Innovation & Problem Relevance',
            'Technical Implementation',
            'Feasibility & Scalability',
            'User Experience / Design',
            'Presentation & Impact'
        ],
        participationType: 'team',
        teamSize: { min: 2, max: 4 },
        themeSymbol: 'Creation - The birth of new ideas and innovations',
        gradientColors: { from: '#f97316', to: '#ef4444' },
        order: 1,
        isFeatured: true
    },
    {
        slug: 'cosmic-intelligence',
        name: 'Cosmic Intelligence',
        tagline: 'Artificial Intelligence Challenge',
        icon: '🧠',
        description: 'An AI-centric challenge exploring the boundaries of machine intelligence, creativity, and problem-solving.',
        eventType: 'challenge',
        overview: 'Cosmic Intelligence is an AI-centric challenge exploring the boundaries of machine intelligence, creativity, and problem-solving. This event tests participants\' ability to leverage AI tools, prompt engineering, and reasoning skills to generate meaningful outputs and solutions.',
        objectives: [
            'Solve AI-driven tasks',
            'Demonstrate prompt engineering skills',
            'Showcase reasoning & creativity',
            'Build AI-assisted workflows or outputs'
        ],
        challengeScope: [
            'Prompt Engineering',
            'AI Reasoning Tasks',
            'Content & Logic Challenges',
            'AI Tool Utilization',
            'Applied AI Creativity'
        ],
        evaluationCriteria: [
            'Accuracy & Quality of Output',
            'Creativity & Innovation',
            'Prompt Design Strategy',
            'Efficiency & Clarity',
            'Problem-solving approach'
        ],
        participationType: 'both',
        teamSize: { min: 1, max: 3 },
        themeSymbol: 'Intelligence - AI & reasoning capabilities',
        gradientColors: { from: '#8b5cf6', to: '#6366f1' },
        order: 2,
        isFeatured: true
    },
    {
        slug: 'quantum-logic',
        name: 'Quantum Logic',
        tagline: 'Competitive Programming Event',
        icon: '⚡',
        description: 'An elite algorithmic battle designed for participants with strong logical reasoning and problem-solving skills.',
        eventType: 'competition',
        overview: 'Quantum Logic is an elite algorithmic battle designed for participants with strong logical reasoning and problem-solving skills. This event challenges coders to solve complex Data Structures & Algorithms (DSA) problems under time constraints.',
        objectives: [
            'Solve algorithmic problems',
            'Demonstrate coding efficiency',
            'Apply logical precision',
            'Optimize performance'
        ],
        challengeScope: [
            'Data Structures',
            'Algorithms',
            'Logical puzzles',
            'Optimization challenges'
        ],
        evaluationCriteria: [
            'Correctness',
            'Execution Efficiency',
            'Time & Space Optimization',
            'Problem-solving strategy'
        ],
        participationType: 'individual',
        teamSize: { min: 1, max: 1 },
        themeSymbol: 'Logic - Computation & algorithmic thinking',
        gradientColors: { from: '#06b6d4', to: '#3b82f6' },
        order: 3,
        isFeatured: true
    },
    {
        slug: 'mission-control',
        name: 'Mission Control',
        tagline: 'Technical Workshop',
        icon: '🛠',
        description: 'A hands-on experiential learning workshop focused on emerging technologies, modern development paradigms, and intelligent systems.',
        eventType: 'workshop',
        overview: 'Mission Control is a hands-on experiential learning workshop focused on emerging technologies, modern development paradigms, and intelligent systems. Designed to provide practical exposure beyond theoretical learning.',
        objectives: [
            'Learn advanced concepts',
            'Build real-world mini implementations',
            'Explore modern tools & workflows',
            'Gain applied technical insights'
        ],
        focusAreas: [
            'AI & Intelligent Systems',
            'Full Stack Development',
            'Automation & Agents',
            'Modern Tech Tools'
        ],
        outcomes: [
            'Practical learning experience',
            'Certification',
            'Industry-relevant exposure'
        ],
        participationType: 'individual',
        teamSize: { min: 1, max: 1 },
        themeSymbol: 'Learning - Systems & knowledge acquisition',
        gradientColors: { from: '#22c55e', to: '#10b981' },
        order: 4
    },
    {
        slug: 'orbit-shift',
        name: 'Orbit Shift',
        tagline: 'Startup Ideathon',
        icon: '🚀',
        description: 'An entrepreneurship-driven innovation challenge encouraging participants to design technology-based startup ideas.',
        eventType: 'ideathon',
        overview: 'Orbit Shift is an entrepreneurship-driven innovation challenge encouraging participants to design technology-based startup ideas. Focus on feasibility, scalability, and impact.',
        objectives: [
            'Identify real-world problems',
            'Design business solutions',
            'Build innovative startup models',
            'Pitch ideas to judges'
        ],
        evaluationCriteria: [
            'Problem Relevance',
            'Innovation',
            'Feasibility',
            'Scalability',
            'Presentation & Clarity'
        ],
        participationType: 'both',
        teamSize: { min: 1, max: 4 },
        themeSymbol: 'Innovation - Startups & entrepreneurship',
        gradientColors: { from: '#ec4899', to: '#f43f5e' },
        order: 5
    },
    {
        slug: 'synthetic-cosmos',
        name: 'Synthetic Cosmos',
        tagline: 'Creative AI Challenge',
        icon: '✨',
        description: 'A creative challenge that blends creativity with technology, exploring AI\'s role in visual storytelling and artistic innovation.',
        eventType: 'challenge',
        overview: 'Synthetic Cosmos blends creativity with technology, challenging participants to leverage Generative AI tools for visual storytelling and artistic innovation. This event explores AI\'s role in creative transformation.',
        objectives: [
            'Create AI-assisted visuals',
            'Demonstrate creative thinking',
            'Blend imagination & technology',
            'Showcase artistic innovation'
        ],
        challengeScope: [
            'AI Image Generation',
            'AI-Enhanced Art',
            'Visual Storytelling',
            'Creative Transformation'
        ],
        evaluationCriteria: [
            'Creativity & Originality',
            'Visual Impact',
            'AI Utilization Strategy',
            'Concept & Execution'
        ],
        participationType: 'both',
        teamSize: { min: 1, max: 2 },
        themeSymbol: 'Creativity - Artistic AI transformation',
        gradientColors: { from: '#f59e0b', to: '#eab308' },
        order: 6
    },
    {
        slug: 'event-horizon',
        name: 'Event Horizon',
        tagline: 'Cyber Escape / Cybersecurity Challenge',
        icon: '🔓',
        description: 'An immersive cybersecurity-driven challenge combining logic puzzles, cyber concepts, and escape-room dynamics.',
        eventType: 'challenge',
        overview: 'Event Horizon is an immersive cybersecurity-driven challenge combining logic puzzles, cyber concepts, and escape-room dynamics. Participants must analyze, decode, and solve system-based challenges.',
        objectives: [
            'Solve cybersecurity puzzles',
            'Demonstrate logical reasoning',
            'Analyze system challenges',
            'Work under pressure'
        ],
        challengeScope: [
            'Encryption puzzles',
            'Logic challenges',
            'Cyber concepts',
            'System analysis tasks'
        ],
        evaluationCriteria: [
            'Problem-solving efficiency',
            'Logical accuracy',
            'Strategy & teamwork',
            'Completion time'
        ],
        participationType: 'team',
        teamSize: { min: 2, max: 4 },
        themeSymbol: 'Challenges - Cyber frontiers & boundaries',
        gradientColors: { from: '#64748b', to: '#475569' },
        order: 7
    }
];

async function seedEvents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');
        
        // Clear existing events (optional)
        await ImmerseEvent.deleteMany({});
        console.log('🗑️  Cleared existing events');
        
        // Insert new events
        const created = await ImmerseEvent.insertMany(events);
        console.log(`✅ Created ${created.length} IMMERSE 2026 events:`);
        
        created.forEach((event, index) => {
            console.log(`   ${index + 1}. ${event.icon} ${event.name} (/${event.slug})`);
        });
        
        console.log('\n🚀 IMMERSE 2026 events seeded successfully!');
        
    } catch (error) {
        console.error('❌ Error seeding events:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
    }
}

seedEvents();
