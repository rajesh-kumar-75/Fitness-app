import { WorkoutPlan } from './workout.model';
import { UserProfile } from './user-profile.model';

export interface TrainerProfile {
  specialties: string[];
  certifications: string[];
  yearsOfExperience: number;
  bio: string;
  isAcceptingClients: boolean;
}

export interface TrainerPublicInfo {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  trainerProfile: TrainerProfile;
}

export interface DietMeal {
  _id?: string;
  name: string;
  time?: string;
  targetCalories: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  suggestedFoods?: string[];
  instructions?: string;
}

export interface DietPlan {
  _id: string;
  title: string;
  name?: string;
  description?: string;
  trainer: string | { _id: string; name: string; email: string; profileImage?: string };
  client: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  meals: DietMeal[];
  guidelines?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainerClient {
  _id: string;
  trainer: string;
  client: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    fitnessGoal?: string;
    activityLevel?: string;
    createdAt?: string;
    profile?: any;
  };
  status: 'pending' | 'active' | 'rejected' | 'terminated';
  requestMessage?: string;
  notes?: string;
  assignedWorkoutPlan?: WorkoutPlan;
  assignedDietPlan?: DietPlan;
  connectedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDietPlanPayload {
  title: string;
  description?: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  meals: DietMeal[];
  guidelines?: string[];
}
