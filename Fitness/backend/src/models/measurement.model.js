import mongoose from 'mongoose';

const measurementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: [true, 'Measurement date is required'],
      index: true,
    },
    weight: {
      type: Number,
      required: [true, 'Weight in kg is required'],
      min: [20, 'Weight must be at least 20 kg'],
      max: [400, 'Weight cannot exceed 400 kg'],
    },
    chest: {
      type: Number,
      min: [30, 'Chest measurement must be at least 30 cm'],
      max: [250, 'Chest measurement cannot exceed 250 cm'],
    },
    waist: {
      type: Number,
      min: [30, 'Waist measurement must be at least 30 cm'],
      max: [250, 'Waist measurement cannot exceed 250 cm'],
    },
    hips: {
      type: Number,
      min: [30, 'Hips measurement must be at least 30 cm'],
      max: [250, 'Hips measurement cannot exceed 250 cm'],
    },
    biceps: {
      type: Number,
      min: [15, 'Biceps measurement must be at least 15 cm'],
      max: [100, 'Biceps measurement cannot exceed 100 cm'],
    },
    thighs: {
      type: Number,
      min: [20, 'Thighs measurement must be at least 20 cm'],
      max: [150, 'Thighs measurement cannot exceed 150 cm'],
    },
    bodyFatPercentage: {
      type: Number,
      min: [3, 'Body fat percentage must be at least 3%'],
      max: [70, 'Body fat percentage cannot exceed 70%'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user-date queries
measurementSchema.index({ user: 1, date: -1 });

export const Measurement = mongoose.model('Measurement', measurementSchema);
export default Measurement;
