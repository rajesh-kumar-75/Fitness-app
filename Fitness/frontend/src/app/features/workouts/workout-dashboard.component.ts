import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { WorkoutService } from '../../core/services/workout.service';
import { AuthService } from '../../core/services/auth.service';
import { ImageService } from '../../core/services/image.service';
import {
  WorkoutPlan,
  WorkoutDay,
  WorkoutLog,
  WorkoutHistoryStats,
  DayOfWeek,
} from '../../core/models/workout.model';

@Component({
  selector: 'app-workout-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './workout-dashboard.component.html',
  styleUrl: './workout-dashboard.component.scss',
})
export class WorkoutDashboardComponent implements OnInit {
  private readonly workoutService = inject(WorkoutService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly imageService = inject(ImageService);

  readonly activePlan = signal<WorkoutPlan | null>(null);
  readonly history = signal<WorkoutLog[]>([]);
  readonly stats = signal<WorkoutHistoryStats | null>(null);
  readonly activeSession = signal<WorkoutLog | null>(null);
  readonly availablePlans = signal<WorkoutPlan[]>([]);
  readonly selectedPlanForDetail = signal<WorkoutPlan | null>(null);

  readonly isLoading = signal<boolean>(true);
  readonly isPlansModalOpen = signal<boolean>(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly todayDayOfWeek: DayOfWeek = this.getTodayDayOfWeek();

  readonly isTrainer = this.authService.isTrainer;
  readonly isAdmin = this.authService.isAdmin;
  readonly user = this.authService.currentUser;
  readonly activeStreak = '42 DAYS';
  readonly nextGoal = 'Bench 100kg - 85% Completed';

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // 1. Load active plan
    this.workoutService.getMyActivePlan().subscribe({
      next: (res) => {
        this.activePlan.set(res.data.plan);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Failed to load active workout plan.');
      },
    });

    // 2. Load workout history & stats
    this.workoutService.getHistory().subscribe({
      next: (res) => {
        this.history.set(res.data.history);
        this.stats.set(res.data.stats);
      },
      error: () => {},
    });

    // 3. Check for active in-progress session
    this.workoutService.getActiveSession().subscribe({
      next: (res) => {
        this.activeSession.set(res.data.session || null);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  getTodaySchedule(): WorkoutDay | null {
    const plan = this.activePlan();
    if (!plan || !plan.schedule) return null;
    return plan.schedule.find((d) => d.dayOfWeek === this.todayDayOfWeek) || null;
  }

  onStartWorkout(day: WorkoutDay): void {
    if (day.isRestDay) return;

    this.workoutService.startWorkout(day.dayOfWeek, this.activePlan()?._id).subscribe({
      next: (res) => {
        this.router.navigate(['/workouts/track']);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Failed to start workout.');
      },
    });
  }

  onResumeSession(): void {
    this.router.navigate(['/workouts/track']);
  }

  openPlansModal(): void {
    this.workoutService.getPlans().subscribe({
      next: (res) => {
        this.availablePlans.set(res.data.plans);
        this.isPlansModalOpen.set(true);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Failed to load workout plans.');
      },
    });
  }

  closePlansModal(): void {
    this.isPlansModalOpen.set(false);
  }

  openPlanDetail(plan: WorkoutPlan): void {
    this.selectedPlanForDetail.set(plan);
  }

  closePlanDetail(): void {
    this.selectedPlanForDetail.set(null);
  }

  getTotalExercises(plan: WorkoutPlan | null): number {
    if (!plan || !plan.schedule) return 0;
    return plan.schedule.reduce((acc, d) => acc + (d.exercises?.length || 0), 0);
  }

  getDayCategory(day: WorkoutDay): string {
    if (day.isRestDay) return 'Rest';
    const name = day.dayName.toLowerCase();
    if (name.includes('chest') || name.includes('push')) return 'Chest';
    if (name.includes('back') || name.includes('pull')) return 'Back';
    if (name.includes('leg') || name.includes('squat')) return 'Legs';
    if (name.includes('shoulder')) return 'Shoulders';
    if (name.includes('arm') || name.includes('bicep') || name.includes('tricep')) return 'Arms';
    if (name.includes('core') || name.includes('ab')) return 'Core';
    if (name.includes('cardio') || name.includes('hiit')) return 'Cardio';
    return 'Full Body';
  }

  onAdoptPlan(plan: WorkoutPlan): void {
    this.workoutService.adoptPlan(plan._id).subscribe({
      next: (res) => {
        this.activePlan.set(res.data.plan);
        this.closePlansModal();
        this.closePlanDetail();
        this.showSuccess(`Switched active workout plan to '${plan.title}'!`);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Failed to adopt workout plan.');
      },
    });
  }

  private getTodayDayOfWeek(): DayOfWeek {
    const days: DayOfWeek[] = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const todayIndex = new Date().getDay();
    return days[todayIndex];
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3500);
  }
}
