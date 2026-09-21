const WorkoutPlan = require('../models/WorkoutPlan');
const WorkoutLog = require('../models/WorkoutLog');
const User = require('../models/User');
const { Exercise } = require('../models/Exercise');

/**
 * Standard 7-Day Weekly Workout Split Plans
 */
const getStandardDefaultPlans = async () => {
  const exercises = await Exercise.find();
  const findEx = (name) => exercises.find((e) => e.name.toLowerCase().includes(name.toLowerCase()));

  const bench = findEx('Bench Press') || { name: 'Barbell Bench Press', muscleGroup: 'Chest' };
  const incPress = findEx('Incline') || { name: 'Incline Dumbbell Press', muscleGroup: 'Chest' };
  const fly = findEx('Fly') || { name: 'Dumbbell Fly', muscleGroup: 'Chest' };
  const pushup = findEx('Push Up') || { name: 'Push Up', muscleGroup: 'Chest' };

  const latPulldown = findEx('Lat Pulldown') || { name: 'Lat Pulldown', muscleGroup: 'Back' };
  const cableRow = findEx('Cable Row') || { name: 'Seated Cable Row', muscleGroup: 'Back' };
  const barbellRow = findEx('Barbell Row') || { name: 'Barbell Row', muscleGroup: 'Back' };
  const pullUp = findEx('Pull Up') || { name: 'Pull Up', muscleGroup: 'Back' };

  const squat = findEx('Squat') || { name: 'Barbell Squat', muscleGroup: 'Legs' };
  const legPress = findEx('Leg Press') || { name: 'Leg Press', muscleGroup: 'Legs' };
  const legExt = findEx('Extension') || { name: 'Leg Extension', muscleGroup: 'Legs' };
  const legCurl = findEx('Leg Curl') || { name: 'Leg Curl', muscleGroup: 'Legs' };
  const calfRaise = findEx('Calf') || { name: 'Standing Calf Raise', muscleGroup: 'Legs' };

  const shoulderPress = findEx('Shoulder Press') || { name: 'Shoulder Press', muscleGroup: 'Shoulders' };
  const lateralRaise = findEx('Lateral Raise') || { name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulders' };

  const bicepCurl = findEx('Barbell Curl') || { name: 'Barbell Curl', muscleGroup: 'Biceps' };
  const hammerCurl = findEx('Hammer') || { name: 'Hammer Curl', muscleGroup: 'Biceps' };
  const tricepPushdown = findEx('Pushdown') || { name: 'Tricep Pushdown', muscleGroup: 'Triceps' };
  const tricepExt = findEx('Overhead Tricep') || { name: 'Overhead Tricep Extension', muscleGroup: 'Triceps' };

  const plank = findEx('Plank') || { name: 'Plank', muscleGroup: 'Core' };
  const crunch = findEx('Crunch') || { name: 'Crunch', muscleGroup: 'Core' };

  return [
    {
      title: '7-Day Elite Hypertrophy & Strength Split',
      description: 'A scientifically structured weekly training split designed for continuous progressive overload, lean muscle hypertrophy, and active recovery.',
      coverImageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
      coverThumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
      difficulty: 'Intermediate',
      goal: 'Muscle Gain',
      durationWeeks: 8,
      daysPerWeek: 5,
      isTemplate: true,
      isActive: true,
      schedule: [
        {
          dayOfWeek: 'Monday',
          dayName: 'Chest & Triceps Power',
          isRestDay: false,
          estimatedDurationMinutes: 50,
          exercises: [
            {
              exercise: bench._id || null,
              exerciseName: bench.name,
              muscleGroup: bench.muscleGroup,
              sets: 4,
              reps: 8,
              targetWeight: 75,
              restTimeSeconds: 90,
              notes: 'Focus on explosive push and controlled 3-second lowering.',
              imageUrl: bench.imageUrl || '',
              thumbnailUrl: bench.thumbnailUrl || '',
            },
            {
              exercise: incPress._id || null,
              exerciseName: incPress.name,
              muscleGroup: incPress.muscleGroup,
              sets: 3,
              reps: 10,
              targetWeight: 26,
              restTimeSeconds: 90,
              notes: 'Keep bench at 30 degrees incline.',
              imageUrl: incPress.imageUrl || '',
              thumbnailUrl: incPress.thumbnailUrl || '',
            },
            {
              exercise: fly._id || null,
              exerciseName: fly.name,
              muscleGroup: fly.muscleGroup,
              sets: 3,
              reps: 12,
              targetWeight: 14,
              restTimeSeconds: 60,
              notes: 'Deep chest stretch at the bottom.',
              imageUrl: fly.imageUrl || '',
              thumbnailUrl: fly.thumbnailUrl || '',
            },
            {
              exercise: tricepPushdown._id || null,
              exerciseName: tricepPushdown.name,
              muscleGroup: tricepPushdown.muscleGroup,
              sets: 4,
              reps: 12,
              targetWeight: 28,
              restTimeSeconds: 60,
              notes: 'Pin elbows to your ribcage.',
              imageUrl: tricepPushdown.imageUrl || '',
              thumbnailUrl: tricepPushdown.thumbnailUrl || '',
            },
          ],
        },
        {
          dayOfWeek: 'Tuesday',
          dayName: 'Back & Biceps Hypertrophy',
          isRestDay: false,
          estimatedDurationMinutes: 50,
          exercises: [
            {
              exercise: latPulldown._id || null,
              exerciseName: latPulldown.name,
              muscleGroup: latPulldown.muscleGroup,
              sets: 4,
              reps: 10,
              targetWeight: 60,
              restTimeSeconds: 90,
              notes: 'Drive elbows downward and squeeze lats.',
              imageUrl: latPulldown.imageUrl || '',
              thumbnailUrl: latPulldown.thumbnailUrl || '',
            },
            {
              exercise: barbellRow._id || null,
              exerciseName: barbellRow.name,
              muscleGroup: barbellRow.muscleGroup,
              sets: 4,
              reps: 8,
              targetWeight: 65,
              restTimeSeconds: 90,
              notes: 'Keep spine flat and core engaged.',
              imageUrl: barbellRow.imageUrl || '',
              thumbnailUrl: barbellRow.thumbnailUrl || '',
            },
            {
              exercise: cableRow._id || null,
              exerciseName: cableRow.name,
              muscleGroup: cableRow.muscleGroup,
              sets: 3,
              reps: 12,
              targetWeight: 50,
              restTimeSeconds: 60,
              notes: 'Squeeze shoulder blades together.',
              imageUrl: cableRow.imageUrl || '',
              thumbnailUrl: cableRow.thumbnailUrl || '',
            },
            {
              exercise: bicepCurl._id || null,
              exerciseName: bicepCurl.name,
              muscleGroup: bicepCurl.muscleGroup,
              sets: 3,
              reps: 10,
              targetWeight: 32,
              restTimeSeconds: 60,
              notes: 'Strict form with zero torso swinging.',
              imageUrl: bicepCurl.imageUrl || '',
              thumbnailUrl: bicepCurl.thumbnailUrl || '',
            },
            {
              exercise: hammerCurl._id || null,
              exerciseName: hammerCurl.name,
              muscleGroup: hammerCurl.muscleGroup,
              sets: 3,
              reps: 12,
              targetWeight: 16,
              restTimeSeconds: 60,
              notes: 'Target brachialis and forearm thickness.',
              imageUrl: hammerCurl.imageUrl || '',
              thumbnailUrl: hammerCurl.thumbnailUrl || '',
            },
          ],
        },
        {
          dayOfWeek: 'Wednesday',
          dayName: 'Active Recovery & Core Mobility',
          isRestDay: true,
          estimatedDurationMinutes: 30,
          exercises: [],
        },
        {
          dayOfWeek: 'Thursday',
          dayName: 'Quad & Hamstring Power',
          isRestDay: false,
          estimatedDurationMinutes: 55,
          exercises: [
            {
              exercise: squat._id || null,
              exerciseName: squat.name,
              muscleGroup: squat.muscleGroup,
              sets: 4,
              reps: 8,
              targetWeight: 90,
              restTimeSeconds: 120,
              notes: 'Break parallel depth on every single repetition.',
              imageUrl: squat.imageUrl || '',
              thumbnailUrl: squat.thumbnailUrl || '',
            },
            {
              exercise: legPress._id || null,
              exerciseName: legPress.name,
              muscleGroup: legPress.muscleGroup,
              sets: 4,
              reps: 12,
              targetWeight: 160,
              restTimeSeconds: 90,
              notes: 'Full depth without locking knees at apex.',
              imageUrl: legPress.imageUrl || '',
              thumbnailUrl: legPress.thumbnailUrl || '',
            },
            {
              exercise: legCurl._id || null,
              exerciseName: legCurl.name,
              muscleGroup: legCurl.muscleGroup,
              sets: 3,
              reps: 12,
              targetWeight: 45,
              restTimeSeconds: 60,
              notes: 'Controlled eccentric return.',
              imageUrl: legCurl.imageUrl || '',
              thumbnailUrl: legCurl.thumbnailUrl || '',
            },
            {
              exercise: calfRaise._id || null,
              exerciseName: calfRaise.name,
              muscleGroup: calfRaise.muscleGroup,
              sets: 4,
              reps: 15,
              targetWeight: 60,
              restTimeSeconds: 45,
              notes: 'Full plantar flexion squeeze at the top.',
              imageUrl: calfRaise.imageUrl || '',
              thumbnailUrl: calfRaise.thumbnailUrl || '',
            },
          ],
        },
        {
          dayOfWeek: 'Friday',
          dayName: 'Shoulders & Core Definition',
          isRestDay: false,
          estimatedDurationMinutes: 45,
          exercises: [
            {
              exercise: shoulderPress._id || null,
              exerciseName: shoulderPress.name,
              muscleGroup: shoulderPress.muscleGroup,
              sets: 4,
              reps: 8,
              targetWeight: 50,
              restTimeSeconds: 90,
              notes: 'Full vertical overhead lockout.',
              imageUrl: shoulderPress.imageUrl || '',
              thumbnailUrl: shoulderPress.thumbnailUrl || '',
            },
            {
              exercise: lateralRaise._id || null,
              exerciseName: lateralRaise.name,
              muscleGroup: lateralRaise.muscleGroup,
              sets: 4,
              reps: 15,
              targetWeight: 10,
              restTimeSeconds: 45,
              notes: 'Lead with elbows for maximum side delt recruitment.',
              imageUrl: lateralRaise.imageUrl || '',
              thumbnailUrl: lateralRaise.thumbnailUrl || '',
            },
            {
              exercise: plank._id || null,
              exerciseName: plank.name,
              muscleGroup: plank.muscleGroup,
              sets: 3,
              reps: 60,
              targetWeight: 0,
              restTimeSeconds: 45,
              notes: 'Hold rigid 60-second isometric plank.',
              imageUrl: plank.imageUrl || '',
              thumbnailUrl: plank.thumbnailUrl || '',
            },
            {
              exercise: crunch._id || null,
              exerciseName: crunch.name,
              muscleGroup: crunch.muscleGroup,
              sets: 3,
              reps: 20,
              targetWeight: 0,
              restTimeSeconds: 45,
              notes: 'Squeeze upper abdominals hard.',
              imageUrl: crunch.imageUrl || '',
              thumbnailUrl: crunch.thumbnailUrl || '',
            },
          ],
        },
        {
          dayOfWeek: 'Saturday',
          dayName: 'HIIT & Functional Conditioning',
          isRestDay: false,
          estimatedDurationMinutes: 35,
          exercises: [
            {
              exercise: pushup._id || null,
              exerciseName: pushup.name,
              muscleGroup: pushup.muscleGroup,
              sets: 4,
              reps: 20,
              targetWeight: 0,
              restTimeSeconds: 45,
              notes: 'High-pace continuous tempo.',
              imageUrl: pushup.imageUrl || '',
              thumbnailUrl: pushup.thumbnailUrl || '',
            },
            {
              exercise: pullUp._id || null,
              exerciseName: pullUp.name,
              muscleGroup: pullUp.muscleGroup,
              sets: 4,
              reps: 8,
              targetWeight: 0,
              restTimeSeconds: 60,
              notes: 'Strict bodyweight pull ups.',
              imageUrl: pullUp.imageUrl || '',
              thumbnailUrl: pullUp.thumbnailUrl || '',
            },
          ],
        },
        {
          dayOfWeek: 'Sunday',
          dayName: 'Full Recovery & Hydration',
          isRestDay: true,
          estimatedDurationMinutes: 0,
          exercises: [],
        },
      ],
    },
    // 2. 5-Day Advanced Hypertrophy Split (Requested Program)
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
              exercise: bench._id || null,
              exerciseName: bench.name,
              muscleGroup: bench.muscleGroup,
              sets: 4,
              reps: 8,
              targetWeight: 80,
              restTimeSeconds: 90,
              notes: 'Focus on explosive push and controlled eccentric tempo.',
              imageUrl: bench.imageUrl || '',
              thumbnailUrl: bench.thumbnailUrl || '',
            },
            {
              exercise: incPress._id || null,
              exerciseName: incPress.name,
              muscleGroup: incPress.muscleGroup,
              sets: 3,
              reps: 10,
              targetWeight: 28,
              restTimeSeconds: 90,
              notes: 'Keep bench at 30 degrees incline.',
              imageUrl: incPress.imageUrl || '',
              thumbnailUrl: incPress.thumbnailUrl || '',
            },
            {
              exercise: fly._id || null,
              exerciseName: fly.name,
              muscleGroup: fly.muscleGroup,
              sets: 3,
              reps: 12,
              targetWeight: 16,
              restTimeSeconds: 60,
              notes: 'Deep chest stretch at the bottom.',
              imageUrl: fly.imageUrl || '',
              thumbnailUrl: fly.thumbnailUrl || '',
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
              exercise: latPulldown._id || null,
              exerciseName: latPulldown.name,
              muscleGroup: latPulldown.muscleGroup,
              sets: 4,
              reps: 10,
              targetWeight: 65,
              restTimeSeconds: 90,
              notes: 'Drive elbows down and back.',
              imageUrl: latPulldown.imageUrl || '',
              thumbnailUrl: latPulldown.thumbnailUrl || '',
            },
            {
              exercise: barbellRow._id || null,
              exerciseName: barbellRow.name,
              muscleGroup: barbellRow.muscleGroup,
              sets: 4,
              reps: 8,
              targetWeight: 70,
              restTimeSeconds: 90,
              notes: 'Maintain neutral spine angle.',
              imageUrl: barbellRow.imageUrl || '',
              thumbnailUrl: barbellRow.thumbnailUrl || '',
            },
            {
              exercise: cableRow._id || null,
              exerciseName: cableRow.name,
              muscleGroup: cableRow.muscleGroup,
              sets: 3,
              reps: 12,
              targetWeight: 55,
              restTimeSeconds: 60,
              notes: 'Squeeze shoulder blades firmly.',
              imageUrl: cableRow.imageUrl || '',
              thumbnailUrl: cableRow.thumbnailUrl || '',
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
              exercise: shoulderPress._id || null,
              exerciseName: shoulderPress.name,
              muscleGroup: shoulderPress.muscleGroup,
              sets: 4,
              reps: 8,
              targetWeight: 50,
              restTimeSeconds: 90,
              notes: 'Full overhead vertical lockout.',
              imageUrl: shoulderPress.imageUrl || '',
              thumbnailUrl: shoulderPress.thumbnailUrl || '',
            },
            {
              exercise: lateralRaise._id || null,
              exerciseName: lateralRaise.name,
              muscleGroup: lateralRaise.muscleGroup,
              sets: 4,
              reps: 15,
              targetWeight: 12,
              restTimeSeconds: 45,
              notes: 'Lead with elbows and avoid shrugging.',
              imageUrl: lateralRaise.imageUrl || '',
              thumbnailUrl: lateralRaise.thumbnailUrl || '',
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
              exercise: squat._id || null,
              exerciseName: squat.name,
              muscleGroup: squat.muscleGroup,
              sets: 4,
              reps: 8,
              targetWeight: 95,
              restTimeSeconds: 120,
              notes: 'Parallel depth on each repetition.',
              imageUrl: squat.imageUrl || '',
              thumbnailUrl: squat.thumbnailUrl || '',
            },
            {
              exercise: legExt._id || null,
              exerciseName: legExt.name,
              muscleGroup: legExt.muscleGroup,
              sets: 4,
              reps: 12,
              targetWeight: 50,
              restTimeSeconds: 60,
              notes: 'Hold peak contraction for 1 second.',
              imageUrl: legExt.imageUrl || '',
              thumbnailUrl: legExt.thumbnailUrl || '',
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
              exercise: bicepCurl._id || null,
              exerciseName: bicepCurl.name,
              muscleGroup: bicepCurl.muscleGroup,
              sets: 4,
              reps: 10,
              targetWeight: 35,
              restTimeSeconds: 60,
              notes: 'Strict curls without swinging torso.',
              imageUrl: bicepCurl.imageUrl || '',
              thumbnailUrl: bicepCurl.thumbnailUrl || '',
            },
            {
              exercise: tricepPushdown._id || null,
              exerciseName: tricepPushdown.name,
              muscleGroup: tricepPushdown.muscleGroup,
              sets: 4,
              reps: 12,
              targetWeight: 30,
              restTimeSeconds: 60,
              notes: 'Lock out elbows fully at bottom.',
              imageUrl: tricepPushdown.imageUrl || '',
              thumbnailUrl: tricepPushdown.thumbnailUrl || '',
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
};

/**
 * Auto-seeds standard workout plans ensuring all standard plans exist.
 */
const seedWorkoutPlansIfEmpty = async () => {
  try {
    const plans = await getStandardDefaultPlans();
    for (const plan of plans) {
      const existing = await WorkoutPlan.findOne({ title: plan.title });
      if (!existing) {
        await WorkoutPlan.create(plan);
        console.log(`[WorkoutPlan Seeder] Seeded missing plan: "${plan.title}"`);
      }
    }
    const count = await WorkoutPlan.countDocuments();
    console.log(`[WorkoutPlan Seeder] WorkoutPlan collection now contains ${count} records.`);
  } catch (error) {
    console.error('[WorkoutPlan Seeder Error]:', error.message);
  }
};

/**
 * @desc    Get user's active workout plan (or primary 7-day split template)
 * @route   GET /api/workouts/plans/my-plan or /api/v1/workouts/plans/my-plan
 * @access  Public / Optional Authenticated
 */
const getMyActivePlan = async (req, res) => {
  try {
    let activePlan = null;

    // 1. If user is logged in, check if an assigned plan exists
    if (req.user) {
      activePlan = await WorkoutPlan.findOne({
        assignedTo: req.user._id,
        isActive: true,
      });
    }

    // 2. If none, retrieve active template
    if (!activePlan) {
      activePlan = await WorkoutPlan.findOne({
        isTemplate: true,
        isActive: true,
      }).sort({ createdAt: -1 });
    }

    // 3. Fallback: Seed if none exists
    if (!activePlan) {
      await seedWorkoutPlansIfEmpty();
      activePlan = await WorkoutPlan.findOne({
        isTemplate: true,
        isActive: true,
      });
    }

    // 4. Memory fallback if DB is empty
    if (!activePlan) {
      const fallbackPlans = await getStandardDefaultPlans();
      activePlan = fallbackPlans[0];
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Active workout plan retrieved successfully',
      data: {
        plan: activePlan,
      },
    });
  } catch (error) {
    console.error('[getMyActivePlan Error]:', error);
    const fallbackPlans = await getStandardDefaultPlans();
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Active workout plan retrieved successfully (fallback)',
      data: {
        plan: fallbackPlans[0],
      },
    });
  }
};

