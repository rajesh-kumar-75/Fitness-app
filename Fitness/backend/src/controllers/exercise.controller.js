import { Exercise, VALID_MUSCLE_GROUPS, VALID_DIFFICULTIES } from '../models/exercise.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// 22 comprehensive standard exercises covering all muscle groups
const DEFAULT_EXERCISES = [
  // 1. CHEST
  {
    name: 'Barbell Bench Press',
    description: 'A classic compound exercise that builds strength and size in the chest, anterior deltoids, and triceps.',
    muscleGroup: 'Chest',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    instructions: [
      'Lie flat on your back on a weight bench with eyes under the barbell.',
      'Grip the bar slightly wider than shoulder-width with wrists straight.',
      'Unrack the bar and lower it under control to the mid-chest, keeping elbows tucked at 45 degrees.',
      'Press the bar explosively back to the starting position without locking out elbows aggressively.',
    ],
    imageUrl: '/assets/images/exercises/barbell-bench-press.svg',
    thumbnailUrl: '/assets/images/exercises/barbell-bench-press.svg',
    altText: 'Barbell bench press exercise demonstration on flat bench',
    image: '/assets/images/exercises/barbell-bench-press.svg',
    video: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  },
  {
    name: 'Incline Dumbbell Press',
    description: 'An upper-chest focused dumbbell press that promotes clavicular head development and shoulder stability.',
    muscleGroup: 'Chest',
    equipment: 'Dumbbell',
    difficulty: 'Intermediate',
    instructions: [
      'Set an adjustable bench to an incline between 30 and 45 degrees.',
      'Sit back holding dumbbells at chest height with palms facing forward.',
      'Press the dumbbells upward until arms are extended, squeezing the upper chest.',
      'Lower the dumbbells slowly to shoulder level with elbows at a 45-degree angle.',
    ],
    imageUrl: '/assets/images/exercises/incline-dumbbell-press.svg',
    thumbnailUrl: '/assets/images/exercises/incline-dumbbell-press.svg',
    altText: 'Incline dumbbell press exercise demonstration on incline bench',
    image: '/assets/images/exercises/incline-dumbbell-press.svg',
    video: 'https://www.youtube.com/watch?v=8iPEnn-ltC8',
  },
  {
    name: 'Dumbbell Fly',
    description: 'An isolation exercise that provides deep horizontal adduction and stretch across the entire pectoral muscle.',
    muscleGroup: 'Chest',
    equipment: 'Dumbbell',
    difficulty: 'Beginner',
    instructions: [
      'Lie on a flat bench holding dumbbells directly above your chest with palms facing each other.',
      'Maintain a slight, fixed bend in your elbows throughout the movement.',
      'Lower weights in a wide arc until you feel a comfortable stretch across your chest.',
      'Bring the dumbbells back together in the same hugging arc, contracting pectorals at the top.',
    ],
    imageUrl: '/assets/images/exercises/dumbbell-fly.svg',
    thumbnailUrl: '/assets/images/exercises/dumbbell-fly.svg',
    altText: 'Dumbbell fly exercise demonstration on flat bench',
    image: '/assets/images/exercises/dumbbell-fly.svg',
    video: 'https://www.youtube.com/watch?v=eozdVDA78K0',
  },
  {
    name: 'Push Up',
    description: 'The fundamental bodyweight pushing movement for chest, shoulders, triceps, and core stability.',
    muscleGroup: 'Chest',
    equipment: 'None',
    difficulty: 'Beginner',
    instructions: [
      'Place hands on the floor slightly wider than shoulder-width, body in a rigid high plank.',
      'Engage glutes and core to keep spine completely neutral.',
      'Lower your chest toward the floor until elbows reach 90 degrees.',
      'Push firmly through the palms to return to the starting position.',
    ],
    imageUrl: '/assets/images/exercises/push-up.svg',
    thumbnailUrl: '/assets/images/exercises/push-up.svg',
    altText: 'Standard bodyweight push up exercise demonstration',
    image: '/assets/images/exercises/push-up.svg',
    video: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
  },

  // 2. BACK
  {
    name: 'Lat Pulldown',
    description: 'A vertical pulling cable exercise targeting the latissimus dorsi to create upper-body width and taper.',
    muscleGroup: 'Back',
    equipment: 'Cable',
    difficulty: 'Beginner',
    instructions: [
      'Sit at the lat pulldown station with thighs secured under pads.',
      'Grip the bar with hands wider than shoulder-width, palms facing away.',
      'Lean back slightly and pull the bar down smoothly toward upper chest, driving elbows downward.',
      'Slowly resist the cable tension as the bar returns to full overhead extension.',
    ],
    imageUrl: '/assets/images/exercises/lat-pulldown.svg',
    thumbnailUrl: '/assets/images/exercises/lat-pulldown.svg',
    altText: 'Wide-grip lat pulldown exercise demonstration on cable machine',
    image: '/assets/images/exercises/lat-pulldown.svg',
    video: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
  },
  {
    name: 'Seated Cable Row',
    description: 'A horizontal pulling movement that thickens the rhomboids, middle trapezius, and lats.',
    muscleGroup: 'Back',
    equipment: 'Cable',
    difficulty: 'Beginner',
    instructions: [
      'Sit upright on the low-row machine with feet on footrests and knees slightly bent.',
      'Grip the V-bar handle with arms extended and back straight.',
      'Pull the handle into your lower abdomen while retracting shoulder blades together.',
      'Extend arms forward with control, allowing lats to stretch without rounding lower back.',
    ],
    imageUrl: '/assets/images/exercises/seated-cable-row.svg',
    thumbnailUrl: '/assets/images/exercises/seated-cable-row.svg',
    altText: 'Seated cable row exercise demonstration on cable station',
    image: '/assets/images/exercises/seated-cable-row.svg',
    video: 'https://www.youtube.com/watch?v=GZbfZ033f74',
  },
  {
    name: 'Barbell Row',
    description: 'A premier compound movement for mid-back thickness, lat strength, and posterior spinal support.',
    muscleGroup: 'Back',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    instructions: [
      'Hinge at hips with knees slightly bent and torso roughly 45 degrees to the floor.',
      'Grip the barbell with hands just outside knees in an overhand grip.',
      'Pull the barbell toward your lower ribcage, driving elbows past the torso.',
      'Lower the bar under control until arms are fully extended.',
    ],
    imageUrl: '/assets/images/exercises/barbell-row.svg',
    thumbnailUrl: '/assets/images/exercises/barbell-row.svg',
    altText: 'Bent-over barbell row exercise demonstration',
    image: '/assets/images/exercises/barbell-row.svg',
    video: 'https://www.youtube.com/watch?v=FWJR5Ve8gkQ',
  },
  {
    name: 'Pull Up',
    description: 'A classic bodyweight vertical pull testing relative upper-body strength and lat engagement.',
    muscleGroup: 'Back',
    equipment: 'None',
    difficulty: 'Intermediate',
    instructions: [
      'Grip an overhead pull-up bar with an overhand grip slightly wider than shoulders.',
      'Hang with arms fully extended and core braced.',
      'Pull yourself upward until chin clears the bar, leading with your chest.',
      'Lower yourself smoothly back to a dead hang position.',
    ],
    imageUrl: '/assets/images/exercises/pull-up.svg',
    thumbnailUrl: '/assets/images/exercises/pull-up.svg',
    altText: 'Overhand grip pull up exercise demonstration',
    image: '/assets/images/exercises/pull-up.svg',
    video: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
  },

  // 3. LEGS
  {
    name: 'Barbell Squat',
    description: 'The premier lower body compound movement targeting quadriceps, glutes, hamstrings, and core.',
    muscleGroup: 'Legs',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    instructions: [
      'Rest barbell securely across the trapezius muscles on your upper back.',
      'Stand with feet shoulder-width apart, toes pointed slightly outward.',
      'Hinge hips back and bend knees, lowering thighs until parallel with the floor.',
      'Drive powerfully through your heels to return upright, keeping chest elevated.',
    ],
    imageUrl: '/assets/images/exercises/barbell-squat.svg',
    thumbnailUrl: '/assets/images/exercises/barbell-squat.svg',
    altText: 'Barbell back squat exercise demonstration with parallel depth',
    image: '/assets/images/exercises/barbell-squat.svg',
    video: 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
  },
  {
    name: 'Leg Press',
    description: 'A closed-chain compound machine exercise that allows heavy loading of quadriceps and glutes with back support.',
    muscleGroup: 'Legs',
    equipment: 'Machine',
    difficulty: 'Beginner',
    instructions: [
      'Sit comfortably in the leg press machine with back and head resting against the pad.',
      'Place feet shoulder-width apart in the middle of the sled platform.',
      'Release safety handles and lower sled until knees form a 90-degree angle.',
      'Press through the entire foot to extend legs back to starting position without locking knees.',
    ],
    imageUrl: '/assets/images/exercises/leg-press.svg',
    thumbnailUrl: '/assets/images/exercises/leg-press.svg',
    altText: '45-degree incline leg press exercise demonstration on machine',
    image: '/assets/images/exercises/leg-press.svg',
    video: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
  },
  {
    name: 'Leg Extension',
    description: 'An open-chain isolation machine exercise isolating the quadriceps through the full range of knee extension.',
    muscleGroup: 'Legs',
    equipment: 'Machine',
    difficulty: 'Beginner',
    instructions: [
      'Sit on the machine with back against pad and shin pad positioned just above the ankles.',
      'Grip side handles to lock your hips into the seat.',
      'Extend legs smoothly upward until knees are fully straightened, squeezing quads.',
      'Lower the weight pad slowly back to starting position under control.',
    ],
    imageUrl: '/assets/images/exercises/leg-extension.svg',
    thumbnailUrl: '/assets/images/exercises/leg-extension.svg',
    altText: 'Seated leg extension exercise demonstration on machine',
    image: '/assets/images/exercises/leg-extension.svg',
    video: 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
  },
  {
    name: 'Leg Curl',
    description: 'An isolation exercise targeting the hamstring muscle group through knee flexion.',
    muscleGroup: 'Legs',
    equipment: 'Machine',
    difficulty: 'Beginner',
    instructions: [
      'Position yourself on the leg curl machine with roller pad resting on lower calves.',
      'Maintain hips firmly against the bench pad.',
      'Curl the weight toward your glutes by flexing the hamstrings.',
      'Slowly lower the roller back down to the starting position.',
    ],
    imageUrl: '/assets/images/exercises/leg-curl.svg',
    thumbnailUrl: '/assets/images/exercises/leg-curl.svg',
    altText: 'Leg curl exercise demonstration targeting hamstrings on machine',
    image: '/assets/images/exercises/leg-curl.svg',
    video: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs',
  },
  {
    name: 'Standing Calf Raise',
    description: 'An ankle plantar flexion movement targeting the gastrocnemius muscle of the calves.',
    muscleGroup: 'Legs',
    equipment: 'Machine',
    difficulty: 'Beginner',
    instructions: [
      'Place balls of feet on an elevated block or calf raise machine platform with heels hanging off.',
      'Lower heels downward until feeling a deep calf stretch.',
      'Drive upward onto the balls of your feet as high as possible, contracting calves hard.',
      'Pause for one second at peak elevation before lowering slowly.',
    ],
    imageUrl: '/assets/images/exercises/standing-calf-raise.svg',
    thumbnailUrl: '/assets/images/exercises/standing-calf-raise.svg',
    altText: 'Standing calf raise exercise demonstration on machine platform',
    image: '/assets/images/exercises/standing-calf-raise.svg',
    video: 'https://www.youtube.com/watch?v=-M4-G8p8fmc',
  },

  // 4. SHOULDERS
  {
    name: 'Shoulder Press',
    description: 'A fundamental vertical pushing movement to build overhead strength and complete shoulder caps.',
    muscleGroup: 'Shoulders',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    instructions: [
      'Stand with feet shoulder-width apart, holding barbell at clavicle level.',
      'Grip the bar slightly wider than shoulders with elbows angled slightly forward.',
      'Press the bar straight upward overhead until arms are fully extended.',
      'Lower slowly back to collarbone level under complete control.',
    ],
    imageUrl: '/assets/images/exercises/shoulder-press.svg',
    thumbnailUrl: '/assets/images/exercises/shoulder-press.svg',
    altText: 'Standing overhead barbell shoulder press exercise demonstration',
    image: '/assets/images/exercises/shoulder-press.svg',
    video: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
  },
  {
    name: 'Dumbbell Lateral Raise',
    description: 'An isolation exercise targeting the lateral deltoid to develop broad, defined shoulder caps.',
    muscleGroup: 'Shoulders',
    equipment: 'Dumbbell',
    difficulty: 'Beginner',
    instructions: [
      'Stand upright holding dumbbells at sides with a neutral grip and slight elbow bend.',
      'Raise dumbbells out to sides until arms are parallel to the floor.',
      'Lead with elbows and avoid shrugging trapezius muscles.',
      'Lower dumbbells slowly back to sides under continuous tension.',
    ],
    imageUrl: '/assets/images/exercises/dumbbell-lateral-raise.svg',
    thumbnailUrl: '/assets/images/exercises/dumbbell-lateral-raise.svg',
    altText: 'Dumbbell lateral raise exercise demonstration targeting side delts',
    image: '/assets/images/exercises/dumbbell-lateral-raise.svg',
    video: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
  },

  // 5. BICEPS
  {
    name: 'Barbell Curl',
    description: 'The foundation bicep movement for maximum loading, targeting both the long and short heads.',
    muscleGroup: 'Biceps',
    equipment: 'Barbell',
    difficulty: 'Beginner',
    instructions: [
      'Stand tall holding a barbell with an underhand shoulder-width grip.',
      'Keep upper arms pinned closely to your torso sides.',
      'Curl the bar upward toward chest while contracting biceps.',
      'Lower the bar slowly back to full elbow extension.',
    ],
    imageUrl: '/assets/images/exercises/barbell-curl.svg',
    thumbnailUrl: '/assets/images/exercises/barbell-curl.svg',
    altText: 'Standing barbell bicep curl exercise demonstration',
    image: '/assets/images/exercises/barbell-curl.svg',
    video: 'https://www.youtube.com/watch?v=kwG2ipFRgfo',
  },
  {
    name: 'Hammer Curl',
    description: 'A neutral-grip curl targeting the brachialis and brachioradialis for forearm and arm thickness.',
    muscleGroup: 'Biceps',
    equipment: 'Dumbbell',
    difficulty: 'Beginner',
    instructions: [
      'Hold dumbbells at sides with palms facing inward toward each other in a neutral grip.',
      'Keep elbows stationary and curl dumbbells toward shoulders.',
      'Squeeze forearms and biceps hard at the peak position.',
      'Lower dumbbells slowly to the starting position.',
    ],
    imageUrl: '/assets/images/exercises/hammer-curl.svg',
    thumbnailUrl: '/assets/images/exercises/hammer-curl.svg',
    altText: 'Neutral-grip dumbbell hammer curl exercise demonstration',
    image: '/assets/images/exercises/hammer-curl.svg',
    video: 'https://www.youtube.com/watch?v=zC3nLlEvin4',
  },

  // 6. TRICEPS
  {
    name: 'Tricep Pushdown',
    description: 'An isolation cable exercise focusing on the lateral and medial heads of the triceps.',
    muscleGroup: 'Triceps',
    equipment: 'Cable',
    difficulty: 'Beginner',
    instructions: [
      'Attach a rope or straight bar to a high cable pulley.',
      'Grip attachment with elbows tucked firmly against your ribcage.',
      'Extend elbows downward until arms are straight, flexing triceps at the bottom.',
      'Allow the cable to return up to elbow level under control.',
    ],
    imageUrl: '/assets/images/exercises/tricep-pushdown.svg',
    thumbnailUrl: '/assets/images/exercises/tricep-pushdown.svg',
    altText: 'Cable tricep rope pushdown exercise demonstration',
    image: '/assets/images/exercises/tricep-pushdown.svg',
    video: 'https://www.youtube.com/watch?v=vB5OHsJ3EME',
  },
  {
    name: 'Overhead Tricep Extension',
    description: 'An overhead extension emphasizing the long head of the triceps in a stretched position.',
    muscleGroup: 'Triceps',
    equipment: 'Dumbbell',
    difficulty: 'Beginner',
    instructions: [
      'Sit on a bench holding a dumbbell with both hands overhead, arms extended.',
      'Lower the dumbbell behind your head by bending only at the elbows.',
      'Feel a deep stretch in the triceps long head at the bottom.',
      'Press the dumbbell back overhead to starting position.',
    ],
    imageUrl: '/assets/images/exercises/overhead-tricep-extension.svg',
    thumbnailUrl: '/assets/images/exercises/overhead-tricep-extension.svg',
    altText: 'Overhead dumbbell tricep extension exercise demonstration',
    image: '/assets/images/exercises/overhead-tricep-extension.svg',
    video: 'https://www.youtube.com/watch?v=nRiJVZDpdL0',
  },

  // 7. CORE
  {
    name: 'Plank',
    description: 'An isometric core exercise developing endurance and strength in the transverse abdominis and lower back.',
    muscleGroup: 'Core',
    equipment: 'None',
    difficulty: 'Beginner',
    instructions: [
      'Rest on forearms with elbows aligned directly under shoulders.',
      'Extend legs straight back, balancing on balls of feet.',
      'Keep body in a rigid straight line from head to heels, squeezing glutes and core.',
      'Hold position steadily while maintaining calm, rhythmic breathing.',
    ],
    imageUrl: '/assets/images/exercises/plank.svg',
    thumbnailUrl: '/assets/images/exercises/plank.svg',
    altText: 'Isometric forearm plank exercise demonstration',
    image: '/assets/images/exercises/plank.svg',
    video: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
  },
  {
    name: 'Crunch',
    description: 'A classic abdominal flexion exercise targeting the upper rectus abdominis.',
    muscleGroup: 'Core',
    equipment: 'None',
    difficulty: 'Beginner',
    instructions: [
      'Lie flat on your back with knees bent and feet flat on the floor.',
      'Place fingertips lightly behind your head without pulling your neck.',
      'Curl shoulders and upper torso upward toward knees, contracting abs.',
      'Lower shoulders smoothly back to the floor under control.',
    ],
    imageUrl: '/assets/images/exercises/crunch.svg',
    thumbnailUrl: '/assets/images/exercises/crunch.svg',
    altText: 'Standard abdominal floor crunch exercise demonstration',
    image: '/assets/images/exercises/crunch.svg',
    video: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU',
  },
  {
    name: 'Leg Raise',
    description: 'A core exercise targeting lower abdominal fibers and hip flexors through leg elevation.',
    muscleGroup: 'Core',
    equipment: 'None',
    difficulty: 'Beginner',
    instructions: [
      'Lie flat on back with legs straight and hands under lower glutes for lumbar support.',
      'Raise legs together smoothly until they form a 90-degree angle with torso.',
      'Pause briefly at the top, contracting lower abdominals.',
      'Lower legs slowly toward the floor without letting heels touch down between reps.',
    ],
    imageUrl: '/assets/images/exercises/leg-raise.svg',
    thumbnailUrl: '/assets/images/exercises/leg-raise.svg',
    altText: 'Lying leg raise exercise demonstration targeting lower abs',
    image: '/assets/images/exercises/leg-raise.svg',
    video: 'https://www.youtube.com/watch?v=l4kQd9eWcl8',
  },
];

