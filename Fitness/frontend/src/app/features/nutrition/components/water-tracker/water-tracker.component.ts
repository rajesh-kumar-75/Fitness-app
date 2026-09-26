import { Component, OnInit, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NutritionService } from '../../../../core/services/nutrition.service';
import { WaterTrackerData } from '../../../../core/models/nutrition.model';

@Component({
  selector: 'app-water-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './water-tracker.component.html',
  styleUrl: './water-tracker.component.scss',
})
export class WaterTrackerComponent implements OnInit {
  private readonly nutritionService = inject(NutritionService);

  @Input() set date(val: string) {
    if (val) {
      this.currentDate.set(val);
      this.loadWaterData();
    }
  }

  readonly currentDate = signal<string>(this.getTodayString());
  readonly waterData = signal<WaterTrackerData>({
    date: this.getTodayString(),
    waterIntakeMl: 0,
    waterGoalMl: 3000,
    percentage: 0,
    streak: 0,
    logs: [],
  });
  readonly isLoading = signal<boolean>(false);
  readonly isUpdating = signal<boolean>(false);
  readonly justHydrated = signal<boolean>(false);

  // SVG circular geometry
  readonly radius = 70;
  readonly circumference = 2 * Math.PI * this.radius;

  // Percentage capped at 100 for gauge visualization, but intake can exceed
  readonly displayPercentage = computed(() => {
    const data = this.waterData();
    if (!data.waterGoalMl) return 0;
    return Math.min(100, Math.round((data.waterIntakeMl / data.waterGoalMl) * 100));
  });

  readonly strokeDashoffset = computed(() => {
    const pct = this.displayPercentage();
    return this.circumference - (pct / 100) * this.circumference;
  });

  readonly isGoalAchieved = computed(() => {
    return this.waterData().waterIntakeMl >= this.waterData().waterGoalMl;
  });

  ngOnInit(): void {
    this.loadWaterData();
  }

  loadWaterData(): void {
    this.isLoading.set(true);
    this.nutritionService.getWaterIntake(this.currentDate()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.waterData.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.warn('Failed to load water data:', err);
        this.isLoading.set(false);
      },
    });
  }

  addWater(amountMl: number): void {
    if (this.isUpdating()) return;
    this.isUpdating.set(true);

    this.nutritionService.logWaterIntake(amountMl, this.currentDate()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.waterData.set(res.data);
          this.triggerSplashAnimation();
        }
        this.isUpdating.set(false);
      },
      error: (err) => {
        console.error('Failed to log water:', err);
        this.isUpdating.set(false);
      },
    });
  }

  resetWater(): void {
    if (this.waterData().waterIntakeMl === 0) return;
    if (!confirm('Are you sure you want to reset today\'s water intake to 0ml?')) return;

    this.isUpdating.set(true);
    this.nutritionService.resetWaterIntake(this.currentDate()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.waterData.set(res.data);
        }
        this.isUpdating.set(false);
      },
      error: (err) => {
        console.error('Failed to reset water:', err);
        this.isUpdating.set(false);
      },
    });
  }

  private triggerSplashAnimation(): void {
    this.justHydrated.set(true);
    setTimeout(() => {
      this.justHydrated.set(false);
    }, 1200);
  }

  private getTodayString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
