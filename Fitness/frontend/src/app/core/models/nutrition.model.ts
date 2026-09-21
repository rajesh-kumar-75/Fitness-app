export type FoodCategory =
  | 'Proteins'
  | 'Carbohydrates'
  | 'Fruits & Vegetables'
  | 'Dairy'
  | 'Snacks & Fats'
  | 'Beverages'
  | 'Other';

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

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
