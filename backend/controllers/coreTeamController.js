import CoreTeamMember from '../models/CoreTeamMember.js';

// Get all team members (Public)
export const getAllMembers = async (req, res) => {
  try {
    const members = await CoreTeamMember.find({ visible: true }).sort({ order: 1, name: 1 });
    res.status(200).json({ success: true, count: members.length, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all members (Admin)
export const getAllMembersAdmin = async (req, res) => {
  try {
    const members = await CoreTeamMember.find({}).sort({ order: 1 });
    res.status(200).json({ success: true, count: members.length, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a member
export const createMember = async (req, res) => {
  try {
    const member = await CoreTeamMember.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a member
export const updateMember = async (req, res) => {
  try {
    const member = await CoreTeamMember.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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
