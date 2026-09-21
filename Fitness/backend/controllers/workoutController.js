const Workout = require('../models/Workout');
const Member = require('../models/Member');

/**
 * @desc    Get all workouts
 * @route   GET /api/workouts
 * @access  Public / Private
 */
const getWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find()
      .populate('trainer', 'name email specialization')
      .populate('assignedMembers', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: workouts.length,
      data: workouts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching workouts',
    });
  }
};

/**
 * @desc    Get single workout by ID
 * @route   GET /api/workouts/:id
 * @access  Public / Private
 */
const getWorkoutById = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id)
      .populate('trainer', 'name email specialization')
      .populate('assignedMembers', 'name email');

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: workout,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching workout',
    });
  }
};

/**
 * @desc    Create a new workout
 * @route   POST /api/workouts
 * @access  Private (Admin & Trainer)
 */
const createWorkout = async (req, res) => {
  try {
    const { name, description, category, difficulty, duration, exercises, trainer } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Workout name is required',
      });
    }

    const workout = await Workout.create({
      name,
      description: description || '',
      category: category || 'Full Body',
      difficulty: difficulty || 'Beginner',
      duration: duration || 45,
      exercises: exercises || [],
      trainer: trainer || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Workout created successfully',
      data: workout,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating workout',
    });
  }
};

/**
 * @desc    Update a workout
 * @route   PUT /api/workouts/:id
 * @access  Private (Admin & Trainer)
 */
const updateWorkout = async (req, res) => {
  try {
    const workout = await Workout.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('trainer', 'name email specialization')
      .populate('assignedMembers', 'name email');

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Workout updated successfully',
      data: workout,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating workout',
    });
  }
};

/**
 * @desc    Delete a workout
 * @route   DELETE /api/workouts/:id
 * @access  Private (Admin & Trainer)
 */
const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findByIdAndDelete(req.params.id);

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Workout deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting workout',
    });
  }
};

/**
 * @desc    Get workouts by category
 * @route   GET /api/workouts/category/:category
 * @access  Public / Private
 */
const getWorkoutsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const workouts = await Workout.find({
      category: { $regex: new RegExp(`^${category}$`, 'i') },
    }).populate('trainer', 'name specialization');

    return res.status(200).json({
      success: true,
      count: workouts.length,
      data: workouts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching workouts by category',
    });
  }
};

/**
 * @desc    Get workouts by difficulty
 * @route   GET /api/workouts/difficulty/:difficulty
 * @access  Public / Private
 */
const getWorkoutsByDifficulty = async (req, res) => {
  try {
    const difficulty = req.params.difficulty;
    const workouts = await Workout.find({
      difficulty: { $regex: new RegExp(`^${difficulty}$`, 'i') },
    }).populate('trainer', 'name specialization');

    return res.status(200).json({
      success: true,
      count: workouts.length,
      data: workouts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching workouts by difficulty',
    });
  }
};

/**
 * @desc    Assign workout to member(s)
 * @route   POST /api/workouts/:id/assign
 * @access  Private (Admin & Trainer)
 */
const assignWorkout = async (req, res) => {
  try {
    const { memberId, memberIds } = req.body;
    const targetIds = memberIds || (memberId ? [memberId] : []);

    if (!targetIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Please specify memberId or memberIds to assign',
      });
    }

    const workout = await Workout.findById(req.params.id);
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found',
      });
    }

    // Add unique member IDs
    targetIds.forEach((id) => {
      if (!workout.assignedMembers.includes(id)) {
        workout.assignedMembers.push(id);
      }
    });

    await workout.save();
    const updated = await Workout.findById(workout._id)
      .populate('trainer', 'name specialization')
      .populate('assignedMembers', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Workout assigned successfully',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error assigning workout',
    });
  }
};

module.exports = {
  getWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getWorkoutsByCategory,
  getWorkoutsByDifficulty,
  assignWorkout,
};
