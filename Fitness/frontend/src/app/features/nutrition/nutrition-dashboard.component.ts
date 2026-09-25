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
  HealthyFoodOption,
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
  readonly modalTab = signal<'healthy' | 'database' | 'custom'>('healthy');
  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<string>('All');
  readonly foodSearchResults = signal<Food[]>([]);
  readonly selectedFood = signal<Food | null>(null);
  readonly servingsCount = signal<number>(1);
  readonly isSubmitting = signal<boolean>(false);
  readonly addingOptionName = signal<string | null>(null);

  // Curated Healthy Options for Dynamic Selection
  readonly healthyMealOptions: Record<MealType, HealthyFoodOption[]> = {
    Breakfast: [
      {
        name: 'Oatmeal with Berries',
        portionLabel: '1 bowl (220g)',
        servingSize: 220,
        servingUnit: 'g',
        calories: 290,
        protein: 10,
        carbohydrates: 54,
        fat: 5,
        icon: '🥣',
      },
      {
        name: 'Greek Yogurt',
        portionLabel: '1 cup (200g)',
        servingSize: 200,
        servingUnit: 'g',
        calories: 210,
        protein: 22,
        carbohydrates: 12,
        fat: 8,
        icon: '🥛',
      },
      {
        name: 'Scrambled Egg Whites',
        portionLabel: '1 plate (180g)',
        servingSize: 180,
        servingUnit: 'g',
        calories: 195,
        protein: 28,
        carbohydrates: 4,
        fat: 7,
        icon: '🍳',
      },
      {
        name: 'Avocado Toast',
        portionLabel: '2 slices (170g)',
        servingSize: 170,
        servingUnit: 'g',
        calories: 340,
        protein: 16,
        carbohydrates: 32,
        fat: 18,
        icon: '🥑',
      },
      {
        name: 'Whole Wheat Pancakes',
        portionLabel: '3 pancakes (210g)',
        servingSize: 210,
        servingUnit: 'g',
        calories: 380,
        protein: 24,
        carbohydrates: 52,
        fat: 8,
        icon: '🥞',
      },
    ],
    Lunch: [
      {
        name: 'Grilled Chicken Salad',
        portionLabel: '1 large bowl (300g)',
        servingSize: 300,
        servingUnit: 'g',
        calories: 380,
        protein: 42,
        carbohydrates: 12,
        fat: 18,
        icon: '🥗',
      },
      {
        name: 'Quinoa Grain Bowl',
        portionLabel: '1 bowl (280g)',
        servingSize: 280,
        servingUnit: 'g',
        calories: 360,
        protein: 14,
        carbohydrates: 58,
        fat: 9,
        icon: '🍲',
      },
      {
        name: 'Turkey Wrap',
        portionLabel: '1 wrap (240g)',
        servingSize: 240,
        servingUnit: 'g',
        calories: 420,
        protein: 38,
        carbohydrates: 36,
        fat: 14,
        icon: '🌯',
      },
      {
        name: 'Lentil Soup',
        portionLabel: '1 bowl (320g)',
        servingSize: 320,
        servingUnit: 'g',
        calories: 270,
        protein: 16,
        carbohydrates: 44,
        fat: 4,
        icon: '🥣',
      },
      {
        name: 'Tuna Poke Bowl',
        portionLabel: '1 bowl (260g)',
        servingSize: 260,
        servingUnit: 'g',
        calories: 410,
        protein: 38,
        carbohydrates: 38,
        fat: 12,
        icon: '🍚',
      },
    ],
    Dinner: [
      {
        name: 'Baked Salmon with Asparagus',
        portionLabel: '1 fillet + veg (260g)',
        servingSize: 260,
        servingUnit: 'g',
        calories: 410,
        protein: 40,
        carbohydrates: 8,
        fat: 24,
        icon: '🐟',
      },
      {
        name: 'Stir-Fry Tofu',
        portionLabel: '1 plate (300g)',
        servingSize: 300,
        servingUnit: 'g',
        calories: 320,
        protein: 24,
        carbohydrates: 28,
        fat: 14,
        icon: '🥢',
      },
      {
        name: 'Brown Rice with Veggies',
        portionLabel: '1 bowl (320g)',
        servingSize: 320,
        servingUnit: 'g',
        calories: 370,
        protein: 15,
        carbohydrates: 66,
        fat: 7,
        icon: '🍚',
      },
      {
        name: 'Grilled Steak with Sweet Potato',
        portionLabel: '1 steak + mash (340g)',
        servingSize: 340,
        servingUnit: 'g',
        calories: 490,
        protein: 46,
        carbohydrates: 38,
        fat: 17,
        icon: '🥩',
      },
      {
        name: 'Lemon Herb Baked Cod',
        portionLabel: '1 plate (270g)',
        servingSize: 270,
        servingUnit: 'g',
        calories: 330,
        protein: 36,
        carbohydrates: 22,
        fat: 8,
        icon: '🍋',
      },
    ],
    'Veg Foods': [
      {
        name: 'Paneer Tikka Skewers',
        portionLabel: '4 skewers (200g)',
        servingSize: 200,
        servingUnit: 'g',
        calories: 310,
        protein: 22,
        carbohydrates: 10,
        fat: 20,
        icon: '🧀',
      },
      {
        name: 'Tofu Buddha Bowl',
        portionLabel: '1 bowl (300g)',
        servingSize: 300,
        servingUnit: 'g',
        calories: 340,
        protein: 24,
        carbohydrates: 38,
        fat: 12,
        icon: '🥗',
      },
      {
        name: 'Chickpea Spinach Curry',
        portionLabel: '1 bowl (320g)',
        servingSize: 320,
        servingUnit: 'g',
        calories: 390,
        protein: 18,
        carbohydrates: 62,
        fat: 9,
        icon: '🍛',
      },
      {
        name: 'Chia Seed Pudding with Almond Milk',
        portionLabel: '1 jar (180g)',
        servingSize: 180,
        servingUnit: 'g',
        calories: 210,
        protein: 7,
        carbohydrates: 26,
        fat: 9,
        icon: '🫐',
      },
      {
        name: 'Roasted Sweet Potato & Black Beans',
        portionLabel: '1 bowl (280g)',
        servingSize: 280,
        servingUnit: 'g',
        calories: 320,
        protein: 14,
        carbohydrates: 58,
        fat: 5,
        icon: '🍠',
      },
      {
        name: 'Edamame Hummus Whole Wheat Wrap',
        portionLabel: '1 wrap (220g)',
        servingSize: 220,
        servingUnit: 'g',
        calories: 310,
        protein: 18,
        carbohydrates: 42,
        fat: 9,
        icon: '🌯',
      },
    ],
    'Non-Veg Foods': [
      {
        name: 'Grilled Herb Chicken Breast',
        portionLabel: '1 breast (200g)',
        servingSize: 200,
        servingUnit: 'g',
        calories: 280,
        protein: 48,
        carbohydrates: 0,
        fat: 6,
        icon: '🍗',
      },
      {
        name: 'Wild Seared Salmon Fillet',
        portionLabel: '1 fillet (180g)',
        servingSize: 180,
        servingUnit: 'g',
        calories: 360,
        protein: 38,
        carbohydrates: 0,
        fat: 22,
        icon: '🐟',
      },
      {
        name: 'Lean Sirloin Steak',
        portionLabel: '1 steak (220g)',
        servingSize: 220,
        servingUnit: 'g',
        calories: 420,
        protein: 52,
        carbohydrates: 2,
        fat: 18,
        icon: '🥩',
      },
      {
        name: 'Tuna Poke Bowl with Sesame',
        portionLabel: '1 bowl (300g)',
        servingSize: 300,
        servingUnit: 'g',
        calories: 440,
        protein: 42,
        carbohydrates: 44,
        fat: 13,
        icon: '🍣',
      },
      {
        name: 'Hard-Boiled Whole Eggs',
        portionLabel: '2 eggs (100g)',
        servingSize: 100,
        servingUnit: 'g',
        calories: 144,
        protein: 13,
        carbohydrates: 1,
        fat: 10,
        icon: '🥚',
      },
      {
        name: 'Roasted Turkey Breast Slices',
        portionLabel: '4 slices (180g)',
        servingSize: 180,
        servingUnit: 'g',
        calories: 220,
        protein: 42,
        carbohydrates: 2,
        fat: 4,
        icon: '🦃',
      },
    ],
    Snacks: [
      {
        name: 'Whey Protein Isolate Shake',
        portionLabel: '1 shake (350ml)',
        servingSize: 350,
        servingUnit: 'ml',
        calories: 160,
        protein: 30,
        carbohydrates: 4,
        fat: 2,
        icon: '🥤',
      },
      {
        name: 'Mixed Roasted Nuts',
        portionLabel: '1 handful (30g)',
        servingSize: 30,
        servingUnit: 'g',
        calories: 185,
        protein: 6,
        carbohydrates: 6,
        fat: 16,
        icon: '🥜',
      },
      {
        name: 'Apple with Natural Peanut Butter',
        portionLabel: '1 apple + 2 tbsp (180g)',
        servingSize: 180,
        servingUnit: 'g',
        calories: 220,
        protein: 7,
        carbohydrates: 28,
        fat: 11,
        icon: '🍏',
      },
      {
        name: 'Cottage Cheese with Berries',
        portionLabel: '1 cup (200g)',
        servingSize: 200,
        servingUnit: 'g',
        calories: 175,
        protein: 24,
        carbohydrates: 12,
        fat: 3,
        icon: '🍓',
      },
    ],
  };

  readonly currentHealthyOptions = computed<HealthyFoodOption[]>(() => {
    return this.healthyMealOptions[this.activeMealType()] || [];
  });

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
    this.modalTab.set('healthy');
    this.isLogModalOpen.set(true);
    if (this.foodSearchResults().length === 0) {
      this.searchFoods();
    }
  }

  quickLogOption(option: HealthyFoodOption): void {
    this.addingOptionName.set(option.name);
    this.isSubmitting.set(true);
    this.nutritionService
      .logFood({
        date: this.selectedDate(),
        mealType: this.activeMealType(),
        foodName: option.name,
        servingSize: option.servingSize,
        servingUnit: option.servingUnit,
        servings: 1,
        calories: option.calories,
        protein: option.protein,
        carbohydrates: option.carbohydrates,
        fat: option.fat,
      })
      .subscribe({
        next: () => {
          this.addingOptionName.set(null);
          this.isSubmitting.set(false);
          this.closeLogModal();
          this.loadDailyNutrition();
        },
        error: (err) => {
          console.error('Failed to log food item:', err);
          this.addingOptionName.set(null);
          this.isSubmitting.set(false);
        },
      });
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
          this.foodSearchResults.set(res.data?.foods || []);
        },
        error: (err) => {
          console.warn('Failed to load foods list:', err);
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
