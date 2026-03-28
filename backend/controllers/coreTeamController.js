import CoreTeamMember from '../models/CoreTeamMember.js';

const normalizeExternalUrl = (url) => {
  if (typeof url !== 'string') return '';

  const trimmed = url.trim();
  if (!trimmed || trimmed === '#') return '';

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, '')}`;

  try {
    const parsed = new URL(withProtocol);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
};

const normalizeSocialLinks = (social = {}) => ({
  linkedin: normalizeExternalUrl(social?.linkedin),
  twitter: normalizeExternalUrl(social?.twitter),
  github: normalizeExternalUrl(social?.github),
  instagram: normalizeExternalUrl(social?.instagram),
});

const normalizeMemberPayload = (payload = {}) => {
  const normalized = { ...payload };
  if (Object.prototype.hasOwnProperty.call(normalized, 'social')) {
    normalized.social = normalizeSocialLinks(normalized.social || {});
  }
  return normalized;
};

// Get all team members (Public)
export const getAllMembers = async (req, res) => {
  try {
    const members = await CoreTeamMember.find({ visible: true }).sort({ order: 1, name: 1 }).lean();
    const data = members.map((member) => ({
      ...member,
      social: normalizeSocialLinks(member.social),
    }));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all members (Admin)
export const getAllMembersAdmin = async (req, res) => {
  try {
    const members = await CoreTeamMember.find({}).sort({ order: 1 }).lean();
    const data = members.map((member) => ({
      ...member,
      social: normalizeSocialLinks(member.social),
    }));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a member
export const createMember = async (req, res) => {
  try {
    const payload = normalizeMemberPayload(req.body);
    const member = await CoreTeamMember.create(payload);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a member
export const updateMember = async (req, res) => {
  try {
    const payload = normalizeMemberPayload(req.body);
    const member = await CoreTeamMember.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a member
export const deleteMember = async (req, res) => {
  try {
    const member = await CoreTeamMember.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.status(200).json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
