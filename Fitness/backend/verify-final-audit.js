const http = require('http');
const mongoose = require('mongoose');

async function verifyAll() {
  console.log('--- EXERCISE IMAGE DUPLICATION AUDIT ---');

  // 1. Direct MongoDB Check
  await mongoose.connect('mongodb://localhost:27017/fitness_db');
  const db = mongoose.connection;
  const exercises = await db.collection('exercises').find({}).toArray();
  console.log(`1. Total exercises in MongoDB: ${exercises.length}`);

  const urlMap = new Map();
  exercises.forEach(ex => {
    const list = urlMap.get(ex.imageUrl) || [];
    list.push(ex.name);
    urlMap.set(ex.imageUrl, list);
  });

  console.log(`2. Total unique image URLs in DB: ${urlMap.size}`);

  const duplicates = [];
  for (const [url, names] of urlMap.entries()) {
    if (names.length > 1) {
      duplicates.push({ url, names });
    }
  }

  if (duplicates.length === 0) {
    console.log('✅ ZERO DUPLICATE IMAGES DETECTED IN DATABASE! (100% Unique)');
  } else {
    console.error(`❌ Found ${duplicates.length} duplicate image groups:`, duplicates);
  }

  // 2. Sample user-mentioned exercises
  const checkNames = [
    'Barbell Bicep Curl',
    'Cable Rope Hammer Curl',
    'Concentration Curl',
    'Hammer Curl',
    'Incline Dumbbell Curl',
    'Barbell Bench Press',
    'Incline Dumbbell Press',
    'Dumbbell Fly',
    'Push Up',
    'Barbell Back Squat',
    'Conventional Deadlift'
  ];

  console.log('\n3. Checking specific exercise thumbnails:');
  checkNames.forEach(name => {
    const found = exercises.find(e => e.name === name);
    if (found) {
      console.log(`  - [${found.muscleGroup}] ${found.name.padEnd(25)} -> ${found.imageUrl.slice(0, 70)}...`);
    } else {
      console.warn(`  - NOT FOUND: ${name}`);
    }
  });

  // 3. API endpoint verification
  await new Promise((resolve) => {
    http.get('http://localhost:5000/api/v1/exercises', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const apiExercises = json.data || json;
          console.log(`\n4. API GET /api/v1/exercises returned ${apiExercises.length} exercises.`);
          const apiUrls = new Set(apiExercises.map(e => e.imageUrl));
          console.log(`   API unique imageUrls: ${apiUrls.size} / ${apiExercises.length}`);
          if (apiUrls.size === apiExercises.length) {
            console.log('✅ API confirms 0 duplicate images across all exercises!');
          }
        } catch (e) {
          console.error('API response parse error:', e.message);
        }
        resolve();
      });
    }).on('error', err => {
      console.error('API request error:', err.message);
      resolve();
    });
  });

  await mongoose.disconnect();
  console.log('\nAudit complete!');
}

verifyAll().catch(console.error);
