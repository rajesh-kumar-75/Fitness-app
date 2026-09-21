const mongoose = require('mongoose');

const workoutLogSetSchema = new mongoose.Schema({
  setNumber: {
    type: Number,
    required: true,
  },
  targetReps: {
    type: Number,
    required: true,
    default: 10,
  },
  completedReps: {
    type: Number,
    default: 0,
  },
  targetWeight: {
    type: Number,
    default: 0,
  },
  actualWeight: {
    type: Number,
    default: 0,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

const workoutLogExerciseSchema = new mongoose.Schema({
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    default: null,
  },
  name: {
    type: String,
    required: true,
  },
  muscleGroup: {
    type: String,
    required: true,
  },
  sets: [workoutLogSetSchema],
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

const workoutLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
      index: true,
    },
    workoutPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutPlan',
      default: null,
    },
    dayOfWeek: {
      type: String,
      required: true,
    },
    dayName: {
      type: String,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'abandoned', 'cancelled'],
      default: 'in-progress',
      index: true,
    },
    exercises: [workoutLogExerciseSchema],
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);

module.exports = WorkoutLog;
