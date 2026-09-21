import Measurement from '../models/measurement.model.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Get all body measurement entries for the logged-in user.
 * GET /api/v1/progress/measurements
 */
export const getMeasurements = async (req, res, next) => {
  try {
    const measurements = await Measurement.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(100);

    return ApiResponse.success(res, 'Measurements retrieved successfully', { measurements, count: measurements.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new body measurement entry.
 * POST /api/v1/progress/measurements
 */
export const addMeasurement = async (req, res, next) => {
  try {
    const { weight, chest, waist, hips, biceps, thighs, bodyFatPercentage, notes, date } = req.body;

    if (!weight) {
      throw ApiError.badRequest('Weight in kg is required');
    }

    const measurement = await Measurement.create({
      user: req.user._id,
      date: date ? new Date(date) : new Date(),
      weight: Number(weight),
      chest: chest ? Number(chest) : undefined,
      waist: waist ? Number(waist) : undefined,
      hips: hips ? Number(hips) : undefined,
      biceps: biceps ? Number(biceps) : undefined,
      thighs: thighs ? Number(thighs) : undefined,
      bodyFatPercentage: bodyFatPercentage ? Number(bodyFatPercentage) : undefined,
      notes: notes || '',
    });

    // Also update current weight on user profile
    await User.findByIdAndUpdate(req.user._id, {
      'profile.weight': Number(weight),
    });

    return ApiResponse.created(res, 'Body measurement recorded successfully', { measurement });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a measurement entry.
 * DELETE /api/v1/progress/measurements/:id
 */
export const deleteMeasurement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const measurement = await Measurement.findOneAndDelete({ _id: id, user: req.user._id });

    if (!measurement) {
      throw ApiError.notFound('Measurement entry not found');
    }

    return ApiResponse.success(res, 'Measurement entry deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

/**
 * Get weight progression time-series and summary stats.
 * GET /api/v1/progress/weight
 */
export const getWeightProgress = async (req, res, next) => {
  try {
    const measurements = await Measurement.find({ user: req.user._id })
      .sort({ date: 1 })
      .select('date weight');

    if (measurements.length === 0) {
      // If no measurements yet, check if profile has a weight
      const user = await User.findById(req.user._id).select('profile createdAt');
      const profileWeight = user?.profile?.weight;
      const initialPoints = profileWeight
        ? [{ date: user.createdAt || new Date(), weight: profileWeight }]
        : [];

      return ApiResponse.success(res, 'Weight progress retrieved', {
        points: initialPoints,
        stats: {
          currentWeight: profileWeight || 0,
          startWeight: profileWeight || 0,
          highestWeight: profileWeight || 0,
          lowestWeight: profileWeight || 0,
          netChange: 0,
        },
      });
    }

    const points = measurements.map((m) => ({
      date: m.date,
      weight: m.weight,
    }));

    const weights = points.map((p) => p.weight);
    const startWeight = weights[0];
    const currentWeight = weights[weights.length - 1];
    const highestWeight = Math.max(...weights);
    const lowestWeight = Math.min(...weights);
    const netChange = Math.round((currentWeight - startWeight) * 10) / 10;

    return ApiResponse.success(res, 'Weight progress retrieved successfully', {
      points,
      stats: {
        currentWeight,
        startWeight,
        highestWeight,
        lowestWeight,
        netChange,
      },
    });
  } catch (error) {
    next(error);
  }
};
