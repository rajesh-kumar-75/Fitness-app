export type FoodCategory =
  | 'Proteins'
  | 'Carbohydrates'
  | 'Fruits & Vegetables'
  | 'Dairy'
  | 'Snacks & Fats'
  | 'Beverages'
  | 'Other';

export type MealType =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Veg Foods'
  | 'Non-Veg Foods'
  | 'Snacks';

export interface HealthyFoodOption {
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  icon?: string;
  portionLabel?: string;
}

export interface Food {
  _id: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  category: FoodCategory;
  isVerified: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NutritionItem {
  _id?: string;
  food?: string;
  foodName: string;
  servingSize: number;
  servingUnit: string;
  servings: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface MealLog {
  _id?: string;
  mealType: MealType;
  items: NutritionItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbohydrates: number;
  totalFat: number;
}

export interface MacroTargets {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  remainingCalories: number;
}

export interface DailyNutritionResponse {
  success: boolean;
  message: string;
  data: {
    date: string;
    targets: MacroTargets;
    totals: DailyTotals;
    meals: MealLog[];
  };
}

export interface FoodsListResponse {
  success: boolean;
  message: string;
  data: {
    foods: Food[];
    count: number;
  };
}

export interface LogFoodPayload {
  date?: string;
  mealType: MealType;
  foodId?: string;
  foodName: string;
  servingSize?: number;
  servingUnit?: string;
  servings?: number;
  calories: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
}

export interface ScannedFoodResult {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: number;
  servingUnit: string;
  confidenceScore: number;
}

export interface ScanResponse {
  success: boolean;
  message?: string;
  data: ScannedFoodResult;
}

export interface WaterLogEntry {
  amountMl: number;
  timestamp: string;
}

export interface WaterTrackerData {
  date: string;
  waterIntakeMl: number;
  waterGoalMl: number;
  percentage: number;
  streak: number;
  logs: WaterLogEntry[];
}

export interface WaterTrackerResponse {
  success: boolean;
  message?: string;
  data: WaterTrackerData;
}

export type GroceryCategory = 'Proteins' | 'Produce' | 'Pantry/Grains' | 'Dairy' | 'Other';

export interface GroceryItem {
  id: string;
  name: string;
  category: GroceryCategory;
  quantity: number;
  unit: string;
  isChecked: boolean;
  isCustom?: boolean;
}

export interface GroceryListResponse {
  success: boolean;
  message?: string;
  data: {
    weekStartDate: string;
    items: GroceryItem[];
    grouped: Record<GroceryCategory, GroceryItem[]>;
    totalCount: number;
    checkedCount: number;
    progressPercentage: number;
  };
}

