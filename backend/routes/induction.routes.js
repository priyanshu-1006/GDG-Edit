import express from 'express';
import multer from 'multer';
import Groq from 'groq-sdk';
import crypto from 'crypto';
import XLSX from 'xlsx';
import cloudinary from '../config/cloudinary.js';
import Induction from '../models/Induction.js';
import InductionInvite from '../models/InductionInvite.js';
import Settings from '../models/Settings.js';
import jwt from 'jsonwebtoken';
import PDFParser from 'pdf2json';
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

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;
const INVITE_ID_PATTERN = /^[A-Za-z0-9_-]{4,60}$/;

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactTrimmedRegex = (value = '') => new RegExp(`^\\s*${escapeRegex(String(value).trim())}\\s*$`, 'i');
const VALID_INDUCTION_STATUSES = ['applied', 'shortlisted_online', 'shortlisted_offline', 'selected', 'rejected'];
const BRANCH_VARIANTS = {
  'Computer Science and Engineering': [
    'Computer Science and Engineering',
    'Computer Science and Engineering (CSE)',
    'CSE',
  ],
  'Information Technology': [
    'Information Technology',
    'Information Technology (IT)',
    'IT',
  ],
  'Electronics and Communication Engineering': [
    'Electronics and Communication Engineering',
    'Electronics and Communication Engineering (ECE)',
    'ECE',
  ],
  'Electrical Engineering': [
    'Electrical Engineering',
    'Electrical Engineering (EE)',
    'EE',
  ],
  'Mechanical Engineering': [
    'Mechanical Engineering',
    'Mechanical Engineering (ME)',
    'ME',
  ],
  'Civil Engineering': [
    'Civil Engineering',
    'Civil Engineering (CE)',
    'CE',
  ],
  'Chemical Engineering': [
    'Chemical Engineering',
    'Chemical Engineering (CHE)',
    'CHE',
  ],
  'Internet of Things': [
    'Internet of Things',
    'Internet of Things (IoT)',
    'IoT',
  ],
};

const getBranchVariants = (branch = '') => {
  const normalizedBranch = String(branch).trim().toLowerCase();
  if (!normalizedBranch) return [];

  for (const variants of Object.values(BRANCH_VARIANTS)) {
    if (variants.some((candidate) => candidate.toLowerCase() === normalizedBranch)) {
      return variants;
    }
  }

  return [String(branch).trim()];
};

const buildInductionFilter = ({ status, branch, search }) => {
  const filter = {};

  const normalizedStatus = String(status || '').trim();
  if (normalizedStatus && VALID_INDUCTION_STATUSES.includes(normalizedStatus)) {
    filter.status = normalizedStatus;
  }

  const normalizedBranch = String(branch || '').trim();
  if (normalizedBranch) {
    filter.branch = {
      $in: getBranchVariants(normalizedBranch).map((value) => exactTrimmedRegex(value)),
    };
  }

  const normalizedSearch = String(search || '').trim();
  if (normalizedSearch) {
    const escapedSearch = escapeRegex(normalizedSearch);
    const searchRegex = new RegExp(escapedSearch, 'i');
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { rollNumber: searchRegex },
      {
        $expr: {
          $regexMatch: {
            input: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ['$firstName', ''] },
                    ' ',
                    { $ifNull: ['$lastName', ''] },
                  ],
                },
              },
            },
            regex: escapedSearch,
            options: 'i',
          },
        },
      },
    ];
  }

  return filter;
};

