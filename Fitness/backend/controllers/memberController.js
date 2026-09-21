const mongoose = require('mongoose');
const Member = require('../models/Member');
const User = require('../models/User');

/**
 * @desc    Get all members
 * @route   GET /api/members
 * @access  Private/Admin
 */
const getMembers = async (req, res) => {
  try {
    const members = await Member.find()
      .populate('membership', 'name price duration status')
      .populate('assignedTrainer', 'name email specialization')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching members',
    });
  }
};

/**
 * @desc    Get single member by ID
 * @route   GET /api/members/:id
 * @access  Private
 */
const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid member ID format: '${id}'`,
      });
    }

    const member = await Member.findById(id)
      .populate('membership')
      .populate('assignedTrainer');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching member',
    });
  }
};

/**
 * @desc    Create a new member
 * @route   POST /api/members
 * @access  Private/Admin
 */
const createMember = async (req, res) => {
  try {
    const { name, email, phone, dateOfBirth, gender, height, weight, fitnessGoal, emergencyContact, membership, assignedTrainer } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required',
      });
    }

    const existing = await Member.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Member with this email already exists',
      });
    }

    const member = await Member.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      dateOfBirth,
      gender: gender || 'Prefer not to say',
      height: height || 170,
      weight: weight || 70,
      fitnessGoal: fitnessGoal || 'General Fitness',
      emergencyContact: emergencyContact || '',
      membership: membership || null,
      assignedTrainer: assignedTrainer || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating member',
    });
  }
};

/**
 * @desc    Update a member
 * @route   PUT /api/members/:id
 * @access  Private/Admin
 */
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid member ID format: '${id}'`,
      });
    }

    const member = await Member.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('membership')
      .populate('assignedTrainer');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      data: member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating member',
    });
  }
};

/**
 * @desc    Delete a member
 * @route   DELETE /api/members/:id
 * @access  Private/Admin
 */
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid member ID format: '${id}'`,
      });
    }

    const member = await Member.findByIdAndDelete(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting member',
    });
  }
};

/**
 * @desc    Get current logged in member's profile
 * @route   GET /api/members/profile/me
 * @access  Private
 */
const getMyProfile = async (req, res) => {
  try {
    let member = await Member.findOne({
      $or: [{ user: req.user._id }, { email: req.user.email }],
    })
      .populate('membership')
      .populate('assignedTrainer');

    if (!member) {
      // Auto-create if not yet created
      member = await Member.create({
        user: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      });
    }

    return res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching member profile',
    });
  }
};

/**
 * @desc    Update current logged in member's profile
 * @route   PUT /api/members/profile/me
 * @access  Private
 */
const updateMyProfile = async (req, res) => {
  try {
    let member = await Member.findOne({
      $or: [{ user: req.user._id }, { email: req.user.email }],
    });

    if (!member) {
      member = new Member({
        user: req.user._id,
        name: req.user.name,
        email: req.user.email,
      });
    }

    const {
      name,
      phone,
      dateOfBirth,
      gender,
      height,
      weight,
      fitnessGoal,
      emergencyContact,
      profileImage,
    } = req.body;

    if (name) member.name = name;
    if (phone) member.phone = phone;
    if (dateOfBirth) member.dateOfBirth = dateOfBirth;
    if (gender) member.gender = gender;
    if (height) member.height = height;
    if (weight) member.weight = weight;
    if (fitnessGoal) member.fitnessGoal = fitnessGoal;
    if (emergencyContact) member.emergencyContact = emergencyContact;
    if (profileImage) member.profileImage = profileImage;

    await member.save();

    // Also update User record if name or phone changed
    if (name || phone || profileImage) {
      await User.findByIdAndUpdate(req.user._id, {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(profileImage && { profileImage }),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating member profile',
    });
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getMyProfile,
  updateMyProfile,
};
