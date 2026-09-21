/**
 * update-exercise-images.js
 * Updates the imageUrl and thumbnailUrl for specific bicep exercises with distinct photography.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness_db';

const targetImages = {
  'Barbell Bicep Curl': {
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80',
    description: 'Standing barbell bicep curls with strict elbow flexion',
  },
  'Barbell Curl': {
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80',
    description: 'Standing barbell curls with Olympic bar',
  },
  'Cable Rope Hammer Curl': {
    imageUrl: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=700&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=400&auto=format&fit=crop&q=80',
    description: 'Neutral grip cable rope curls at low pulley station',
  },
  'Concentration Curl': {
    imageUrl: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=700&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&auto=format&fit=crop&q=80',
    description: 'Seated isolated single-arm dumbbell concentration curl',
  },
  'Hammer Curl': {
    imageUrl: 'https://images.unsplash.com/photo-1583454155184-870a1f63aebc?w=700&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583454155184-870a1f63aebc?w=400&auto=format&fit=crop&q=80',
    description: 'Standing neutral-grip dumbbell hammer curls targeting brachialis',
  },
};

async function updateExerciseImages() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully!\n');

    const db = mongoose.connection.db;
    const exercisesCollection = db.collection('exercises');

    for (const [name, data] of Object.entries(targetImages)) {
      const result = await exercisesCollection.updateMany(
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        {
          $set: {
            imageUrl: data.imageUrl,
            thumbnailUrl: data.thumbnailUrl,
            image: data.imageUrl,
          },
        }
      );

      console.log(`Updated [${name}]: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
      console.log(`  -> URL: ${data.imageUrl}\n`);
    }

    console.log('All targeted exercise images updated successfully in database!');
  } catch (error) {
    console.error('Error updating exercise images:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

updateExerciseImages();
