import { UserRole } from './auth.model';

export type FitnessGoal =
  | 'Muscle Gain'
  | 'Weight Loss'
  | 'Strength'
  | 'Endurance'
  | 'General Fitness';

export type ActivityLevel =
  | 'Sedentary'
  | 'Lightly Active'
  | 'Moderately Active'
  | 'Very Active'
  | 'Extremely Active';

export type Gender = 'Male' | 'Female' | 'Non-Binary' | 'Other' | 'Prefer not to say';

export interface ProfileMetrics {
  bmi: number | null;
  bmiCategory: string | null;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  profileImage?: string;
  age?: number | null;
  gender?: Gender;
  height?: number | null; // in cm
  weight?: number | null; // in kg
  fitnessGoal?: FitnessGoal;
  activityLevel?: ActivityLevel;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileData {
  user: UserProfile;
  metrics: ProfileMetrics;
}

export interface ProfileResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ProfileData;
}

export interface UpdateProfilePayload {
  name?: string;
  profileImage?: string;
  age?: number | null;
  gender?: Gender;
  height?: number | null;
  weight?: number | null;
  fitnessGoal?: FitnessGoal;
  activityLevel?: ActivityLevel;
}
