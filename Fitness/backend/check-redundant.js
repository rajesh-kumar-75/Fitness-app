const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/fitness_db');

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

  const idMap = {};
  for (const [oldName, newName] of Object.entries(redundantMapping)) {
    const oldEx = await mongoose.connection.collection('exercises').findOne({ name: oldName });
    const newEx = await mongoose.connection.collection('exercises').findOne({ name: newName });
    if (oldEx && newEx) {
      idMap[oldEx._id.toString()] = newEx._id;
    }
  }

  const oldObjectIds = Object.keys(idMap).map(id => new mongoose.Types.ObjectId(id));

  // Check workoutplans
  const plans = await mongoose.connection.collection('workoutplans').find({}).toArray();
  let plansReferencing = 0;
  for (const plan of plans) {
    let touched = false;
    if (plan.days) {
      for (const day of plan.days) {
        if (day.exercises) {
          for (const ex of day.exercises) {
            const exIdStr = (ex.exercise || ex.exerciseId || '').toString();
            if (idMap[exIdStr]) {
              touched = true;
            }
          }
        }
      }
    }
    if (touched) plansReferencing++;
  }
  console.log('WorkoutPlans referencing redundant exercises:', plansReferencing);

  // Check workoutlogs
  const logs = await mongoose.connection.collection('workoutlogs').find({}).toArray();
  let logsReferencing = 0;
  for (const log of logs) {
    let touched = false;
    if (log.exercises) {
      for (const ex of log.exercises) {
        const exIdStr = (ex.exercise || ex.exerciseId || '').toString();
        if (idMap[exIdStr]) {
          touched = true;
        }
      }
    }
    if (touched) logsReferencing++;
  }
  console.log('WorkoutLogs referencing redundant exercises:', logsReferencing);

  await mongoose.disconnect();
}

run().catch(console.error);