const mapSubmissionForExport = (submission) => ({
  'Roll No': submission.rollNumber || '',
  Name: `${submission.firstName || ''} ${submission.lastName || ''}`.trim(),
  Email: submission.email || '',
  Phone: submission.phone || '',
  Branch: submission.branch || '',
  Section: submission.section || '',
  Domains: (submission.domains || []).join('; '),
  'Tech Stack': submission.techStack || '',
  'Tech Skills': submission.techSkills || '',
  'Soft Skills': submission.softSkills || '',
  Projects: submission.projects || '',
  GitHub: submission.githubId || '',
  LinkedIn: submission.linkedinUrl || '',
  Codeforces: submission.codeforcesId || '',
  CodeChef: submission.codechefId || '',
  HackerRank: submission.hackerrankId || '',
  LeetCode: submission.leetcodeId || '',
  'Why Join': submission.whyJoin || '',
  'Interesting Fact': submission.interestingFact || '',
  'Other Clubs': submission.otherClubs || '',
  Strengths: submission.strengths || '',
  Weaknesses: submission.weaknesses || '',
  Residence: submission.residenceType || '',
  Resume: submission.resumeUrl || '',
  Status: submission.status || '',
  'Submitted At': submission.createdAt ? new Date(submission.createdAt).toISOString() : '',
});

const normalizeInductionPayload = (body = {}) => {
  const {
    firstName, lastName, email, phone, branch, section, rollNumber,
    techStack, domains, projects, githubId, linkedinUrl,
    whyJoin, interestingFact, otherClubs, residenceType,
    codeforcesId, codechefId, hackerrankId, resumeUrl,
    strengths, weaknesses, techSkills, softSkills,
    leetcodeId,
  } = body;

  return {
    firstName,
    lastName,
    email: String(email || '').toLowerCase().trim(),
    phone,
    branch,
    section,
    rollNumber: String(rollNumber || '').trim(),
    techStack,
    domains,
    projects,
    githubId,
    linkedinUrl,
    whyJoin,
    interestingFact,
    otherClubs,
    residenceType,
    codeforcesId,
    codechefId,
    hackerrankId,
    resumeUrl,
    strengths,
    weaknesses,
    techSkills,
    softSkills,
    leetcodeId,
  };
};

const findExistingInductionByIdentity = async ({ email, rollNumber }) => {
  const candidateConditions = [];
  if (email) candidateConditions.push({ email: exactTrimmedRegex(email) });
  if (rollNumber) candidateConditions.push({ rollNumber: exactTrimmedRegex(rollNumber) });

  if (candidateConditions.length === 0) {
    return null;
  }

  return Induction.findOne({ $or: candidateConditions });
};

const getInviteShareUrl = ({ inviteId, token }) => {
  const base = (process.env.FRONTEND_URL || 'https://gdg.mmmut.app').replace(/\/$/, '');
  return `${base}/induction/special/${encodeURIComponent(inviteId)}/${encodeURIComponent(token)}`;
};

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

