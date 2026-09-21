const mongoose = require('mongoose');

/**
 * Connect to MongoDB database using MONGO_URI
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    // Don't crash the entire process immediately so error can be inspected or retry handled
    return null;
  }
};

module.exports = connectDB;