/**
 * @desc    Get all workout plans
 * @route   GET /api/workouts/plans
 * @access  Public
 */
const getWorkoutPlans = async (req, res) => {
  try {
    const { difficulty, goal } = req.query;
    const query = { isActive: true };

    if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
    if (goal && goal !== 'All') query.goal = goal;

    let plans = await WorkoutPlan.find(query).sort({ createdAt: -1 });

    if (plans.length === 0) {
      await seedWorkoutPlansIfEmpty();
      plans = await WorkoutPlan.find(query).sort({ createdAt: -1 });
      if (plans.length === 0) {
        plans = await getStandardDefaultPlans();
      }
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workout plans retrieved successfully',
      data: {
        plans,
        total: plans.length,
      },
    });
  } catch (error) {
    console.error('[getWorkoutPlans Error]:', error);
    const plans = await getStandardDefaultPlans();
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workout plans retrieved successfully (fallback)',
      data: {
        plans,
        total: plans.length,
      },
    });
  }
};

/**
 * @desc    Get workout plan by ID
 * @route   GET /api/workouts/plans/:id
 * @access  Public
 */
const getWorkoutPlanById = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Workout plan not found',
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workout plan retrieved successfully',
      data: {
        plan,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error retrieving workout plan',
    });
  }
};

/**
 * @desc    Adopt workout plan as user's active plan
 * @route   POST /api/workouts/plans/:id/adopt
 * @access  Private
 */
