import express from 'express';
import multer from 'multer';
import Groq from 'groq-sdk';
import crypto from 'crypto';
import XLSX from 'xlsx';
import cloudinary from '../config/cloudinary.js';
import Induction from '../models/Induction.js';
import InductionInvite from '../models/InductionInvite.js';
import InductionPanel from '../models/InductionPanel.js';
import InductionPanelEvaluation from '../models/InductionPanelEvaluation.js';
import InductionAdvancementRequest from '../models/InductionAdvancementRequest.js';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
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

const isApprovedEventManager = (userDoc) =>
  userDoc?.role === 'event_manager' && userDoc?.isApproved !== false;

const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      isInductionOpen: true,
      piRound: 'shortlisted_online',
      isPiStarted: false,
    });
  }
  return settings;
};

const canAccessPanel = (panel, reqUser) => {
  if (!panel || !reqUser) return false;
  if (reqUser.role === 'super_admin') return true;
  // Handle both populated (object with _id) and non-populated (ObjectId) members
  return panel.members.some((member) => {
    const memberId = member?._id || member;
    return String(memberId) === String(reqUser._id);
  });
};

const findManagerConflicts = async ({ memberIds = [], excludePanelId }) => {
  if (!memberIds.length) return [];

  const query = {
    members: { $in: memberIds },
    isActive: true,
  };

  if (excludePanelId) {
    query._id = { $ne: excludePanelId };
  }

  const conflictingPanels = await InductionPanel.find(query)
    .select('name members')
    .populate('members', 'name email');

  if (!conflictingPanels.length) return [];

  const memberIdSet = new Set(memberIds.map((id) => String(id)));

  return conflictingPanels.flatMap((panel) =>
    (panel.members || [])
      .filter((member) => memberIdSet.has(String(member._id)))
      .map((member) => ({
        panelId: panel._id,
        panelName: panel.name,
        memberId: member._id,
        memberName: member.name,
        memberEmail: member.email,
      })),
  );
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

// GET /api/induction/panel-members — Get eligible GDG members for induction panels
router.get('/panel-members', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const members = await User.find({
      role: 'event_manager',
      isApproved: true,
    })
      .select('name email role isApproved')
      .sort({ name: 1 });

    return res.json({ success: true, data: members });
  } catch (error) {
    console.error('Fetch panel members error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/induction/pi-control — Get global PI controls
router.get('/pi-control', protect, authorize('event_manager', 'admin', 'super_admin'), async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({
      success: true,
      data: {
        piRound: settings.piRound || 'shortlisted_online',
        isPiStarted: !!settings.isPiStarted,
        piStartedAt: settings.piStartedAt || null,
      },
    });
  } catch (error) {
    console.error('Fetch PI control error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/induction/pi-control — Update PI round or global start/stop
router.put('/pi-control', protect, authorize('super_admin'), async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const hasRound = Object.prototype.hasOwnProperty.call(req.body || {}, 'piRound');
    const hasStartToggle = Object.prototype.hasOwnProperty.call(req.body || {}, 'isPiStarted');

    if (hasRound) {
      const round = String(req.body?.piRound || '').trim();
      const allowedRounds = ['shortlisted_online', 'shortlisted_offline'];
      if (!allowedRounds.includes(round)) {
        return res.status(400).json({ success: false, message: 'Invalid PI round' });
      }
      settings.piRound = round;
      settings.isPiStarted = false;
      settings.piStartedAt = null;
      settings.piStartedBy = null;

      await InductionPanel.updateMany(
        { isActive: true },
        { $set: { piStarted: false }, $unset: { piStartedAt: '', piStartedBy: '' } },
      );
    }

    if (hasStartToggle) {
      const shouldStart = !!req.body?.isPiStarted;
      settings.isPiStarted = shouldStart;
      settings.piStartedAt = shouldStart ? new Date() : null;
      settings.piStartedBy = shouldStart ? req.user?._id : null;

      await InductionPanel.updateMany(
        { isActive: true },
        shouldStart
          ? { $set: { piStarted: true, piStartedAt: settings.piStartedAt, piStartedBy: req.user?._id } }
          : { $set: { piStarted: false }, $unset: { piStartedAt: '', piStartedBy: '' } },
      );
    }

    await settings.save();

    return res.json({
      success: true,
      message: 'PI control updated successfully',
      data: {
        piRound: settings.piRound,
        isPiStarted: settings.isPiStarted,
        piStartedAt: settings.piStartedAt,
      },
    });
  } catch (error) {
    console.error('Update PI control error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/induction/pi-candidates — Get shortlisted candidates by selected PI round
router.get('/pi-candidates', protect, authorize('super_admin'), async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const requestedRound = String(req.query?.round || '').trim();
    const round = requestedRound || settings.piRound || 'shortlisted_online';
    const allowedRounds = ['shortlisted_online', 'shortlisted_offline'];

    if (!allowedRounds.includes(round)) {
      return res.status(400).json({ success: false, message: 'Invalid PI round' });
    }

    // Fetch students with the specified round status
    // Also include students from BOTH rounds if no specific round is requested
    let statusFilter;
    if (requestedRound) {
      statusFilter = round;
    } else {
      // If no specific round requested, show all shortlisted students
      statusFilter = { $in: allowedRounds };
    }

    const students = await Induction.find({ status: statusFilter })
      .select('firstName lastName email rollNumber branch section status createdAt')
      .sort({ firstName: 1, lastName: 1, rollNumber: 1 });

    const studentIds = students.map((student) => student._id);
    const panels = await InductionPanel.find({ 'students.student': { $in: studentIds } })
      .select('name students.student');

    const assignmentMap = new Map();
    panels.forEach((panel) => {
      (panel.students || []).forEach((entry) => {
        assignmentMap.set(String(entry.student), {
          panelId: panel._id,
          panelName: panel.name,
        });
      });
    });

    const data = students.map((student) => ({
      ...student.toObject(),
      assignedPanel: assignmentMap.get(String(student._id)) || null,
    }));

    return res.json({ success: true, data, round });
  } catch (error) {
    console.error('Fetch PI candidates error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/induction/panels — Create induction evaluation panel
router.post('/panels', protect, authorize('super_admin'), async (req, res) => {
  try {
    const panelName = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    const memberUserIds = Array.isArray(req.body?.memberUserIds) ? req.body.memberUserIds : [];

    if (!panelName) {
      return res.status(400).json({ success: false, message: 'Panel name is required' });
    }

    if (!memberUserIds.length) {
      return res.status(400).json({ success: false, message: 'Select at least one panel member' });
    }

    const uniqueMemberIds = [...new Set(memberUserIds.map((id) => String(id)))];
    const memberUsers = await User.find({ _id: { $in: uniqueMemberIds } }).select('_id role isApproved');

    if (memberUsers.length !== uniqueMemberIds.length) {
      return res.status(400).json({ success: false, message: 'Some selected panel members are invalid' });
    }

    const invalidMember = memberUsers.find((member) => !isApprovedEventManager(member));

    if (invalidMember) {
      return res.status(400).json({
        success: false,
        message: 'Panel members must be approved event managers',
      });
    }

    const managerConflicts = await findManagerConflicts({ memberIds: uniqueMemberIds });
    if (managerConflicts.length > 0) {
      const conflict = managerConflicts[0];
      return res.status(409).json({
        success: false,
        message: `${conflict.memberName || 'Selected manager'} is already assigned to ${conflict.panelName}. One event manager can be in only one panel.`,
      });
    }

    const panel = await InductionPanel.create({
      name: panelName,
      description,
      members: uniqueMemberIds,
      createdBy: req.user?._id,
    });

    const populatedPanel = await InductionPanel.findById(panel._id).populate('members', 'name email role');
    return res.status(201).json({ success: true, data: populatedPanel });
  } catch (error) {
    console.error('Create panel error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/induction/panels/:panelId — Get one panel details for management
router.get('/panels/:panelId', protect, authorize('event_manager', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { panelId } = req.params;
    const panel = await InductionPanel.findById(panelId)
      .populate('members', 'name email role')
      .populate('students.student', 'firstName lastName email rollNumber branch section status');

    if (!panel) {
      return res.status(404).json({ success: false, message: 'Panel not found' });
    }

    if (!canAccessPanel(panel, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this panel' });
    }

    return res.json({ success: true, data: panel });
  } catch (error) {
    console.error('Fetch panel detail error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/induction/panels/:panelId — Update panel details and members
router.patch('/panels/:panelId', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { panelId } = req.params;
    const panel = await InductionPanel.findById(panelId);

    if (!panel) {
      return res.status(404).json({ success: false, message: 'Panel not found' });
    }

    const hasName = Object.prototype.hasOwnProperty.call(req.body || {}, 'name');
    const hasDescription = Object.prototype.hasOwnProperty.call(req.body || {}, 'description');
    const hasMembers = Object.prototype.hasOwnProperty.call(req.body || {}, 'memberUserIds');

    if (hasName) {
      const panelName = String(req.body?.name || '').trim();
      if (!panelName) {
        return res.status(400).json({ success: false, message: 'Panel name is required' });
      }
      panel.name = panelName;
    }

    if (hasDescription) {
      panel.description = String(req.body?.description || '').trim();
    }

    if (hasMembers) {
      const memberUserIds = Array.isArray(req.body?.memberUserIds) ? req.body.memberUserIds : [];
      if (!memberUserIds.length) {
        return res.status(400).json({ success: false, message: 'Select at least one panel member' });
      }

      const uniqueMemberIds = [...new Set(memberUserIds.map((id) => String(id)))];
      const memberUsers = await User.find({ _id: { $in: uniqueMemberIds } }).select('_id role isApproved');

      if (memberUsers.length !== uniqueMemberIds.length) {
        return res.status(400).json({ success: false, message: 'Some selected panel members are invalid' });
      }

      const invalidMember = memberUsers.find((member) => !isApprovedEventManager(member));
      if (invalidMember) {
        return res.status(400).json({
          success: false,
          message: 'Panel members must be approved event managers',
        });
      }

      const managerConflicts = await findManagerConflicts({
        memberIds: uniqueMemberIds,
        excludePanelId: panel._id,
      });
      if (managerConflicts.length > 0) {
        const conflict = managerConflicts[0];
        return res.status(409).json({
          success: false,
          message: `${conflict.memberName || 'Selected manager'} is already assigned to ${conflict.panelName}. One event manager can be in only one panel.`,
        });
      }

      panel.members = uniqueMemberIds;
    }

    await panel.save();

    const updatedPanel = await InductionPanel.findById(panel._id)
      .populate('members', 'name email role')
      .populate('students.student', 'firstName lastName email rollNumber branch status');

    return res.json({ success: true, message: 'Panel updated successfully', data: updatedPanel });
  } catch (error) {
    console.error('Update panel error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/induction/panels/:panelId — Delete a panel (super_admin only)
router.delete('/panels/:panelId', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { panelId } = req.params;
    const panel = await InductionPanel.findById(panelId);

    if (!panel) {
      return res.status(404).json({ success: false, message: 'Panel not found' });
    }

    // Optional: Check if panel has students and prevent deletion
    if (panel.students && panel.students.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete panel with ${panel.students.length} assigned student(s). Please remove students first.` 
      });
    }

    await InductionPanel.findByIdAndDelete(panelId);

    return res.json({ success: true, message: 'Panel deleted successfully' });
  } catch (error) {
    console.error('Delete panel error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/induction/panels/:panelId/start-pi — Start PI round for a panel
router.post('/panels/:panelId/start-pi', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { panelId } = req.params;
    const panel = await InductionPanel.findById(panelId);

    if (!panel) {
      return res.status(404).json({ success: false, message: 'Panel not found' });
    }

    if (panel.piStarted) {
      return res.json({ success: true, message: 'PI round is already started for this panel' });
    }

    panel.piStarted = true;
    panel.piStartedAt = new Date();
    panel.piStartedBy = req.user?._id;
    await panel.save();

    return res.json({ success: true, message: 'PI round started successfully' });
  } catch (error) {
    console.error('Start PI error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/induction/panels — List induction panels (event managers see their own)
router.get('/panels', protect, authorize('event_manager', 'admin', 'super_admin'), async (req, res) => {
  try {
    const includeStudents = String(req.query?.includeStudents || '') === 'true';
    const query = req.user.role === 'event_manager'
      ? { members: req.user._id, isActive: true }
      : {};

    let panelQuery = InductionPanel.find(query)
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    if (includeStudents) {
      panelQuery = panelQuery.populate('students.student', 'firstName lastName email rollNumber branch status');
    }

    const panels = await panelQuery;

    return res.json({ success: true, data: panels });
  } catch (error) {
    console.error('List panels error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/induction/panels/:panelId/students — Assign shortlisted students to panel
router.patch('/panels/:panelId/students', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { panelId } = req.params;
    const studentIds = Array.isArray(req.body?.studentIds) ? req.body.studentIds : [];
    const mode = String(req.body?.mode || 'add').toLowerCase();

    // Allow empty array only for 'set' mode (to clear all students)
    if (!studentIds.length && mode !== 'set') {
      return res.status(400).json({ success: false, message: 'studentIds array is required' });
    }

    const panel = await InductionPanel.findById(panelId);
    if (!panel) {
      return res.status(404).json({ success: false, message: 'Panel not found' });
    }

    // If mode is 'set' and studentIds is empty, clear all students
    if (mode === 'set' && !studentIds.length) {
      panel.students = [];
      await panel.save();

      const updatedPanel = await InductionPanel.findById(panel._id)
        .populate('members', 'name email role')
        .populate('students.student', 'firstName lastName email rollNumber branch status');

      return res.json({
        success: true,
        message: 'All students removed from panel successfully',
        data: updatedPanel,
      });
    }

    const students = await Induction.find({ _id: { $in: studentIds } }).select('_id status');
    const allowedStatuses = ['shortlisted_online', 'shortlisted_offline'];
    const assignable = students.filter((student) => allowedStatuses.includes(student.status));

    if (!assignable.length) {
      return res.status(400).json({
        success: false,
        message: 'Only shortlisted students can be assigned to panels',
      });
    }

    const nextEntries = assignable.map((student) => ({
      student: student._id,
      addedBy: req.user?._id,
      addedAt: new Date(),
    }));

    const assignableIds = assignable.map((student) => student._id);
    const conflictingPanels = await InductionPanel.find({
      _id: { $ne: panel._id },
      'students.student': { $in: assignableIds },
      isActive: true,
    }).select('name students.student');

    if (conflictingPanels.length > 0) {
      const conflictingStudentIds = new Set(
        conflictingPanels
          .flatMap((conflictPanel) => conflictPanel.students || [])
          .map((entry) => String(entry.student))
          .filter((sid) => assignableIds.some((id) => String(id) === sid)),
      );

      if (conflictingStudentIds.size > 0) {
        return res.status(409).json({
          success: false,
          message: 'Some students are already assigned to another panel. One student can be in only one panel.',
        });
      }
    }

    if (mode === 'set') {
      panel.students = nextEntries.map((entry, index) => ({
        ...entry,
        sequence: index + 1,
      }));
    } else {
      const existingSet = new Set(panel.students.map((entry) => String(entry.student)));
      const maxSequence = panel.students.reduce(
        (max, entry) => Math.max(max, Number(entry.sequence || 0)),
        0,
      );
      let nextSequence = maxSequence + 1;

      nextEntries.forEach((entry) => {
        if (!existingSet.has(String(entry.student))) {
          panel.students.push({
            ...entry,
            sequence: nextSequence,
          });
          nextSequence += 1;
        }
      });
    }

    await panel.save();

    const updatedPanel = await InductionPanel.findById(panel._id)
      .populate('members', 'name email role')
      .populate('students.student', 'firstName lastName email rollNumber branch status');

    return res.json({
      success: true,
      message: 'Students assigned to panel successfully',
      data: updatedPanel,
    });
  } catch (error) {
    console.error('Assign panel students error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/induction/panels/:panelId/students — Get panel students with evaluations
router.get('/panels/:panelId/students', protect, authorize('event_manager', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { panelId } = req.params;
    const settings = await getOrCreateSettings();
    const panel = await InductionPanel.findById(panelId)
      .populate('members', 'name email role')
      .populate('students.student', 'firstName lastName email rollNumber branch status');

    if (!panel) {
      return res.status(404).json({ success: false, message: 'Panel not found' });
    }

    if (!canAccessPanel(panel, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this panel' });
    }

    const studentIds = panel.students.map((entry) => entry.student?._id).filter(Boolean);
    const evaluations = await InductionPanelEvaluation.find({
      panel: panel._id,
      student: { $in: studentIds },
    }).populate('evaluator', 'name email role');

    const evalByStudent = new Map();
    evaluations.forEach((evaluation) => {
      const key = String(evaluation.student);
      const bucket = evalByStudent.get(key) || [];
      bucket.push(evaluation);
      evalByStudent.set(key, bucket);
    });

    const students = panel.students
      .filter((entry) => entry.student)
      .map((entry) => {
        const sid = String(entry.student._id);
        const list = evalByStudent.get(sid) || [];
        const avgScore = list.length
          ? Number((list.reduce((sum, ev) => sum + Number(ev.score || 0), 0) / list.length).toFixed(2))
          : null;
        const myEvaluation = list.find((ev) => String(ev.evaluator?._id) === String(req.user._id)) || null;

        return {
          sequence: entry.sequence || 1,
          student: entry.student,
          isFinalized: !!entry.isFinalized,
          finalStatus: entry.finalStatus || null,
          finalNote: entry.finalNote || '',
          finalizedAt: entry.finalizedAt || null,
          evaluations: list,
          averageScore: avgScore,
          myEvaluation,
        };
      })
      .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0));

    return res.json({
      success: true,
      data: {
        panel,
        piControl: {
          piRound: settings.piRound || 'shortlisted_online',
          isPiStarted: !!settings.isPiStarted,
          piStartedAt: settings.piStartedAt || null,
        },
        students,
      },
    });
  } catch (error) {
    console.error('Fetch panel students error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/induction/panels/:panelId/evaluate — Save evaluator score for student
router.post('/panels/:panelId/evaluate', protect, authorize('event_manager', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { panelId } = req.params;
    const {
      studentId,
      score,
      overallRating,
      technicalSkills,
      softSkills,
      comment,
      review,
      remarks,
      recommendation,
    } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'studentId is required' });
    }

    const overallRatingNumber = Number(overallRating);
    const technicalSkillsNumber = Number(technicalSkills);
    const softSkillsNumber = Number(softSkills);
    const hasRubric =
      !Number.isNaN(overallRatingNumber) &&
      !Number.isNaN(technicalSkillsNumber) &&
      !Number.isNaN(softSkillsNumber);
    const rubricValid =
      hasRubric &&
      overallRatingNumber >= 1 && overallRatingNumber <= 10 &&
      technicalSkillsNumber >= 1 && technicalSkillsNumber <= 10 &&
      softSkillsNumber >= 1 && softSkillsNumber <= 10;

    if (hasRubric && !rubricValid) {
      return res.status(400).json({ success: false, message: 'Ratings must be between 1 and 10' });
    }

    const scoreNumber = !Number.isNaN(Number(score))
      ? Number(score)
      : hasRubric
        ? Math.round(((overallRatingNumber + technicalSkillsNumber + softSkillsNumber) / 3) * 10)
        : NaN;

    if (Number.isNaN(scoreNumber) || scoreNumber < 0 || scoreNumber > 100) {
      return res.status(400).json({ success: false, message: 'Score must be between 0 and 100' });
    }

    const settings = await getOrCreateSettings();
    const panel = await InductionPanel.findById(panelId);
    if (!panel) {
      return res.status(404).json({ success: false, message: 'Panel not found' });
    }

    if (!canAccessPanel(panel, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this panel' });
    }

    if (!settings.isPiStarted) {
      return res.status(403).json({
        success: false,
        message: 'PI round is not started yet. Ask super admin to start PI first.',
      });
    }

    const isStudentAssigned = panel.students.some((entry) => String(entry.student) === String(studentId));
    if (!isStudentAssigned) {
      return res.status(400).json({ success: false, message: 'Student is not assigned to this panel' });
    }

    const allowedRecommendations = ['hold', 'shortlisted_offline', 'selected', 'rejected'];
    const safeRecommendation = allowedRecommendations.includes(String(recommendation || ''))
      ? String(recommendation)
      : 'hold';

    const evaluationUpdate = {
      score: scoreNumber,
      comment: String(comment || '').trim(),
      review: String(review || '').trim(),
      remarks: String(remarks || '').trim(),
      recommendation: safeRecommendation,
    };

    if (rubricValid) {
      evaluationUpdate.overallRating = overallRatingNumber;
      evaluationUpdate.technicalSkills = technicalSkillsNumber;
      evaluationUpdate.softSkills = softSkillsNumber;
    }

    const evaluation = await InductionPanelEvaluation.findOneAndUpdate(
      {
        panel: panel._id,
        student: studentId,
        evaluator: req.user._id,
      },
      {
        $set: evaluationUpdate,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).populate('evaluator', 'name email role');

    return res.json({ success: true, data: evaluation });
  } catch (error) {
    console.error('Save panel evaluation error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/induction/panels/:panelId/finalize — Finalize panel decision for one student
router.post('/panels/:panelId/finalize', protect, authorize('event_manager', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { panelId } = req.params;
    const { studentId, finalStatus, finalNote } = req.body;

    if (!studentId || !finalStatus) {
      return res.status(400).json({ success: false, message: 'studentId and finalStatus are required' });
    }

    if (!VALID_INDUCTION_STATUSES.includes(finalStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid final status' });
    }

    const panel = await InductionPanel.findById(panelId);
    if (!panel) {
      return res.status(404).json({ success: false, message: 'Panel not found' });
    }

    if (!canAccessPanel(panel, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this panel' });
    }

    const settings = await getOrCreateSettings();
    if (!settings.isPiStarted) {
      return res.status(403).json({
        success: false,
        message: 'PI round is not started yet. Ask super admin to start PI first.',
      });
    }

    const targetEntry = panel.students.find((entry) => String(entry.student) === String(studentId));
    if (!targetEntry) {
      return res.status(400).json({ success: false, message: 'Student is not assigned to this panel' });
    }

    targetEntry.isFinalized = true;
    targetEntry.finalStatus = finalStatus;
    targetEntry.finalizedBy = req.user._id;
    targetEntry.finalizedAt = new Date();
    targetEntry.finalNote = String(finalNote || '').trim();
    await panel.save();

    await Induction.findByIdAndUpdate(studentId, { $set: { status: finalStatus } });

    return res.json({
      success: true,
      message: 'Student finalized successfully',
    });
  } catch (error) {
    console.error('Finalize panel student error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/induction/panels/:panelId/students/:studentId — Get detailed student profile and my evaluation for panel
router.get('/panels/:panelId/students/:studentId', protect, authorize('event_manager', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { panelId, studentId } = req.params;
    const settings = await getOrCreateSettings();
    const panel = await InductionPanel.findById(panelId).populate('members', 'name email role');

    if (!panel) {
      return res.status(404).json({ success: false, message: 'Panel not found' });
    }

    if (!canAccessPanel(panel, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this panel' });
    }

    const panelEntry = panel.students.find((entry) => String(entry.student) === String(studentId));
    if (!panelEntry) {
      return res.status(404).json({ success: false, message: 'Student is not assigned to this panel' });
    }

    const student = await Induction.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const myEvaluation = await InductionPanelEvaluation.findOne({
      panel: panel._id,
      student: student._id,
      evaluator: req.user._id,
    }).populate('evaluator', 'name email role');

    return res.json({
      success: true,
      data: {
        panel,
        panelEntry,
        student,
        myEvaluation,
        piControl: {
          piRound: settings.piRound || 'shortlisted_online',
          isPiStarted: !!settings.isPiStarted,
          piStartedAt: settings.piStartedAt || null,
        },
      },
    });
  } catch (error) {
    console.error('Fetch panel student detail error:', error);
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

    // Event managers can see all applications (not restricted to their panels)
    // This allows them to view total applications and select students for panel assignment

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

// ═══════════════════════════════════════════════════════════════
// ADVANCEMENT REQUEST ROUTES (event_manager can request, super_admin approves)
// ═══════════════════════════════════════════════════════════════

// POST /api/induction/advancement-requests — Create advancement request (event_manager/admin)
router.post('/advancement-requests', protect, authorize('event_manager', 'admin'), async (req, res) => {
  try {
    const { studentIds, targetStatus, reason } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Student IDs are required' });
    }

    if (!targetStatus || !['shortlisted_online', 'shortlisted_offline', 'selected', 'rejected'].includes(targetStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid target status' });
    }

    // Get student details
    const students = await Induction.find({ _id: { $in: studentIds } }).select('_id firstName lastName status');

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found' });
    }

    // Check if requests already exist for these students with pending status
    const existingRequests = await InductionAdvancementRequest.find({
      student: { $in: studentIds },
      status: 'pending'
    });

    if (existingRequests.length > 0) {
      const existingStudentIds = existingRequests.map(r => r.student.toString());
      return res.status(400).json({
        success: false,
        message: `Some students already have pending requests: ${existingStudentIds.join(', ')}`
      });
    }

    // Create requests for each student
    const requests = students.map(student => ({
      student: student._id,
      requestedBy: req.user._id,
      requestedByName: req.user.name,
      requestedByRole: req.user.role,
      currentStatus: student.status,
      targetStatus,
      reason: reason || '',
      status: 'pending'
    }));

    const createdRequests = await InductionAdvancementRequest.insertMany(requests);

    res.json({
      success: true,
      message: `Advancement request created for ${createdRequests.length} student(s)`,
      data: createdRequests
    });
  } catch (error) {
    console.error('Create advancement request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/induction/advancement-requests — Get all advancement requests
router.get('/advancement-requests', protect, authorize('event_manager', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    // Event managers only see their own requests
    if (req.user.role === 'event_manager') {
      filter.requestedBy = req.user._id;
    }

    // Filter by status if provided
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const requests = await InductionAdvancementRequest.find(filter)
      .populate('student', 'firstName lastName email rollNumber branch status')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get advancement requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/induction/advancement-requests/pending-count — Get count of pending requests (super_admin)
router.get('/advancement-requests/pending-count', protect, authorize('super_admin'), async (req, res) => {
  try {
    const count = await InductionAdvancementRequest.countDocuments({ status: 'pending' });
    res.json({ success: true, count });
  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/induction/advancement-requests/:id/approve — Approve request (super_admin only)
router.patch('/advancement-requests/:id/approve', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { reviewNote } = req.body;
    const request = await InductionAdvancementRequest.findById(req.params.id).populate('student');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already reviewed' });
    }

    // Update student status
    await Induction.findByIdAndUpdate(request.student._id, {
      status: request.targetStatus
    });

    // Update request
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedByName = req.user.name;
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote || '';
    await request.save();

    // Send email to student
    let roundName = "";
    let nextRoundDetails = "";

    if (request.targetStatus === 'shortlisted_online') {
      roundName = "Online PI Round";
      nextRoundDetails = "Get ready for a virtual interview where we will evaluate your technical and soft skills. Check your WhatsApp regularly for updates, the meeting link, and interview slot timings.";
    } else if (request.targetStatus === 'shortlisted_offline') {
      roundName = "Offline PI Round";
      nextRoundDetails = "You cleared the online round! The final offline interview details will be shared soon. Be prepared to showcase your projects and problem-solving skills in person.";
    } else if (request.targetStatus === 'selected') {
      roundName = "Core Team Member";
      nextRoundDetails = "Welcome to the GDG MMMUT family! We are thrilled to have you onboard. We will contact you shortly with onboarding details.";
    }

    if (['shortlisted_online', 'shortlisted_offline', 'selected'].includes(request.targetStatus)) {
      sendInductionRoundEmail(request.student.email, request.student.firstName, roundName, nextRoundDetails);
    }

    res.json({
      success: true,
      message: 'Request approved and student status updated',
      data: request
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/induction/advancement-requests/:id/reject — Reject request (super_admin only)
router.patch('/advancement-requests/:id/reject', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { reviewNote } = req.body;
    const request = await InductionAdvancementRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already reviewed' });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedByName = req.user.name;
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote || '';
    await request.save();

    res.json({
      success: true,
      message: 'Request rejected',
      data: request
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/induction/advancement-requests/:id — Delete request (requester or super_admin)
router.delete('/advancement-requests/:id', protect, authorize('event_manager', 'admin', 'super_admin'), async (req, res) => {
  try {
    const request = await InductionAdvancementRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only requester or super_admin can delete
    if (req.user.role !== 'super_admin' && request.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this request' });
    }

    // Can only delete pending requests
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Cannot delete reviewed requests' });
    }

    await request.deleteOne();

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/induction/analytics — Get comprehensive analytics for panels and evaluations
router.get('/analytics', protect, authorize('event_manager', 'admin', 'super_admin'), async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const isEventManager = req.user.role === 'event_manager';

    // Build query based on role
    let panelQuery = { isActive: true };
    if (isEventManager) {
      // Event managers only see their own panels
      panelQuery.members = req.user._id;
    }

    // Fetch panels with populated data
    const panels = await InductionPanel.find(panelQuery)
      .populate('members', 'name email role')
      .populate({
        path: 'students.student',
        select: 'firstName lastName email rollNumber branch status'
      })
      .lean();

    // Get PI control status from Settings
    const settings = await Settings.findOne().lean();
    const piControl = {
      isPiStarted: !!settings?.isPiStarted,
      piRound: settings?.piRound || 'shortlisted_online',
      piStartedAt: settings?.piStartedAt
    };

    // Calculate analytics for each panel
    const panelAnalytics = await Promise.all(panels.map(async (panel) => {
      const totalStudents = panel.students?.length || 0;
      const studentIds = (panel.students || []).map(entry => entry.student?._id).filter(Boolean);

      // Get all evaluations for this panel
      const evaluations = await InductionPanelEvaluation.find({
        panel: panel._id,
        student: { $in: studentIds }
      }).lean();

      // Calculate unique students evaluated (a student might have multiple evaluations from different panel members)
      const evaluatedStudentIds = new Set(evaluations.map(ev => String(ev.student)));
      const studentsEvaluated = evaluatedStudentIds.size;
      const studentsPending = totalStudents - studentsEvaluated;

      // Calculate recommendation breakdown
      const recommendations = {
        hold: 0,
        shortlisted_offline: 0,
        selected: 0,
        rejected: 0
      };

      evaluations.forEach(ev => {
        if (recommendations.hasOwnProperty(ev.recommendation)) {
          recommendations[ev.recommendation]++;
        }
      });

      // Calculate average ratings
      const ratingsData = evaluations.filter(ev => ev.overallRating);
      const avgOverallRating = ratingsData.length > 0
        ? (ratingsData.reduce((sum, ev) => sum + ev.overallRating, 0) / ratingsData.length).toFixed(2)
        : 0;

      const techRatingsData = evaluations.filter(ev => ev.technicalSkills);
      const avgTechnicalSkills = techRatingsData.length > 0
        ? (techRatingsData.reduce((sum, ev) => sum + ev.technicalSkills, 0) / techRatingsData.length).toFixed(2)
        : 0;

      const softRatingsData = evaluations.filter(ev => ev.softSkills);
      const avgSoftSkills = softRatingsData.length > 0
        ? (softRatingsData.reduce((sum, ev) => sum + ev.softSkills, 0) / softRatingsData.length).toFixed(2)
        : 0;

      // Calculate finalization status (students with finalStatus set)
      const finalizedStudents = (panel.students || []).filter(entry => entry.finalStatus).length;

      // Student status breakdown (based on their current induction status)
      const statusBreakdown = {
        shortlisted_online: 0,
        shortlisted_offline: 0,
        selected: 0,
        rejected: 0,
        other: 0
      };

      (panel.students || []).forEach(entry => {
        const status = entry.student?.status;
        if (statusBreakdown.hasOwnProperty(status)) {
          statusBreakdown[status]++;
        } else {
          statusBreakdown.other++;
        }
      });

      return {
        panelId: panel._id,
        panelName: panel.name,
        description: panel.description,
        members: panel.members?.map(m => ({
          id: m._id,
          name: m.name,
          email: m.email
        })) || [],
        totalStudents,
        studentsEvaluated,
        studentsPending,
        evaluationProgress: totalStudents > 0 ? ((studentsEvaluated / totalStudents) * 100).toFixed(1) : 0,
        totalEvaluations: evaluations.length,
        finalizedStudents,
        finalizationProgress: totalStudents > 0 ? ((finalizedStudents / totalStudents) * 100).toFixed(1) : 0,
        averageRatings: {
          overall: parseFloat(avgOverallRating),
          technical: parseFloat(avgTechnicalSkills),
          soft: parseFloat(avgSoftSkills)
        },
        recommendations,
        statusBreakdown,
        piStarted: panel.piStarted || false,
        piStartedAt: panel.piStartedAt
      };
    }));

    // Calculate overall system stats (for super admin)
    let systemStats = null;
    if (isSuperAdmin) {
      const totalPanels = panelAnalytics.length;
      const totalStudentsAcrossAllPanels = panelAnalytics.reduce((sum, p) => sum + p.totalStudents, 0);
      const totalEvaluationsAcrossAllPanels = panelAnalytics.reduce((sum, p) => sum + p.totalEvaluations, 0);
      const totalStudentsEvaluatedAcrossAllPanels = panelAnalytics.reduce((sum, p) => sum + p.studentsEvaluated, 0);
      const totalFinalizedAcrossAllPanels = panelAnalytics.reduce((sum, p) => sum + p.finalizedStudents, 0);

      const overallEvaluationProgress = totalStudentsAcrossAllPanels > 0
        ? ((totalStudentsEvaluatedAcrossAllPanels / totalStudentsAcrossAllPanels) * 100).toFixed(1)
        : 0;

      const overallFinalizationProgress = totalStudentsAcrossAllPanels > 0
        ? ((totalFinalizedAcrossAllPanels / totalStudentsAcrossAllPanels) * 100).toFixed(1)
        : 0;

      // Aggregate recommendations across all panels
      const aggregatedRecommendations = {
        hold: 0,
        shortlisted_offline: 0,
        selected: 0,
        rejected: 0
      };

      panelAnalytics.forEach(panel => {
        Object.keys(aggregatedRecommendations).forEach(key => {
          aggregatedRecommendations[key] += panel.recommendations[key] || 0;
        });
      });

      // Count induction applications by status
      const inductionStats = await Induction.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const inductionStatusBreakdown = {};
      inductionStats.forEach(stat => {
        inductionStatusBreakdown[stat._id] = stat.count;
      });

      systemStats = {
        totalPanels,
        totalStudents: totalStudentsAcrossAllPanels,
        totalEvaluations: totalEvaluationsAcrossAllPanels,
        studentsEvaluated: totalStudentsEvaluatedAcrossAllPanels,
        studentsPending: totalStudentsAcrossAllPanels - totalStudentsEvaluatedAcrossAllPanels,
        studentsFinalized: totalFinalizedAcrossAllPanels,
        evaluationProgress: parseFloat(overallEvaluationProgress),
        finalizationProgress: parseFloat(overallFinalizationProgress),
        aggregatedRecommendations,
        inductionApplications: inductionStatusBreakdown,
        piStatus: {
          isStarted: piControl.isPiStarted,
          round: piControl.piRound,
          startedAt: piControl.piStartedAt
        }
      };
    }

    res.json({
      success: true,
      data: {
        panels: panelAnalytics,
        systemStats,
        piControl
      }
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
