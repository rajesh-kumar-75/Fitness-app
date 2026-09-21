const mongoose = require('mongoose');
const { EXERCISE_IMAGES } = require('../validate-118-images');

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect('mongodb://localhost:27017/fitness_db');
  console.log('Connected to fitness_db.');

  const exercisesCol = mongoose.connection.collection('exercises');
  const workoutLogsCol = mongoose.connection.collection('workoutlogs');

  // 1. Redundant mapping for remap
  const redundantMapping = {
    'Overhead Shoulder Press': 'Overhead Barbell Military Press',
    'Dumbbell Bicep Curl': 'Incline Dumbbell Curl',
    'Tricep Rope Pushdown': 'Triceps Rope Pushdown',
    'Hanging Knee Raise': 'Hanging Leg Raise',
    'HIIT Treadmill Sprints': 'Treadmill HIIT Sprints',
    'Barbell Row': 'Barbell Bent-Over Row',
    'Pull Up': 'Pull-Up',
    'Barbell Squat': 'Barbell Back Squat',
    'Leg Curl': 'Lying Leg Curl',
    'Shoulder Press': 'Seated Dumbbell Shoulder Press',
    'Barbell Curl': 'Barbell Bicep Curl',
    'Tricep Pushdown': 'Triceps Rope Pushdown',
    'Overhead Tricep Extension': 'Overhead Dumbbell Triceps Extension',
    'Crunch': 'Bicycle Crunches',
    'Leg Raise': 'Lying Leg Raise',
    'Tree Pose (Vrksasana)': 'Tree Pose (Vrikshasana)',
    'Bridge Pose (Setu Bandhasana)': 'Bridge Pose (Setu Bandha Sarvangasana)'
  };

  // Build ID mapping: redundantObjectId -> canonicalObjectId
  const idRemap = {};
  const redundantObjectIds = [];

  for (const [oldName, newName] of Object.entries(redundantMapping)) {
    const oldDoc = await exercisesCol.findOne({ name: oldName });
    const newDoc = await exercisesCol.findOne({ name: newName });
    if (oldDoc && newDoc) {
      idRemap[oldDoc._id.toString()] = newDoc._id;
      redundantObjectIds.push(oldDoc._id);
    }
  }

  console.log(`Prepared ${Object.keys(idRemap).length} redundant exercise ID mappings.`);

  // 2. Remap references in workoutlogs
  const logs = await workoutLogsCol.find({}).toArray();
  let updatedLogsCount = 0;

  for (const log of logs) {
    let modified = false;
    if (log.exercises && Array.isArray(log.exercises)) {
      for (const item of log.exercises) {
        const idStr = (item.exercise || item.exerciseId || '').toString();
        if (idRemap[idStr]) {
          if (item.exercise) item.exercise = idRemap[idStr];
          if (item.exerciseId) item.exerciseId = idRemap[idStr];
          modified = true;
        }
      }
    }
    if (modified) {
      await workoutLogsCol.updateOne(
        { _id: log._id },
        { $set: { exercises: log.exercises } }
      );
      updatedLogsCount++;
    }
  }
  console.log(`Updated ${updatedLogsCount} workout logs to point to canonical exercise IDs.`);

  // 3. Remove redundant exercises from exercises collection
  const deleteResult = await exercisesCol.deleteMany({
    _id: { $in: redundantObjectIds }
  });
  console.log(`Deleted ${deleteResult.deletedCount} redundant exercise documents.`);

  // 4. Update all 118 exercises with their 100% unique image URLs
  let updatedImagesCount = 0;
  for (const [name, url] of Object.entries(EXERCISE_IMAGES)) {
    const thumb = url.includes('unsplash')
      ? url.replace('w=700', 'w=400')
      : url;

    const res = await exercisesCol.updateOne(
      { name: name },
      {
        $set: {
          imageUrl: url,
          thumbnailUrl: thumb,
          image: url
        }
      }
    );
    if (res.matchedCount > 0) {
      updatedImagesCount++;
    } else {
      console.warn(`Exercise not found in DB to update image: ${name}`);
    }
  }
  console.log(`Updated images for ${updatedImagesCount} exercises.`);

  // 5. Verification
  const totalCount = await exercisesCol.countDocuments();
  const allDocs = await exercisesCol.find({}).toArray();
  const distinctUrls = new Set(allDocs.map(d => d.imageUrl));

  console.log('\n--- VERIFICATION STATS ---');
  console.log(`Total exercises in DB: ${totalCount} (Expected: 118)`);
  console.log(`Total distinct imageUrls: ${distinctUrls.size} (Expected: 118)`);

  if (totalCount === 118 && distinctUrls.size === 118) {
    console.log('SUCCESS: All 118 exercises are unique and have 0 duplicate images!');
  } else {
    console.error('WARNING: Check stats!');
  }

  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
