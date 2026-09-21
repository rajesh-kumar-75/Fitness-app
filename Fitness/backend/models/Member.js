const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    name: {
      type: String,
      required: [true, 'Please provide member name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide member email'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      default: 'Prefer not to say',
    },
    height: {
      type: Number, // in cm
      default: 170,
    },
    weight: {
      type: Number, // in kg
      default: 70,
    },
    fitnessGoal: {
      type: String,
      enum: [
        'Weight Loss',
        'Muscle Gain',
        'Strength',
        'General Fitness',
        'Endurance',
        'Flexibility',
      ],
      default: 'General Fitness',
    },
    emergencyContact: {
      type: String,
      default: '',
    },
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Membership',
    },
    membershipStartDate: {
      type: Date,
      default: Date.now,
    },
    membershipEndDate: {
      type: Date,
    },
    assignedTrainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
    },
    profileImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;
