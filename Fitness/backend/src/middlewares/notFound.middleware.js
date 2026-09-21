import { ApiError } from '../utils/apiError.js';

/**
 * Middleware to handle routes that do not exist (404 Not Found).
 */
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`);
  next(error);
};
