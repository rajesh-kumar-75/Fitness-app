const Attendance = require('../models/Attendance');
const Member = require('../models/Member');

/**
 * @desc    Member Check-in
 * @route   POST /api/attendance/check-in
 * @access  Private
 */
const checkIn = async (req, res) => {
  try {
    let memberId = req.body.memberId;

    // If no memberId provided in body, use logged-in user's member record
    if (!memberId && req.user) {
      const member = await Member.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }],
      });
      if (member) {
        memberId = member._id;
      }
    }

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: 'Member ID is required for check-in',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      member: memberId,
      date: today,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Member has already checked in today',
        data: existing,
      });
    }

    const attendance = await Attendance.create({
      member: memberId,
      date: today,
      checkInTime: new Date(),
      status: req.body.status || 'Present',
    });

    const populated = await Attendance.findById(attendance._id).populate('member', 'name email phone');

    return res.status(201).json({
      success: true,
      message: 'Check-in recorded successfully',
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error recording check-in',
    });
  }
};

/**
 * @desc    Member Check-out
 * @route   PUT /api/attendance/check-out
 * @access  Private
 */
const checkOut = async (req, res) => {
  try {
    let memberId = req.body.memberId;

    if (!memberId && req.user) {
      const member = await Member.findOne({
        $or: [{ user: req.user._id }, { email: req.user.email }],
      });
      if (member) {
        memberId = member._id;
      }
    }

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: 'Member ID is required for check-out',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      member: memberId,
      date: today,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No active check-in found for today',
      });
    }

    attendance.checkOutTime = new Date();
    await attendance.save();

    const populated = await Attendance.findById(attendance._id).populate('member', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Check-out recorded successfully',
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error recording check-out',
    });
  }
};

/**
 * @desc    Get all attendance logs
 * @route   GET /api/attendance
 * @access  Private/Admin
 */
const getAttendance = async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate('member', 'name email phone fitnessGoal')
      .sort({ date: -1, checkInTime: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching attendance',
    });
  }
};

/**
 * @desc    Get attendance for a specific member
 * @route   GET /api/attendance/member/:memberId
 * @access  Private
 */
const getMemberAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ member: req.params.memberId })
      .populate('member', 'name email')
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching member attendance',
    });
  }
};

/**
 * @desc    Get today's attendance
 * @route   GET /api/attendance/today
 * @access  Private
 */
const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const records = await Attendance.find({ date: today })
      .populate('member', 'name email phone')
      .sort({ checkInTime: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching today attendance',
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  getMemberAttendance,
  getTodayAttendance,
};
