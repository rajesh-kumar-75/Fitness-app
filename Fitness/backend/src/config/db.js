import mongoose from 'mongoose';

/**
 * MongoDB connection helper (DISCONNECTED MODE).
 * Database connection is disabled. No connection attempts are made to MongoDB.
 */
export const connectDB = async () => {
  console.log('[Database] Database connection is disabled (disconnected mode). No connection attempt made.');
  return null;
};

/**
 * Returns human-readable MongoDB connection state.
 */
export const getDatabaseStatus = () => {
  return 'disconnected';
};

/**
 * Gracefully close MongoDB connection on app termination (Safe no-op).
 */
export const disconnectDB = async () => {
  // Safe no-op when disconnected
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close();
      console.log('[Database] MongoDB connection closed gracefully');
    } catch (err) {
      console.error(`[Database Error] Error during MongoDB disconnection: ${err.message}`);
    }
  }
};

