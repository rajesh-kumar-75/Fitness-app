const { Exercise, VALID_MUSCLE_GROUPS, VALID_DIFFICULTIES } = require('../models/Exercise');
const { ALL_118_EXERCISES, EXERCISE_IMAGES, getExerciseImageByName } = require('../data/exerciseDataset');

const DEFAULT_EXERCISES = ALL_118_EXERCISES;

/**
 * Auto-seeds and synchronizes all exercises with distinct, movement-tailored imagery.
 */
const seedExercisesIfEmpty = async () => {
  try {
    console.log(`[Exercise Seeder] Synchronizing exercise library with tailored imagery...`);
    let added = 0;
    let updated = 0;

    for (const ex of ALL_118_EXERCISES) {
      const distinctImg = EXERCISE_IMAGES[ex.name] || ex.imageUrl || getExerciseImageByName(ex.name, ex.muscleGroup);
      const distinctThumb = distinctImg.includes('unsplash') ? distinctImg.replace('w=700', 'w=400') : distinctImg;

      const existing = await Exercise.findOne({ name: ex.name });
      if (!existing) {
        await Exercise.create({
          ...ex,
          imageUrl: distinctImg,
          thumbnailUrl: distinctThumb,
          image: distinctImg,
        });
        added++;
      } else {
        existing.description = ex.description;
        existing.muscleGroup = ex.muscleGroup;
        existing.equipment = ex.equipment;
        existing.difficulty = ex.difficulty;
        existing.instructions = ex.instructions;
        existing.imageUrl = distinctImg;
        existing.thumbnailUrl = distinctThumb;
        existing.image = distinctImg;
        if (!existing.altText) existing.altText = ex.altText;
        if (!existing.video) existing.video = ex.video;
        await existing.save();
        updated++;
      }
    }

    const totalCount = await Exercise.countDocuments();
    console.log(`🏋️ [Exercise Seeder] Exercise library synchronized: ${totalCount} exercises with distinct images (${added} added, ${updated} updated).`);
  } catch (error) {
    console.error('[Exercise Seeder] Seeding error:', error.message);
  }
};

/**
 * @desc    Get exercises with search, filtering, and sorting
 * @route   GET /api/exercises or GET /api/v1/exercises
 * @access  Public
 */
const getExercises = async (req, res) => {
  try {
    const { search, muscleGroup, difficulty, equipment } = req.query;
    const query = {};

    if (muscleGroup && muscleGroup !== 'All') {
      query.muscleGroup = muscleGroup;
    }

    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }

    if (equipment && equipment !== 'All') {
      query.equipment = { $regex: equipment.trim(), $options: 'i' };
    }

    if (search && search.trim().length > 0) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    let exercises = await Exercise.find(query).sort({ name: 1 });

    // Fallback if DB query returns empty and no filters were applied
    if (exercises.length === 0 && !search && (!muscleGroup || muscleGroup === 'All')) {
      await seedExercisesIfEmpty();
      exercises = await Exercise.find(query).sort({ name: 1 });
      if (exercises.length === 0) {
        exercises = DEFAULT_EXERCISES;
      }
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Exercises retrieved successfully',
      data: {
        exercises,
        total: exercises.length,
        count: exercises.length,
        filters: {
          search: search || '',
          muscleGroup: muscleGroup || 'All',
          difficulty: difficulty || 'All',
          equipment: equipment || 'All',
        },
      },
    });
  } catch (error) {
    console.error('[getExercises Error]:', error);
    // Return graceful fallback so frontend never breaks
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Exercises retrieved successfully (fallback)',
      data: {
        exercises: DEFAULT_EXERCISES,
        total: DEFAULT_EXERCISES.length,
        count: DEFAULT_EXERCISES.length,
        filters: {
          search: '',
          muscleGroup: 'All',
          difficulty: 'All',
          equipment: 'All',
        },
      },
    });
  }
};

/**
 * @desc    Get single exercise by ID
 * @route   GET /api/exercises/:id
 * @access  Public
 */
const getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Exercise not found',
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Exercise details retrieved successfully',
      data: {
        exercise,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error retrieving exercise',
    });
  }
};

/**
 * @desc    Create new exercise
 * @route   POST /api/exercises
 * @access  Private/Admin
 */
const createExercise = async (req, res) => {
  try {
    const { name, description, muscleGroup, equipment, difficulty, instructions, imageUrl, video } = req.body;

    const existing = await Exercise.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `An exercise named '${name}' already exists.`,
      });
    }

    const exercise = await Exercise.create({
      name: name.trim(),
      description: description.trim(),
      muscleGroup,
      equipment: equipment || 'None',
      difficulty: difficulty || 'Beginner',
      instructions: Array.isArray(instructions) ? instructions : [instructions],
      imageUrl: imageUrl || '',
      thumbnailUrl: imageUrl || '',
      altText: `${name} exercise demonstration`,
      video: video || '',
      createdBy: req.user ? req.user._id : null,
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Exercise created successfully',
      data: {
        exercise,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message || 'Error creating exercise',
    });
  }
};

/**
 * @desc    Update exercise
 * @route   PUT /api/exercises/:id
 * @access  Private/Admin
 */
const updateExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Exercise not found',
      });
    }

    Object.assign(exercise, req.body);
    await exercise.save();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Exercise updated successfully',
      data: {
        exercise,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message || 'Error updating exercise',
    });
  }
};

/**
 * @desc    Delete exercise
 * @route   DELETE /api/exercises/:id
 * @access  Private/Admin
 */
const deleteExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Exercise not found',
      });
    }

    await exercise.deleteOne();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Exercise deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error deleting exercise',
    });
  }
};

module.exports = {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  seedExercisesIfEmpty,
  DEFAULT_EXERCISES,
};
