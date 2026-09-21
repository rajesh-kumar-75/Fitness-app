const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fitness_jwt_secret_dev_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is temporarily unavailable. Please check database connection.',
      });
    }

    const { name, email, password, phone, role, profileImage } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Normalize role
    let normalizedRole = 'member';
    if (role) {
      const lower = role.toLowerCase();
      if (['admin', 'trainer', 'member'].includes(lower)) {
        normalizedRole = lower;
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: normalizedRole,
      profileImage: profileImage || '',
    });

    // Automatically create corresponding Member or Trainer profile
    if (normalizedRole === 'member') {
      await Member.create({
        user: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
      });
    } else if (normalizedRole === 'trainer') {
      await Trainer.create({
        user: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
      });
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: normalizedRole === 'trainer' ? 'TRAINER' : (normalizedRole === 'admin' ? 'ADMIN' : 'USER'),
          phone: user.phone,
          profileImage: user.profileImage,
          isActive: user.isActive !== false,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error registering user',
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is temporarily unavailable. Please check database connection.',
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: (user.role || 'member').toUpperCase() === 'TRAINER' ? 'TRAINER' : ((user.role || '').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER'),
          phone: user.phone,
          profileImage: user.profileImage,
          isActive: user.isActive !== false,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error logging in',
    });
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = async (req, res) => {
  try {
    let profile = null;
    if (req.user.role === 'member') {
      profile = await Member.findOne({ user: req.user._id }).populate('membership').populate('assignedTrainer');
    } else if (req.user.role === 'trainer') {
      profile = await Trainer.findOne({ user: req.user._id });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: (req.user.role || 'member').toUpperCase() === 'TRAINER' ? 'TRAINER' : ((req.user.role || '').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER'),
          phone: req.user.phone,
          profileImage: req.user.profileImage,
          isActive: req.user.isActive !== false,
          createdAt: req.user.createdAt,
          profile,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user profile',
    });
  }
};

/**
 * @desc    Log out user / clear session
 * @route   POST /api/auth/logout
 * @access  Public / Private
 */
const logoutUser = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
};