// POST /api/induction/invite-links — Create a one-time special induction form link (super_admin)
router.post('/invite-links', protect, authorize('super_admin'), async (req, res) => {
  try {
    const rawInviteId = String(req.body?.inviteId || '').trim();
    const note = String(req.body?.note || '').trim();
    const expiresInDays = Number(req.body?.expiresInDays || 0);

    if (!INVITE_ID_PATTERN.test(rawInviteId)) {
      return res.status(400).json({
        success: false,
        message: 'Invite ID must be 4-60 chars and use only letters, numbers, _ or -',
      });
    }

    const inviteId = rawInviteId;
    const existingInvite = await InductionInvite.findOne({ inviteId });
    if (existingInvite) {
      return res.status(409).json({
        success: false,
        message: 'This invite ID already exists. Please use a different ID.',
      });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const inviteDoc = new InductionInvite({
      inviteId,
      token,
      note,
      createdBy: req.user?._id,
      expiresAt: expiresInDays > 0 ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : undefined,
    });

    await inviteDoc.save();

    return res.status(201).json({
      success: true,
      message: 'Special induction link generated successfully.',
      data: {
        inviteId: inviteDoc.inviteId,
        note: inviteDoc.note,
        isUsed: inviteDoc.isUsed,
        isActive: inviteDoc.isActive,
        expiresAt: inviteDoc.expiresAt,
        createdAt: inviteDoc.createdAt,
        url: getInviteShareUrl({ inviteId: inviteDoc.inviteId, token: inviteDoc.token }),
      },
    });
  } catch (error) {
    console.error('Create invite link error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/induction/invite-links — List existing special induction links (super_admin)
router.get('/invite-links', protect, authorize('super_admin'), async (req, res) => {
  try {
    const invites = await InductionInvite.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('submission', 'firstName lastName email');

    const data = invites.map((invite) => ({
      id: invite._id,
      inviteId: invite.inviteId,
      note: invite.note,
      isActive: invite.isActive,
      isUsed: invite.isUsed,
      usedAt: invite.usedAt,
      usedByEmail: invite.usedByEmail,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      createdBy: invite.createdBy,
      submission: invite.submission,
      url: getInviteShareUrl({ inviteId: invite.inviteId, token: invite.token }),
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('List invite links error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/induction/special/:inviteId/:token — Validate special induction link (public)
router.get('/special/:inviteId/:token', async (req, res) => {
  try {
    const { inviteId, token } = req.params;
    const invite = await InductionInvite.findOne({ inviteId, token, isActive: true });

    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invalid special induction link.' });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'This link has expired.' });
    }

    if (invite.isUsed) {
      return res.status(410).json({ success: false, message: 'This link has already been used.' });
    }

    return res.json({
      success: true,
      data: {
        inviteId: invite.inviteId,
        note: invite.note,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    console.error('Validate special link error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
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

    const normalizedPayload = normalizeInductionPayload(req.body);
    const existing = await findExistingInductionByIdentity({
      email: normalizedPayload.email,
      rollNumber: normalizedPayload.rollNumber,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted an induction form. Please contact admin if you need to resubmit.'
      });
    }

    const induction = new Induction({
      ...normalizedPayload,
      applicationType: 'college_oauth',
    });

    await induction.save();

    // Send confirmation email asynchronously
    sendGlobalEmail({
      to: normalizedPayload.email,
      subject: 'Application Received 🚀 - GDG MMMUT Induction',
      html: inductionSubmissionTemplate(normalizedPayload.firstName, induction)
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

// POST /api/induction/special/:inviteId/:token/submit — Submit special induction form via one-time link
router.post('/special/:inviteId/:token/submit', async (req, res) => {
  try {
    const { inviteId, token } = req.params;
    const invite = await InductionInvite.findOne({ inviteId, token, isActive: true });

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invalid special induction link.',
      });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'This link has expired.',
      });
    }

    if (invite.isUsed) {
      return res.status(410).json({
        success: false,
        message: 'This link has already been used to submit a form.',
      });
    }

    const normalizedPayload = normalizeInductionPayload(req.body);
    const existing = await findExistingInductionByIdentity({
      email: normalizedPayload.email,
      rollNumber: normalizedPayload.rollNumber,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An induction submission already exists for this email or roll number.',
      });
    }

    const induction = new Induction({
      ...normalizedPayload,
      applicationType: 'special_link',
      inviteId: invite.inviteId,
    });

    await induction.save();

    invite.isUsed = true;
    invite.usedAt = new Date();
    invite.usedByEmail = normalizedPayload.email;
    invite.submission = induction._id;
    await invite.save();

    sendGlobalEmail({
      to: normalizedPayload.email,
      subject: 'Application Received 🚀 - GDG MMMUT Induction',
      html: inductionSubmissionTemplate(normalizedPayload.firstName, induction),
    });

    return res.status(201).json({
      success: true,
      message: 'Special induction form submitted successfully.',
      data: {
        id: induction._id,
        inviteId: invite.inviteId,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    console.error('Special induction submit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
});

// GET /api/induction/my-submission-status — Get current applicant submission status
router.get('/my-submission-status', verifyInductionToken, async (req, res) => {
  try {
    const email = String(req.user?.email || '').toLowerCase().trim();
    const rollNo = String(req.user?.rollNo || '').trim();

    const matchConditions = [];
    if (email) matchConditions.push({ email: exactTrimmedRegex(email) });
    if (rollNo) matchConditions.push({ rollNumber: exactTrimmedRegex(rollNo) });

    if (matchConditions.length === 0) {
      return res.json({ success: true, hasSubmitted: false });
    }

    const existingSubmission = await Induction.findOne({
      $or: matchConditions
    })
      .sort({ createdAt: -1 })
      .select('_id status createdAt updatedAt rollNumber email');

    if (!existingSubmission) {
      return res.json({ success: true, hasSubmitted: false });
    }

    res.json({
      success: true,
      hasSubmitted: true,
      submission: {
        id: existingSubmission._id,
        status: existingSubmission.status,
        rollNumber: existingSubmission.rollNumber,
        email: existingSubmission.email,
        createdAt: existingSubmission.createdAt,
        updatedAt: existingSubmission.updatedAt,
      },
    });
  } catch (error) {
    console.error('Fetch my submission status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/induction — Get all submissions (event_manager/admin/super_admin)
router.get('/', protect, authorize('event_manager', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { status, branch, search, page = 1, limit = 50 } = req.query;
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 50, 1);

    const filter = buildInductionFilter({ status, branch, search });

    const submissions = await Induction.find(filter)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    const total = await Induction.countDocuments(filter);

    res.json({
      success: true,
      data: submissions,
      pagination: {
        total,
        page: parsedPage,
        pages: Math.max(Math.ceil(total / parsedLimit), 1),
      }
    });
  } catch (error) {
    console.error('Induction fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/induction/export — Export all matching submissions as Excel (event_manager/admin/super_admin)
router.get('/export', protect, authorize('event_manager', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { status, branch, search } = req.query;
    const filter = buildInductionFilter({ status, branch, search });

    const submissions = await Induction.find(filter).lean();
    submissions.sort((a, b) => {
      const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
      const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim();

      const byName = nameA.localeCompare(nameB, 'en', { sensitivity: 'base' });
      if (byName !== 0) return byName;

      return String(a.rollNumber || '').localeCompare(String(b.rollNumber || ''), 'en', { sensitivity: 'base' });
    });

    const worksheetRows = submissions.map(mapSubmissionForExport);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Induction Submissions');

    const fileBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const today = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="induction_submissions_${today}.xlsx"`);
    return res.send(fileBuffer);
  } catch (error) {
    console.error('Induction export error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/induction/bulk-advance — Update status of multiple candidates (super_admin)
router.patch('/bulk-advance', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { studentIds, targetStatus } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || !targetStatus) {
      return res.status(400).json({ success: false, message: 'Invalid data provided' });
    }

    if (!VALID_INDUCTION_STATUSES.includes(targetStatus)) {
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
    const submission = await Induction.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const email = String(submission.email || '').toLowerCase().trim();
    const rollNumber = String(submission.rollNumber || '').trim();

    const deleteConditions = [];
    if (email) deleteConditions.push({ email: exactTrimmedRegex(email) });
    if (rollNumber) deleteConditions.push({ rollNumber: exactTrimmedRegex(rollNumber) });

    const deleteQuery =
      deleteConditions.length > 0
        ? { $or: deleteConditions }
        : { _id: submission._id };

    const deleteResult = await Induction.deleteMany(deleteQuery);

    res.json({
      success: true,
      message: 'Submission deleted successfully',
      deletedCount: deleteResult.deletedCount,
    });
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
      try {
        parsedText = await new Promise((resolve, reject) => {
          const pdfParser = new PDFParser(this, 1);
          pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => {
            resolve(pdfParser.getRawTextContent());
          });
          pdfParser.parseBuffer(req.file.buffer);
        });
      } catch (pdfErr) {
        console.warn("PDF parsing failed (often due to Vercel worker missing), gracefully continuing:", pdfErr.message || pdfErr);
      }
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
    if (!groq || !parsedText.trim()) {
      return res.json({ 
        success: true, 
        resumeUrl: finalResumeUrl,
        parsedData: null,
        message: !groq ? 'Resume saved, but AI parsing is unavailable.' : 'Resume saved, but PDF text could not be extracted. Please enter manually.'
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
