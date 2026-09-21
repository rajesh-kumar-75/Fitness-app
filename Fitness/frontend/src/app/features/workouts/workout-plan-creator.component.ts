import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { WorkoutService } from '../../core/services/workout.service';
import { ExerciseService } from '../../core/services/exercise.service';
import { Exercise } from '../../core/models/exercise.model';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

@Component({
  selector: 'app-workout-plan-creator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './workout-plan-creator.component.html',
  styleUrl: './workout-plan-creator.component.scss',
})
export class WorkoutPlanCreatorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly workoutService = inject(WorkoutService);
  private readonly exerciseService = inject(ExerciseService);
  private readonly router = inject(Router);

  readonly availableExercises = signal<Exercise[]>([]);
  readonly selectedDayIndex = signal<number>(0);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly successMessage = signal<string>('');

  readonly goals = [
    'Muscle Gain',
    'Weight Loss',
    'Strength',
    'Endurance',
    'General Fitness',
  ];

  readonly difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  readonly daysOfWeek = DAYS_OF_WEEK;

  readonly coverOptions = [
    { label: 'Chest & Upper Push', value: '/assets/images/workouts/chest.svg' },
    { label: 'Back & Upper Pull', value: '/assets/images/workouts/back.svg' },
    { label: 'Legs & Lower Body', value: '/assets/images/workouts/legs.svg' },
    { label: 'Shoulders & Delts', value: '/assets/images/workouts/shoulders.svg' },
    { label: 'Arms & Hypertrophy', value: '/assets/images/workouts/arms.svg' },
    { label: 'Core & Conditioning', value: '/assets/images/workouts/core.svg' },
    { label: 'Full Body Circuit', value: '/assets/images/workouts/fullbody.svg' },
    { label: 'Cardio & Endurance', value: '/assets/images/workouts/cardio.svg' },
  ];

  planForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadExercises();
  }

  private initForm(): void {
    this.planForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      fitnessGoal: ['Muscle Gain', [Validators.required]],
      difficulty: ['Intermediate', [Validators.required]],
      coverImageUrl: ['/assets/images/workouts/fullbody.svg', [Validators.required]],
      coverThumbnailUrl: ['/assets/images/workouts/fullbody.svg'],
      schedule: this.fb.array(
        DAYS_OF_WEEK.map((day, idx) =>
          this.fb.group({
            dayName: [day],
            focus: [idx === 6 ? 'Active Recovery' : 'Workout Session', [Validators.required]],
            isRestDay: [idx === 6], // default Sunday to rest
            exercises: this.fb.array([]),
          })
        )
      ),
    });
  }

  get scheduleArray(): FormArray {
    return this.planForm.get('schedule') as FormArray;
  }

  getDayGroup(index: number): FormGroup {
    return this.scheduleArray.at(index) as FormGroup;
  }

  getExercisesArray(dayIndex: number): FormArray {
    return this.getDayGroup(dayIndex).get('exercises') as FormArray;
  }

  private loadExercises(): void {
    this.exerciseService.getExercises().subscribe({
      next: (res) => {
        this.availableExercises.set(res.data.exercises || []);
      },
      error: () => {
        this.errorMessage.set('Could not load exercise library. Please try again.');
      },
    });
  }

  selectDay(index: number): void {
    this.selectedDayIndex.set(index);
  }

  addExercise(dayIndex: number): void {
    const exercisesArr = this.getExercisesArray(dayIndex);
    const defaultExId = this.availableExercises().length > 0 ? this.availableExercises()[0]._id : '';

    const exGroup = this.fb.group({
      exercise: [defaultExId, Validators.required],
      sets: [3, [Validators.required, Validators.min(1), Validators.max(20)]],
      reps: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      targetWeight: [20, [Validators.required, Validators.min(0)]],
      restTimeSeconds: [60, [Validators.required, Validators.min(10), Validators.max(600)]],
      notes: [''],
    });

    exercisesArr.push(exGroup);
  }

  removeExercise(dayIndex: number, exIndex: number): void {
    this.getExercisesArray(dayIndex).removeAt(exIndex);
  }

  onRestDayToggle(dayIndex: number): void {
    const dayGroup = this.getDayGroup(dayIndex);
    const isRest = dayGroup.get('isRestDay')?.value;
    if (isRest) {
      dayGroup.patchValue({ focus: 'Rest & Recovery' });
      // clear exercises
      const exArr = this.getExercisesArray(dayIndex);
      while (exArr.length !== 0) {
        exArr.removeAt(0);
      }
    } else {
      dayGroup.patchValue({ focus: 'Training Session' });
    }
  }

  onSubmit(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      this.errorMessage.set('Please fill in all required fields properly.');
      return;
    }

    const formVal = this.planForm.value;

    // Calculate daysPerWeek based on non-rest days
    const trainingDaysCount = formVal.schedule.filter((d: any) => !d.isRestDay).length;

    if (trainingDaysCount === 0) {
      this.errorMessage.set('A workout plan must have at least one training day.');
      return;
    }

    // Verify at least one training day has exercises
    const totalEx = formVal.schedule.reduce((acc: number, d: any) => acc + (d.exercises?.length || 0), 0);
    if (totalEx === 0) {
      this.errorMessage.set('Please add at least one exercise to your training days.');
      return;
    }

    const payload = {
      title: formVal.title,
      description: formVal.description,
      fitnessGoal: formVal.fitnessGoal,
      difficulty: formVal.difficulty,
      coverImageUrl: formVal.coverImageUrl || '/assets/images/workouts/fullbody.svg',
      coverThumbnailUrl: formVal.coverThumbnailUrl || formVal.coverImageUrl || '/assets/images/workouts/fullbody.svg',
      daysPerWeek: trainingDaysCount,
      schedule: formVal.schedule,
    };

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.workoutService.createPlan(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Workout plan created successfully!');
        setTimeout(() => {
          this.router.navigate(['/workouts']);
        }, 1200);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to create workout plan. Please try again.');
      },
    });
  }
}
