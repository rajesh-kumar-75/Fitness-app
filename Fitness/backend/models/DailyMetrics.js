const mongoose = require('mongoose');

const waterLogEntrySchema = new mongoose.Schema({
  amountMl: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const dailyMetricsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Date string (YYYY-MM-DD) is required'],
      index: true,
    },
    waterIntakeMl: {
      type: Number,
      default: 0,
      min: 0,
    },
    waterGoalMl: {
      type: Number,
      default: 3000,
      min: 500,
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    steps: {
      type: Number,
      default: 0,
      min: 0,
      max: 50000,
    },
    stepGoal: {
      type: Number,
      default: 10000,
      min: 1000,
    },
    waterLogs: [waterLogEntrySchema],
  },
  {
    timestamps: true,
  }
);

// Unique compound index per user per calendar day
dailyMetricsSchema.index({ user: 1, date: 1 }, { unique: true });

const DailyMetrics = mongoose.model('DailyMetrics', dailyMetricsSchema);

module.exports = DailyMetrics;