/**
 * Auto-seeds standard exercises and updates existing records with image metadata.
 */
export const seedExercisesIfEmpty = async () => {
  try {
    console.log('[Exercise Seeder] Synchronizing exercise library with image assets...');
    for (const item of DEFAULT_EXERCISES) {
      await Exercise.findOneAndUpdate(
        { name: item.name },
        {
          $set: {
            description: item.description,
            muscleGroup: item.muscleGroup,
            equipment: item.equipment,
            difficulty: item.difficulty,
            instructions: item.instructions,
            image: item.image,
            imageUrl: item.imageUrl,
            thumbnailUrl: item.thumbnailUrl,
            altText: item.altText,
            video: item.video,
          },
        },
        { upsert: true, new: true }
      );
    }

    // Backfill any remaining exercises without imageUrl
    const unseeded = await Exercise.find({
      $or: [{ imageUrl: { $exists: false } }, { imageUrl: '' }, { imageUrl: null }],
    });
    for (const doc of unseeded) {
      const slug = doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const imgPath = `/assets/images/exercises/${slug}.svg`;
      doc.imageUrl = doc.image || imgPath;
      doc.thumbnailUrl = doc.thumbnailUrl || doc.imageUrl;
      doc.altText = doc.altText || `${doc.name} exercise demonstration`;
      await doc.save();
    }

    const totalCount = await Exercise.countDocuments();
    console.log(`[Exercise Seeder] Exercise library synchronized with ${totalCount} exercises.`);
  } catch (error) {
    console.error('[Exercise Seeder] Error seeding exercises:', error.message);
  }
};

