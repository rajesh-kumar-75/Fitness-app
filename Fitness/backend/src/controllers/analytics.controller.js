import WorkoutLog from '../models/workout-log.model.js';
import Measurement from '../models/measurement.model.js';
import User from '../models/user.model.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Get strength progression for exercises from completed workout logs.
 * GET /api/v1/progress/strength?exerciseName=Barbell%20Bench%20Press
 */
export const getStrengthProgress = async (req, res, next) => {
  try {
    const { exerciseName } = req.query;
    const userId = req.user._id;

    // Fetch all completed workout sessions
    const logs = await WorkoutLog.find({
      user: userId,
      status: 'completed',
    }).sort({ completedAt: 1, startedAt: 1 });

    // Extract all distinct exercises performed
    const exercisesMap = new Map();

    logs.forEach((log) => {
      const sessionDate = log.completedAt || log.startedAt;
      log.exercises.forEach((ex) => {
        const name = ex.name;
        if (!exercisesMap.has(name)) {
          exercisesMap.set(name, []);
        }

        // Find max weight and total volume in this session for this exercise
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
    const points = selectedExercise ? (exercisesMap.get(selectedExercise) || []) : [];

    let personalRecord = 0;
    let totalVolume = 0;
    points.forEach((p) => {
      if (p.maxWeight > personalRecord) personalRecord = p.maxWeight;
      totalVolume += p.volume;
    });

    return ApiResponse.success(res, 'Strength progression retrieved successfully', {
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
 * Get detailed paginated workout history with metrics.
 * GET /api/v1/progress/workouts?page=1&limit=15
 */
export const getWorkoutHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const filter = {
      user: req.user._id,
      status: 'completed',
    };

    const total = await WorkoutLog.countDocuments(filter);
    const logs = await WorkoutLog.find(filter)
      .populate('workoutPlan', 'title difficulty goal')
      .sort({ completedAt: -1, startedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Compute session volumes & set stats
    const enrichedLogs = logs.map((log) => {
      let totalVolume = 0;
      let totalCompletedSets = 0;

      log.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          if (set.isCompleted) {
            totalCompletedSets++;
            totalVolume += (set.actualWeight || 0) * (set.completedReps || 0);
          }
        });
      });

      return {
        _id: log._id,
        workoutPlan: log.workoutPlan,
        dayOfWeek: log.dayOfWeek,
        dayName: log.dayName,
        startedAt: log.startedAt,
        completedAt: log.completedAt,
        durationMinutes: log.durationMinutes,
        status: log.status,
        notes: log.notes,
        exercises: log.exercises,
        totalVolume,
        totalCompletedSets,
      };
    });

    return ApiResponse.success(res, 'Workout history retrieved successfully', {
      history: enrichedLogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unified progress overview for user dashboard.
 * GET /api/v1/progress/overview
 */
export const getProgressOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Total workouts & minutes
    const workoutStats = await WorkoutLog.aggregate([
      { $match: { user: userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalMinutes: { $sum: '$durationMinutes' },
        },
      },
    ]);

    const totalWorkouts = workoutStats[0]?.totalWorkouts || 0;
    const totalMinutes = workoutStats[0]?.totalMinutes || 0;

    // Weight stats
    const measurements = await Measurement.find({ user: userId }).sort({ date: 1 });
    let currentWeight = 0;
    let netWeightChange = 0;

    if (measurements.length > 0) {
      const weights = measurements.map((m) => m.weight);
      currentWeight = weights[weights.length - 1];
      netWeightChange = Math.round((currentWeight - weights[0]) * 10) / 10;
    } else {
      const user = await User.findById(userId).select('profile');
      currentWeight = user?.profile?.weight || 0;
    }

    return ApiResponse.success(res, 'Progress overview retrieved successfully', {
      totalWorkouts,
      totalMinutes,
      currentWeight,
      netWeightChange,
    });
  } catch (error) {
    next(error);
  }
};
