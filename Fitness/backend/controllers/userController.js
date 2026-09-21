const User = require('../models/User');
const Member = require('../models/Member');

/**
 * Calculate BMI and category based on weight (kg) and height (cm).
 */
const calculateBmi = (weight, height) => {
  if (!weight || !height || height <= 0 || weight <= 0) {
    return { bmi: null, bmiCategory: null };
  }

  const heightInMeters = height / 100;
  const bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(1));

  let bmiCategory = 'Normal weight';
  if (bmi < 18.5) {
    bmiCategory = 'Underweight';
  } else if (bmi >= 18.5 && bmi < 25) {
    bmiCategory = 'Normal weight';
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = 'Overweight';
  } else {
    bmiCategory = 'Obese';
  }

  return { bmi, bmiCategory };
};

/**
 * @desc    Get current user profile & metrics
 * @route   GET /api/users/profile, GET /api/v1/users/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'User profile not found',
      });
    }

    // If height or weight is missing on User, check linked Member document
    let member = await Member.findOne({
      $or: [{ user: req.user._id }, { email: req.user.email }],
    });

    let height = user.height;
    let weight = user.weight;
    let fitnessGoal = user.fitnessGoal;
    let gender = user.gender;

    if (member) {
      if (!height && member.height) height = member.height;
      if (!weight && member.weight) weight = member.weight;
      if (!fitnessGoal && member.fitnessGoal) fitnessGoal = member.fitnessGoal;
      if (!gender || gender === 'Prefer not to say') {
        if (member.gender && member.gender !== 'Prefer not to say') gender = member.gender;
      }

      // Sync back to user if user was missing them
      if (height !== user.height || weight !== user.weight) {
        user.height = height;
        user.weight = weight;
        user.fitnessGoal = fitnessGoal;
        user.gender = gender;
        await user.save();
      }
    }

    const { bmi, bmiCategory } = calculateBmi(height, weight);

    let normalizedRole = (user.role || 'USER').toUpperCase();
    if (normalizedRole === 'MEMBER') normalizedRole = 'USER';

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: normalizedRole,
          isActive: user.isActive !== false,
          profileImage: user.profileImage || '',
          age: user.age || null,
          gender: gender || 'Prefer not to say',
          height: height || null,
          weight: weight || null,
          fitnessGoal: fitnessGoal || 'General Fitness',
          activityLevel: user.activityLevel || 'Moderately Active',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        metrics: {
          bmi,
          bmiCategory,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error fetching user profile',
    });
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/profile, PUT /api/v1/users/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
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
    if (name !== undefined) updates.name = name;
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (age !== undefined) updates.age = age !== null && age !== '' ? Number(age) : null;
    if (gender !== undefined) updates.gender = gender;
    if (height !== undefined) updates.height = height !== null && height !== '' ? Number(height) : null;
    if (weight !== undefined) updates.weight = weight !== null && weight !== '' ? Number(weight) : null;
    if (fitnessGoal !== undefined) updates.fitnessGoal = fitnessGoal;
    if (activityLevel !== undefined) updates.activityLevel = activityLevel;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'User profile not found',
      });
    }

    // Also sync to Member document if exists or create one
    let member = await Member.findOne({
      $or: [{ user: req.user._id }, { email: req.user.email }],
    });

    if (member) {
      if (name) member.name = name;
      if (profileImage !== undefined) member.profileImage = profileImage;
      if (gender) member.gender = gender;
      if (height !== undefined && height !== null) member.height = Number(height);
      if (weight !== undefined && weight !== null) member.weight = Number(weight);
      if (fitnessGoal) member.fitnessGoal = fitnessGoal;
      await member.save();
    } else {
      await Member.create({
        user: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        gender: gender || 'Prefer not to say',
        height: height ? Number(height) : 170,
        weight: weight ? Number(weight) : 70,
        fitnessGoal: fitnessGoal || 'General Fitness',
        profileImage: profileImage || '',
      });
    }

    const { bmi, bmiCategory } = calculateBmi(user.weight, user.height);

    let normalizedRole = (user.role || 'USER').toUpperCase();
    if (normalizedRole === 'MEMBER') normalizedRole = 'USER';

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: normalizedRole,
          isActive: user.isActive !== false,
          profileImage: user.profileImage || '',
          age: user.age || null,
          gender: user.gender || 'Prefer not to say',
          height: user.height || null,
          weight: user.weight || null,
          fitnessGoal: user.fitnessGoal || 'General Fitness',
          activityLevel: user.activityLevel || 'Moderately Active',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        metrics: {
          bmi,
          bmiCategory,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error updating user profile',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
