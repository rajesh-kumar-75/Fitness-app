const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const Workout = require('../models/Workout');
const Attendance = require('../models/Attendance');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const User = require('../models/User');

/**
 * @desc    Get admin dashboard metrics
 * @route   GET /api/dashboard/admin
 * @access  Private/Admin
 */
const getAdminDashboard = async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments();
    const totalTrainers = await Trainer.countDocuments();
    const totalPlans = await Membership.countDocuments();

    // Active vs Expired memberships
    const now = new Date();
    const activeMemberships = await Member.countDocuments({
      membershipEndDate: { $gte: now },
    });
    const expiredMemberships = await Member.countDocuments({
      membershipEndDate: { $lt: now },
    });

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.countDocuments({ date: today });

    // Revenue calculations
    const payments = await Payment.find({ paymentStatus: 'Completed' });
    const totalPayments = payments.length;
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Current month revenue
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyPayments = await Payment.find({
      paymentStatus: 'Completed',
      paymentDate: { $gte: startOfMonth },
    });
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Recent items
    const recentMembers = await Member.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('membership', 'name');

    const recentPayments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('member', 'name email')
      .populate('membership', 'name');

    return res.status(200).json({
      success: true,
      data: {
        totalMembers,
        totalTrainers,
        totalPlans,
        activeMemberships,
        expiredMemberships,
        todayAttendance,
        totalPayments,
        totalRevenue,
        monthlyRevenue,
        recentMembers,
        recentPayments,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching admin dashboard statistics',
    });
  }
};

/**
 * @desc    Get trainer dashboard metrics
 * @route   GET /api/dashboard/trainer
 * @access  Private/Trainer
 */
const getTrainerDashboard = async (req, res) => {
  try {
    let trainer = await Trainer.findOne({
      $or: [{ user: req.user._id }, { email: req.user.email }],
    });

    const trainerId = trainer ? trainer._id : null;

    const assignedMembers = trainerId
      ? await Member.find({ assignedTrainer: trainerId }).populate('membership', 'name')
      : [];

    const assignedMemberIds = assignedMembers.map((m) => m._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.countDocuments({
      date: today,
      member: { $in: assignedMemberIds },
    });

    const assignedWorkouts = trainerId
      ? await Workout.find({ trainer: trainerId })
      : await Workout.find().limit(5);

    return res.status(200).json({
      success: true,
      data: {
        trainer,
        totalAssignedMembers: assignedMembers.length,
        assignedMembers,
        todayAttendance,
        assignedWorkouts,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching trainer dashboard',
    });
  }
};

/**
 * @desc    Get member dashboard metrics
 * @route   GET /api/dashboard/member
 * @access  Private/Member
 */
const getMemberDashboard = async (req, res) => {
  try {
    let member = await Member.findOne({
      $or: [{ user: req.user._id }, { email: req.user.email }],
    })
      .populate('membership')
      .populate('assignedTrainer');

    if (!member) {
      member = await Member.create({
        user: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      });
    }

    // Member workouts
    const assignedWorkouts = await Workout.find({
      $or: [
        { assignedMembers: member._id },
        { category: 'Full Body' },
      ],
    }).limit(6);

    // Attendance summary
    const attendanceLogs = await Attendance.find({ member: member._id })
      .sort({ date: -1 })
      .limit(10);

    const totalCheckIns = await Attendance.countDocuments({ member: member._id });

    // Recent payments
    const recentPayments = await Payment.find({ member: member._id })
      .populate('membership', 'name price')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        member,
        currentMembership: member.membership || null,
        membershipExpiry: member.membershipEndDate || null,
        assignedTrainer: member.assignedTrainer || null,
        assignedWorkouts,
        totalCheckIns,
        recentAttendance: attendanceLogs,
        recentPayments,
        fitnessStatistics: {
          height: member.height,
          weight: member.weight,
          fitnessGoal: member.fitnessGoal,
          bmi:
            member.height && member.weight
              ? ((member.weight / (member.height * member.height)) * 10000).toFixed(1)
              : 22.5,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching member dashboard',
    });
  }
};

module.exports = {
  getAdminDashboard,
  getTrainerDashboard,
  getMemberDashboard,
};
