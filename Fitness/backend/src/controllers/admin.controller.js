import { User } from '../models/user.model.js';
import { Exercise } from '../models/exercise.model.js';
import { WorkoutPlan } from '../models/workout-plan.model.js';
import { WorkoutLog } from '../models/workout-log.model.js';
import { TrainerClient } from '../models/trainer-client.model.js';
import { Subscription } from '../models/subscription.model.js';
import { Payment } from '../models/payment.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// ==========================================
// 1. DASHBOARD STATISTICS & OVERVIEW
// ==========================================

/**
 * Get comprehensive platform statistics.
 * GET /api/v1/admin/stats
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      userRoleCount,
      trainerRoleCount,
      adminRoleCount,
      totalExercises,
      totalWorkoutPlans,
      totalCompletedWorkouts,
      totalSubscriptions,
      activeSubscriptions,
      recentUsers,
      recentPayments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'USER' }),
      User.countDocuments({ role: 'TRAINER' }),
      User.countDocuments({ role: 'ADMIN' }),
      Exercise.countDocuments(),
      WorkoutPlan.countDocuments(),
      WorkoutLog.countDocuments({ status: 'completed' }),
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      User.find().select('name email role isActive createdAt profileImage').sort({ createdAt: -1 }).limit(5),
      Payment.find().populate('user', 'name email').sort({ paidAt: -1 }).limit(5),
    ]);

    // Calculate revenue metrics
    const revenueAgg = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // Calculate MRR from active paid subscriptions
    const mrrAgg = await Subscription.aggregate([
      { $match: { status: 'active', plan: { $in: ['Pro', 'Elite'] } } },
      { $group: { _id: null, mrr: { $sum: '$price' } } },
    ]);
    const mrr = mrrAgg[0]?.mrr || 0;

    // Subscription plan breakdown
    const [freeSubs, proSubs, eliteSubs] = await Promise.all([
      Subscription.countDocuments({ plan: 'Free', status: 'active' }),
      Subscription.countDocuments({ plan: 'Pro', status: 'active' }),
      Subscription.countDocuments({ plan: 'Elite', status: 'active' }),
    ]);

    return ApiResponse.success(res, 'Admin dashboard statistics retrieved successfully', {
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          byRole: {
            user: userRoleCount,
            trainer: trainerRoleCount,
            admin: adminRoleCount,
          },
        },
        content: {
          exercises: totalExercises,
          workoutPlans: totalWorkoutPlans,
          completedWorkouts: totalCompletedWorkouts,
        },
        billing: {
          totalRevenue,
          monthlyRecurringRevenue: mrr,
          totalSubscriptions,
          activeSubscriptions,
          planBreakdown: {
            free: freeSubs,
            pro: proSubs,
            elite: eliteSubs,
          },
        },
        recentUsers,
        recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. USER MANAGEMENT
// ==========================================

/**
 * Get paginated list of users with search and filters.
 * GET /api/v1/admin/users
 */
