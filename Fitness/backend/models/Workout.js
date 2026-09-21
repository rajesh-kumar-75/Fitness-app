const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide workout name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['Strength', 'Cardio', 'HIIT', 'Yoga', 'Flexibility', 'Full Body'],
      default: 'Full Body',
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    duration: {
      type: Number, // in minutes
      required: [true, 'Please provide workout duration in minutes'],
      default: 45,
    },
    exercises: [
      {
        exerciseName: {
          type: String,
          required: true,
        },
        sets: {
          type: Number,
          default: 3,
        },
        reps: {
          type: Number,
          default: 12,
        },
        duration: {
          type: Number, // in seconds
          default: 0,
        },
        restTime: {
          type: Number, // in seconds
          default: 60,
        },
      },
    ],
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
    },
    assignedMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Workout = mongoose.model('Workout', workoutSchema);

module.exports = Workout;
