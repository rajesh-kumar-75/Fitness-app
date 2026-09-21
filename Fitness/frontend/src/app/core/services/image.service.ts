import { Injectable } from '@angular/core';
import { Exercise } from '../models/exercise.model';
import { WorkoutExercise, WorkoutPlan, WorkoutDay } from '../models/workout.model';

export interface CategoryCover {
  coverUrl: string;
  thumbnailUrl: string;
  altText: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private readonly workoutCovers: Record<string, CategoryCover> = {
    Chest: {
      coverUrl: '/assets/images/workouts/chest.svg',
      thumbnailUrl: '/assets/images/workouts/chest.svg',
      altText: 'Chest and pectoral workout training demonstration',
    },
    Back: {
      coverUrl: '/assets/images/workouts/back.svg',
      thumbnailUrl: '/assets/images/workouts/back.svg',
      altText: 'Back and lat hypertrophy training demonstration',
    },
    Legs: {
      coverUrl: '/assets/images/workouts/legs.svg',
      thumbnailUrl: '/assets/images/workouts/legs.svg',
      altText: 'Lower body, quadriceps and hamstring training demonstration',
    },
    Shoulders: {
      coverUrl: '/assets/images/workouts/shoulders.svg',
      thumbnailUrl: '/assets/images/workouts/shoulders.svg',
      altText: 'Deltoid and overhead shoulder press demonstration',
    },
    Arms: {
      coverUrl: '/assets/images/workouts/arms.svg',
      thumbnailUrl: '/assets/images/workouts/arms.svg',
      altText: 'Biceps and triceps arm workout demonstration',
    },
    Core: {
      coverUrl: '/assets/images/workouts/core.svg',
      thumbnailUrl: '/assets/images/workouts/core.svg',
      altText: 'Abdominal core and stability workout demonstration',
    },
    'Full Body': {
      coverUrl: '/assets/images/workouts/fullbody.svg',
      thumbnailUrl: '/assets/images/workouts/fullbody.svg',
      altText: 'Full body compound strength and conditioning routine',
    },
    Cardio: {
      coverUrl: '/assets/images/workouts/cardio.svg',
      thumbnailUrl: '/assets/images/workouts/cardio.svg',
      altText: 'Cardiovascular endurance and conditioning training',
    },
    Rest: {
      coverUrl: '/assets/images/workouts/rest.svg',
      thumbnailUrl: '/assets/images/workouts/rest.svg',
      altText: 'Active recovery and mobility rest day visual',
    },
  };

