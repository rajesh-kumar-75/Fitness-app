import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register a new user account.
 * Supported self-registration roles: USER, TRAINER.
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      throw ApiError.badRequest('Name, email, and password are required.');
    }

    if (name.trim().length < 2) {
      throw ApiError.badRequest('Name must be at least 2 characters long.');
    }

    if (!emailRegex.test(email.trim())) {
      throw ApiError.badRequest('Please provide a valid email address.');
    }

    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      throw ApiError.badRequest(
        'Password must be at least 8 characters long and contain both letters and numbers.'
      );
    }

    // Role validation: prevent self-registration as ADMIN
    const assignedRole = role ? role.toUpperCase() : 'USER';
    if (!['USER', 'TRAINER'].includes(assignedRole)) {
      throw ApiError.badRequest(
        `Invalid role: '${role}'. Allowed self-registration roles: USER, TRAINER.`
      );
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      throw ApiError.badRequest('An account with this email address already exists.');
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
    });

    const token = user.generateAuthToken();

    return ApiResponse.created(res, 'Registration successful', {
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user with email and password.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest('Both email and password are required.');
    }

    // Query user and explicitly select password hash
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Your account has been deactivated. Please contact support.');
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const token = user.generateAuthToken();

    return ApiResponse.success(res, 'Login successful', {
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve the currently authenticated user's profile.
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    return ApiResponse.success(res, 'Profile retrieved successfully', {
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout handler (acknowledges client-side token discard).
 */
export const logout = async (req, res, next) => {
  try {
    return ApiResponse.success(
      res,
      'Logged out successfully. Please remove the token from client storage.'
    );
  } catch (error) {
    next(error);
  }
};
