import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TrainerService } from '../../core/services/trainer.service';
import { WorkoutService } from '../../core/services/workout.service';
import { TrainerClient, DietPlan, DietMeal } from '../../core/models/trainer.model';
import { WorkoutPlan } from '../../core/models/workout.model';
import { LineChartComponent, ChartPoint } from '../../shared/components/line-chart/line-chart.component';

@Component({
  selector: 'app-trainer-client-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, LineChartComponent],
  templateUrl: './trainer-client-detail.component.html',
  styleUrl: './trainer-client-detail.component.scss',
})
export class TrainerClientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly trainerService = inject(TrainerService);
  private readonly workoutService = inject(WorkoutService);
  private readonly fb = inject(FormBuilder);

  readonly clientId = signal<string>('');
  readonly activeTab = signal<'overview' | 'workouts' | 'nutrition' | 'progress' | 'measurements'>('overview');
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');
  readonly successMessage = signal<string>('');

  // Client and Connection
  readonly clientData = signal<any>(null);
  readonly connection = signal<TrainerClient | null>(null);

  // Available Workout Plans for assignment
  readonly availablePlans = signal<WorkoutPlan[]>([]);
  readonly selectedPlanId = signal<string>('');
  readonly isAssigningPlan = signal<boolean>(false);
  readonly isPlanModalOpen = signal<boolean>(false);

  // Workout History
  readonly workoutHistory = signal<any[]>([]);
  readonly totalWorkouts = signal<number>(0);

  // Diet Plan
  readonly dietPlan = signal<DietPlan | null>(null);
  readonly isDietModalOpen = signal<boolean>(false);
  readonly isSubmittingDiet = signal<boolean>(false);
  dietForm!: FormGroup;

  // Measurements
  readonly measurementsList = signal<any[]>([]);

  // Weight Progress
  readonly weightPoints = signal<{ date: string; weight: number }[]>([]);
  readonly currentWeight = signal<number | null>(null);
  readonly weightChange = signal<number>(0);
  readonly weightChartPoints = computed<ChartPoint[]>(() => {
    return this.weightPoints().map((p) => ({
      x: p.date,
      y: p.weight,
    }));
  });

  // Strength Progress
  readonly strengthExercises = signal<string[]>([]);
  readonly selectedStrengthExercise = signal<string>('');
  readonly strengthPoints = signal<{ date: string; maxWeight: number }[]>([]);
  readonly strengthChartPoints = computed<ChartPoint[]>(() => {
    return this.strengthPoints().map((p) => ({
      x: p.date,
      y: p.maxWeight,
    }));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('clientId');
    if (!id) {
      this.router.navigate(['/trainer']);
      return;
    }
    this.clientId.set(id);
    this.initDietForm();
    this.loadAllData();
  }

  private initDietForm(): void {
    this.dietForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      targetCalories: [2200, [Validators.required, Validators.min(500)]],
      targetProtein: [160, [Validators.required, Validators.min(0)]],
      targetCarbs: [220, [Validators.required, Validators.min(0)]],
      targetFat: [65, [Validators.required, Validators.min(0)]],
      guidelines: [
        'Stay adequately hydrated with 3-4 liters of water daily.\nPrioritize whole food lean protein with every meal.\nAvoid sugary beverages and ultra-processed snacks.',
      ],
      meals: this.fb.array([]),
    });

    // Add 3 default meals
    this.addMeal('Breakfast', '08:00 AM', 550, 'Oatmeal, whey protein, banana, almond butter');
    this.addMeal('Lunch', '01:00 PM', 750, 'Grilled chicken breast, jasmine rice, broccoli, olive oil');
    this.addMeal('Dinner', '07:30 PM', 700, 'Salmon fillet, sweet potato, asparagus');
    this.addMeal('Post-Workout Snack', '04:30 PM', 200, 'Greek yogurt, mixed berries, whey scoop');
  }

  get meals(): FormArray {
    return this.dietForm.get('meals') as FormArray;
  }

  addMeal(name = '', time = '', calories = 500, suggestedFoods = '', instructions = ''): void {
    const mealGroup = this.fb.group({
      name: [name, Validators.required],
      time: [time],
      targetCalories: [calories, [Validators.required, Validators.min(0)]],
      suggestedFoods: [suggestedFoods],
      instructions: [instructions],
    });
    this.meals.push(mealGroup);
  }

  removeMeal(index: number): void {
    this.meals.removeAt(index);
  }

  loadAllData(): void {
    this.isLoading.set(true);
    const id = this.clientId();

    // 1. Client Details
    this.trainerService.getClientDetails(id).subscribe({
      next: (res) => {
        this.clientData.set(res.data.client);
        this.connection.set(res.data.connection);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to load client details');
        this.isLoading.set(false);
      },
    });

    // 2. Workout Plans (for assignment dropdown)
    this.workoutService.getPlans().subscribe({
      next: (res) => {
        this.availablePlans.set(res.data.plans || []);
      },
    });

    // 3. Workout History
    this.trainerService.getClientWorkoutHistory(id).subscribe({
      next: (res) => {
        this.workoutHistory.set(res.data.history || []);
        this.totalWorkouts.set(res.data.totalWorkouts || 0);
      },
    });

    // 4. Diet Plan
    this.trainerService.getClientDietPlan(id).subscribe({
      next: (res) => {
        this.dietPlan.set(res.data.dietPlan || null);
      },
    });

    // 5. Measurements
    this.trainerService.getClientMeasurements(id).subscribe({
      next: (res) => {
        this.measurementsList.set(res.data.measurements || []);
      },
    });

    // 6. Weight Progress
    this.trainerService.getClientProgress(id).subscribe({
      next: (res) => {
        this.weightPoints.set(res.data.points || []);
        this.currentWeight.set(res.data.currentWeight ?? null);
        this.weightChange.set(res.data.weightChange || 0);
      },
    });

    // 7. Strength Progress
    this.loadStrengthProgress();
  }

  loadStrengthProgress(exerciseName?: string): void {
    this.trainerService.getClientStrengthProgress(this.clientId(), exerciseName).subscribe({
      next: (res) => {
        this.strengthExercises.set(res.data.exercises || []);
        this.strengthPoints.set(res.data.points || []);
        if (res.data.exerciseName) {
          this.selectedStrengthExercise.set(res.data.exerciseName);
        } else if (res.data.exercises?.length && !this.selectedStrengthExercise()) {
          this.selectedStrengthExercise.set(res.data.exercises[0]);
        }
      },
    });
  }

  onStrengthExerciseChange(exercise: string): void {
    this.selectedStrengthExercise.set(exercise);
    this.loadStrengthProgress(exercise);
  }

  // Assign Workout Plan
  openPlanModal(): void {
    this.selectedPlanId.set(this.connection()?.assignedWorkoutPlan?._id || '');
    this.isPlanModalOpen.set(true);
  }

  closePlanModal(): void {
    this.isPlanModalOpen.set(false);
  }

  submitAssignPlan(): void {
    const planId = this.selectedPlanId();
    if (!planId) return;

    this.isAssigningPlan.set(true);
    this.trainerService.assignWorkoutPlan(this.clientId(), planId).subscribe({
      next: (res) => {
        this.isAssigningPlan.set(false);
        this.closePlanModal();
        this.successMessage.set('Workout plan assigned to client successfully!');
        // Refresh connection details
        this.trainerService.getClientDetails(this.clientId()).subscribe((r) => {
          this.connection.set(r.data.connection);
        });
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.isAssigningPlan.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to assign workout plan');
        setTimeout(() => this.errorMessage.set(''), 4000);
      },
    });
  }

  // Create Custom Diet Plan
  openDietModal(): void {
    const current = this.dietPlan();
    if (current) {
      this.dietForm.patchValue({
        title: current.title,
        description: current.description || '',
        targetCalories: current.targetCalories,
        targetProtein: current.targetProtein,
        targetCarbs: current.targetCarbs,
        targetFat: current.targetFat,
        guidelines: current.guidelines?.join('\n') || '',
      });

      this.meals.clear();
      if (current.meals && current.meals.length > 0) {
        current.meals.forEach((m) => {
          this.addMeal(
            m.name,
            m.time || '',
            m.targetCalories,
            Array.isArray(m.suggestedFoods) ? m.suggestedFoods.join(', ') : '',
            m.instructions || ''
          );
        });
      }
    }
    this.isDietModalOpen.set(true);
  }

  closeDietModal(): void {
    this.isDietModalOpen.set(false);
  }

  submitDietPlan(): void {
    if (this.dietForm.invalid) {
      this.dietForm.markAllAsTouched();
      return;
    }

    this.isSubmittingDiet.set(true);
    const val = this.dietForm.value;

    const mealsPayload = (val.meals || []).map((m: any) => ({
      name: m.name,
      time: m.time || undefined,
      targetCalories: Number(m.targetCalories),
      suggestedFoods: typeof m.suggestedFoods === 'string'
        ? m.suggestedFoods.split(',').map((s: string) => s.trim()).filter(Boolean)
        : m.suggestedFoods,
      instructions: m.instructions || undefined,
    }));

    const guidelinesArray = typeof val.guidelines === 'string'
      ? val.guidelines.split('\n').map((g: string) => g.trim()).filter(Boolean)
      : val.guidelines;

    const payload = {
      title: val.title,
      description: val.description,
      targetCalories: Number(val.targetCalories),
      targetProtein: Number(val.targetProtein),
      targetCarbs: Number(val.targetCarbs),
      targetFat: Number(val.targetFat),
      meals: mealsPayload,
      guidelines: guidelinesArray,
    };

    this.trainerService.createAndAssignDietPlan(this.clientId(), payload).subscribe({
      next: (res) => {
        this.isSubmittingDiet.set(false);
        this.dietPlan.set(res.data.dietPlan);
        this.closeDietModal();
        this.successMessage.set('Custom diet plan created and assigned successfully!');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.isSubmittingDiet.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to create diet plan');
        setTimeout(() => this.errorMessage.set(''), 4000);
      },
    });
  }
}
