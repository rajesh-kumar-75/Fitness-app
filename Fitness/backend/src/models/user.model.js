import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['USER', 'TRAINER', 'ADMIN'],
        message: '{VALUE} is not a valid role. Supported: USER, TRAINER, ADMIN',
      },
      default: 'USER',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // User Profile fields
    profileImage: {
      type: String,
      default: '',
      trim: true,
    },
    age: {
      type: Number,
      min: [10, 'Age must be at least 10'],
      max: [120, 'Age cannot exceed 120'],
      default: null,
    },
    gender: {
      type: String,
      enum: {
        values: ['Male', 'Female', 'Non-Binary', 'Other', 'Prefer not to say'],
        message: '{VALUE} is not a valid gender option.',
      },
      default: 'Prefer not to say',
    },
    height: {
      type: Number,
      min: [50, 'Height must be at least 50 cm'],
      max: [300, 'Height cannot exceed 300 cm'],
      default: null, // in cm
    },
    weight: {
      type: Number,
      min: [20, 'Weight must be at least 20 kg'],
      max: [500, 'Weight cannot exceed 500 kg'],
      default: null, // in kg
    },
    fitnessGoal: {
      type: String,
      enum: {
        values: ['Muscle Gain', 'Weight Loss', 'Strength', 'Endurance', 'General Fitness'],
        message: '{VALUE} is not a valid fitness goal.',
      },
      default: 'General Fitness',
    },
    activityLevel: {
      type: String,
      enum: {
        values: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active'],
        message: '{VALUE} is not a valid activity level.',
      },
      default: 'Moderately Active',
    },
    // Trainer Profile fields (for users with TRAINER role)
    trainerProfile: {
      specialties: {
        type: [String],
        default: ['Strength Training', 'Bodybuilding', 'Weight Loss'],
      },
      certifications: {
        type: [String],
        default: ['NASM Certified Personal Trainer'],
      },
      yearsOfExperience: {
        type: Number,
        default: 3,
        min: 0,
      },
      bio: {
        type: String,
        default: 'Dedicated fitness professional helping clients reach their full potential.',
        trim: true,
      },
      isAcceptingClients: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
};

// Remove password and __v from output when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

export const User = mongoose.model('User', userSchema);
export default User;