  /**
   * Resolves cover image URL for a workout plan or workout day.
   */
  getWorkoutCover(item?: WorkoutPlan | WorkoutDay | null, categoryHint?: string): string {
    if (!item && !categoryHint) {
      return this.workoutCovers['Full Body'].coverUrl;
    }

    if (item && 'coverImageUrl' in item && item.coverImageUrl) {
      return item.coverImageUrl;
    }

    // Determine category from dayName or title
    const textToMatch = [
      (item as WorkoutPlan)?.title,
      (item as WorkoutDay)?.dayName,
      categoryHint,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if ((item as WorkoutDay)?.isRestDay || textToMatch.includes('rest')) {
      return this.workoutCovers['Rest'].coverUrl;
    }
    if (textToMatch.includes('chest') || textToMatch.includes('push')) {
      return this.workoutCovers['Chest'].coverUrl;
    }
    if (textToMatch.includes('back') || textToMatch.includes('pull')) {
      return this.workoutCovers['Back'].coverUrl;
    }
    if (textToMatch.includes('leg') || textToMatch.includes('squat') || textToMatch.includes('glute')) {
      return this.workoutCovers['Legs'].coverUrl;
    }
    if (textToMatch.includes('shoulder') || textToMatch.includes('press')) {
      return this.workoutCovers['Shoulders'].coverUrl;
    }
    if (textToMatch.includes('arm') || textToMatch.includes('bicep') || textToMatch.includes('tricep')) {
      return this.workoutCovers['Arms'].coverUrl;
    }
    if (textToMatch.includes('core') || textToMatch.includes('ab')) {
      return this.workoutCovers['Core'].coverUrl;
    }
    if (textToMatch.includes('cardio') || textToMatch.includes('hiit') || textToMatch.includes('run')) {
      return this.workoutCovers['Cardio'].coverUrl;
    }

    return this.workoutCovers['Full Body'].coverUrl;
  }

  private static readonly EXERCISE_MAP: Record<string, string> = {
    'Barbell Bench Press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg',
    'Incline Dumbbell Press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/0.jpg',
    'Dumbbell Fly': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Flyes/0.jpg',
    'Push Up': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg',
    'Decline Barbell Bench Press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Barbell_Bench_Press/0.jpg',
    'Cable Crossover': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flat_Bench_Cable_Flyes/0.jpg',
    'Chest Dips': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Chest_Version/0.jpg',
    'Pec Deck Machine Fly': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Butterfly/0.jpg',
    'Incline Cable Fly': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Cable_Flye/0.jpg',
    'Dumbbell Pullover': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Straight-Arm_Dumbbell_Pullover/0.jpg',
    'Close-Grip Push-Up': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Close-Grip_Push-Up_off_of_a_Dumbbell/0.jpg',
    'Floor Press with Dumbbells': 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=700&auto=format&fit=crop&q=80',

    'Lat Pulldown': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg',
    'Barbell Bent-Over Row': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/0.jpg',
    'Seated Cable Row': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/0.jpg',
    'Conventional Deadlift': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg',
    'Pull-Up': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/0.jpg',
    'Chin-Up': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chin-Up/0.jpg',
    'Single-Arm Dumbbell Row': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Dumbbell_Row/0.jpg',
    'T-Bar Row': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/T-Bar_Row_with_Handle/0.jpg',
    'Face Pull': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull/0.jpg',
    'Straight-Arm Cable Pulldown': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rope_Straight-Arm_Pulldown/0.jpg',
    'Hyperextensions (Back Extension)': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hyperextensions_Back_Extensions/0.jpg',
    'Inverted Row': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Inverted_Row/0.jpg',

    'Overhead Barbell Military Press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Military_Press/0.jpg',
    'Dumbbell Lateral Raise': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/0.jpg',
    'Seated Dumbbell Shoulder Press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Dumbbell_Press/0.jpg',
    'Arnold Press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Arnold_Dumbbell_Press/0.jpg',
    'Cable Lateral Raise': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Internal_Rotation/0.jpg',
    'Front Plate Raise': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Plate_Raise/0.jpg',
    'Rear Delt Dumbbell Fly': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Bent-Over_Rear_Delt_Raise/0.jpg',
    'Barbell Upright Row': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Upright_Barbell_Row/0.jpg',
    'Push Press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Push_Press/0.jpg',
    'Handstand Push-Up': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Handstand_Push-Ups/0.jpg',
    'Dumbbell Shrugs': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shrug/0.jpg',
    'Landmine Shoulder Press': 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=700&auto=format&fit=crop&q=80',

    'Barbell Bicep Curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/0.jpg',
    'Incline Dumbbell Curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Curl/0.jpg',
    'Hammer Curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/0.jpg',
    'Preacher Curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Preacher_Curl/0.jpg',
    'Concentration Curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Concentration_Curls/0.jpg',
    'Cable Rope Hammer Curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Hammer_Curls_-_Rope_Attachment/0.jpg',
    'Spider Curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Spider_Curl/0.jpg',
    'EZ-Bar 21s Curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/EZ-Bar_Curl/0.jpg',
    'Reverse Grip Barbell Curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Reverse_Barbell_Curl/0.jpg',
    'Zottman Curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Zottman_Curl/0.jpg',
    'High Cable Bicep Curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Overhead_Cable_Curl/0.jpg',

    'Triceps Rope Pushdown': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown_-_Rope_Attachment/0.jpg',
    'Skull Crusher (Lying Triceps Extension)': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Triceps_Press/0.jpg',
    'Overhead Dumbbell Triceps Extension': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Dumbbell_Triceps_Extension/0.jpg',
    'Close-Grip Barbell Bench Press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Close-Grip_Barbell_Bench_Press/0.jpg',
    'Parallel Bar Triceps Dips': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Parallel_Bar_Dip/0.jpg',
    'Diamond Push-Up': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Push-Ups_-_Close_Triceps_Position/0.jpg',
    'Cable Overhead Triceps Extension': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Rope_Overhead_Triceps_Extension/0.jpg',
    'Single-Arm Reverse Grip Cable Pushdown': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Reverse_Grip_Triceps_Pushdown/0.jpg',
    'Dumbbell Triceps Kickback': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tricep_Dumbbell_Kickback/0.jpg',
    'Bench Dips': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bench_Dips/0.jpg',
    'Tate Press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Tate_Press/0.jpg',

    'Barbell Back Squat': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Full_Squat/0.jpg',
    'Barbell Front Squat': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Squat_Clean_Grip/0.jpg',
    'Romanian Deadlift (RDL)': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg',
    'Bulgarian Split Squat': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squat_with_Dumbbells/0.jpg',
    'Leg Press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press/0.jpg',
    'Walking Dumbbell Lunges': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lunges/0.jpg',
    'Hack Squat': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hack_Squat/0.jpg',
    'Leg Extension': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/0.jpg',
    'Lying Leg Curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/0.jpg',
    'Seated Leg Curl': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Leg_Curl/0.jpg',
    'Goblet Squat': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Goblet_Squat/0.jpg',
    'Standing Calf Raise': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/0.jpg',
    'Seated Calf Raise': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Calf_Raise/0.jpg',
    'Sissy Squat': 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=700&auto=format&fit=crop&q=80',

    'Barbell Hip Thrust': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Glute_Bridge/0.jpg',
    'Cable Glute Kickback': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Glute_Kickback/0.jpg',
    'Dumbbell Romanian Deadlift (Glute Bias)': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Stiff-Legged_Dumbbell_Deadlift/0.jpg',
    'Bulgarian Split Squat (Glute Bias)': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Split_Squats/0.jpg',
    'Bodyweight Glute Bridge': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Butt_Lift_Bridge/0.jpg',
    'Curtsy Lunge': 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=700&auto=format&fit=crop&q=80',
    'High Step-Up with Knee Drive': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Step_Ups/0.jpg',
    'Kettlebell Swing': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Kettlebell_Swings/0.jpg',
    'Single-Leg Hip Thrust': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&auto=format&fit=crop&q=80',
    'Frog Pumps': 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=700&auto=format&fit=crop&q=80',
    'Banded Clamshells': 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700&auto=format&fit=crop&q=80',

    'Plank': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg',
    'Hanging Leg Raise': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hanging_Leg_Raise/0.jpg',
    'Cable Woodchoppers': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Cable_Wood_Chop/0.jpg',
    'Ab Wheel Rollout': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Ab_Roller/0.jpg',
    'Russian Twists': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Russian_Twist/0.jpg',
    'Bicycle Crunches': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cross-Body_Crunch/0.jpg',
    "Captain's Chair Knee Raise": 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Knee_Hip_Raise_On_Parallel_Bars/0.jpg',
    'Side Plank': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Bridge/0.jpg',
    'Dragon Flag': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=700&auto=format&fit=crop&q=80',
    'V-Ups': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Jackknife_Sit-Up/0.jpg',
    'Dead Bug': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dead_Bug/0.jpg',
    'Bird Dog': 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=700&auto=format&fit=crop&q=80',
    'Lying Leg Raise': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Flat_Bench_Lying_Leg_Raise/0.jpg',

    'Jump Rope': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rope_Jumping/0.jpg',
    'Treadmill HIIT Sprints': 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=700&auto=format&fit=crop&q=80',
    'Rowing Machine 500m Sprint': 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=700&auto=format&fit=crop&q=80',
    'Assault Air Bike Intervals': 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=700&auto=format&fit=crop&q=80',
    'Burpees': 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=700&auto=format&fit=crop&q=80',
    'Battle Ropes Wave': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Battling_Ropes/0.jpg',
    'Plyometric Box Jumps': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Box_Jump_Multiple_Response/0.jpg',
    'Stairmaster Climb Intervals': 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=700&auto=format&fit=crop&q=80',
    'High Knee Running in Place': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&auto=format&fit=crop&q=80',
    'Kettlebell Clean and Press': 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Clean_and_Press/0.jpg',

    'Downward-Facing Dog (Adho Mukha Svanasana)': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=700&auto=format&fit=crop&q=80',
    'Warrior I (Virabhadrasana I)': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=700&auto=format&fit=crop&q=80',
    'Warrior II (Virabhadrasana II)': 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=700&auto=format&fit=crop&q=80',
    'Warrior III (Virabhadrasana III)': 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=700&auto=format&fit=crop&q=80',
    'Cobra Pose (Bhujangasana)': 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=700&auto=format&fit=crop&q=80',
    "Child's Pose (Balasana)": 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Childs_Pose/0.jpg',
    'Triangle Pose (Trikonasana)': 'https://images.unsplash.com/photo-1580261450046-d0a30080dc9b?w=700&auto=format&fit=crop&q=80',
    'Tree Pose (Vrikshasana)': 'https://images.unsplash.com/photo-1434725039720-aaad6dd32dfe?w=700&auto=format&fit=crop&q=80',
    'Bridge Pose (Setu Bandha Sarvangasana)': 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=700&auto=format&fit=crop&q=80',
    'Crow Pose (Bakasana)': 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=700&auto=format&fit=crop&q=80',
    'Upward-Facing Dog (Urdhva Mukha Svanasana)': 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=700&auto=format&fit=crop&q=80',
    'Pigeon Pose (Eka Pada Rajakapotasana)': 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=700&auto=format&fit=crop&q=80'
  };

  /**
   * Resolves exercise image URL specifically tailored to the exercise name and movement pattern.
   */
  resolveExerciseImageByName(name: string, muscleGroup?: string, size: 'thumb' | 'full' = 'thumb'): string {
    const trimmed = (name || '').trim();
    if (ImageService.EXERCISE_MAP[trimmed]) {
      const url = ImageService.EXERCISE_MAP[trimmed];
      if (url.includes('unsplash')) {
        const w = size === 'thumb' ? 450 : 800;
        return url.replace(/w=\d+/, `w=${w}`);
      }
      return url;
    }

    const n = trimmed.toLowerCase();
    for (const [key, url] of Object.entries(ImageService.EXERCISE_MAP)) {
      if (key.toLowerCase() === n) {
        if (url.includes('unsplash')) {
          const w = size === 'thumb' ? 450 : 800;
          return url.replace(/w=\d+/, `w=${w}`);
        }
        return url;
      }
    }

    const m = (muscleGroup || '').toLowerCase().trim();
    const w = size === 'thumb' ? 450 : 800;
    const params = `?w=${w}&auto=format&fit=crop&q=80`;

    // 1. CHEST
    if (n.includes('incline') && (n.includes('press') || n.includes('dumbbell'))) return `https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e${params}`;
    if (n.includes('decline') && n.includes('bench')) return `https://images.unsplash.com/photo-1590487988256-9ed24133863e${params}`;
    if (n.includes('cable crossover') || n.includes('cable fly') || n.includes('incline cable')) return `https://images.unsplash.com/photo-1574680096145-d05b474e2155${params}`;
    if (n.includes('fly') || n.includes('pec deck')) return `https://images.unsplash.com/photo-1534438327276-14e5300c3a48${params}`;
    if (n.includes('push up') || n.includes('push-up')) return `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b${params}`;
    if (n.includes('dip') && (m.includes('chest') || n.includes('chest'))) return `https://images.unsplash.com/photo-1598971639058-fab3c3109a00${params}`;
    if (n.includes('pullover')) return `https://images.unsplash.com/photo-1584824486509-112e4181ff6b${params}`;
    if (n.includes('floor press')) return `https://images.unsplash.com/photo-1526506118085-60ce8714f8c5${params}`;
    if (n.includes('bench press') || m === 'chest') return `https://images.unsplash.com/photo-1517838277536-f5f99be501cd${params}`;

    // 2. BACK
    if (n.includes('deadlift') && !n.includes('romanian')) return `https://images.unsplash.com/photo-1584466977773-e625c37cdd50${params}`;
    if (n.includes('lat pulldown') || n.includes('pulldown')) return `https://images.unsplash.com/photo-1534367507873-d2d7e24c797f${params}`;
    if (n.includes('pull-up') || n.includes('pull up') || n.includes('chin-up')) return `https://images.unsplash.com/photo-1598971639058-fab3c3109a00${params}`;
    if (n.includes('seated cable row') || (n.includes('cable') && n.includes('row'))) return `https://images.unsplash.com/photo-1540497077202-7c8a3999166f${params}`;
    if (n.includes('single-arm') && n.includes('row')) return `https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e${params}`;
    if (n.includes('bent-over row') || n.includes('barbell row')) return `https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a${params}`;
    if (n.includes('face pull')) return `https://images.unsplash.com/photo-1574680096145-d05b474e2155${params}`;
    if (n.includes('hyperextension') || n.includes('back extension')) return `https://images.unsplash.com/photo-1517836357463-d25dfeac3438${params}`;
    if (n.includes('t-bar') || n.includes('inverted row') || m === 'back') return `https://images.unsplash.com/photo-1526506118085-60ce8714f8c5${params}`;

    // 3. SHOULDERS
    if (n.includes('lateral raise') || n.includes('side raise')) return `https://images.unsplash.com/photo-1534438327276-14e5300c3a48${params}`;
    if (n.includes('arnold press')) return `https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e${params}`;
    if (n.includes('front raise')) return `https://images.unsplash.com/photo-1584824486509-112e4181ff6b${params}`;
    if (n.includes('rear delt')) return `https://images.unsplash.com/photo-1574680096145-d05b474e2155${params}`;
    if (n.includes('upright row')) return `https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a${params}`;
    if (n.includes('handstand')) return `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b${params}`;
    if (n.includes('military press') || n.includes('shoulder press') || n.includes('overhead') || m === 'shoulders') return `https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5${params}`;

    // 4. BICEPS
    if (n.includes('hammer curl')) return `https://images.unsplash.com/photo-1583454155184-870a1f63aebc${params}`;
    if (n.includes('preacher curl') || n.includes('spider curl')) return `https://images.unsplash.com/photo-1584824486509-112e4181ff6b${params}`;
    if (n.includes('concentration curl') || n.includes('incline dumbbell curl')) return `https://images.unsplash.com/photo-1581009137042-c552e485697a${params}`;
    if (n.includes('barbell curl') || n.includes('barbell bicep')) return `https://images.unsplash.com/photo-1583454110551-21f2fa2afe61${params}`;
    if (n.includes('dumbbell bicep curl') || n.includes('bicep curl') || n.includes('curl') || m === 'biceps') return `https://images.unsplash.com/photo-1581009137042-c552e485697a${params}`;

    // 5. TRICEPS
    if (n.includes('rope pushdown') || n.includes('tricep pushdown') || n.includes('pushdown')) return `https://images.unsplash.com/photo-1534367507873-d2d7e24c797f${params}`;
    if (n.includes('skull crusher') || n.includes('lying tricep')) return `https://images.unsplash.com/photo-1590487988256-9ed24133863e${params}`;
    if (n.includes('overhead tricep') || n.includes('extension')) return `https://images.unsplash.com/photo-1584824486509-112e4181ff6b${params}`;
    if (n.includes('dip')) return `https://images.unsplash.com/photo-1598971639058-fab3c3109a00${params}`;
    if (n.includes('close-grip bench')) return `https://images.unsplash.com/photo-1517838277536-f5f99be501cd${params}`;
    if (n.includes('diamond push-up') || m === 'triceps') return `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b${params}`;

    // 6. LEGS
    if (n.includes('front squat')) return `https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2${params}`;
    if (n.includes('romanian deadlift') || n.includes('rdl')) return `https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2${params}`;
    if (n.includes('split squat') || n.includes('lunge')) return `https://images.unsplash.com/photo-1576678927484-cc907957088c${params}`;
    if (n.includes('leg press') || n.includes('hack squat') || n.includes('leg extension')) return `https://images.unsplash.com/photo-1540497077202-7c8a3999166f${params}`;
    if (n.includes('leg curl') || n.includes('hamstring')) return `https://images.unsplash.com/photo-1517963879433-6ad2b056d712${params}`;
    if (n.includes('calf raise')) return `https://images.unsplash.com/photo-1576678927484-cc907957088c${params}`;
    if (n.includes('goblet squat')) return `https://images.unsplash.com/photo-1579758629938-03607ccdbaba${params}`;
    if (n.includes('squat') || m === 'legs') return `https://images.unsplash.com/photo-1517836357463-d25dfeac3438${params}`;

    // 7. GLUTES
    if (n.includes('hip thrust') || n.includes('glute bridge') || n.includes('clamshell')) return `https://images.unsplash.com/photo-1518611012118-696072aa579a${params}`;
    if (n.includes('kickback') || n.includes('donkey kick')) return `https://images.unsplash.com/photo-1517963879433-6ad2b056d712${params}`;
    if (m === 'glutes') return `https://images.unsplash.com/photo-1518611012118-696072aa579a${params}`;

    // 8. CORE
    if (n.includes('plank')) return `https://images.unsplash.com/photo-1599058917212-d750089bc07e${params}`;
    if (n.includes('hanging leg') || n.includes('hanging knee') || n.includes('leg raise')) return `https://images.unsplash.com/photo-1598971639058-fab3c3109a00${params}`;
    if (n.includes('woodchopper') || n.includes('pallof')) return `https://images.unsplash.com/photo-1574680096145-d05b474e2155${params}`;
    if (n.includes('rollout') || n.includes('dragon flag')) return `https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b${params}`;
    if (n.includes('russian twist')) return `https://images.unsplash.com/photo-1549060279-7e168fcee0c2${params}`;
    if (n.includes('crunch') || n.includes('v-up') || n.includes('dead bug') || m === 'core') return `https://images.unsplash.com/photo-1594737625785-a6cbdabd333c${params}`;

    // 9. CARDIO
    if (n.includes('jump rope') || n.includes('skipping')) return `https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc${params}`;
    if (n.includes('treadmill') || n.includes('running') || n.includes('sprint')) return `https://images.unsplash.com/photo-1552674605-db6ffd4facb5${params}`;
    if (n.includes('rowing') || n.includes('rower')) return `https://images.unsplash.com/photo-1534258936925-c58bed479fcb${params}`;
    if (n.includes('bike') || n.includes('cycle')) return `https://images.unsplash.com/photo-1538805060514-97d9cc17730c${params}`;
    if (n.includes('battle rope')) return `https://images.unsplash.com/photo-1518459031867-a89b944bffe4${params}`;
    if (n.includes('kettlebell')) return `https://images.unsplash.com/photo-1605296867304-46d5465a13f1${params}`;
    if (n.includes('boxing')) return `https://images.unsplash.com/photo-1518609878373-06d740f60d8b${params}`;
    if (n.includes('burpee') || n.includes('box jump') || m === 'cardio') return `https://images.unsplash.com/photo-1599447421416-3414500d18a5${params}`;

    // 10. YOGA
    if (n.includes('downward') || n.includes('upward') || n.includes('dog')) return `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b${params}`;
    if (n.includes('warrior')) return `https://images.unsplash.com/photo-1506126613408-eca07ce68773${params}`;
    if (n.includes('cobra') || n.includes('bridge')) return `https://images.unsplash.com/photo-1550345332-09e3ac987658${params}`;
    if (n.includes('child') || n.includes('pigeon')) return `https://images.unsplash.com/photo-1580261450046-d0a30080dc9b${params}`;
    if (n.includes('tree') || n.includes('balance')) return `https://images.unsplash.com/photo-1518310383802-640c2de311b2${params}`;
    if (n.includes('crow') || n.includes('triangle') || m === 'yoga') return `https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b${params}`;

    return `https://images.unsplash.com/photo-1517838277536-f5f99be501cd${params}`;
  }

  /**
   * Resolves image URL for an exercise (thumbnail or full).
   * Prioritizes the exercise object's own unique image URL from database.
   */
  getExerciseImage(
    ex?: any,
    size: 'thumb' | 'full' = 'thumb'
  ): string {
    if (!ex) return this.getFallback('exercise', 'Exercise');

    // 1. Prioritize exercise object's own unique image URL from DB
    if (size === 'thumb') {
      if (ex.thumbnailUrl && ex.thumbnailUrl.trim().length > 0) return ex.thumbnailUrl.trim();
      if (ex.imageUrl && ex.imageUrl.trim().length > 0) return ex.imageUrl.trim();
      if (ex.image && ex.image.trim().length > 0) return ex.image.trim();
    } else {
      if (ex.imageUrl && ex.imageUrl.trim().length > 0) return ex.imageUrl.trim();
      if (ex.thumbnailUrl && ex.thumbnailUrl.trim().length > 0) return ex.thumbnailUrl.trim();
      if (ex.image && ex.image.trim().length > 0) return ex.image.trim();
    }

    // 2. Resolve via tailored name lookup
    const name = (ex.name || ex.exerciseName || '').trim();
    if (name) {
      return this.resolveExerciseImageByName(name, ex.muscleGroup, size);
    }

    return this.getFallback('exercise', ex.muscleGroup || 'Exercise');
  }

  /**
   * Resolves meaningful accessibility alt text for an exercise.
   */
  getExerciseAlt(ex?: any): string {
    if (!ex) return 'Exercise demonstration';
    if (ex.altText && ex.altText.trim().length > 0) return ex.altText.trim();
    const name = (ex.name || ex.exerciseName || 'Exercise').trim();
    const muscle = ex.muscleGroup ? ` targeting ${ex.muscleGroup.toLowerCase()}` : '';
    return `${name} exercise demonstration${muscle}`;
  }

  /**
   * Generates a sleek, high-contrast SVG fallback data URI.
   */
  getFallback(type: 'exercise' | 'workout', label = 'Fitness'): string {
    const encodedLabel = encodeURIComponent(label || (type === 'workout' ? 'Workout' : 'Exercise'));
    const color = type === 'workout' ? '%236366f1' : '%2306b6d4';
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%230f172a"/><circle cx="300" cy="180" r="50" fill="${color}" opacity="0.15"/><path d="M285 180 L315 180 M300 165 L300 195" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/><text x="50%" y="270" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23cbd5e1" text-anchor="middle">${encodedLabel}</text><text x="50%" y="295" font-family="sans-serif" font-size="13" fill="%2364748b" text-anchor="middle">FitPlatform Demonstration</text></svg>`;
  }

  /**
   * Error event handler to gracefully switch to SVG fallback without broken image icon.
   */
  onImageError(event: Event, type: 'exercise' | 'workout' = 'exercise', label = 'Fitness'): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.getFallback(type, label);
    }
  }
}
