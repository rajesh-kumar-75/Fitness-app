import { Routes } from '@angular/router';
import { HealthCheckComponent } from './features/health-check/health-check.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProfileComponent } from './features/profile/profile.component';
import { ExerciseListComponent } from './features/exercises/exercise-list.component';
import { WorkoutDashboardComponent } from './features/workouts/workout-dashboard.component';
import { WorkoutTrackerComponent } from './features/workouts/workout-tracker.component';
import { WorkoutPlanCreatorComponent } from './features/workouts/workout-plan-creator.component';
import { WorkoutHistoryComponent } from './features/workouts/workout-history.component';
import { NutritionDashboardComponent } from './features/nutrition/nutrition-dashboard.component';
import { MealPrepChecklistComponent } from './features/nutrition/meal-prep-checklist/meal-prep-checklist.component';
import { ProgressDashboardComponent } from './features/progress/progress-dashboard.component';
import { TrainerDashboardComponent } from './features/trainer/trainer-dashboard.component';
import { TrainerClientDetailComponent } from './features/trainer/trainer-client-detail.component';
import { TrainerDirectoryComponent } from './features/trainer/trainer-directory.component';
import { ChatComponent } from './features/chat/chat.component';
import { AiCoachComponent } from './features/ai-coach/ai-coach.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { LandingComponent } from './features/landing/landing.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: LandingComponent,
    title: 'FitPlatform - Workout & Health Ecosystem',
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    title: 'FitPlatform - Dashboard',
  },
  {
    path: 'workouts',
    component: WorkoutDashboardComponent,
    canActivate: [authGuard],
    title: 'FitPlatform - Workouts & Schedule',
  },
  {
    path: 'workouts/track',
    component: WorkoutTrackerComponent,
    canActivate: [authGuard],
    title: 'FitPlatform - Active Workout Tracker',
  },
  {
    path: 'workouts/create',
    component: WorkoutPlanCreatorComponent,
    canActivate: [authGuard],
    title: 'FitPlatform - Create Workout Plan',
  },
  {
    path: 'workouts/history',
    component: WorkoutHistoryComponent,
    canActivate: [authGuard],
    title: 'FitPlatform - Workout History',
  },
  {
    path: 'nutrition',
    component: NutritionDashboardComponent,
    canActivate: [authGuard],
    title: 'FitPlatform - Nutrition & Food Tracker',
  },
  {
    path: 'nutrition/meal-prep',
    component: MealPrepChecklistComponent,
    canActivate: [authGuard],
    title: 'FitPlatform - Automated Meal Prep & Grocery Checklist',
  },
  {
    path: 'progress',
    component: ProgressDashboardComponent,
    canActivate: [authGuard],
    title: 'FitPlatform - Progress & Analytics',
  },
  {
    path: 'exercises',
    component: ExerciseListComponent,
    canActivate: [authGuard],
    title: 'FitPlatform - Exercise Library',
  },
  {
    path: 'trainers',
    component: TrainerDirectoryComponent,
    canActivate: [authGuard],
    title: 'FitPlatform - Trainer Directory',
  },
  {
    path: 'trainer',
    component: TrainerDashboardComponent,
    canActivate: [authGuard, roleGuard('TRAINER', 'ADMIN')],
    title: 'FitPlatform - Trainer Studio',
  },
  {
    path: 'trainer/clients/:clientId',
    component: TrainerClientDetailComponent,
    canActivate: [authGuard, roleGuard('TRAINER', 'ADMIN')],
    title: 'FitPlatform - Client Studio',
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [authGuard],
    title: 'FitPlatform - Coaching Chat',
  },
  {
    path: 'ai-coach',
    component: AiCoachComponent,
    canActivate: [authGuard],
    title: 'FitPlatform - AI Coach & Biomechanics Studio',
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
    title: 'FitPlatform - User Profile',
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard('ADMIN')],
    title: 'FitPlatform - Super Admin Console',
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
    title: 'FitPlatform - Sign In',
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard],
    title: 'FitPlatform - Create Account',
  },
  {
    path: 'health',
    component: HealthCheckComponent,
    title: 'FitPlatform - System Health',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
