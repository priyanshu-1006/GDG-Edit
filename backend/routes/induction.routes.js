import express from 'express';
import multer from 'multer';
import Groq from 'groq-sdk';
import cloudinary from '../config/cloudinary.js';
import Induction from '../models/Induction.js';
import Settings from '../models/Settings.js';
import jwt from 'jsonwebtoken';
import { PDFParse } from 'pdf-parse';
import https from 'https';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { sendInductionRoundEmail } from '../utils/sendInductionEmail.js';
import { sendGlobalEmail } from '../utils/unifiedEmail.js';
import { inductionSubmissionTemplate } from '../utils/emailTemplates.js';

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Middleware to verify induction JWT
const verifyInductionToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'induction') {
      return res.status(401).json({ success: false, message: 'Invalid token purpose' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// GET /api/induction/status — Get induction form open status (public)
router.get('/status', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ isInductionOpen: true });
    }
    res.json({ success: true, isInductionOpen: settings.isInductionOpen });
  } catch (error) {
    console.error('Fetch status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/induction/results — Get public results list
router.get('/results', async (req, res) => {
  try {
    const submissions = await Induction.find({
      status: { $in: ['shortlisted_online', 'shortlisted_offline', 'selected'] }
    }).select('firstName lastName rollNumber status -_id');
    
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Fetch results error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/induction/status — Update induction form open status (super_admin)
router.put('/status', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { isInductionOpen } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ isInductionOpen });
    } else {
      settings.isInductionOpen = isInductionOpen;
    }
    await settings.save();
    
    res.json({ success: true, isInductionOpen: settings.isInductionOpen });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/induction — Submit induction form
router.post('/', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (settings && settings.isInductionOpen === false) {
      return res.status(403).json({
        success: false,
        message: 'The induction form is currently closed. New applications are not being accepted.'
      });
    }

    const {
      firstName, lastName, email, phone, branch, section, rollNumber,
      techStack, domains, projects, githubId, linkedinUrl,
      whyJoin, interestingFact, otherClubs, residenceType,
      codeforcesId, codechefId, hackerrankId, resumeUrl
    } = req.body;

    // Check if already submitted (Temporarily Disabled by Admin)
    /*
    const existing = await Induction.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an induction form with this email.'
      });
    }
    */

    const induction = new Induction({
      firstName, lastName, email, phone, branch, section, rollNumber,
      techStack, domains, projects, githubId, linkedinUrl,
      whyJoin, interestingFact, otherClubs, residenceType,
      codeforcesId, codechefId, hackerrankId, resumeUrl
    });

    await induction.save();

    // Send confirmation email asynchronously
    sendGlobalEmail({
      to: email,
      subject: 'Application Received 🚀 - GDG MMMUT Induction',
      html: inductionSubmissionTemplate(firstName, induction)
    });

    res.status(201).json({
      success: true,
      message: 'Induction form submitted successfully! We will review your application.',
      data: { id: induction._id }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    console.error('Induction submit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// GET /api/induction — Get all submissions (admin)
router.get('/', async (req, res) => {
  try {
    const { status, branch, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (branch) filter.branch = branch;

    const submissions = await Induction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Induction.countDocuments(filter);

    res.json({
      success: true,
      data: submissions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Induction fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/induction/bulk-advance — Update status of multiple candidates (super_admin)
router.patch('/bulk-advance', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { studentIds, targetStatus } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || !targetStatus) {
      return res.status(400).json({ success: false, message: 'Invalid data provided' });
    }

    const validStatuses = ['applied', 'shortlisted_online', 'shortlisted_offline', 'selected', 'rejected'];
    if (!validStatuses.includes(targetStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid target status' });
    }

    // Prepare email content based on status
    let roundName = "";
    let nextRoundDetails = "";

    if (targetStatus === 'shortlisted_online') {
      roundName = "Online PI Round";
      nextRoundDetails = "Get ready for a virtual interview where we will evaluate your technical and soft skills. Check your WhatsApp regularly for updates, the meeting link, and interview slot timings.";
    } else if (targetStatus === 'shortlisted_offline') {
      roundName = "Offline PI Round";
      nextRoundDetails = "You cleared the online round! The final offline interview details will be shared soon. Be prepared to showcase your projects and problem-solving skills in person.";
    } else if (targetStatus === 'selected') {
      roundName = "Core Team Member";
      nextRoundDetails = "Welcome to the GDG MMMUT family! We are thrilled to have you onboard. We will contact you shortly with onboarding details.";
    }

    // Send emails in background if it's an advancement
    if (['shortlisted_online', 'shortlisted_offline', 'selected'].includes(targetStatus)) {
      const students = await Induction.find({ _id: { $in: studentIds } });
      students.forEach(student => {
        sendInductionRoundEmail(student.email, student.firstName, roundName, nextRoundDetails);
      });
    }

    // Update in DB
    await Induction.updateMany(
      { _id: { $in: studentIds } },
      { $set: { status: targetStatus } }
    );

    res.json({ success: true, message: `Successfully updated ${studentIds.length} candidates` });
  } catch (error) {
    console.error('Bulk advance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/induction/:id — Delete submission (super_admin)
router.delete('/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    const submission = await Induction.findByIdAndDelete(req.params.id);

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/induction/parse-resume — Parse uploaded resume and return AI extracted details
router.post('/parse-resume', verifyInductionToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No resume file uploaded' });
    }

    // 1. Upload to Cloudinary using upload_stream to properly handle raw binary buffers
    const cloudinaryResponse = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'gdg_resumes',
          resource_type: 'raw',
          public_id: `resume_${Date.now()}.pdf`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const finalResumeUrl = cloudinaryResponse.secure_url;

    // 2. Parse PDF text
    let parsedText = '';
    if (req.file.mimetype === 'application/pdf') {
      const parser = new PDFParse({ data: req.file.buffer });
      const pdfData = await parser.getText();
      parsedText = pdfData.text;
      await parser.destroy();
    } else {
      // If it's docx or something else, we might just skip text extraction for now
      // since pdf-parse only handles PDFs, but the UI generally expects PDF.
      return res.json({ 
        success: true, 
        resumeUrl: finalResumeUrl,
        parsedData: null,
        message: 'Non-PDF file uploaded. Saved to cloud but OCR skipped.'
      });
    }

    // 3. Extract info using Groq
    if (!process.env.GROQ_API_KEY) {
      return res.json({ 
        success: true, 
        resumeUrl: finalResumeUrl,
        parsedData: null,
        message: 'Resume saved, but AI parsing is unavailable.'
      });
    }

    const prompt = `
      Extract the following information from the provided resume text. 
      Return ONLY a valid JSON object with the following keys, containing strings. If a field is not found, leave it as an empty string.
      - techStack: A comma-separated list of ONLY programming languages, frameworks, and core tech tools mentioned (e.g., "C++, Python, React, MongoDB").
      - githubId: Just the username from the GitHub link if present.
      - linkedinUrl: The full LinkedIn URL if present.
      - projects: A 2-3 sentence extremely concise summary of their most impressive technical projects.

      Resume Text:
      """
      ${parsedText.substring(0, 4000)}
      """
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const aiContent = chatCompletion.choices[0]?.message?.content;
    let parsedData = null;
    if (aiContent) {
      try {
        parsedData = JSON.parse(aiContent);
      } catch (e) {
        console.error('Failed to parse Groq response:', aiContent);
      }
    }

    res.json({
      success: true,
      resumeUrl: finalResumeUrl,
      parsedData
    });

  } catch (error) {
    console.error('Resume Parse Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to parse resume or upload to cloud. Please try manual entry.'
    });
  }
});

// GET /api/induction/download-resume — Proxy to download the uploaded resume, hiding Cloudinary source URL
router.get('/download-resume', verifyInductionToken, (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl || !fileUrl.includes('cloudinary.com')) {
    return res.status(400).send('Invalid or missing URL');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="uploaded_resume.pdf"');

  https.get(fileUrl, (stream) => {
    stream.pipe(res);
  }).on('error', (err) => {
    console.error('Error fetching resume for download:', err);
    res.status(500).send('Failed to download resume');
  });
});

export default router;
