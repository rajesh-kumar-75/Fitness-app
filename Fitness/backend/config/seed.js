const mongoose = require('mongoose');
const User = require('../models/User');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const Membership = require('../models/Membership');
const Workout = require('../models/Workout');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const { seedExercisesIfEmpty } = require('../controllers/exerciseController');
const { seedWorkoutPlansIfEmpty } = require('../controllers/workoutPlanController');

const seedDatabase = async () => {
  try {
    console.log('[Seeder] Checking and seeding initial fitness database records...');

    // 0. Seed Exercises and Workout Plans if empty
    await seedExercisesIfEmpty();
    await seedWorkoutPlansIfEmpty();

    // 1. Seed Memberships if empty
    const membershipCount = await Membership.countDocuments();
    let basicPlan, premiumPlan, goldPlan;
    if (membershipCount === 0) {
      console.log('[Seeder] Seeding membership plans...');
      const plans = await Membership.insertMany([
        {
          name: 'Basic',
          description: 'Access to standard gym floor and equipment during regular hours',
          price: 29,
          duration: 30,
          features: ['Standard gym equipment', 'Locker room access', 'FitPlatform Mobile App'],
          status: 'Active',
        },
        {
          name: 'Premium',
          description: 'Full access to all facilities, classes, and spa amenities',
          price: 59,
          duration: 30,
          features: [
            'All gym equipment & cardio zone',
            'Unlimited group classes',
            'Sauna & steam room',
            '1 Personal coaching session/month',
            'FitPlatform Mobile App & Progress Tracker',
          ],
          status: 'Active',
        },
        {
          name: 'Gold',
          description: 'VIP complete access with dedicated personal trainer & nutrition',
          price: 99,
          duration: 90,
          features: [
            '24/7 Priority gym access',
            'Dedicated personal trainer',
            'Customized workout & diet plan',
            'Unlimited guest passes',
            'Complementary recovery smoothies',
          ],
          status: 'Active',
        },
        {
          name: 'Annual Pass',
          description: 'Year-round fitness commitment with maximum savings and VIP perks',
          price: 499,
          duration: 365,
          features: [
            'Full VIP Gold privileges for 12 months',
            'Free fitness assessment & body composition analysis',
            'Free gym merchandise kit',
            '2 Free guest passes every month',
          ],
          status: 'Active',
        },
      ]);
      basicPlan = plans[0];
      premiumPlan = plans[1];
      goldPlan = plans[2];
      console.log('[Seeder] Membership plans seeded successfully.');
    } else {
      basicPlan = await Membership.findOne({ name: 'Basic' });
      premiumPlan = await Membership.findOne({ name: 'Premium' });
    }

    // 2. Seed Admin User
    let adminUser = await User.findOne({ email: 'admin@fitness.com' });
    if (!adminUser) {
      console.log('[Seeder] Creating default admin user (admin@fitness.com / Admin@123)...');
      adminUser = await User.create({
        name: 'Super Admin',
        email: 'admin@fitness.com',
        password: 'Admin@123',
        phone: '+1 555-0199',
        role: 'admin',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      });
      console.log('[Seeder] Admin user created.');
    }

    // 3. Seed Trainer User & Trainer profile
    let trainerUser = await User.findOne({ email: 'trainer@fitness.com' });
    let trainerProfile = null;
    if (!trainerUser) {
      console.log('[Seeder] Creating default trainer user (trainer@fitness.com / Trainer@123)...');
      trainerUser = await User.create({
        name: 'Alex Rivera',
        email: 'trainer@fitness.com',
        password: 'Trainer@123',
        phone: '+1 555-0144',
        role: 'trainer',
        profileImage: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150',
      });
      trainerProfile = await Trainer.create({
        user: trainerUser._id,
        name: 'Alex Rivera',
        email: 'trainer@fitness.com',
        phone: '+1 555-0144',
        specialization: 'Strength & Conditioning, Functional Training',
        experience: 6,
        certification: 'NASM-CPT, CSCS Certified',
        bio: 'Dedicated coach helping clients build lean strength, endurance, and sustainable athletic habits.',
        profileImage: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150',
        availability: 'Mon-Sat: 6:00 AM - 6:00 PM',
      });
      console.log('[Seeder] Trainer profile created.');
    } else {
      trainerProfile = await Trainer.findOne({ email: 'trainer@fitness.com' });
    }

    // 4. Seed Member User & Member profile
    let memberUser = await User.findOne({ email: 'member@fitness.com' });
    let memberProfile = null;
    if (!memberUser) {
      console.log('[Seeder] Creating default member user (member@fitness.com / Member@123)...');
      memberUser = await User.create({
        name: 'Jordan Miller',
        email: 'member@fitness.com',
        password: 'Member@123',
        phone: '+1 555-0188',
        role: 'member',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      });

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      memberProfile = await Member.create({
        user: memberUser._id,
        name: 'Jordan Miller',
        email: 'member@fitness.com',
        phone: '+1 555-0188',
        gender: 'Male',
        height: 178,
        weight: 76,
        fitnessGoal: 'Muscle Gain',
        emergencyContact: '+1 555-0122 (Sarah Miller - Spouse)',
        membership: premiumPlan ? premiumPlan._id : null,
        membershipStartDate: new Date(),
        membershipEndDate: expiry,
        assignedTrainer: trainerProfile ? trainerProfile._id : null,
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      });

      // Add a sample payment for this member
      if (premiumPlan) {
        await Payment.create({
          member: memberProfile._id,
          membership: premiumPlan._id,
          amount: premiumPlan.price,
          paymentMethod: 'Card',
          paymentStatus: 'Completed',
          paymentDate: new Date(),
        });
      }

      // Add attendance record for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await Attendance.create({
        member: memberProfile._id,
        date: today,
        checkInTime: new Date(Date.now() - 3600000), // 1 hour ago
        status: 'Present',
      });

      console.log('[Seeder] Sample member and records created.');
    }

    // 5. Seed Workouts if empty
    const workoutCount = await Workout.countDocuments();
    if (workoutCount === 0) {
      console.log('[Seeder] Seeding initial workouts...');
      await Workout.insertMany([
        {
          name: 'Total Body Strength Foundation',
          description: 'Compound lift routine targeting major muscle groups for foundation building.',
          category: 'Strength',
          difficulty: 'Beginner',
          duration: 45,
          exercises: [
            { exerciseName: 'Barbell Back Squat', sets: 4, reps: 10, duration: 0, restTime: 90 },
            { exerciseName: 'Dumbbell Bench Press', sets: 3, reps: 12, duration: 0, restTime: 60 },
            { exerciseName: 'Bent Over Barbell Row', sets: 3, reps: 12, duration: 0, restTime: 60 },
            { exerciseName: 'Plank Hold', sets: 3, reps: 1, duration: 45, restTime: 45 },
          ],
          trainer: trainerProfile ? trainerProfile._id : null,
          assignedMembers: memberProfile ? [memberProfile._id] : [],
        },
        {
          name: 'High-Intensity Cardio Blast',
          description: 'Fast-paced intervals to skyrocket calorie burn and cardiovascular endurance.',
          category: 'HIIT',
          difficulty: 'Intermediate',
          duration: 30,
          exercises: [
            { exerciseName: 'Burpees', sets: 4, reps: 15, duration: 0, restTime: 45 },
            { exerciseName: 'Kettlebell Swings', sets: 4, reps: 20, duration: 0, restTime: 45 },
            { exerciseName: 'Mountain Climbers', sets: 4, reps: 30, duration: 0, restTime: 30 },
            { exerciseName: 'Jump Squats', sets: 4, reps: 15, duration: 0, restTime: 45 },
          ],
          trainer: trainerProfile ? trainerProfile._id : null,
          assignedMembers: [],
        },
        {
          name: 'Core & Mobility Yoga Flow',
          description: 'Gentle active recovery focusing on deep hip openers and spine mobility.',
          category: 'Yoga',
          difficulty: 'Beginner',
          duration: 35,
          exercises: [
            { exerciseName: 'Sun Salutation A', sets: 5, reps: 1, duration: 180, restTime: 30 },
            { exerciseName: 'Warrior II Sequence', sets: 3, reps: 1, duration: 120, restTime: 30 },
            { exerciseName: 'Downward Dog to Cobra', sets: 4, reps: 8, duration: 0, restTime: 30 },
          ],
          trainer: null,
          assignedMembers: [],
        },
      ]);
      console.log('[Seeder] Workouts seeded successfully.');
    }

    console.log('[Seeder] Seeding check completed.');
  } catch (err) {
    console.error(`[Seeder Error]: ${err.message}`);
  }
};

module.exports = seedDatabase;
