import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NutritionService } from '../../core/services/nutrition.service';
import {
  DailyNutritionResponse,
  Food,
  MealLog,
  MealType,
  NutritionItem,
} from '../../core/models/nutrition.model';
import { DonutChartComponent, DonutSegment } from '../../shared/components/donut-chart/donut-chart.component';

@Component({
  selector: 'app-nutrition-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DonutChartComponent],
  templateUrl: './nutrition-dashboard.component.html',
  styleUrl: './nutrition-dashboard.component.scss',
})
export class NutritionDashboardComponent implements OnInit {
  private readonly nutritionService = inject(NutritionService);
  private readonly fb = inject(FormBuilder);

  readonly activeStreak = '42 DAYS';
  readonly nextGoal = 'Bench 100kg - 85% Completed';
  readonly selectedDate = signal<string>(this.getTodayString());
  readonly dailyData = signal<DailyNutritionResponse['data'] | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly loadError = signal<string | null>(null);

  // Food Search & Logging Modal State
  readonly isLogModalOpen = signal<boolean>(false);
  readonly activeMealType = signal<MealType>('Breakfast');
  readonly modalTab = signal<'database' | 'custom'>('database');
  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<string>('All');
  readonly foodSearchResults = signal<Food[]>([]);
  readonly selectedFood = signal<Food | null>(null);
  readonly servingsCount = signal<number>(1);
  readonly isSubmitting = signal<boolean>(false);

  readonly categories = [
    'All',
    'Proteins',
    'Carbohydrates',
    'Fruits & Vegetables',
    'Dairy',
    'Snacks & Fats',
    'Beverages',
  ];

  customFoodForm!: FormGroup;

  // Computed Donut Segments for Macronutrient Breakdown
  readonly macroSegments = computed<DonutSegment[]>(() => {
    const data = this.dailyData();
    if (!data || !data.totals) return [];

    return [
      { label: 'Protein', value: data.totals.protein, color: '#6366f1', unit: 'g' },
      { label: 'Carbs', value: data.totals.carbohydrates, color: '#38bdf8', unit: 'g' },
      { label: 'Fat', value: data.totals.fat, color: '#f59e0b', unit: 'g' },
    ];
  });

  ngOnInit(): void {
    this.initCustomForm();
    this.loadDailyNutrition();
    this.searchFoods();
  }

  private initCustomForm(): void {
    this.customFoodForm = this.fb.group({
      foodName: ['', [Validators.required, Validators.minLength(2)]],
      servingSize: [100, [Validators.required, Validators.min(1)]],
      servingUnit: ['g', Validators.required],
      calories: [0, [Validators.required, Validators.min(0)]],
      protein: [0, [Validators.required, Validators.min(0)]],
      carbohydrates: [0, [Validators.required, Validators.min(0)]],
      fat: [0, [Validators.required, Validators.min(0)]],
      servings: [1, [Validators.required, Validators.min(0.1)]],
    });
  }

  loadDailyNutrition(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.nutritionService.getDailyNutrition(this.selectedDate()).subscribe({
      next: (res) => {
        this.dailyData.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load daily nutrition:', err);
        this.loadError.set('Unable to load nutrition data. Please check connection and try again.');
        this.isLoading.set(false);
      },
    });
  }

  changeDate(deltaDays: number): void {
    const current = new Date(this.selectedDate());
    current.setDate(current.getDate() + deltaDays);
    this.selectedDate.set(this.formatDate(current));
    this.loadDailyNutrition();
  }

  setToday(): void {
    this.selectedDate.set(this.getTodayString());
    this.loadDailyNutrition();
  }

  openLogModal(mealType: MealType): void {
    this.activeMealType.set(mealType);
    this.selectedFood.set(null);
    this.servingsCount.set(1);
    this.modalTab.set('database');
    this.isLogModalOpen.set(true);
    if (this.foodSearchResults().length === 0) {
      this.searchFoods();
    }
  }

  closeLogModal(): void {
    this.isLogModalOpen.set(false);
    this.selectedFood.set(null);
    this.customFoodForm.reset({
      servingSize: 100,
      servingUnit: 'g',
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      servings: 1,
    });
  }

  searchFoods(): void {
    this.nutritionService
      .getFoods(this.searchQuery(), this.selectedCategory())
      .subscribe({
        next: (res) => {
          this.foodSearchResults.set(res.data.foods || []);
        },
      });
  }

  selectCategory(cat: string): void {
    this.selectedCategory.set(cat);
    this.searchFoods();
  }

  selectFoodItem(food: Food): void {
    this.selectedFood.set(food);
  }

  logSelectedFood(): void {
    const food = this.selectedFood();
    if (!food) return;

    this.isSubmitting.set(true);
    this.nutritionService
      .logFood({
        date: this.selectedDate(),
        mealType: this.activeMealType(),
        foodId: food._id,
        foodName: food.name,
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
        servings: this.servingsCount(),
        calories: food.calories,
        protein: food.protein,
        carbohydrates: food.carbohydrates,
        fat: food.fat,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeLogModal();
          this.loadDailyNutrition();
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }

  logCustomFood(): void {
    if (this.customFoodForm.invalid) {
      this.customFoodForm.markAllAsTouched();
      return;
    }

    const val = this.customFoodForm.value;
    this.isSubmitting.set(true);

    this.nutritionService
      .logFood({
        date: this.selectedDate(),
        mealType: this.activeMealType(),
        foodName: val.foodName,
        servingSize: val.servingSize,
        servingUnit: val.servingUnit,
        servings: val.servings,
        calories: val.calories,
        protein: val.protein,
        carbohydrates: val.carbohydrates,
        fat: val.fat,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeLogModal();
          this.loadDailyNutrition();
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }

  removeItem(logId: string | undefined, itemId: string | undefined): void {
    if (!logId || !itemId) return;

    if (!confirm('Remove this food item?')) return;

    this.nutritionService.removeFoodItem(logId, itemId).subscribe({
      next: () => {
        this.loadDailyNutrition();
      },
    });
  }

  private getTodayString(): string {
    return this.formatDate(new Date());
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
