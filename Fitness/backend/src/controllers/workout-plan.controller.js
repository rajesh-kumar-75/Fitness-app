import { WorkoutPlan } from '../models/workout-plan.model.js';
import { Exercise } from '../models/exercise.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * Auto-seeds 2 standard workout programs if database has no plans.
 */
export const seedWorkoutPlansIfEmpty = async () => {
  try {
    // Also ensure existing plans have cover images
    await WorkoutPlan.updateMany(
      { $or: [{ coverImageUrl: '' }, { coverImageUrl: { $exists: false } }] },
      {
        $set: {
          coverImageUrl: '/assets/images/workouts/fullbody.svg',
          coverThumbnailUrl: '/assets/images/workouts/fullbody.svg',
        },
      }
    );

    const count = await WorkoutPlan.countDocuments();
    if (count > 0) return;

    console.log('[Workout Seeder] Seeding default workout programs...');

    // Fetch seeded exercises
    const bench = await Exercise.findOne({ name: 'Barbell Bench Press' });
    const squat = await Exercise.findOne({ name: 'Barbell Back Squat' });
    const deadlift = await Exercise.findOne({ name: 'Conventional Deadlift' });
    const ohp = await Exercise.findOne({ name: 'Overhead Shoulder Press' });
    const curl = await Exercise.findOne({ name: 'Dumbbell Bicep Curl' });
    const triceps = await Exercise.findOne({ name: 'Tricep Rope Pushdown' });
    const hipThrust = await Exercise.findOne({ name: 'Barbell Hip Thrust' });
    const kneeRaise = await Exercise.findOne({ name: 'Hanging Knee Raise' });
    const sprints = await Exercise.findOne({ name: 'HIIT Treadmill Sprints' });

    if (!bench || !squat) {
      console.log('[Workout Seeder] Exercises not yet ready for workout seeding.');
      return;
    }

    const defaultPlans = [
      {
        title: '4-Day Hypertrophy & Power Split',
        description: 'An optimal 4-day upper/lower split designed for muscle hypertrophy, compound strength, and progressive overload.',
        coverImageUrl: '/assets/images/workouts/fullbody.svg',
        coverThumbnailUrl: '/assets/images/workouts/fullbody.svg',
        difficulty: 'Intermediate',
        goal: 'Muscle Gain',
        durationWeeks: 8,
        daysPerWeek: 4,
        isTemplate: true,
        isActive: true,
        schedule: [
          {
            dayOfWeek: 'Monday',
            dayName: 'Push - Chest, Shoulders & Triceps',
            isRestDay: false,
            estimatedDurationMinutes: 50,
            exercises: [
              {
                exercise: bench._id,
                exerciseName: bench.name,
                muscleGroup: bench.muscleGroup,
                sets: 4,
                reps: 8,
                targetWeight: 75,
                restTimeSeconds: 90,
                notes: 'Focus on explosive push and controlled eccentric tempo.',
              },
              {
                exercise: ohp._id,
                exerciseName: ohp.name,
                muscleGroup: ohp.muscleGroup,
                sets: 3,
                reps: 10,
                targetWeight: 45,
                restTimeSeconds: 90,
                notes: 'Keep core braced and spine neutral.',
              },
              {
                exercise: triceps._id,
                exerciseName: triceps.name,
                muscleGroup: triceps.muscleGroup,
                sets: 3,
                reps: 12,
                targetWeight: 25,
                restTimeSeconds: 60,
                notes: 'Full lock out at the bottom.',
              },
            ],
          },
          {
            dayOfWeek: 'Tuesday',
            dayName: 'Pull - Back & Biceps',
            isRestDay: false,
            estimatedDurationMinutes: 50,
            exercises: [
              {
                exercise: deadlift._id,
                exerciseName: deadlift.name,
                muscleGroup: deadlift.muscleGroup,
                sets: 4,
                reps: 6,
                targetWeight: 110,
                restTimeSeconds: 120,
                notes: 'Reset between reps; drive through heels.',
              },
              {
                exercise: curl._id,
                exerciseName: curl.name,
                muscleGroup: curl.muscleGroup,
                sets: 3,
                reps: 12,
                targetWeight: 14,
                restTimeSeconds: 60,
                notes: 'Squeeze biceps at the top without swinging.',
              },
            ],
          },
          {
            dayOfWeek: 'Wednesday',
            dayName: 'Active Recovery & Mobility',
            isRestDay: true,
            estimatedDurationMinutes: 0,
            exercises: [],
          },
          {
            dayOfWeek: 'Thursday',
            dayName: 'Legs & Glutes Power',
            isRestDay: false,
            estimatedDurationMinutes: 55,
            exercises: [
              {
                exercise: squat._id,
                exerciseName: squat.name,
                muscleGroup: squat.muscleGroup,
                sets: 4,
                reps: 8,
                targetWeight: 90,
                restTimeSeconds: 120,
                notes: 'Break parallel depth on every repetition.',
              },
              {
                exercise: hipThrust._id,
                exerciseName: hipThrust.name,
                muscleGroup: hipThrust.muscleGroup,
                sets: 3,
                reps: 10,
                targetWeight: 80,
                restTimeSeconds: 90,
                notes: 'Hold peak contraction for 1 full second.',
              },
            ],
          },
          {
            dayOfWeek: 'Friday',
            dayName: 'Core & Conditioning',
            isRestDay: false,
            estimatedDurationMinutes: 40,
            exercises: [
              {
                exercise: kneeRaise._id,
                exerciseName: kneeRaise.name,
                muscleGroup: kneeRaise.muscleGroup,
                sets: 3,
                reps: 15,
                targetWeight: 0,
                restTimeSeconds: 60,
                notes: 'Avoid swinging; bring knees all the way to chest.',
              },
              {
                exercise: sprints._id,
                exerciseName: sprints.name,
                muscleGroup: sprints.muscleGroup,
                sets: 8,
                reps: 1,
                targetWeight: 0,
                restTimeSeconds: 60,
                notes: '30s sprint / 60s recovery interval.',
              },
            ],
          },
          {
            dayOfWeek: 'Saturday',
            dayName: 'Rest & Nutrition Focus',
            isRestDay: true,
            estimatedDurationMinutes: 0,
            exercises: [],
          },
          {
            dayOfWeek: 'Sunday',
            dayName: 'Rest & Weekly Review',
            isRestDay: true,
            estimatedDurationMinutes: 0,
            exercises: [],
          },
        ],
      },
      {
        title: '3-Day Full Body Strength Foundation',
        description: 'An efficient 3-day weekly routine ideal for developing baseline strength and full-body neuromuscular efficiency.',
        difficulty: 'Beginner',
        goal: 'General Fitness',
        durationWeeks: 6,
        daysPerWeek: 3,
        isTemplate: true,
        isActive: true,
        schedule: [
          {
            dayOfWeek: 'Monday',
            dayName: 'Full Body A',
            isRestDay: false,
            estimatedDurationMinutes: 45,
            exercises: [
              {
                exercise: squat._id,
                exerciseName: squat.name,
                muscleGroup: squat.muscleGroup,
                sets: 3,
                reps: 10,
                targetWeight: 60,
                restTimeSeconds: 90,
                notes: 'Master form before increasing load.',
              },
              {
                exercise: bench._id,
                exerciseName: bench.name,
                muscleGroup: bench.muscleGroup,
                sets: 3,
                reps: 10,
                targetWeight: 50,
                restTimeSeconds: 90,
                notes: 'Tuck shoulders back and down.',
              },
              {
                exercise: curl._id,
                exerciseName: curl.name,
                muscleGroup: curl.muscleGroup,
                sets: 3,
                reps: 12,
                targetWeight: 10,
                restTimeSeconds: 60,
                notes: 'Controlled movement.',
              },
            ],
          },
          {
            dayOfWeek: 'Tuesday',
            dayName: 'Rest Day',
            isRestDay: true,
            estimatedDurationMinutes: 0,
            exercises: [],
          },
          {
            dayOfWeek: 'Wednesday',
            dayName: 'Full Body B',
            isRestDay: false,
            estimatedDurationMinutes: 45,
            exercises: [
              {
                exercise: deadlift._id,
                exerciseName: deadlift.name,
                muscleGroup: deadlift.muscleGroup,
                sets: 3,
                reps: 8,
                targetWeight: 80,
                restTimeSeconds: 120,
                notes: 'Keep barbell close to shins.',
              },
              {
                exercise: ohp._id,
                exerciseName: ohp.name,
                muscleGroup: ohp.muscleGroup,
                sets: 3,
                reps: 10,
                targetWeight: 35,
                restTimeSeconds: 90,
                notes: 'Lock out overhead.',
              },
              {
                exercise: triceps._id,
                exerciseName: triceps.name,
                muscleGroup: triceps.muscleGroup,
                sets: 3,
                reps: 12,
                targetWeight: 20,
                restTimeSeconds: 60,
                notes: 'Keep upper arms still.',
              },
            ],
          },
          {
            dayOfWeek: 'Thursday',
            dayName: 'Rest Day',
            isRestDay: true,
            estimatedDurationMinutes: 0,
            exercises: [],
          },
          {
            dayOfWeek: 'Friday',
            dayName: 'Full Body C',
            isRestDay: false,
            estimatedDurationMinutes: 45,
            exercises: [
              {
                exercise: hipThrust._id,
                exerciseName: hipThrust.name,
                muscleGroup: hipThrust.muscleGroup,
                sets: 3,
                reps: 12,
                targetWeight: 60,
                restTimeSeconds: 90,
                notes: 'Drive through heels.',
              },
              {
                exercise: kneeRaise._id,
                exerciseName: kneeRaise.name,
                muscleGroup: kneeRaise.muscleGroup,
                sets: 3,
                reps: 12,
                targetWeight: 0,
                restTimeSeconds: 60,
                notes: 'Engage core fully.',
              },
            ],
          },
          {
            dayOfWeek: 'Saturday',
            dayName: 'Rest Day',
            isRestDay: true,
            estimatedDurationMinutes: 0,
            exercises: [],
          },
          {
            dayOfWeek: 'Sunday',
            dayName: 'Rest Day',
            isRestDay: true,
            estimatedDurationMinutes: 0,
            exercises: [],
          },
        ],
      },
      {
        title: '5-Day Advanced Hypertrophy Split',
        description: 'A comprehensive 5-day routine targeting individual muscle groups daily to maximize training volume and muscular hypertrophy.',
        coverImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
        coverThumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80',
        difficulty: 'Advanced',
        goal: 'Muscle Gain',
        durationWeeks: 10,
        daysPerWeek: 5,
        isTemplate: true,
        isActive: true,
        schedule: [
          {
            dayOfWeek: 'Monday',
            dayName: 'Chest Hypertrophy Focus',
            isRestDay: false,
            estimatedDurationMinutes: 55,
            exercises: [
              {
                exercise: bench._id,
                exerciseName: bench.name,
                muscleGroup: bench.muscleGroup,
                sets: 4,
                reps: 8,
                targetWeight: 80,
                restTimeSeconds: 90,
                notes: 'Focus on explosive push and controlled eccentric tempo.',
              },
              {
                exercise: dbPress ? dbPress._id : bench._id,
                exerciseName: dbPress ? dbPress.name : 'Incline Dumbbell Press',
                muscleGroup: 'Chest',
                sets: 3,
                reps: 10,
                targetWeight: 28,
                restTimeSeconds: 90,
                notes: 'Keep bench at 30 degrees incline.',
              },
              {
                exercise: dbFly ? dbFly._id : bench._id,
                exerciseName: dbFly ? dbFly.name : 'Dumbbell Fly',
                muscleGroup: 'Chest',
                sets: 3,
                reps: 12,
                targetWeight: 16,
                restTimeSeconds: 60,
                notes: 'Deep chest stretch at the bottom.',
              },
            ],
          },
          {
            dayOfWeek: 'Tuesday',
            dayName: 'Back Thickness & Width',
            isRestDay: false,
            estimatedDurationMinutes: 55,
            exercises: [
              {
                exercise: latPulldown._id,
                exerciseName: latPulldown.name,
                muscleGroup: latPulldown.muscleGroup,
                sets: 4,
                reps: 10,
                targetWeight: 65,
                restTimeSeconds: 90,
                notes: 'Drive elbows down and back.',
              },
              {
                exercise: barbellRow._id,
                exerciseName: barbellRow.name,
                muscleGroup: barbellRow.muscleGroup,
                sets: 4,
                reps: 8,
                targetWeight: 70,
                restTimeSeconds: 90,
                notes: 'Maintain neutral spine angle.',
              },
              {
                exercise: cableRow._id,
                exerciseName: cableRow.name,
                muscleGroup: cableRow.muscleGroup,
                sets: 3,
                reps: 12,
                targetWeight: 55,
                restTimeSeconds: 60,
                notes: 'Squeeze shoulder blades firmly.',
              },
            ],
          },
          {
            dayOfWeek: 'Wednesday',
            dayName: 'Shoulders & Deltoids Isolation',
            isRestDay: false,
            estimatedDurationMinutes: 50,
            exercises: [
              {
                exercise: ohp._id,
                exerciseName: ohp.name,
                muscleGroup: ohp.muscleGroup,
                sets: 4,
                reps: 8,
                targetWeight: 50,
                restTimeSeconds: 90,
                notes: 'Full overhead vertical lockout.',
              },
              {
                exercise: latRaise ? latRaise._id : ohp._id,
                exerciseName: latRaise ? latRaise.name : 'Dumbbell Lateral Raise',
                muscleGroup: 'Shoulders',
                sets: 4,
                reps: 15,
                targetWeight: 12,
                restTimeSeconds: 45,
                notes: 'Lead with elbows and avoid shrugging.',
              },
            ],
          },
          {
            dayOfWeek: 'Thursday',
            dayName: 'Leg Quad & Hamstring Power',
            isRestDay: false,
            estimatedDurationMinutes: 60,
            exercises: [
              {
                exercise: squat._id,
                exerciseName: squat.name,
                muscleGroup: squat.muscleGroup,
                sets: 4,
                reps: 8,
                targetWeight: 95,
                restTimeSeconds: 120,
                notes: 'Parallel depth on each repetition.',
              },
              {
                exercise: legExt ? legExt._id : squat._id,
                exerciseName: legExt ? legExt.name : 'Seated Leg Extension',
                muscleGroup: 'Legs',
                sets: 4,
                reps: 12,
                targetWeight: 50,
                restTimeSeconds: 60,
                notes: 'Hold peak contraction for 1 second.',
              },
            ],
          },
          {
            dayOfWeek: 'Friday',
            dayName: 'Arms (Biceps & Triceps) Blast',
            isRestDay: false,
            estimatedDurationMinutes: 50,
            exercises: [
              {
                exercise: bicepCurl._id,
                exerciseName: bicepCurl.name,
                muscleGroup: bicepCurl.muscleGroup,
                sets: 4,
                reps: 10,
                targetWeight: 35,
                restTimeSeconds: 60,
                notes: 'Strict curls without swinging torso.',
              },
              {
                exercise: triceps._id,
                exerciseName: triceps.name,
                muscleGroup: triceps.muscleGroup,
                sets: 4,
                reps: 12,
                targetWeight: 30,
                restTimeSeconds: 60,
                notes: 'Lock out elbows fully at bottom.',
              },
            ],
          },
          {
            dayOfWeek: 'Saturday',
            dayName: 'Rest & Muscle Recovery',
            isRestDay: true,
            estimatedDurationMinutes: 0,
            exercises: [],
          },
          {
            dayOfWeek: 'Sunday',
            dayName: 'Rest & Mobility Recovery',
            isRestDay: true,
            estimatedDurationMinutes: 0,
            exercises: [],
          },
        ],
      },
    ];

    await WorkoutPlan.insertMany(defaultPlans);
    console.log(`[Workout Seeder] Successfully seeded ${defaultPlans.length} workout plans.`);
  } catch (error) {
    console.error('[Workout Seeder] Error seeding plans:', error.message);
  }
};

