const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../config/db');
const { Exercise } = require('../models/Exercise');
const { seedExercisesIfEmpty } = require('../controllers/exerciseController');

const runSync = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Synchronizing exercises...');
    await seedExercisesIfEmpty();

    const total = await Exercise.countDocuments();
    console.log(`\n========================================`);
    console.log(`Total Exercises in Database: ${total}`);
    console.log(`========================================`);

    const breakdown = await Exercise.aggregate([
      { $group: { _id: '$muscleGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log('\nBreakdown by Muscle Group:');
    breakdown.forEach((group) => {
      console.log(` - ${group._id.padEnd(12)}: ${group.count} exercises`);
    });
    console.log(`========================================\n`);

    process.exit(0);
  } catch (err) {
    console.error('Error during exercise synchronization:', err);
    process.exit(1);
  }
};

runSync();
