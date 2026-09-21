import User from '../models/user.model.js';
import TrainerClient from '../models/trainer-client.model.js';
import DietPlan from '../models/diet-plan.model.js';
import WorkoutPlan from '../models/workout-plan.model.js';
import WorkoutLog from '../models/workout-log.model.js';
import Measurement from '../models/measurement.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Helper to verify that the requesting trainer is authorized to access the specified client.
 * Must have an 'active' connection or the requester must be an ADMIN.
 */
const verifyTrainerClientAccess = async (trainerId, clientId, role) => {
  if (role === 'ADMIN') {
    return true;
  }

  const connection = await TrainerClient.findOne({
    trainer: trainerId,
    client: clientId,
    status: 'active',
  });

  if (!connection) {
    throw ApiError.forbidden(
      'Access denied. You do not have an active trainer-client relationship with this user.'
    );
  }

  return connection;
};

// ==========================================
// 1. TRAINER PROFILE & PUBLIC DIRECTORY
// ==========================================

/**
 * Get authenticated trainer's profile and roster stats.
 * GET /api/v1/trainers/profile
 */
export const getTrainerProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      'name email role profileImage age gender height weight fitnessGoal activityLevel trainerProfile createdAt'
    );

    // Get client counts
    const activeClientsCount = await TrainerClient.countDocuments({
      trainer: req.user._id,
      status: 'active',
    });

    const pendingRequestsCount = await TrainerClient.countDocuments({
      trainer: req.user._id,
      status: 'pending',
    });

    return ApiResponse.success(res, 'Trainer profile retrieved successfully', {
      user,
      stats: {
        activeClientsCount,
        pendingRequestsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated trainer's professional profile.
 * PUT /api/v1/trainers/profile
 */
export const updateTrainerProfile = async (req, res, next) => {
  try {
    const { specialties, certifications, yearsOfExperience, bio, isAcceptingClients } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.trainerProfile) {
      user.trainerProfile = {};
    }

    if (specialties !== undefined) user.trainerProfile.specialties = specialties;
    if (certifications !== undefined) user.trainerProfile.certifications = certifications;
    if (yearsOfExperience !== undefined) user.trainerProfile.yearsOfExperience = Number(yearsOfExperience);
    if (bio !== undefined) user.trainerProfile.bio = bio;
    if (isAcceptingClients !== undefined) user.trainerProfile.isAcceptingClients = Boolean(isAcceptingClients);

    await user.save();

    return ApiResponse.success(res, 'Trainer profile updated successfully', {
      trainerProfile: user.trainerProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public directory of certified trainers accepting clients.
 * GET /api/v1/trainers/public
 */
export const getPublicTrainers = async (req, res, next) => {
  try {
    const trainers = await User.find({
      role: 'TRAINER',
      isActive: true,
      $or: [
        { 'trainerProfile.isAcceptingClients': true },
        { 'trainerProfile.isAcceptingClients': { $exists: false } },
      ],
    }).select('name email profileImage trainerProfile');

    return ApiResponse.success(res, 'Trainers retrieved successfully', {
      trainers,
      count: trainers.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Seed a default certified trainer if none exists.
 */
export const seedTrainerIfEmpty = async () => {
  try {
    const trainerCount = await User.countDocuments({ role: 'TRAINER' });
    if (trainerCount > 0) return;

    const trainer = new User({
      name: 'Sarah Connor',
      email: 'sarah@fitness.test',
      password: 'password123',
      role: 'TRAINER',
      age: 29,
      gender: 'Female',
      height: 172,
      weight: 64,
      fitnessGoal: 'Strength',
      activityLevel: 'Very Active',
      trainerProfile: {
        specialties: ['Hypertrophy', 'Strength Conditioning', 'Fat Loss'],
        certifications: ['NASM Certified Personal Trainer', 'CSCS Strength Coach'],
        yearsOfExperience: 6,
        bio: 'Certified Strength & Conditioning Specialist dedicated to helping athletes and fitness enthusiasts achieve transformational body composition results.',
        isAcceptingClients: true,
      },
    });

    await trainer.save();
    console.log('[Trainer Seeder] Seeded default certified trainer (sarah@fitness.test)');
  } catch (error) {
    console.error('[Trainer Seeder] Seeding error:', error.message);
  }
};

// ==========================================
// 2. CLIENT MANAGEMENT (TRAINER SIDE)
// ==========================================

/**
 * Get trainer's roster of clients (both active and pending).
 * GET /api/v1/trainers/clients
 */
export const getClients = async (req, res, next) => {
  try {
    const connections = await TrainerClient.find({ trainer: req.user._id })
      .populate('client', 'name email profileImage age gender height weight fitnessGoal activityLevel createdAt')
      .populate('assignedWorkoutPlan', 'title difficulty daysPerWeek')
      .populate('assignedDietPlan', 'title targetCalories targetProtein')
      .sort({ createdAt: -1 });

    const activeClients = connections.filter((c) => c.status === 'active');
    const pendingRequests = connections.filter((c) => c.status === 'pending');

    return ApiResponse.success(res, 'Client roster retrieved successfully', {
      clients: connections,
      activeClients,
      pendingRequests,
      activeCount: activeClients.length,
      pendingCount: pendingRequests.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Respond to a client connection request (accept or reject).
 * POST /api/v1/trainers/clients/:clientId/respond
 */
export const respondToConnectionRequest = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { action } = req.body; // 'accept' | 'reject'

    if (!['accept', 'reject'].includes(action)) {
      throw ApiError.badRequest("Action must be either 'accept' or 'reject'");
    }

    const connection = await TrainerClient.findOne({
      trainer: req.user._id,
      client: clientId,
      status: 'pending',
    });

    if (!connection) {
      throw ApiError.notFound('Pending connection request not found for this client');
    }

    if (action === 'accept') {
      connection.status = 'active';
      connection.connectedAt = new Date();
    } else {
      connection.status = 'rejected';
    }

    await connection.save();

    return ApiResponse.success(
      res,
      `Connection request ${action === 'accept' ? 'accepted' : 'rejected'} successfully`,
      { connection }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get full client details for an authorized trainer.
 * GET /api/v1/trainers/clients/:clientId
 */
export const getClientDetails = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const connection = await verifyTrainerClientAccess(req.user._id, clientId, req.user.role);

    const client = await User.findById(clientId).select(
      'name email profileImage age gender height weight fitnessGoal activityLevel createdAt'
    );

    if (!client) {
      throw ApiError.notFound('Client user not found');
    }

    const populatedConnection = await TrainerClient.findById(connection._id)
      .populate('assignedWorkoutPlan')
      .populate('assignedDietPlan');

    // Calculate BMI
    let bmi = null;
    let bmiCategory = null;
    if (client.height && client.weight) {
      const heightInMeters = client.height / 100;
      bmi = Math.round((client.weight / (heightInMeters * heightInMeters)) * 10) / 10;
      if (bmi < 18.5) bmiCategory = 'Underweight';
      else if (bmi < 24.9) bmiCategory = 'Normal weight';
      else if (bmi < 29.9) bmiCategory = 'Overweight';
      else bmiCategory = 'Obesity';
    }

    return ApiResponse.success(res, 'Client details retrieved successfully', {
      client: {
        ...client.toObject(),
        bmi,
        bmiCategory,
      },
      connection: populatedConnection,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. PLAN ASSIGNMENT (WORKOUT & DIET)
// ==========================================

/**
 * Assign a workout plan to an active client.
 * POST /api/v1/trainers/clients/:clientId/workout-plan
 */
export const assignWorkoutPlanToClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { workoutPlanId } = req.body;

    if (!workoutPlanId) {
      throw ApiError.badRequest('workoutPlanId is required');
    }

    const connection = await verifyTrainerClientAccess(req.user._id, clientId, req.user.role);

    const plan = await WorkoutPlan.findById(workoutPlanId);
    if (!plan) {
      throw ApiError.notFound('Workout plan not found');
    }

    // Set connection's assigned workout plan
    connection.assignedWorkoutPlan = plan._id;
    await connection.save();

    // Also mark plan assigned to this client
    plan.assignedTo = clientId;
    plan.isActive = true;
    await plan.save();

    return ApiResponse.success(res, 'Workout plan assigned to client successfully', {
      assignedWorkoutPlan: plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create and assign a custom diet plan to an active client.
 * POST /api/v1/trainers/clients/:clientId/diet-plan
 */
export const createAndAssignDietPlan = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { title, description, targetCalories, targetProtein, targetCarbs, targetFat, meals, guidelines } = req.body;

    if (!title || !targetCalories) {
      throw ApiError.badRequest('Diet plan title and target calories are required');
    }

    const connection = await verifyTrainerClientAccess(req.user._id, clientId, req.user.role);

    // Deactivate existing diet plans for this client
    await DietPlan.updateMany({ client: clientId, isActive: true }, { isActive: false });

    // Create new diet plan
    const dietPlan = await DietPlan.create({
      title,
      description: description || '',
      trainer: req.user._id,
      client: clientId,
      targetCalories: Number(targetCalories),
      targetProtein: Number(targetProtein || 0),
      targetCarbs: Number(targetCarbs || 0),
      targetFat: Number(targetFat || 0),
      meals: meals || [],
      guidelines: guidelines || undefined,
      isActive: true,
    });

    // Update connection
    connection.assignedDietPlan = dietPlan._id;
    await connection.save();

    return ApiResponse.created(res, 'Diet plan created and assigned to client successfully', {
      dietPlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active diet plan for client (accessible by authorized trainer or client themselves).
 * GET /api/v1/trainers/clients/:clientId/diet-plan
 */
export const getClientDietPlan = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    // Check if requester is the client themselves, or an authorized trainer / admin
    if (req.user._id.toString() !== clientId) {
      await verifyTrainerClientAccess(req.user._id, clientId, req.user.role);
    }

    const dietPlan = await DietPlan.findOne({
      client: clientId,
      isActive: true,
    }).populate('trainer', 'name email profileImage');

    return ApiResponse.success(res, 'Client diet plan retrieved', { dietPlan });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. CLIENT PROGRESS & ANALYTICS INSPECTION
// ==========================================

/**
 * View client's weight progression.
 * GET /api/v1/trainers/clients/:clientId/progress
 */
export const getClientProgress = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    await verifyTrainerClientAccess(req.user._id, clientId, req.user.role);

    const measurements = await Measurement.find({ user: clientId })
      .sort({ date: 1 })
      .select('date weight');

    const points = measurements.map((m) => ({ date: m.date, weight: m.weight }));
    const weights = points.map((p) => p.weight);

    const startWeight = weights.length > 0 ? weights[0] : 0;
    const currentWeight = weights.length > 0 ? weights[weights.length - 1] : 0;
    const highestWeight = weights.length > 0 ? Math.max(...weights) : 0;
    const lowestWeight = weights.length > 0 ? Math.min(...weights) : 0;
    const netChange = Math.round((currentWeight - startWeight) * 10) / 10;

    // Total workouts completed
    const totalWorkouts = await WorkoutLog.countDocuments({ user: clientId, status: 'completed' });

    return ApiResponse.success(res, 'Client progress retrieved successfully', {
      points,
      stats: {
        startWeight,
        currentWeight,
        highestWeight,
        lowestWeight,
        netChange,
        totalWorkouts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * View client's strength progression across workout logs.
 * GET /api/v1/trainers/clients/:clientId/strength
 */
export const getClientStrengthProgress = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { exerciseName } = req.query;
    await verifyTrainerClientAccess(req.user._id, clientId, req.user.role);

    const logs = await WorkoutLog.find({
      user: clientId,
      status: 'completed',
    }).sort({ completedAt: 1, startedAt: 1 });

    const exercisesMap = new Map();

    logs.forEach((log) => {
      const sessionDate = log.completedAt || log.startedAt;
      log.exercises.forEach((ex) => {
        const name = ex.name;
        if (!exercisesMap.has(name)) {
          exercisesMap.set(name, []);
        }

        let maxWeight = 0;
        let volume = 0;

        ex.sets.forEach((set) => {
          const w = set.actualWeight || 0;
          const r = set.completedReps || 0;
          if (w > maxWeight) maxWeight = w;
          volume += w * r;
        });

        if (maxWeight > 0 || volume > 0) {
          exercisesMap.get(name).push({
            date: sessionDate,
            maxWeight,
            volume,
            setsCount: ex.sets.length,
          });
        }
      });
    });

    const availableExercises = Array.from(exercisesMap.keys());
    const selectedExercise = exerciseName || availableExercises[0] || null;
    const points = selectedExercise ? exercisesMap.get(selectedExercise) || [] : [];

    let personalRecord = 0;
    let totalVolume = 0;
    points.forEach((p) => {
      if (p.maxWeight > personalRecord) personalRecord = p.maxWeight;
      totalVolume += p.volume;
    });

    return ApiResponse.success(res, 'Client strength progression retrieved', {
      availableExercises,
      selectedExercise,
      points,
      stats: {
        personalRecord,
        totalSessions: points.length,
        totalVolume,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * View client's completed workout logs with set breakdowns.
 * GET /api/v1/trainers/clients/:clientId/workouts
 */
export const getClientWorkoutHistory = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    await verifyTrainerClientAccess(req.user._id, clientId, req.user.role);

    const logs = await WorkoutLog.find({ user: clientId, status: 'completed' })
      .populate('workoutPlan', 'title difficulty goal')
      .sort({ completedAt: -1, startedAt: -1 })
      .limit(20);

    return ApiResponse.success(res, 'Client workout history retrieved', {
      history: logs,
      count: logs.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * View client's recorded body measurements.
 * GET /api/v1/trainers/clients/:clientId/measurements
 */
export const getClientMeasurements = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    await verifyTrainerClientAccess(req.user._id, clientId, req.user.role);

    const measurements = await Measurement.find({ user: clientId })
      .sort({ date: -1 })
      .limit(30);

    return ApiResponse.success(res, 'Client measurements retrieved', {
      measurements,
      count: measurements.length,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. USER-SIDE CONNECTION
// ==========================================

/**
 * User requests connection with a certified trainer.
 * POST /api/v1/trainers/:trainerId/connect
 */
export const connectWithTrainer = async (req, res, next) => {
  try {
    const { trainerId } = req.params;
    const { message } = req.body;

    const trainer = await User.findOne({ _id: trainerId, role: 'TRAINER', isActive: true });
    if (!trainer) {
      throw ApiError.notFound('Trainer not found or not active');
    }

    let connection = await TrainerClient.findOne({
      trainer: trainerId,
      client: req.user._id,
    });

    if (connection) {
      if (connection.status === 'active') {
        throw ApiError.badRequest('You already have an active connection with this trainer');
      }
      if (connection.status === 'pending') {
        throw ApiError.badRequest('You already have a pending connection request with this trainer');
      }
      // If rejected or terminated, reset to pending
      connection.status = 'pending';
      connection.requestMessage = message || '';
      await connection.save();
    } else {
      connection = await TrainerClient.create({
        trainer: trainerId,
        client: req.user._id,
        status: 'pending',
        requestMessage: message || '',
      });
    }

    return ApiResponse.created(res, 'Connection request sent to trainer successfully', {
      connection,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User retrieves their connected trainer and assigned plans.
 * GET /api/v1/trainers/my-trainer
 */
export const getMyTrainer = async (req, res, next) => {
  try {
    const connection = await TrainerClient.findOne({
      client: req.user._id,
      status: 'active',
    })
      .populate('trainer', 'name email profileImage trainerProfile')
      .populate('assignedWorkoutPlan')
      .populate('assignedDietPlan');

    return ApiResponse.success(res, 'Active trainer connection retrieved', {
      connection,
      hasTrainer: Boolean(connection),
    });
  } catch (error) {
    next(error);
  }
};