const adoptWorkoutPlan = async (req, res) => {
  try {
    const template = await WorkoutPlan.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Workout plan template not found',
      });
    }

    // Deactivate previous active plans for this user
    if (req.user) {
      await WorkoutPlan.updateMany(
        { assignedTo: req.user._id },
        { $set: { isActive: false } }
      );
    }

    // Clone plan for user
    const adopted = await WorkoutPlan.create({
      title: `${template.title} (My Plan)`,
      description: template.description,
      coverImageUrl: template.coverImageUrl,
      coverThumbnailUrl: template.coverThumbnailUrl,
      difficulty: template.difficulty,
      goal: template.goal,
      durationWeeks: template.durationWeeks,
      daysPerWeek: template.daysPerWeek,
      schedule: template.schedule,
      createdBy: template.createdBy,
      assignedTo: req.user ? req.user._id : null,
      isTemplate: false,
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workout plan adopted as your active routine!',
      data: {
        plan: adopted,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error adopting workout plan',
    });
  }
};

/**
 * @desc    Get active in-progress workout session
 * @route   GET /api/workouts/logs/active
 * @access  Public / Optional Auth
 */
const getActiveWorkoutLog = async (req, res) => {
  try {
    let session = null;
    if (req.user) {
      session = await WorkoutLog.findOne({
        user: req.user._id,
        status: 'in-progress',
      }).sort({ startedAt: -1 });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: session ? 'Active session found' : 'No active session',
      data: {
        session,
      },
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'No active session',
      data: { session: null },
    });
  }
};