/**
 * Retrieve exercises with search, filtering, and sorting.
 */
export const getExercises = async (req, res, next) => {
  try {
    const { search, muscleGroup, difficulty, equipment } = req.query;

    const query = {};

    // Muscle Group filter
    if (muscleGroup && muscleGroup !== 'All') {
      if (!VALID_MUSCLE_GROUPS.includes(muscleGroup)) {
        throw ApiError.badRequest(`Invalid muscle group: '${muscleGroup}'.`);
      }
      query.muscleGroup = muscleGroup;
    }

    // Difficulty filter
    if (difficulty && difficulty !== 'All') {
      if (!VALID_DIFFICULTIES.includes(difficulty)) {
        throw ApiError.badRequest(`Invalid difficulty: '${difficulty}'.`);
      }
      query.difficulty = difficulty;
    }

    // Equipment filter
    if (equipment && equipment !== 'All') {
      query.equipment = { $regex: equipment.trim(), $options: 'i' };
    }

    // Search query across name and description
    if (search && search.trim().length > 0) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    const exercises = await Exercise.find(query).sort({ name: 1 });
    const total = await Exercise.countDocuments(query);

    return ApiResponse.success(res, 'Exercises retrieved successfully', {
      exercises,
      total,
      count: exercises.length,
      filters: {
        search: search || '',
        muscleGroup: muscleGroup || 'All',
        difficulty: difficulty || 'All',
        equipment: equipment || 'All',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve single exercise by ID.
 */
export const getExerciseById = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      throw ApiError.notFound('Exercise not found.');
    }

    return ApiResponse.success(res, 'Exercise details retrieved successfully', {
      exercise,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new exercise. (Admin only)
 */
export const createExercise = async (req, res, next) => {
  try {
    const {
      name,
      description,
      muscleGroup,
      equipment,
      difficulty,
      instructions,
      image,
      imageUrl,
      thumbnailUrl,
      altText,
      video,
    } = req.body;

    // Validation
    if (!name || !description || !muscleGroup || !equipment) {
      throw ApiError.badRequest(
        'Name, description, muscle group, and equipment are required fields.'
      );
    }

    if (!VALID_MUSCLE_GROUPS.includes(muscleGroup)) {
      throw ApiError.badRequest(
        `Invalid muscle group: '${muscleGroup}'. Supported: ${VALID_MUSCLE_GROUPS.join(', ')}.`
      );
    }

    const assignedDifficulty = difficulty || 'Beginner';
    if (!VALID_DIFFICULTIES.includes(assignedDifficulty)) {
      throw ApiError.badRequest(
        `Invalid difficulty: '${difficulty}'. Supported: ${VALID_DIFFICULTIES.join(', ')}.`
      );
    }

    // Process instructions (can be array or newline-separated string)
    let processedInstructions = instructions;
    if (typeof instructions === 'string') {
      processedInstructions = instructions
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    if (!Array.isArray(processedInstructions) || processedInstructions.length === 0) {
      throw ApiError.badRequest('Exercise must include at least one instruction step.');
    }

    // Check unique name
    const existing = await Exercise.findOne({ name: name.trim() });
    if (existing) {
      throw ApiError.badRequest(`An exercise with the name '${name.trim()}' already exists.`);
    }

    const finalImageUrl = (imageUrl || image || '').trim();
    const finalThumbnailUrl = (thumbnailUrl || finalImageUrl).trim();
    const finalAltText = (altText || `${name.trim()} exercise demonstration`).trim();

    const exercise = await Exercise.create({
      name: name.trim(),
      description: description.trim(),
      muscleGroup,
      equipment: equipment.trim(),
      difficulty: assignedDifficulty,
      instructions: processedInstructions,
      image: finalImageUrl,
      imageUrl: finalImageUrl,
      thumbnailUrl: finalThumbnailUrl,
      altText: finalAltText,
      video: video ? video.trim() : '',
      createdBy: req.user._id,
    });

    return ApiResponse.created(res, 'Exercise created successfully', {
      exercise,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing exercise. (Admin only)
 */
export const updateExercise = async (req, res, next) => {
  try {
    const {
      name,
      description,
      muscleGroup,
      equipment,
      difficulty,
      instructions,
      image,
      imageUrl,
      thumbnailUrl,
      altText,
      video,
    } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) throw ApiError.badRequest('Exercise name cannot be empty.');
      // Check duplicate name on another exercise
      const duplicate = await Exercise.findOne({
        name: name.trim(),
        _id: { $ne: req.params.id },
      });
      if (duplicate) {
        throw ApiError.badRequest(`Another exercise with the name '${name.trim()}' already exists.`);
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      if (!description.trim()) throw ApiError.badRequest('Description cannot be empty.');
      updates.description = description.trim();
    }

    if (muscleGroup !== undefined) {
      if (!VALID_MUSCLE_GROUPS.includes(muscleGroup)) {
        throw ApiError.badRequest(`Invalid muscle group: '${muscleGroup}'.`);
      }
      updates.muscleGroup = muscleGroup;
    }

    if (equipment !== undefined) {
      if (!equipment.trim()) throw ApiError.badRequest('Equipment cannot be empty.');
      updates.equipment = equipment.trim();
    }

    if (difficulty !== undefined) {
      if (!VALID_DIFFICULTIES.includes(difficulty)) {
        throw ApiError.badRequest(`Invalid difficulty: '${difficulty}'.`);
      }
      updates.difficulty = difficulty;
    }

    if (instructions !== undefined) {
      let processed = instructions;
      if (typeof instructions === 'string') {
        processed = instructions
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
      if (!Array.isArray(processed) || processed.length === 0) {
        throw ApiError.badRequest('At least one instruction step is required.');
      }
      updates.instructions = processed;
    }

    if (image !== undefined) {
      updates.image = image.trim();
      if (imageUrl === undefined) updates.imageUrl = image.trim();
    }
    if (imageUrl !== undefined) {
      updates.imageUrl = imageUrl.trim();
      if (image === undefined) updates.image = imageUrl.trim();
    }
    if (thumbnailUrl !== undefined) updates.thumbnailUrl = thumbnailUrl.trim();
    if (altText !== undefined) updates.altText = altText.trim();
    if (video !== undefined) updates.video = video.trim();

    const updated = await Exercise.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw ApiError.notFound('Exercise not found.');
    }

    return ApiResponse.success(res, 'Exercise updated successfully', {
      exercise: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete exercise by ID. (Admin only)
 */
export const deleteExercise = async (req, res, next) => {
  try {
    const deleted = await Exercise.findByIdAndDelete(req.params.id);

    if (!deleted) {
      throw ApiError.notFound('Exercise not found.');
    }

    return ApiResponse.success(res, `Exercise '${deleted.name}' deleted successfully.`);
  } catch (error) {
    next(error);
  }
};
