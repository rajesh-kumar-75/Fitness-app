/**
 * Middleware to intercept database-dependent endpoints when MongoDB is disconnected.
 * Returns a standardized 503 Service Unavailable response.
 */
export const dbDisconnected = (req, res) => {
  return res.status(503).json({
    success: false,
    statusCode: 503,
    message: 'Database is currently disconnected.',
    endpoint: req.originalUrl,
    method: req.method,
  });
};
