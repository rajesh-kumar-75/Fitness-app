export interface Measurement {
  _id: string;
  user: string;
  date: string;
  weight: number;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  bodyFatPercentage?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WeightProgressPoint {
  date: string;
  weight: number;
}

export interface WeightProgressStats {
  currentWeight: number;
  startWeight: number;
  highestWeight: number;
  lowestWeight: number;
  netChange: number;
}

export interface WeightProgressResponse {
  success: boolean;
  message: string;
  data: {
    points: WeightProgressPoint[];
    stats: WeightProgressStats;
  };
}

export interface StrengthProgressPoint {
  date: string;
  maxWeight: number;
  volume: number;
  setsCount: number;
}

export interface StrengthProgressStats {
  personalRecord: number;
  totalSessions: number;
  totalVolume: number;
}

export interface StrengthProgressResponse {
  success: boolean;
  message: string;
  data: {
    availableExercises: string[];
    selectedExercise: string | null;
    points: StrengthProgressPoint[];
    stats: StrengthProgressStats;
  };
}

export interface ProgressOverviewResponse {
  success: boolean;
  message: string;
  data: {
    totalWorkouts: number;
    totalMinutes: number;
    currentWeight: number;
    netWeightChange: number;
  };
}

export interface MeasurementsResponse {
  success: boolean;
  message: string;
  data: {
    measurements: Measurement[];
    count: number;
  };
}

export interface AddMeasurementPayload {
  weight: number;
  date?: string;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  bodyFatPercentage?: number;
  notes?: string;
}
