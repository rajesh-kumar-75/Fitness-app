import { Difficulty } from './exercise.model';
import { FitnessGoal } from './user-profile.model';

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface WorkoutExercise {
  _id?: string;
  exercise: string | { _id: string; name: string; image?: string; imageUrl?: string; thumbnailUrl?: string; altText?: string; video?: string };
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  targetWeight: number; // in kg
  restTimeSeconds: number; // in seconds
  notes?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  altText?: string;
}

export interface WorkoutDay {
  _id?: string;
  dayOfWeek: DayOfWeek;
  dayName: string;
  isRestDay: boolean;
  estimatedDurationMinutes: number;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  _id: string;
  title: string;
  name?: string;
  description?: string;
  coverImageUrl?: string;
  coverThumbnailUrl?: string;
  difficulty: Difficulty;
  goal: FitnessGoal;
  durationWeeks: number;
  daysPerWeek: number;
  schedule: WorkoutDay[];
  createdBy?: { _id: string; name: string; role: string } | string;
  assignedTo?: { _id: string; name: string; email: string } | string;
  isTemplate: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutLogSet {
  _id?: string;
  setNumber: number;
  targetReps: number;
  completedReps: number;
  targetWeight: number;
  actualWeight: number;
  isCompleted: boolean;
}

export interface WorkoutLogExercise {
  _id?: string;
  exerciseId: string;
  name: string;
  muscleGroup: string;
  sets: WorkoutLogSet[];
  isCompleted: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  altText?: string;
}

export interface WorkoutLog {
  _id: string;
  user: string;
  workoutPlan?: { _id: string; title: string; goal: string; difficulty: string } | string;
  dayOfWeek: string;
  dayName: string;
  startedAt: string;
  completedAt?: string;
  durationMinutes: number;
  status: 'in-progress' | 'completed' | 'abandoned';
  exercises: WorkoutLogExercise[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutHistoryStats {
  totalWorkouts: number;
  totalMinutes: number;
  recentCount: number;
}

export interface WorkoutPlansResponse {
  success: boolean;
  data: {
    plans: WorkoutPlan[];
    total: number;
  };
}

export interface ActivePlanResponse {
  success: boolean;
  data: {
    plan: WorkoutPlan | null;
  };
}

export interface WorkoutLogResponse {
  success: boolean;
  message: string;
  data: {
    session: WorkoutLog;
    resumed?: boolean;
    hasActiveSession?: boolean;
  };
}

export interface WorkoutHistoryResponse {
  success: boolean;
  data: {
    history: WorkoutLog[];
    stats: WorkoutHistoryStats;
  };
}