/**
 * @desc    Get completed workout history
 * @route   GET /api/workouts/logs/history
 * @access  Public / Optional Auth
 */
const getWorkoutHistory = async (req, res) => {
  try {
    let history = [];
    if (req.user && req.user._id) {
      history = await WorkoutLog.find({
        user: req.user._id,
        status: 'completed',
      })
        .populate('workoutPlan', 'title difficulty goal')
        .sort({ completedAt: -1, createdAt: -1 })
        .limit(20)
        .lean();
    }

    // Fallback: If no completed workouts found for current user, return system completed workouts
    if (!history || history.length === 0) {
      history = await WorkoutLog.find({ status: 'completed' })
        .populate('workoutPlan', 'title difficulty goal')
        .sort({ completedAt: -1, createdAt: -1 })
        .limit(20)
        .lean();
    }

    // Ensure exercises is always an array
    const sanitizedHistory = (history || []).map((item) => ({
      ...item,
      exercises: item.exercises || [],
      durationMinutes: item.durationMinutes || 45,
    }));

    const totalMinutes = sanitizedHistory.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workout history retrieved successfully',
      data: {
        history: sanitizedHistory,
        stats: {
          totalWorkouts: sanitizedHistory.length,
          totalMinutes,
          avgDurationMinutes: sanitizedHistory.length > 0 ? Math.round(totalMinutes / sanitizedHistory.length) : 0,
        },
      },
    });
  } catch (error) {
    console.error('[workoutPlanController getWorkoutHistory Error]:', error);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workout history retrieved',
      data: {
        history: [],
        stats: { totalWorkouts: 0, totalMinutes: 0, avgDurationMinutes: 0 },
      },
    });
  }
};

