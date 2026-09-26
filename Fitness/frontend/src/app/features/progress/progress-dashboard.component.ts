import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProgressService } from '../../core/services/progress.service';
import {
  Measurement,
  WeightProgressResponse,
  StrengthProgressResponse,
  ProgressOverviewResponse,
} from '../../core/models/progress.model';
import { LineChartComponent, ChartPoint } from '../../shared/components/line-chart/line-chart.component';

@Component({
  selector: 'app-progress-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, LineChartComponent],
  templateUrl: './progress-dashboard.component.html',
  styleUrl: './progress-dashboard.component.scss',
})
export class ProgressDashboardComponent implements OnInit {
  private readonly progressService = inject(ProgressService);
  private readonly fb = inject(FormBuilder);

  readonly activeStreak = '42 DAYS';
  readonly nextGoal = 'Bench 100kg - 85% Completed';
  readonly activeTab = signal<'weight' | 'strength' | 'measurements'>('weight');
  readonly isLoading = signal<boolean>(true);

  // Overview Stats
  readonly overview = signal<ProgressOverviewResponse['data'] | null>(null);

  // Weight Progress
  readonly weightData = signal<WeightProgressResponse['data'] | null>(null);
  readonly weightChartPoints = computed<ChartPoint[]>(() => {
    const data = this.weightData();
    if (!data || !data.points) return [];
    return data.points.map((p) => ({
      x: p.date,
      y: p.weight,
    }));
  });

  // Strength Progress
  readonly strengthData = signal<StrengthProgressResponse['data'] | null>(null);
  readonly selectedExercise = signal<string>('');
  readonly strengthChartPoints = computed<ChartPoint[]>(() => {
    const data = this.strengthData();
    if (!data || !data.points) return [];
    return data.points.map((p) => ({
      x: p.date,
      y: p.maxWeight,
    }));
  });

  // Measurements
  readonly measurementsList = signal<Measurement[]>([]);
  readonly isMeasurementModalOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  measurementForm!: FormGroup;

  ngOnInit(): void {
    this.initMeasurementForm();
    this.loadAllProgressData();
  }

  private initMeasurementForm(): void {
    this.measurementForm = this.fb.group({
      weight: ['', [Validators.required, Validators.min(20), Validators.max(400)]],
      date: [this.getTodayString(), Validators.required],
      chest: ['', [Validators.min(30), Validators.max(250)]],
      waist: ['', [Validators.min(30), Validators.max(250)]],
      hips: ['', [Validators.min(30), Validators.max(250)]],
      biceps: ['', [Validators.min(15), Validators.max(100)]],
      thighs: ['', [Validators.min(20), Validators.max(150)]],
      bodyFatPercentage: ['', [Validators.min(3), Validators.max(70)]],
      notes: [''],
    });
  }

  loadAllProgressData(): void {
    this.isLoading.set(true);

    this.progressService.getProgressOverview().subscribe({
      next: (res) => this.overview.set(res?.data || null),
      error: () => {},
    });

    this.loadWeightProgress();
    this.loadStrengthProgress();
    this.loadMeasurements();
  }

  loadWeightProgress(): void {
    this.progressService.getWeightProgress().subscribe({
      next: (res) => {
        this.weightData.set(res?.data || null);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadStrengthProgress(exerciseName?: string): void {
    this.progressService.getStrengthProgress(exerciseName).subscribe({
      next: (res) => {
        this.strengthData.set(res?.data || null);
        if (res?.data?.selectedExercise) {
          this.selectedExercise.set(res.data.selectedExercise);
        }
      },
      error: () => {},
    });
  }

  loadMeasurements(): void {
    this.progressService.getMeasurements().subscribe({
      next: (res) => {
        this.measurementsList.set(res?.data?.measurements || []);
      },
      error: () => {},
    });
  }

  onSelectExercise(name: string): void {
    this.selectedExercise.set(name);
    this.loadStrengthProgress(name);
  }

  openMeasurementModal(): void {
    // Prefill weight from current weight if available
    const current = this.overview()?.currentWeight;
    if (current && !this.measurementForm.get('weight')?.value) {
      this.measurementForm.patchValue({ weight: current });
    }
    this.isMeasurementModalOpen.set(true);
  }

  closeMeasurementModal(): void {
    this.isMeasurementModalOpen.set(false);
    this.measurementForm.reset({
      date: this.getTodayString(),
    });
  }

  submitMeasurement(): void {
    if (this.measurementForm.invalid) {
      this.measurementForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.measurementForm.value;

    this.progressService.addMeasurement(formVal).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeMeasurementModal();
        this.loadAllProgressData();
      },
      error: () => {
        this.isSubmitting.set(false);
      },
    });
  }

  deleteMeasurement(id: string): void {
    if (!confirm('Are you sure you want to delete this measurement entry?')) return;

    this.progressService.deleteMeasurement(id).subscribe({
      next: () => {
        this.loadAllProgressData();
      },
    });
  }

  private getTodayString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
