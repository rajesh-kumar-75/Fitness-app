/**
 * Recursively cleans an object by removing keys that start with '$' or contain '.'
 * to prevent MongoDB operator injection attacks.
 */
const cleanObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  }

  const clean = {};
  for (const key of Object.keys(obj)) {
    // Strip operators starting with '$' or containing dots
    if (!key.startsWith('$') && !key.includes('.')) {
      clean[key] = cleanObject(obj[key]);
    }
  }
  return clean;
};

/**
 * Middleware to sanitize request body, query, and params against NoSQL injection.
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = cleanObject(req.body);
  }
  if (req.query) {
    req.query = cleanObject(req.query);
  }
  if (req.params) {
    req.params = cleanObject(req.params);
  }
  next();
};
