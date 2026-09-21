import { WorkoutLog } from '../models/workout-log.model.js';
import { WorkoutPlan } from '../models/workout-plan.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Start or resume a workout session for a given day.
 */
export const startWorkout = async (req, res, next) => {
  try {
    const { planId, dayOfWeek } = req.body;

    if (!dayOfWeek) {
      throw ApiError.badRequest('dayOfWeek is required to start a workout.');
    }

    // Check if there is already an in-progress workout for this user
    let existingSession = await WorkoutLog.findOne({
      user: req.user._id,
      status: 'in-progress',
    });

    if (existingSession) {
      return ApiResponse.success(res, 'Resuming active workout session', {
        session: existingSession,
        resumed: true,
      });
    }

    // Find the plan
    let plan;
    if (planId) {
      plan = await WorkoutPlan.findById(planId);
    } else {
      plan = await WorkoutPlan.findOne({
        $or: [{ assignedTo: req.user._id }, { isTemplate: true }],
        isActive: true,
      });
    }

    if (!plan) {
      throw ApiError.notFound('Workout plan not found.');
    }

    const scheduledDay = plan.schedule.find(
      (d) => d.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase()
    );

    if (!scheduledDay) {
      throw ApiError.badRequest(`No workout scheduled for ${dayOfWeek}.`);
    }

    if (scheduledDay.isRestDay) {
      throw ApiError.badRequest(`${dayOfWeek} is marked as a Rest Day in this plan.`);
    }

    // Prepare exercises and sets from the day's schedule
    const initialExercises = scheduledDay.exercises.map((ex) => ({
      exerciseId: ex.exercise,
      name: ex.exerciseName,
      muscleGroup: ex.muscleGroup,
      isCompleted: false,
      sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
        setNumber: i + 1,
        targetReps: ex.reps || 10,
        completedReps: ex.reps || 10,
        targetWeight: ex.targetWeight || 0,
        actualWeight: ex.targetWeight || 0,
        isCompleted: false,
      })),
    }));

    const session = await WorkoutLog.create({
      user: req.user._id,
      workoutPlan: plan._id,
      dayOfWeek: scheduledDay.dayOfWeek,
      dayName: scheduledDay.dayName,
      startedAt: new Date(),
      status: 'in-progress',
      exercises: initialExercises,
      notes: '',
    });

    return ApiResponse.created(res, 'Workout session started!', {
      session,
      resumed: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently active in-progress workout session for user.
 */
export const getActiveSession = async (req, res, next) => {
  try {
    const session = await WorkoutLog.findOne({
      user: req.user._id,
      status: 'in-progress',
    });

    return ApiResponse.success(res, 'Active workout session status', {
      hasActiveSession: !!session,
      session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update real-time progress of an in-progress session.
 */
export const updateWorkoutProgress = async (req, res, next) => {
  try {
    const { exercises, notes } = req.body;
    const sessionId = req.params.id;

    const session = await WorkoutLog.findOne({
      _id: sessionId,
      user: req.user._id,
      status: 'in-progress',
    });

    if (!session) {
      throw ApiError.notFound('Active workout session not found.');
    }

    if (exercises) {
      session.exercises = exercises;
    }
    if (notes !== undefined) {
      session.notes = notes;
    }

    await session.save();

    return ApiResponse.success(res, 'Workout progress saved', {
      session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete a workout session.
 */
export const completeWorkout = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const { exercises, notes } = req.body;

    const session = await WorkoutLog.findOne({
      _id: sessionId,
      user: req.user._id,
      status: 'in-progress',
    });

    if (!session) {
      throw ApiError.notFound('Active workout session not found.');
    }

    if (exercises) {
      session.exercises = exercises;
    }
    if (notes !== undefined) {
      session.notes = notes;
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - new Date(session.startedAt).getTime();
    const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

    session.completedAt = completedAt;
    session.durationMinutes = durationMinutes;
    session.status = 'completed';

    // Mark completed status on exercises
    session.exercises.forEach((ex) => {
      const allSetsDone = ex.sets.length > 0 && ex.sets.every((s) => s.isCompleted);
      ex.isCompleted = allSetsDone;
    });

    await session.save();

    return ApiResponse.success(res, 'Congratulations! Workout completed successfully.', {
      session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Abandon or cancel an in-progress workout session.
 */
export const cancelWorkout = async (req, res, next) => {
  try {
    const session = await WorkoutLog.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'in-progress' },
      { $set: { status: 'abandoned', completedAt: new Date() } },
      { new: true }
    );

    if (!session) {
      throw ApiError.notFound('Active workout session not found.');
    }

    return ApiResponse.success(res, 'Workout session cancelled.');
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve user's completed workout history and stats.
 */
export const getWorkoutHistory = async (req, res, next) => {
  try {
    const history = await WorkoutLog.find({
      user: req.user._id,
      status: 'completed',
    })
      .populate('workoutPlan', 'title goal difficulty')
      .sort({ completedAt: -1 })
      .limit(30);

    const totalWorkouts = await WorkoutLog.countDocuments({
      user: req.user._id,
      status: 'completed',
    });

    // Calculate total minutes
    const totalMinutes = history.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

    return ApiResponse.success(res, 'Workout history retrieved successfully', {
      history,
      stats: {
        totalWorkouts,
        totalMinutes,
        recentCount: history.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
