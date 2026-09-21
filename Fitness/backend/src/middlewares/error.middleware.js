import { ApiError } from '../utils/apiError.js';
import { config } from '../config/env.js';

/**
 * Centralized Error Handling Middleware for Express.
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Normalize specific database and operational errors
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid resource identifier format for '${err.path}'.`);
  } else if (err.name === 'ValidationError') {
    const errorMessages = Object.values(err.errors || {}).map((e) => e.message);
    error = ApiError.badRequest('Validation failed.', errorMessages);
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`An account or resource with this ${field} already exists.`);
  } else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(config.nodeEnv === 'development' && { stack: error.stack }),
  };

  // Log non-404 errors for debugging
  if (error.statusCode !== 404) {
    console.error(`[Error Handler] ${req.method} ${req.originalUrl} - ${error.message}`);
  }

  return res.status(error.statusCode).json(response);
};
