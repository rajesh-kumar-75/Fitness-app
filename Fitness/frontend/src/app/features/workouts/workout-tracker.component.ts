import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { WorkoutService } from '../../core/services/workout.service';
import { ImageService } from '../../core/services/image.service';
import { WorkoutLog, WorkoutLogExercise, WorkoutLogSet } from '../../core/models/workout.model';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-workout-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './workout-tracker.component.html',
  styleUrl: './workout-tracker.component.scss',
})
export class WorkoutTrackerComponent implements OnInit, OnDestroy {
  private readonly workoutService = inject(WorkoutService);
  readonly imageService = inject(ImageService);
  private readonly router = inject(Router);

  readonly session = signal<WorkoutLog | null>(null);
  readonly currentExIndex = signal<number>(0);
  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);
  readonly isCompleting = signal<boolean>(false);
  readonly isCelebration = signal<boolean>(false);
  readonly completedStats = signal<{ duration: number; exercisesCount: number; setsCount: number } | null>(null);

  readonly notesControl = new FormControl<string>('');

  // Rest Timer State
  readonly restTimerSeconds = signal<number>(0);
  readonly initialRestDuration = signal<number>(60);
  readonly isTimerRunning = signal<boolean>(false);
  private timerSub?: Subscription;

  // Computed
  readonly planTitle = computed<string>(() => {
    const s = this.session();
    if (!s || !s.workoutPlan) return 'Workout Session';
    if (typeof s.workoutPlan === 'object' && s.workoutPlan.title) {
      return s.workoutPlan.title;
    }
    return 'Workout Session';
  });

  readonly currentExercise = computed<WorkoutLogExercise | null>(() => {
    const s = this.session();
    if (!s || !s.exercises || s.exercises.length === 0) return null;
    return s.exercises[this.currentExIndex()] || null;
  });

  readonly totalCompletedSets = computed<number>(() => {
    const s = this.session();
    if (!s || !s.exercises) return 0;
    return s.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((st) => st.isCompleted).length,
      0
    );
  });

  readonly totalSets = computed<number>(() => {
    const s = this.session();
    if (!s || !s.exercises) return 0;
    return s.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  });

  ngOnInit(): void {
    this.loadActiveSession();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  loadActiveSession(): void {
    this.isLoading.set(true);
    this.workoutService.getActiveSession().subscribe({
      next: (res) => {
        if (!res.data.session) {
          // No active workout found; navigate back to dashboard
          this.router.navigate(['/workouts']);
          return;
        }
        this.session.set(res.data.session);
        this.notesControl.setValue(res.data.session.notes || '');
        this.isLoading.set(false);
      },
      error: () => {
        this.router.navigate(['/workouts']);
      },
    });
  }

  toggleSet(set: WorkoutLogSet): void {
    set.isCompleted = !set.isCompleted;

    // If set was just completed, trigger rest timer
    if (set.isCompleted) {
      this.startRestTimer(60);
    }

    this.saveProgress();
  }

  updateReps(set: WorkoutLogSet, delta: number): void {
    set.completedReps = Math.max(1, (set.completedReps || 0) + delta);
    this.saveProgress();
  }

  updateWeight(set: WorkoutLogSet, delta: number): void {
    set.actualWeight = Math.max(0, (set.actualWeight || 0) + delta);
    this.saveProgress();
  }

  selectExercise(index: number): void {
    this.currentExIndex.set(index);
  }

  nextExercise(): void {
    const s = this.session();
    if (!s) return;
    if (this.currentExIndex() < s.exercises.length - 1) {
      this.currentExIndex.update((i) => i + 1);
    }
  }

  prevExercise(): void {
    if (this.currentExIndex() > 0) {
      this.currentExIndex.update((i) => i - 1);
    }
  }

  completeCurrentExercise(): void {
    const ex = this.currentExercise();
    const s = this.session();
    if (!ex || !s) return;

    // Mark all sets of current exercise as completed
    ex.sets.forEach((set) => {
      set.isCompleted = true;
    });
    this.saveProgress();

    // Advance to next exercise if available
    if (this.currentExIndex() < s.exercises.length - 1) {
      this.nextExercise();
      this.startRestTimer(60);
    }
  }

  // --- Rest Timer ---

  startRestTimer(seconds: number): void {
    this.stopTimer();
    this.initialRestDuration.set(seconds);
    this.restTimerSeconds.set(seconds);
    this.isTimerRunning.set(true);

    this.timerSub = interval(1000).subscribe(() => {
      const current = this.restTimerSeconds();
      if (current <= 1) {
        this.stopTimer();
        this.restTimerSeconds.set(0);
      } else {
        this.restTimerSeconds.set(current - 1);
      }
    });
  }

  addTimerSeconds(sec: number): void {
    this.restTimerSeconds.update((s) => s + sec);
  }

  stopTimer(): void {
    if (this.timerSub) {
      this.timerSub.unsubscribe();
      this.timerSub = undefined;
    }
    this.isTimerRunning.set(false);
  }

  skipTimer(): void {
    this.stopTimer();
    this.restTimerSeconds.set(0);
  }

  // --- Persistence & Completion ---

  saveProgress(): void {
    const s = this.session();
    if (!s) return;

    this.isSaving.set(true);
    this.workoutService
      .updateProgress(s._id, s.exercises, this.notesControl.value || '')
      .subscribe({
        next: (res) => {
          this.session.set(res.data.session);
          this.isSaving.set(false);
        },
        error: () => {
          this.isSaving.set(false);
        },
      });
  }

  finishWorkout(): void {
    const s = this.session();
    if (!s) return;

    if (!confirm('Ready to finish and log this workout?')) return;

    this.isCompleting.set(true);
    this.workoutService
      .completeWorkout(s._id, s.exercises, this.notesControl.value || '')
      .subscribe({
        next: (res) => {
          this.isCompleting.set(false);
          this.stopTimer();
          this.completedStats.set({
            duration: res.data.session.durationMinutes,
            exercisesCount: s.exercises.length,
            setsCount: this.totalCompletedSets(),
          });
          this.isCelebration.set(true);
        },
        error: () => {
          this.isCompleting.set(false);
        },
      });
  }

  abandonWorkout(): void {
    const s = this.session();
    if (!s) return;

    if (!confirm('Are you sure you want to cancel this workout? Current progress will not be logged.')) {
      return;
    }

    this.workoutService.cancelWorkout(s._id).subscribe({
      next: () => {
        this.stopTimer();
        this.router.navigate(['/workouts']);
      },
    });
  }
}
