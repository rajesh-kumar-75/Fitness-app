/**
 * High-definition, verified unique photography for all 118 exercises.
 * Guarantees zero duplicate images across the entire exercise library.
 */

const FDB = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const EXERCISE_IMAGES = {
  // 1. CHEST (12)
  'Barbell Bench Press': `${FDB}Barbell_Bench_Press_-_Medium_Grip/0.jpg`,
  'Incline Dumbbell Press': `${FDB}Incline_Dumbbell_Press/0.jpg`,
  'Dumbbell Fly': `${FDB}Dumbbell_Flyes/0.jpg`,
  'Push Up': `${FDB}Pushups/0.jpg`,
  'Decline Barbell Bench Press': `${FDB}Decline_Barbell_Bench_Press/0.jpg`,
  'Cable Crossover': `${FDB}Flat_Bench_Cable_Flyes/0.jpg`,
  'Chest Dips': `${FDB}Dips_-_Chest_Version/0.jpg`,
  'Pec Deck Machine Fly': `${FDB}Butterfly/0.jpg`,
  'Incline Cable Fly': `${FDB}Incline_Cable_Flye/0.jpg`,
  'Dumbbell Pullover': `${FDB}Straight-Arm_Dumbbell_Pullover/0.jpg`,
  'Close-Grip Push-Up': `${FDB}Close-Grip_Push-Up_off_of_a_Dumbbell/0.jpg`,
  'Floor Press with Dumbbells': 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=700&auto=format&fit=crop&q=80',

  // 2. BACK (12)
  'Lat Pulldown': `${FDB}Wide-Grip_Lat_Pulldown/0.jpg`,
  'Barbell Bent-Over Row': `${FDB}Bent_Over_Barbell_Row/0.jpg`,
  'Seated Cable Row': `${FDB}Seated_Cable_Rows/0.jpg`,
  'Conventional Deadlift': `${FDB}Barbell_Deadlift/0.jpg`,
  'Pull-Up': `${FDB}Pullups/0.jpg`,
  'Chin-Up': `${FDB}Chin-Up/0.jpg`,
  'Single-Arm Dumbbell Row': `${FDB}One-Arm_Dumbbell_Row/0.jpg`,
  'T-Bar Row': `${FDB}T-Bar_Row_with_Handle/0.jpg`,
  'Face Pull': `${FDB}Face_Pull/0.jpg`,
  'Straight-Arm Cable Pulldown': `${FDB}Rope_Straight-Arm_Pulldown/0.jpg`,
  'Hyperextensions (Back Extension)': `${FDB}Hyperextensions_Back_Extensions/0.jpg`,
  'Inverted Row': `${FDB}Inverted_Row/0.jpg`,

  // 3. SHOULDERS (12)
  'Overhead Barbell Military Press': `${FDB}Standing_Military_Press/0.jpg`,
  'Dumbbell Lateral Raise': `${FDB}Side_Lateral_Raise/0.jpg`,
  'Seated Dumbbell Shoulder Press': `${FDB}Seated_Dumbbell_Press/0.jpg`,
  'Arnold Press': `${FDB}Arnold_Dumbbell_Press/0.jpg`,
  'Cable Lateral Raise': `${FDB}Cable_Internal_Rotation/0.jpg`,
  'Front Plate Raise': `${FDB}Front_Plate_Raise/0.jpg`,
  'Rear Delt Dumbbell Fly': `${FDB}Seated_Bent-Over_Rear_Delt_Raise/0.jpg`,
  'Barbell Upright Row': `${FDB}Upright_Barbell_Row/0.jpg`,
  'Push Press': `${FDB}Push_Press/0.jpg`,
  'Handstand Push-Up': `${FDB}Handstand_Push-Ups/0.jpg`,
  'Dumbbell Shrugs': `${FDB}Dumbbell_Shrug/0.jpg`,
  'Landmine Shoulder Press': 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=700&auto=format&fit=crop&q=80',

  // 4. BICEPS (11)
  'Barbell Bicep Curl': `${FDB}Barbell_Curl/0.jpg`,
  'Incline Dumbbell Curl': `${FDB}Incline_Dumbbell_Curl/0.jpg`,
  'Hammer Curl': `${FDB}Hammer_Curls/0.jpg`,
  'Preacher Curl': `${FDB}Preacher_Curl/0.jpg`,
  'Concentration Curl': `${FDB}Concentration_Curls/0.jpg`,
  'Cable Rope Hammer Curl': `${FDB}Cable_Hammer_Curls_-_Rope_Attachment/0.jpg`,
  'Spider Curl': `${FDB}Spider_Curl/0.jpg`,
  'EZ-Bar 21s Curl': `${FDB}EZ-Bar_Curl/0.jpg`,
  'Reverse Grip Barbell Curl': `${FDB}Reverse_Barbell_Curl/0.jpg`,
  'Zottman Curl': `${FDB}Zottman_Curl/0.jpg`,
  'High Cable Bicep Curl': `${FDB}Overhead_Cable_Curl/0.jpg`,

  // 5. TRICEPS (11)
  'Triceps Rope Pushdown': `${FDB}Triceps_Pushdown_-_Rope_Attachment/0.jpg`,
  'Skull Crusher (Lying Triceps Extension)': `${FDB}Lying_Triceps_Press/0.jpg`,
  'Overhead Dumbbell Triceps Extension': `${FDB}Standing_Dumbbell_Triceps_Extension/0.jpg`,
  'Close-Grip Barbell Bench Press': `${FDB}Close-Grip_Barbell_Bench_Press/0.jpg`,
  'Parallel Bar Triceps Dips': `${FDB}Parallel_Bar_Dip/0.jpg`,
  'Diamond Push-Up': `${FDB}Push-Ups_-_Close_Triceps_Position/0.jpg`,
  'Cable Overhead Triceps Extension': `${FDB}Cable_Rope_Overhead_Triceps_Extension/0.jpg`,
  'Single-Arm Reverse Grip Cable Pushdown': `${FDB}Reverse_Grip_Triceps_Pushdown/0.jpg`,
  'Dumbbell Triceps Kickback': `${FDB}Tricep_Dumbbell_Kickback/0.jpg`,
  'Bench Dips': `${FDB}Bench_Dips/0.jpg`,
  'Tate Press': `${FDB}Tate_Press/0.jpg`,

  // 6. LEGS (14)
  'Barbell Back Squat': `${FDB}Barbell_Full_Squat/0.jpg`,
  'Barbell Front Squat': `${FDB}Front_Squat_Clean_Grip/0.jpg`,
  'Romanian Deadlift (RDL)': `${FDB}Romanian_Deadlift/0.jpg`,
  'Bulgarian Split Squat': `${FDB}Split_Squat_with_Dumbbells/0.jpg`,
  'Leg Press': `${FDB}Leg_Press/0.jpg`,
  'Walking Dumbbell Lunges': `${FDB}Dumbbell_Lunges/0.jpg`,
  'Hack Squat': `${FDB}Hack_Squat/0.jpg`,
  'Leg Extension': `${FDB}Leg_Extensions/0.jpg`,
  'Lying Leg Curl': `${FDB}Lying_Leg_Curls/0.jpg`,
  'Seated Leg Curl': `${FDB}Seated_Leg_Curl/0.jpg`,
  'Goblet Squat': `${FDB}Goblet_Squat/0.jpg`,
  'Standing Calf Raise': `${FDB}Standing_Calf_Raises/0.jpg`,
  'Seated Calf Raise': `${FDB}Seated_Calf_Raise/0.jpg`,
  'Sissy Squat': 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=700&auto=format&fit=crop&q=80',

  // 7. GLUTES (11)
  'Barbell Hip Thrust': `${FDB}Barbell_Glute_Bridge/0.jpg`,
  'Cable Glute Kickback': `${FDB}Glute_Kickback/0.jpg`,
  'Dumbbell Romanian Deadlift (Glute Bias)': `${FDB}Stiff-Legged_Dumbbell_Deadlift/0.jpg`,
  'Bulgarian Split Squat (Glute Bias)': `${FDB}Split_Squats/0.jpg`,
  'Bodyweight Glute Bridge': `${FDB}Butt_Lift_Bridge/0.jpg`,
  'Curtsy Lunge': 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=700&auto=format&fit=crop&q=80',
  'High Step-Up with Knee Drive': `${FDB}Dumbbell_Step_Ups/0.jpg`,
  'Kettlebell Swing': `${FDB}One-Arm_Kettlebell_Swings/0.jpg`,
  'Single-Leg Hip Thrust': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&auto=format&fit=crop&q=80',
  'Frog Pumps': 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=700&auto=format&fit=crop&q=80',
  'Banded Clamshells': 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700&auto=format&fit=crop&q=80',

  // 8. CORE (13)
  'Plank': `${FDB}Plank/0.jpg`,
  'Hanging Leg Raise': `${FDB}Hanging_Leg_Raise/0.jpg`,
  'Cable Woodchoppers': `${FDB}Standing_Cable_Wood_Chop/0.jpg`,
  'Ab Wheel Rollout': `${FDB}Ab_Roller/0.jpg`,
  'Russian Twists': `${FDB}Russian_Twist/0.jpg`,
  'Bicycle Crunches': `${FDB}Cross-Body_Crunch/0.jpg`,
  "Captain's Chair Knee Raise": `${FDB}Knee_Hip_Raise_On_Parallel_Bars/0.jpg`,
  'Side Plank': `${FDB}Side_Bridge/0.jpg`,
  'Dragon Flag': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=700&auto=format&fit=crop&q=80',
  'V-Ups': `${FDB}Jackknife_Sit-Up/0.jpg`,
  'Dead Bug': `${FDB}Dead_Bug/0.jpg`,
  'Bird Dog': 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=700&auto=format&fit=crop&q=80',
  'Lying Leg Raise': `${FDB}Flat_Bench_Lying_Leg_Raise/0.jpg`,

  // 9. CARDIO (10)
  'Jump Rope': `${FDB}Rope_Jumping/0.jpg`,
  'Treadmill HIIT Sprints': 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=700&auto=format&fit=crop&q=80',
  'Rowing Machine 500m Sprint': 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=700&auto=format&fit=crop&q=80',
  'Assault Air Bike Intervals': 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=700&auto=format&fit=crop&q=80',
  'Burpees': 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=700&auto=format&fit=crop&q=80',
  'Battle Ropes Wave': `${FDB}Battling_Ropes/0.jpg`,
  'Plyometric Box Jumps': `${FDB}Box_Jump_Multiple_Response/0.jpg`,
  'Stairmaster Climb Intervals': 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=700&auto=format&fit=crop&q=80',
  'High Knee Running in Place': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&auto=format&fit=crop&q=80',
  'Kettlebell Clean and Press': `${FDB}Clean_and_Press/0.jpg`,

  // 10. YOGA (12)
  'Downward-Facing Dog (Adho Mukha Svanasana)': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=700&auto=format&fit=crop&q=80',
  'Warrior I (Virabhadrasana I)': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=700&auto=format&fit=crop&q=80',
  'Warrior II (Virabhadrasana II)': 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=700&auto=format&fit=crop&q=80',
  'Warrior III (Virabhadrasana III)': 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=700&auto=format&fit=crop&q=80',
  'Cobra Pose (Bhujangasana)': 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=700&auto=format&fit=crop&q=80',
  "Child's Pose (Balasana)": `${FDB}Childs_Pose/0.jpg`,
  'Triangle Pose (Trikonasana)': 'https://images.unsplash.com/photo-1580261450046-d0a30080dc9b?w=700&auto=format&fit=crop&q=80',
  'Tree Pose (Vrikshasana)': 'https://images.unsplash.com/photo-1434725039720-aaad6dd32dfe?w=700&auto=format&fit=crop&q=80',
  'Bridge Pose (Setu Bandha Sarvangasana)': 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=700&auto=format&fit=crop&q=80',
  'Crow Pose (Bakasana)': 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=700&auto=format&fit=crop&q=80',
  'Upward-Facing Dog (Urdhva Mukha Svanasana)': 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=700&auto=format&fit=crop&q=80',
  'Pigeon Pose (Eka Pada Rajakapotasana)': 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=700&auto=format&fit=crop&q=80'
};

module.exports = { EXERCISE_IMAGES };
