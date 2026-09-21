const mongoose = require('mongoose');

const VALID_MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Glutes',
  'Core',
  'Cardio',
  'Yoga',
];

const VALID_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Exercise name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Exercise description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    muscleGroup: {
      type: String,
      required: [true, 'Target muscle group is required'],
      enum: {
        values: VALID_MUSCLE_GROUPS,
        message: '{VALUE} is not a valid muscle group. Supported: ' + VALID_MUSCLE_GROUPS.join(', '),
      },
      index: true,
    },
    equipment: {
      type: String,
      required: [true, 'Equipment is required (use "None" if bodyweight)'],
      trim: true,
      maxlength: [50, 'Equipment cannot exceed 50 characters'],
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty level is required'],
      enum: {
        values: VALID_DIFFICULTIES,
        message: '{VALUE} is not a valid difficulty level. Supported: ' + VALID_DIFFICULTIES.join(', '),
      },
      default: 'Beginner',
      index: true,
    },
    instructions: {
      type: [String],
      required: [true, 'At least one instruction step is required'],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0 && val.some((s) => s.trim().length > 0);
        },
        message: 'Exercise must have at least one instruction step',
      },
    },
    image: {
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
    video: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

exerciseSchema.index({ name: 'text', description: 'text' });

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = {
  Exercise,
  VALID_MUSCLE_GROUPS,
  VALID_DIFFICULTIES,
};
