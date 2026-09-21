import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const DEFAULT_JWT_FALLBACK = 'fallback_secret_key_fitness_platform';

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/fitness_db',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_FALLBACK,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

// Validate environment variables on initialization
export const validateEnv = () => {
  const warnings = [];

  if (config.isProduction) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_JWT_FALLBACK) {
      throw new Error(
        '[Security Violation] Production deployment must specify a strong, unique JWT_SECRET.'
      );
    }
  } else {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_JWT_FALLBACK) {
      warnings.push(
        '[Security Warning] Using default development JWT_SECRET. Set a secure secret in .env.'
      );
    }
  }

  warnings.forEach((w) => console.warn(w));
};

validateEnv();