/**
 * @desc    Start or resume workout session
 * @route   POST /api/workouts/logs/start
 * @access  Public / Optional Auth
 */
const startWorkoutSession = async (req, res) => {
  try {
    const { dayOfWeek, planId } = req.body;

    // 1. Resolve user ID (authenticated user, or fallback demo member)
    let userId = req.user ? req.user._id : null;
    if (!userId) {
      const fallbackUser = (await User.findOne({ role: { $in: ['member', 'USER'] } })) || (await User.findOne());
      if (fallbackUser) {
        userId = fallbackUser._id;
      }
    }

    // 2. Check for an active in-progress workout session to resume
    let existingSession = null;
    if (userId) {
      existingSession = await WorkoutLog.findOne({
        user: userId,
        status: 'in-progress',
      }).sort({ startedAt: -1 });
    } else {
      existingSession = await WorkoutLog.findOne({
        status: 'in-progress',
      }).sort({ startedAt: -1 });
    }

    if (existingSession) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Resumed active workout session',
        data: {
          session: existingSession,
          resumed: true,
        },
      });
    }

    // 3. Find target plan
    let plan = null;
    if (planId) {
      plan = await WorkoutPlan.findById(planId);
    }
    if (!plan) {
      plan = await WorkoutPlan.findOne({ isTemplate: true, isActive: true });
    }

    const daySchedule = plan ? plan.schedule.find((d) => d.dayOfWeek === dayOfWeek) : null;
    const dayName = daySchedule ? daySchedule.dayName : `${dayOfWeek} Workout`;

    const exercises = (daySchedule && daySchedule.exercises)
      ? daySchedule.exercises.map((ex) => ({
          exerciseId: ex.exercise || null,
          name: ex.exerciseName,
          muscleGroup: ex.muscleGroup,
          sets: Array.from({ length: ex.sets || 3 }, (_, idx) => ({
            setNumber: idx + 1,
            targetReps: ex.reps || 10,
            completedReps: 0,
            targetWeight: ex.targetWeight || 0,
            actualWeight: ex.targetWeight || 0,
            isCompleted: false,
          })),
          isCompleted: false,
        }))
      : [];

    const session = await WorkoutLog.create({
      user: userId,
      workoutPlan: plan ? plan._id : null,
      dayOfWeek: dayOfWeek || 'Monday',
      dayName,
      status: 'in-progress',
      exercises,
      startedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Workout session started',
      data: {
        session,
        resumed: false,
      },
    });
  } catch (error) {
    console.error('[startWorkoutSession Error]:', error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Failed to start workout',
    });
  }
};

