const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Trainer = require('./models/Trainer');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitness_db';

const trainersToSeed = [
  {
    name: 'Alexander Wright',
    emails: ['alexander@fitplatform.com', 'alexander.wright@fitplatform.com'],
    specialization: 'Longevity & Anti-Aging',
    specialties: ['Longevity', 'Anti-Aging', 'Joint Mobility', 'Zone 2 Cardio'],
    bio: 'Pioneer in longevity training, metabolic health, and preserving functional mobility and vitality at every age.',
    profileImage: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Grace Miller',
    emails: ['grace@fitplatform.com', 'grace.miller@fitplatform.com'],
    specialization: 'Rotator Cuff Rehab',
    specialties: ['Rotator Cuff Rehab', 'Shoulder Health', 'Corrective Exercise', 'Scapular Stability'],
    bio: 'Orthopedic rehabilitation and physical therapy coach specializing in overcoming impingements and building bulletproof shoulders.',
    profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Maya Patel',
    emails: ['maya@fitplatform.com', 'maya.patel@fitplatform.com'],
    specialization: 'Holistic Movement',
    specialties: ['Holistic Movement', 'Yoga & Mobility', 'Posture', 'Active Recovery'],
    bio: 'Holistic movement and recovery coach uniting joint centration, breathwork, and dynamic mobility flows.',
    profileImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Alex Rivera',
    emails: ['trainer@fitness.com'],
    specialization: 'Elite Strength & Conditioning',
    specialties: ['Strength Training', 'Hypertrophy', 'Athletic Conditioning'],
    bio: 'Senior head coach specializing in barbell biomechanics, hypertrophy, and periodized training.',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  },
];

const seedTrainers = async () => {
  try {
    console.log('🔄 Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully.');

    const plainPassword = 'Trainer123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    console.log('\n🌱 Seeding Trainer Accounts with password: "Trainer123!"...\n');

    for (const trainerData of trainersToSeed) {
      for (const email of trainerData.emails) {
        // 1. Create or update User document
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
          user.name = trainerData.name;
          user.password = plainPassword; // Mongoose pre('save') hook will hash this once
          user.role = 'trainer';
          user.profileImage = trainerData.profileImage;
          await user.save();
          console.log(`  Updated existing user: ${user.name} (${email}) [Role: trainer]`);
        } else {
          user = await User.create({
            name: trainerData.name,
            email: email.toLowerCase(),
            password: plainPassword, // Mongoose pre('save') hook will hash this once
            role: 'trainer',
            profileImage: trainerData.profileImage,
          });
          console.log(`  Created new user: ${user.name} (${email}) [Role: trainer]`);
        }

        // 2. Create or link Trainer profile document
        let trainerProfile = await Trainer.findOne({ email: email.toLowerCase() });
        if (trainerProfile) {
          trainerProfile.user = user._id;
          trainerProfile.name = trainerData.name;
          trainerProfile.specialization = trainerData.specialization;
          trainerProfile.specialties = trainerData.specialties;
          trainerProfile.bio = trainerData.bio;
          trainerProfile.profileImage = trainerData.profileImage;
          trainerProfile.isAcceptingClients = true;
          await trainerProfile.save();
        } else {
          trainerProfile = await Trainer.create({
            user: user._id,
            name: trainerData.name,
            email: email.toLowerCase(),
            specialization: trainerData.specialization,
            specialties: trainerData.specialties,
            bio: trainerData.bio,
            profileImage: trainerData.profileImage,
            isAcceptingClients: true,
            rating: 4.95,
            reviewsCount: 35,
          });
        }
      }
    }

    console.log('\n=============================================================');
    console.log('🎉 Trainer Accounts Seeded Successfully!');
    console.log('=============================================================');
    console.log('You can now log in to FitPlatform with any of these credentials:');
    console.log('-------------------------------------------------------------');
    console.log('1. Alexander Wright : alexander@fitplatform.com  | Trainer123!');
    console.log('   (or alternate)   : alexander.wright@fitplatform.com');
    console.log('2. Grace Miller     : grace@fitplatform.com      | Trainer123!');
    console.log('   (or alternate)   : grace.miller@fitplatform.com');
    console.log('3. Maya Patel       : maya@fitplatform.com       | Trainer123!');
    console.log('   (or alternate)   : maya.patel@fitplatform.com');
    console.log('4. Alex Rivera      : trainer@fitness.com        | Trainer123! or Trainer@123');
    console.log('=============================================================\n');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding trainers:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedTrainers();