export const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const search = req.query.search?.trim();
    const role = req.query.role;
    const status = req.query.status;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'All') {
      query.role = role;
    }

    if (status && status !== 'All') {
      query.isActive = status === 'active';
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('name email role isActive profileImage age gender height weight fitnessGoal activityLevel createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return ApiResponse.success(res, 'Users retrieved successfully', {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate or deactivate a user account.
 * PATCH /api/v1/admin/users/:id/status
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw ApiError.badRequest('isActive boolean is required');
    }

    if (id === req.user._id.toString()) {
      throw ApiError.badRequest('Administrators cannot change their own account status');
    }

    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.isActive = isActive;
    await user.save();

    return ApiResponse.success(res, `User ${isActive ? 'activated' : 'deactivated'} successfully`, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role (USER, TRAINER, ADMIN).
 * PATCH /api/v1/admin/users/:id/role
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'TRAINER', 'ADMIN'].includes(role)) {
      throw ApiError.badRequest('Invalid role. Supported: USER, TRAINER, ADMIN');
    }

    if (id === req.user._id.toString() && role !== 'ADMIN') {
      throw ApiError.badRequest('Administrators cannot demote their own account');
    }

    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.role = role;
    await user.save();

    return ApiResponse.success(res, `User role updated to ${role} successfully`, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user account.
 * DELETE /api/v1/admin/users/:id
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      throw ApiError.badRequest('Administrators cannot delete their own account');
    }

    const user = await User.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await User.findByIdAndDelete(id);
    // Cleanup related connections and subscriptions
    await TrainerClient.deleteMany({ $or: [{ trainer: id }, { client: id }] });
    await Subscription.deleteMany({ user: id });

    return ApiResponse.success(res, 'User and associated data deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. TRAINER MANAGEMENT
// ==========================================

/**
 * Get all trainers with client counts and profile details.
 * GET /api/v1/admin/trainers
 */
export const getTrainers = async (req, res, next) => {
  try {
    const trainers = await User.find({ role: 'TRAINER' })
      .select('name email profileImage trainerProfile isActive createdAt')
      .sort({ createdAt: -1 });

    const trainersWithMetrics = await Promise.all(
      trainers.map(async (t) => {
        const [activeClientsCount, totalClientsCount, plansCreatedCount] = await Promise.all([
          TrainerClient.countDocuments({ trainer: t._id, status: 'active' }),
          TrainerClient.countDocuments({ trainer: t._id }),
          WorkoutPlan.countDocuments({ createdBy: t._id }),
        ]);

        return {
          ...t.toObject(),
          activeClientsCount,
          totalClientsCount,
          plansCreatedCount,
        };
      })
    );

    return ApiResponse.success(res, 'Trainers retrieved successfully', {
      trainers: trainersWithMetrics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update trainer profile details or verification status.
 * PATCH /api/v1/admin/trainers/:id
 */
export const updateTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isAcceptingClients, specialties, certifications, yearsOfExperience, bio } = req.body;

    const user = await User.findOne({ _id: id, role: 'TRAINER' });
    if (!user) {
      throw ApiError.notFound('Trainer not found');
    }

    if (!user.trainerProfile) {
      user.trainerProfile = {};
    }

    if (typeof isAcceptingClients === 'boolean') {
      user.trainerProfile.isAcceptingClients = isAcceptingClients;
    }
    if (specialties) user.trainerProfile.specialties = specialties;
    if (certifications) user.trainerProfile.certifications = certifications;
    if (yearsOfExperience !== undefined) user.trainerProfile.yearsOfExperience = Number(yearsOfExperience);
    if (bio !== undefined) user.trainerProfile.bio = bio;

    await user.save();

    return ApiResponse.success(res, 'Trainer profile updated successfully', {
      trainer: user,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. WORKOUT MANAGEMENT
// ==========================================

/**
 * Get all workout programs across the platform with creator details.
 * GET /api/v1/admin/workouts
 */
export const getWorkoutsOverview = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const search = req.query.search?.trim();
    const difficulty = req.query.difficulty;
    const goal = req.query.goal;

    const query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }
    if (goal && goal !== 'All') {
      query.goal = goal;
    }

    const total = await WorkoutPlan.countDocuments(query);
    const plans = await WorkoutPlan.find(query)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return ApiResponse.success(res, 'Workout plans retrieved successfully', {
      plans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete any workout plan.
 * DELETE /api/v1/admin/workouts/:id
 */
export const deleteWorkoutPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await WorkoutPlan.findByIdAndDelete(id);

    if (!plan) {
      throw ApiError.notFound('Workout plan not found');
    }

    return ApiResponse.success(res, 'Workout plan deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. SUBSCRIPTION & PAYMENT MANAGEMENT
// ==========================================

/**
 * Get all platform subscriptions.
 * GET /api/v1/admin/subscriptions
 */
export const getSubscriptions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const plan = req.query.plan;
    const status = req.query.status;

    const query = {};
    if (plan && plan !== 'All') query.plan = plan;
    if (status && status !== 'All') query.status = status;

    const total = await Subscription.countDocuments(query);
    const subscriptions = await Subscription.find(query)
      .populate('user', 'name email role profileImage')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return ApiResponse.success(res, 'Subscriptions retrieved successfully', {
      subscriptions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a user's subscription status or tier.
 * PATCH /api/v1/admin/subscriptions/:id
 */
export const updateSubscriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plan, status, price, endDate } = req.body;

    const sub = await Subscription.findById(id);
    if (!sub) {
      throw ApiError.notFound('Subscription not found');
    }

    if (plan) sub.plan = plan;
    if (status) sub.status = status;
    if (price !== undefined) sub.price = Number(price);
    if (endDate) sub.endDate = new Date(endDate);

    await sub.save();

    return ApiResponse.success(res, 'Subscription updated successfully', {
      subscription: sub,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all payment transactions.
 * GET /api/v1/admin/payments
 */
export const getPayments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const status = req.query.status;

    const query = {};
    if (status && status !== 'All') query.status = status;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('user', 'name email role')
      .populate('subscription')
      .sort({ paidAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return ApiResponse.success(res, 'Payments retrieved successfully', {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. REPORTS & ANALYTICS
// ==========================================

/**
 * Get analytical reports for users, revenue, and content.
 * GET /api/v1/admin/reports
 */
export const getReports = async (req, res, next) => {
  try {
    // 1. User registration trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const userTrends = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 2. Revenue trends (monthly)
    const revenueTrends = await Payment.aggregate([
      { $match: { status: 'completed', paidAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
          total: { $sum: '$amount' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 3. Subscription tier breakdown
    const subscriptionBreakdown = await Subscription.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]);

    // 4. Popular muscle groups across exercises
    const exerciseDistribution = await Exercise.aggregate([
      { $group: { _id: '$muscleGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return ApiResponse.success(res, 'Reports retrieved successfully', {
      reports: {
        userTrends: userTrends.map((t) => ({ month: t._id, count: t.count })),
        revenueTrends: revenueTrends.map((r) => ({ month: r._id, revenue: r.total, count: r.transactions })),
        subscriptionBreakdown: subscriptionBreakdown.map((s) => ({ plan: s._id, count: s.count })),
        exerciseDistribution: exerciseDistribution.map((e) => ({ muscleGroup: e._id, count: e.count })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. SEEDER: ADMIN & BILLING DATA
// ==========================================

/**
 * Seed default Admin user, Subscriptions, and Payments if empty.
 */
export const seedAdminAndBillingIfEmpty = async () => {
  try {
    // 1. Seed Admin User
    let admin = await User.findOne({ email: 'admin@fitness.test' });
    if (!admin) {
      admin = new User({
        name: 'Platform Administrator',
        email: 'admin@fitness.test',
        password: 'password123',
        role: 'ADMIN',
        isActive: true,
      });
      await admin.save();
      console.log('[Admin Seeder] Seeded default administrator (admin@fitness.test)');
    }

    // 2. Seed Subscriptions and Payments if none exist
    const subCount = await Subscription.countDocuments();
    if (subCount === 0) {
      const users = await User.find().limit(5);

      if (users.length > 0) {
        const sampleSubs = [
          {
            user: users[0]._id,
            plan: 'Pro',
            status: 'active',
            billingCycle: 'monthly',
            price: 19,
            startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          {
            user: users[1] ? users[1]._id : users[0]._id,
            plan: 'Elite',
            status: 'active',
            billingCycle: 'monthly',
            price: 49,
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
          {
            user: users[2] ? users[2]._id : users[0]._id,
            plan: 'Free',
            status: 'active',
            billingCycle: 'monthly',
            price: 0,
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        ];

        const createdSubs = await Subscription.insertMany(sampleSubs);

        // Seed corresponding payments
        const samplePayments = [
          {
            user: createdSubs[0].user,
            subscription: createdSubs[0]._id,
            amount: 19,
            currency: 'USD',
            status: 'completed',
            paymentMethod: 'Credit Card',
            transactionId: 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          {
            user: createdSubs[0].user,
            subscription: createdSubs[0]._id,
            amount: 19,
            currency: 'USD',
            status: 'completed',
            paymentMethod: 'Credit Card',
            transactionId: 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            paidAt: new Date(),
          },
          {
            user: createdSubs[1].user,
            subscription: createdSubs[1]._id,
            amount: 49,
            currency: 'USD',
            status: 'completed',
            paymentMethod: 'PayPal',
            transactionId: 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            paidAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          },
        ];

        await Payment.insertMany(samplePayments);
        console.log('[Billing Seeder] Seeded sample subscriptions and payments');
      }
    }
  } catch (error) {
    console.error('[Admin Seeder] Seeding error:', error.message);
  }
};
