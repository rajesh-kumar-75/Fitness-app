export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Legs'
  | 'Glutes'
  | 'Core'
  | 'Cardio'
  | 'Yoga';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Exercise {
  _id: string;
  name: string;
  description: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  difficulty: Difficulty;
  instructions: string[];
  image?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  altText?: string;
  video?: string;
  videoUrl?: string;
  motionUrl?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExerciseFilters {
  search?: string;
  muscleGroup?: string;
  difficulty?: string;
  equipment?: string;
}

export interface ExerciseListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    exercises: Exercise[];
    total: number;
    count: number;
    filters: ExerciseFilters;
  };
}

export interface ExerciseDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    exercise: Exercise;
  };
}

export interface CreateExercisePayload {
  name: string;
  description: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  difficulty: Difficulty;
  instructions: string[] | string;
  image?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  altText?: string;
  video?: string;
  videoUrl?: string;
  motionUrl?: string;
}
