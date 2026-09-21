export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: {
      user: number;
      trainer: number;
      admin: number;
    };
  };
  content: {
    exercises: number;
    workoutPlans: number;
    completedWorkouts: number;
  };
  billing: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    planBreakdown: {
      free: number;
      pro: number;
      elite: number;
    };
  };
  recentUsers: AdminUser[];
  recentPayments: AdminPayment[];
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'USER' | 'TRAINER' | 'ADMIN';
  isActive: boolean;
  profileImage?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  fitnessGoal?: string;
  activityLevel?: string;
  createdAt: string;
}

export interface AdminTrainer {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  isActive: boolean;
  trainerProfile?: {
    specialties?: string[];
    certifications?: string[];
    yearsOfExperience?: number;
    bio?: string;
    isAcceptingClients?: boolean;
  };
  activeClientsCount: number;
  totalClientsCount: number;
  plansCreatedCount: number;
  createdAt: string;
}

export interface AdminSubscription {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    profileImage?: string;
  };
  plan: 'Free' | 'Pro' | 'Elite';
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  billingCycle: 'monthly' | 'yearly';
  price: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
}

export interface AdminPayment {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role?: string;
  };
  subscription?: any;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId: string;
  paidAt: string;
}

export interface AdminReports {
  userTrends: { month: string; count: number }[];
  revenueTrends: { month: string; revenue: number; count: number }[];
  subscriptionBreakdown: { plan: string; count: number }[];
  exerciseDistribution: { muscleGroup: string; count: number }[];
}