/**
 * Retrieve all available workout plans (templates or assigned).
 */
export const getWorkoutPlans = async (req, res, next) => {
  try {
    const { difficulty, goal } = req.query;

    const query = {
      $or: [
        { isTemplate: true },
        { assignedTo: req.user._id },
        { createdBy: req.user._id },
      ],
      isActive: true,
    };

    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }
    if (goal && goal !== 'All') {
      query.goal = goal;
    }

    const plans = await WorkoutPlan.find(query)
      .populate('createdBy', 'name role')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Workout plans retrieved successfully', {
      plans,
      total: plans.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's active workout plan.
 * Returns assigned plan, or the user's selected plan, or the default template.
 */
export const getMyActivePlan = async (req, res, next) => {
  try {
    // 1. Check if user has an assigned plan
    let activePlan = await WorkoutPlan.findOne({
      assignedTo: req.user._id,
      isActive: true,
    }).populate('schedule.exercises.exercise');

    // 2. If not, find the primary template
    if (!activePlan) {
      activePlan = await WorkoutPlan.findOne({
        isTemplate: true,
        isActive: true,
      })
        .populate('schedule.exercises.exercise')
        .sort({ createdAt: 1 });
    }

    return ApiResponse.success(res, 'Active workout plan retrieved successfully', {
      plan: activePlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get workout plan details by ID.
 */
export const getWorkoutPlanById = async (req, res, next) => {
  try {
    const plan = await WorkoutPlan.findById(req.params.id)
      .populate('createdBy', 'name role')
      .populate('assignedTo', 'name email')
      .populate('schedule.exercises.exercise');

    if (!plan) {
      throw ApiError.notFound('Workout plan not found.');
    }

    return ApiResponse.success(res, 'Workout plan details retrieved successfully', {
      plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new workout plan.
 * Trainers & Admins can create templates or assign to users.
 * Users can create personal plans for themselves.
 */
export const createWorkoutPlan = async (req, res, next) => {
  try {
    const {
      title,
      description,
      difficulty,
      goal,
      durationWeeks,
      daysPerWeek,
      schedule,
      assignedTo,
      isTemplate,
      coverImageUrl,
      coverThumbnailUrl,
    } = req.body;

    if (!title) {
      throw ApiError.badRequest('Workout plan title is required.');
    }

    // Role check for template creation
    const canCreateTemplate = ['TRAINER', 'ADMIN'].includes(req.user.role);
    const templateFlag = canCreateTemplate ? (isTemplate !== undefined ? isTemplate : true) : false;

    // Validate assignedTo if provided
    let assignedUserId = null;
    if (assignedTo) {
      if (!['TRAINER', 'ADMIN'].includes(req.user.role)) {
        throw ApiError.forbidden('Only trainers and admins can assign plans to other users.');
      }
      const targetUser = await User.findById(assignedTo);
      if (!targetUser) {
        throw ApiError.badRequest('Target user to assign not found.');
      }
      assignedUserId = targetUser._id;
    } else if (!templateFlag) {
      // User created their own plan
      assignedUserId = req.user._id;
    }

    // Ensure 7 days in schedule
    let finalSchedule = schedule;
    if (!Array.isArray(schedule) || schedule.length === 0) {
      finalSchedule = DAYS_OF_WEEK.map((day) => ({
        dayOfWeek: day,
        dayName: 'Rest Day',
        isRestDay: true,
        estimatedDurationMinutes: 0,
        exercises: [],
      }));
    }

    const plan = await WorkoutPlan.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      coverImageUrl: coverImageUrl ? coverImageUrl.trim() : '',
      coverThumbnailUrl: coverThumbnailUrl ? coverThumbnailUrl.trim() : (coverImageUrl ? coverImageUrl.trim() : ''),
      difficulty: difficulty || 'Intermediate',
      goal: goal || 'General Fitness',
      durationWeeks: durationWeeks || 4,
      daysPerWeek: daysPerWeek || 4,
      schedule: finalSchedule,
      createdBy: req.user._id,
      assignedTo: assignedUserId,
      isTemplate: templateFlag,
      isActive: true,
    });

    return ApiResponse.created(res, 'Workout plan created successfully', {
      plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign a workout plan to a client user (Trainer or Admin).
 */
export const assignWorkoutPlan = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const planId = req.params.id;

    if (!targetUserId) {
      throw ApiError.badRequest('targetUserId is required.');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw ApiError.notFound('Target client user not found.');
    }

    const originalPlan = await WorkoutPlan.findById(planId);
    if (!originalPlan) {
      throw ApiError.notFound('Workout plan not found.');
    }

    // Deactivate previous active assigned plans for this user
    await WorkoutPlan.updateMany(
      { assignedTo: targetUser._id },
      { $set: { isActive: false } }
    );

    // Create a personalized clone for the client
    const assignedPlan = await WorkoutPlan.create({
      title: `${originalPlan.title} (${targetUser.name})`,
      description: originalPlan.description,
      difficulty: originalPlan.difficulty,
      goal: originalPlan.goal,
      durationWeeks: originalPlan.durationWeeks,
      daysPerWeek: originalPlan.daysPerWeek,
      schedule: originalPlan.schedule,
      createdBy: req.user._id,
      assignedTo: targetUser._id,
      isTemplate: false,
      isActive: true,
    });

    return ApiResponse.success(res, `Workout plan assigned to ${targetUser.name} successfully.`, {
      plan: assignedPlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User adopts a plan as their active workout routine.
 */
export const adoptWorkoutPlan = async (req, res, next) => {
  try {
    const planId = req.params.id;
    const plan = await WorkoutPlan.findById(planId);

    if (!plan) {
      throw ApiError.notFound('Workout plan not found.');
    }

    // Deactivate previous active plans for this user
    await WorkoutPlan.updateMany(
      { assignedTo: req.user._id },
      { $set: { isActive: false } }
    );

    // If it's a template, create a personalized active copy
    const userActivePlan = await WorkoutPlan.create({
      title: plan.title,
      description: plan.description,
      difficulty: plan.difficulty,
      goal: plan.goal,
      durationWeeks: plan.durationWeeks,
      daysPerWeek: plan.daysPerWeek,
      schedule: plan.schedule,
      createdBy: req.user._id,
      assignedTo: req.user._id,
      isTemplate: false,
      isActive: true,
    });

    return ApiResponse.success(res, 'Workout plan adopted as your active routine.', {
      plan: userActivePlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing workout plan.
 */
export const updateWorkoutPlan = async (req, res, next) => {
  try {
    const plan = await WorkoutPlan.findById(req.params.id);

    if (!plan) {
      throw ApiError.notFound('Workout plan not found.');
    }

    // Check permissions
    const isOwner = plan.createdBy?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to modify this workout plan.');
    }

    const allowedUpdates = [
      'title',
      'description',
      'difficulty',
      'goal',
      'durationWeeks',
      'daysPerWeek',
      'schedule',
      'isActive',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        plan[field] = req.body[field];
      }
    });

    await plan.save();

    return ApiResponse.success(res, 'Workout plan updated successfully', {
      plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a workout plan.
 */
export const deleteWorkoutPlan = async (req, res, next) => {
  try {
    const plan = await WorkoutPlan.findById(req.params.id);

    if (!plan) {
      throw ApiError.notFound('Workout plan not found.');
    }

    const isOwner = plan.createdBy?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to delete this workout plan.');
    }

    await WorkoutPlan.findByIdAndDelete(req.params.id);

    return ApiResponse.success(res, 'Workout plan deleted successfully.');
  } catch (error) {
    next(error);
  }
};
