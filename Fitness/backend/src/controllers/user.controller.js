import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

const VALID_FITNESS_GOALS = [
  'Muscle Gain',
  'Weight Loss',
  'Strength',
  'Endurance',
  'General Fitness',
];

const VALID_ACTIVITY_LEVELS = [
  'Sedentary',
  'Lightly Active',
  'Moderately Active',
  'Very Active',
  'Extremely Active',
];

const VALID_GENDERS = ['Male', 'Female', 'Non-Binary', 'Other', 'Prefer not to say'];

/**
 * Calculate BMI and category based on weight (kg) and height (cm).
 */
export const calculateBmi = (weight, height) => {
  if (!weight || !height || height <= 0 || weight <= 0) {
    return { bmi: null, category: null };
  }

  const heightInMeters = height / 100;
  const bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(1));

  let category = 'Normal weight';
  if (bmi < 18.5) {
    category = 'Underweight';
  } else if (bmi >= 18.5 && bmi < 25) {
    category = 'Normal weight';
  } else if (bmi >= 25 && bmi < 30) {
    category = 'Overweight';
  } else {
    category = 'Obese';
  }

  return { bmi, category };
};

/**
 * Get current authenticated user's full profile including derived metrics.
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw ApiError.notFound('User profile not found.');
    }

    const { bmi, category: bmiCategory } = calculateBmi(user.weight, user.height);

    return ApiResponse.success(res, 'Profile retrieved successfully', {
      user,
      metrics: {
        bmi,
        bmiCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current authenticated user's profile.
 * Only allows users to modify their own profile (req.user._id).
 */
export const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      profileImage,
      age,
      gender,
      height,
      weight,
      fitnessGoal,
      activityLevel,
    } = req.body;

    const updates = {};

    // Validate and prepare name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
        throw ApiError.badRequest('Name must be between 2 and 50 characters.');
      }
      updates.name = name.trim();
    }

    // Profile Image
    if (profileImage !== undefined) {
      updates.profileImage = typeof profileImage === 'string' ? profileImage.trim() : '';
    }

    // Age validation (10 - 120)
    if (age !== undefined && age !== null && age !== '') {
      const parsedAge = Number(age);
      if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120) {
        throw ApiError.badRequest('Age must be a valid number between 10 and 120.');
      }
      updates.age = parsedAge;
    } else if (age === null || age === '') {
      updates.age = null;
    }

    // Gender validation
    if (gender !== undefined && gender !== null && gender !== '') {
      if (!VALID_GENDERS.includes(gender)) {
        throw ApiError.badRequest(
          `Invalid gender: '${gender}'. Supported: ${VALID_GENDERS.join(', ')}.`
        );
      }
      updates.gender = gender;
    }

    // Height validation (50 - 300 cm)
    if (height !== undefined && height !== null && height !== '') {
      const parsedHeight = Number(height);
      if (isNaN(parsedHeight) || parsedHeight < 50 || parsedHeight > 300) {
        throw ApiError.badRequest('Height must be a valid number between 50 and 300 cm.');
      }
      updates.height = parsedHeight;
    } else if (height === null || height === '') {
      updates.height = null;
    }

    // Weight validation (20 - 500 kg)
    if (weight !== undefined && weight !== null && weight !== '') {
      const parsedWeight = Number(weight);
      if (isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 500) {
        throw ApiError.badRequest('Weight must be a valid number between 20 and 500 kg.');
      }
      updates.weight = parsedWeight;
    } else if (weight === null || weight === '') {
      updates.weight = null;
    }

    // Fitness Goal validation
    if (fitnessGoal !== undefined && fitnessGoal !== null && fitnessGoal !== '') {
      if (!VALID_FITNESS_GOALS.includes(fitnessGoal)) {
        throw ApiError.badRequest(
          `Invalid fitness goal: '${fitnessGoal}'. Supported: ${VALID_FITNESS_GOALS.join(', ')}.`
        );
      }
      updates.fitnessGoal = fitnessGoal;
    }

    // Activity Level validation
    if (activityLevel !== undefined && activityLevel !== null && activityLevel !== '') {
      if (!VALID_ACTIVITY_LEVELS.includes(activityLevel)) {
        throw ApiError.badRequest(
          `Invalid activity level: '${activityLevel}'. Supported: ${VALID_ACTIVITY_LEVELS.join(', ')}.`
        );
      }
      updates.activityLevel = activityLevel;
    }

    // Update user strictly by authenticated ID
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw ApiError.notFound('User profile not found.');
    }

    const { bmi, category: bmiCategory } = calculateBmi(updatedUser.weight, updatedUser.height);

    return ApiResponse.success(res, 'Profile updated successfully', {
      user: updatedUser,
      metrics: {
        bmi,
        bmiCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};
