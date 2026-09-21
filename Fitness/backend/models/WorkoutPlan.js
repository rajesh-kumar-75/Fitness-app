const mongoose = require('mongoose');

const workoutExerciseSchema = new mongoose.Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    default: null,
  },
  exerciseName: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true,
  },
  muscleGroup: {
    type: String,
    required: [true, 'Muscle group is required'],
  },
  sets: {
    type: Number,
    required: true,
    min: [1, 'Sets must be at least 1'],
    default: 3,
  },
  reps: {
    type: Number,
    required: true,
    min: [1, 'Reps must be at least 1'],
    default: 10,
  },
  targetWeight: {
    type: Number,
    default: 0,
    min: [0, 'Target weight cannot be negative'],
  },
  restTimeSeconds: {
    type: Number,
    default: 60,
    min: [0, 'Rest time cannot be negative'],
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
  imageUrl: {
    type: String,
    default: '',
    trim: true,
  },
  thumbnailUrl: {
    type: String,
    default: '',
    trim: true,
  },
  altText: {
    type: String,
    default: '',
    trim: true,
  },
});

const workoutDaySchema = new mongoose.Schema({
  dayOfWeek: {
    type: String,
    required: true,
    enum: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
  },
  dayName: {
    type: String,
    required: true,
    trim: true,
  },
  isRestDay: {
    type: Boolean,
    default: false,
  },
  estimatedDurationMinutes: {
    type: Number,
    default: 45,
    min: [0, 'Duration cannot be negative'],
  },
  exercises: [workoutExerciseSchema],
});

const workoutPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Workout plan title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    coverImageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    coverThumbnailUrl: {
      type: String,
      default: '',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    goal: {
      type: String,
      enum: [
        'Muscle Gain',
        'Weight Loss',
        'Strength',
        'Endurance',
        'General Fitness',
      ],
      default: 'General Fitness',
    },
    durationWeeks: {
      type: Number,
      default: 4,
      min: [1, 'Duration must be at least 1 week'],
      max: [52, 'Duration cannot exceed 52 weeks'],
    },
    daysPerWeek: {
      type: Number,
      default: 4,
      min: [1, 'Must have at least 1 day per week'],
      max: [7, 'Cannot exceed 7 days per week'],
    },
    schedule: {
      type: [workoutDaySchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isTemplate: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);

module.exports = WorkoutPlan;
