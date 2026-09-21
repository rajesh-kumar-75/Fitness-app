const https = require('https');
const { ALL_118_EXERCISES } = require('./data/exerciseDataset');

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

// Aliases for better matching with free-exercise-db
const ALIASES = {
  'Chest Dips': ['Dips - Chest Version', 'Chest dip'],
  'Pec Deck Machine Fly': ['Butterfly', 'Pec Deck'],
  'Barbell Bent-Over Row': ['Bent Over Two-Arm Long Barbell Row', 'Bent Over Barbell Row'],
  'Conventional Deadlift': ['Barbell Deadlift', 'Deadlift'],
  'Single-Arm Dumbbell Row': ['One-Arm Dumbbell Row', 'Dumbbell Row'],
  'Straight-Arm Cable Pulldown': ['Straight-Arm Pulldown', 'Rope Straight-Arm Pulldown'],
  'Overhead Barbell Military Press': ['Standing Military Press', 'Military Press', 'Overhead Press'],
  'Dumbbell Lateral Raise': ['Side Lateral Raise'],
  'Cable Lateral Raise': ['Cable Lateral Raise', 'Cable Side Lateral'],
  'Rear Delt Dumbbell Fly': ['Seated Bent-Over Rear Delt Raise', 'Rear Delt Flyes'],
  'Barbell Upright Row': ['Upright Barbell Row', 'Upright Row'],
  'Landmine Shoulder Press': ['Landmine 180s', 'One-Arm Landmine Push Press', 'Clean and press'],
  'Barbell Bicep Curl': ['Barbell Curl', 'Close-Grip Barbell Curl'],
  'Cable Rope Hammer Curl': ['Cable Rope Hammer Curl', 'Rope Cable Curl', 'Standing Biceps Cable Curl'],
  'EZ-Bar 21s Curl': ['21s', 'EZ-Bar Curl'],
  'High Cable Bicep Curl': ['Overhead Cable Curl', 'Cable Preacher Curl'],
  'Triceps Rope Pushdown': ['Triceps Pushdown - Rope Attachment', 'Triceps Pushdown'],
  'Skull Crusher (Lying Triceps Extension)': ['Lying Triceps Press', 'Decline EZ Bar Triceps Extension'],
  'Overhead Dumbbell Triceps Extension': ['Standing Dumbbell Triceps Extension', 'Seated Triceps Press'],
  'Parallel Bar Triceps Dips': ['Dips - Triceps Version', 'Parallel Bar Dip'],
  'Diamond Push-Up': ['Diamond Push-Up', 'Close-grip push-up'],
  'Single-Arm Reverse Grip Cable Pushdown': ['Reverse Grip Triceps Pushdown', 'Single Arm Cable Pushdown'],
  'Dumbbell Triceps Kickback': ['Tricep Dumbbell Kickback'],
  'Barbell Back Squat': ['Barbell Full Squat', 'Barbell Squat'],
  'Barbell Front Squat': ['Front Barbell Squat'],
  'Bulgarian Split Squat': ['Split Squat with Dumbbells', 'Single Leg Split Squat'],
  'Bulgarian Split Squat (Glute Bias)': ['Single Leg Split Squat'],
  'Bodyweight Glute Bridge': ['Glute Bridge', 'Butt Lift (Bridge)'],
  'Curtsy Lunge': ['Curtsy Lunge', 'Cross Lunges'],
  'High Step-Up with Knee Drive': ['Dumbbell Step Ups', 'Step-up with Knee Raise'],
  'Single-Leg Hip Thrust': ['Single Leg Glute Bridge', 'Single-Leg Hip Thrust'],
  'Frog Pumps': ['Frog Hops', 'Glute Bridge'],
  'Banded Clamshells': ['Clam', 'Side Lying Clam'],
  'Cable Woodchoppers': ['Standing Cable Wood Chop'],
  'Ab Wheel Rollout': ['Ab Roller'],
  "Captain's Chair Knee Raise": ['Vertical Traction', 'Hanging Leg Raise'],
  'Dragon Flag': ['Dragon Flag', 'Flat Bench Leg Pull-In'],
  'V-Ups': ['Jackknife Sit-Up', 'V-Up'],
  'Bird Dog': ['Bird Dog', 'Birddog'],
  'Jump Rope': ['Rope Jumping'],
  'Treadmill HIIT Sprints': ['Treadmill running', 'Running, Treadmill'],
  'Rowing Machine 500m Sprint': ['Rowing, Stationary'],
  'Burpees': ['Burpee'],
  'Battle Ropes Wave': ['Battling Ropes'],
  'Plyometric Box Jumps': ['Box Jump (Multiple Response)', 'Box Jump'],
  'High Knee Running in Place': ['Jog In Place', 'High Knees'],
  'Kettlebell Clean and Press': ['One-Arm Kettlebell Clean and Press'],
  'Child\'s Pose (Balasana)': ['Child\'s Pose'],
  'Downward-Facing Dog (Adho Mukha Svanasana)': ['Downward Facing Dog'],
  'Warrior I (Virabhadrasana I)': ['Warrior I'],
  'Warrior II (Virabhadrasana II)': ['Warrior II'],
  'Warrior III (Virabhadrasana III)': ['Warrior III'],
  'Cobra Pose (Bhujangasana)': ['Cobra'],
  'Triangle Pose (Trikonasana)': ['Triangle'],
  'Tree Pose (Vrikshasana)': ['Tree Pose'],
  'Bridge Pose (Setu Bandha Sarvangasana)': ['Bridge Pose'],
  'Crow Pose (Bakasana)': ['Crow Pose'],
  'Upward-Facing Dog (Urdhva Mukha Svanasana)': ['Upward Facing Dog'],
  'Pigeon Pose (Eka Pada Rajakapotasana)': ['Pigeon Pose']
};

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function run() {
  const freeDb = await getJson('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');

  const normMap = new Map();
  freeDb.forEach(item => {
    normMap.set(normalize(item.name), item);
  });

  const matches = {};
  const missing = [];

  for (const ex of ALL_118_EXERCISES) {
    let found = normMap.get(normalize(ex.name));
    if (!found && ALIASES[ex.name]) {
      for (const alias of ALIASES[ex.name]) {
        found = normMap.get(normalize(alias));
        if (found) break;
        found = freeDb.find(f => normalize(f.name).includes(normalize(alias)));
        if (found) break;
      }
    }
    if (!found) {
      // search keywords
      const words = ex.name.split(' ').filter(w => w.length > 3);
      found = freeDb.find(f => words.every(w => normalize(f.name).includes(normalize(w))));
    }

    if (found && found.images && found.images.length > 0) {
      matches[ex.name] = {
        freeName: found.name,
        image: `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${found.images[0]}`
      };
    } else {
      missing.push(ex.name);
    }
  }

  console.log(`Matched with free-exercise-db: ${Object.keys(matches).length} / ${ALL_118_EXERCISES.length}`);
  console.log('Missing count:', missing.length);
  console.log('Missing list:', missing);
}

run().catch(console.error);
