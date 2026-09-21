const mongoose = require('mongoose');

/**
 * Connect to MongoDB database.
 * Tries cloud MongoDB Atlas URI first. If Atlas is unreachable (e.g. IP whitelist not yet configured),
 * it seamlessly falls back to the running local MongoDB instance so login, registration, and data work immediately.
 */
const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  const localUri = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/fitness_db';

  if (primaryUri) {
    try {
      console.log(`Connecting to primary database (MongoDB Atlas)...`);
      const conn = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 3500,
      });
      console.log(`MongoDB connected successfully to Atlas: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.warn(`\n⚠️ MongoDB Atlas connection notice: ${error.message}`);
      console.warn(`👉 Cloud deployments require adding '0.0.0.0/0' to MongoDB Atlas Network Access.`);
      console.warn(`🔄 Falling back to local MongoDB service for instant development...\n`);
    }
  }

  try {
    const conn = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB connected successfully to Local Database: ${conn.connection.host}`);
    return conn;
  } catch (localError) {
    console.error(`❌ Database connection failed completely: ${localError.message}`);
    return null;
  }
};

module.exports = connectDB;