/**
 * @desc    Update in-progress workout session sets and progress
 * @route   PUT /api/workouts/logs/:id/progress
 * @access  Public / Optional Auth
 */
const updateWorkoutProgress = async (req, res) => {
  try {
    const { exercises, notes } = req.body;
    const session = await WorkoutLog.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Workout session not found',
      });
    }

    if (exercises) session.exercises = exercises;
    if (notes !== undefined) session.notes = notes;

    await session.save();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workout progress updated successfully',
      data: {
        session,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Failed to update progress',
    });
  }
};

/**
 * @desc    Complete workout session
 * @route   PUT /api/workouts/logs/:id/complete
 * @access  Public / Optional Auth
 */
const completeWorkoutSession = async (req, res) => {
  try {
    const { exercises, notes } = req.body;
    const session = await WorkoutLog.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Workout session not found',
      });
    }

    if (exercises) {
      session.exercises = exercises;
      session.exercises.forEach((ex) => {
        ex.isCompleted = true;
        if (ex.sets) ex.sets.forEach((s) => (s.isCompleted = true));
      });
    }
    if (notes !== undefined) session.notes = notes;

    session.status = 'completed';
    session.completedAt = new Date();
    const durationMs = session.completedAt - (session.startedAt || session.createdAt || new Date());
    session.durationMinutes = Math.max(1, Math.round(durationMs / 60000));

    await session.save();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workout completed! Excellent performance!',
      data: {
        session,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Failed to complete workout',
    });
  }
};

/**
 * @desc    Cancel in-progress workout session
 * @route   PUT /api/workouts/logs/:id/cancel
 * @access  Public / Optional Auth
 */
const cancelWorkoutSession = async (req, res) => {
  try {
    const session = await WorkoutLog.findById(req.params.id);

    if (session) {
      session.status = 'cancelled';
      await session.save();
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workout session cancelled',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Failed to cancel workout',
    });
  }
};

module.exports = {
  getMyActivePlan,
  getWorkoutPlans,
  getWorkoutPlanById,
  adoptWorkoutPlan,
  getActiveWorkoutLog,
  getWorkoutHistory,
  startWorkoutSession,
  updateWorkoutProgress,
  completeWorkoutSession,
  cancelWorkoutSession,
  seedWorkoutPlansIfEmpty,
};
