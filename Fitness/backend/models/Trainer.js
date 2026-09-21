const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    name: {
      type: String,
      required: [true, 'Please provide trainer name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide trainer email'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    specialization: {
      type: String,
      default: 'General Fitness',
      trim: true,
    },
    specialties: {
      type: [String],
      default: [],
    },
    experience: {
      type: Number,
      default: 1, // years
      min: 0,
    },
    certification: {
      type: String,
      default: '',
      trim: true,
    },
    certifications: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    availability: {
      type: String,
      default: 'Monday - Saturday: 6:00 AM - 8:00 PM',
    },
    isAcceptingClients: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 4.9,
      min: 1,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 24,
    },
  },
  {
    timestamps: true,
  }
);

const Trainer = mongoose.model('Trainer', trainerSchema);

module.exports = Trainer;
