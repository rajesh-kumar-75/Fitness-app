import Food from '../models/food.model.js';
import NutritionLog from '../models/nutrition-log.model.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// Helper to get formatted YYYY-MM-DD
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calculate target calories and macronutrients based on user profile
const calculateMacroTargets = (profile) => {
  const weight = profile?.weight || 70; // kg
  const height = profile?.height || 175; // cm
  const age = profile?.age || 25;
  const gender = profile?.gender || 'Other';
  const activityLevel = profile?.activityLevel || 'Moderately Active';
  const goal = profile?.fitnessGoal || 'General Fitness';

  // Mifflin-St Jeor BMR
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'Male') {
    bmr += 5;
  } else if (gender === 'Female') {
    bmr -= 161;
  } else {
    bmr -= 50;
  }

  // Activity multipliers
  const activityMap = {
    Sedentary: 1.2,
    'Lightly Active': 1.375,
    'Moderately Active': 1.55,
    'Very Active': 1.725,
    'Extremely Active': 1.9,
  };
  const tdee = Math.round(bmr * (activityMap[activityLevel] || 1.4));

  // Goal calorie adjustment
  let targetCalories = tdee;
  if (goal === 'Weight Loss') targetCalories -= 500;
  else if (goal === 'Muscle Gain') targetCalories += 350;
  else if (goal === 'Strength') targetCalories += 250;
  else if (goal === 'Endurance') targetCalories += 200;

  targetCalories = Math.max(1200, targetCalories);

  // Target macros
  // Protein: ~2g per kg bodyweight
  const targetProtein = Math.round(weight * 2.0);
  // Fat: ~25% of total calories (9 kcal/g)
  const targetFat = Math.round((targetCalories * 0.25) / 9);
  // Carbs: remaining calories (4 kcal/g)
  const remainingKcal = Math.max(0, targetCalories - targetProtein * 4 - targetFat * 9);
  const targetCarbs = Math.round(remainingKcal / 4);

  return {
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
  };
};

/**
 * Get foods from food database with optional search and category filter.
 * GET /api/v1/nutrition/foods
 */
export const getFoods = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { brand: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    const foods = await Food.find(filter).sort({ isVerified: -1, name: 1 }).limit(100);

    return ApiResponse.success(res, 'Foods retrieved successfully', { foods, count: foods.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new custom or verified food item.
 * POST /api/v1/nutrition/foods
 */
export const createFood = async (req, res, next) => {
  try {
    const { name, brand, servingSize, servingUnit, calories, protein, carbohydrates, fat, category } = req.body;

    if (!name || calories === undefined) {
      throw ApiError.badRequest('Food name and calories are required');
    }

    const isVerified = req.user.role === 'ADMIN';

    const food = await Food.create({
      name,
      brand: brand || 'Custom Food',
      servingSize: servingSize || 100,
      servingUnit: servingUnit || 'g',
      calories: Number(calories),
      protein: Number(protein || 0),
      carbohydrates: Number(carbohydrates || 0),
      fat: Number(fat || 0),
      category: category || 'Other',
      isVerified,
      createdBy: req.user._id,
    });

    return ApiResponse.created(res, 'Food item created successfully', { food });
  } catch (error) {
    next(error);
  }
};

/**
 * Get daily nutrition summary and meals for a given date.
 * GET /api/v1/nutrition/daily?date=YYYY-MM-DD
 */
export const getDailyNutrition = async (req, res, next) => {
  try {
    const date = req.query.date || getTodayDateString();
    const userId = req.user._id;

    // Fetch user profile for targets
    const user = await User.findById(userId).select('profile');
    const targets = calculateMacroTargets(user?.profile);

    // Fetch meal logs for this date
    const logs = await NutritionLog.find({ user: userId, date });

    const mealsMap = {
      Breakfast: { mealType: 'Breakfast', items: [], totalCalories: 0, totalProtein: 0, totalCarbohydrates: 0, totalFat: 0 },
      Lunch: { mealType: 'Lunch', items: [], totalCalories: 0, totalProtein: 0, totalCarbohydrates: 0, totalFat: 0 },
      Dinner: { mealType: 'Dinner', items: [], totalCalories: 0, totalProtein: 0, totalCarbohydrates: 0, totalFat: 0 },
      'Veg Foods': { mealType: 'Veg Foods', items: [], totalCalories: 0, totalProtein: 0, totalCarbohydrates: 0, totalFat: 0 },
      'Non-Veg Foods': { mealType: 'Non-Veg Foods', items: [], totalCalories: 0, totalProtein: 0, totalCarbohydrates: 0, totalFat: 0 },
      Snacks: { mealType: 'Snacks', items: [], totalCalories: 0, totalProtein: 0, totalCarbohydrates: 0, totalFat: 0 },
    };

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbohydrates = 0;
    let totalFat = 0;

    logs.forEach((log) => {
      if (mealsMap[log.mealType]) {
        mealsMap[log.mealType] = {
          _id: log._id,
          mealType: log.mealType,
          items: log.items,
          totalCalories: log.totalCalories,
          totalProtein: log.totalProtein,
          totalCarbohydrates: log.totalCarbohydrates,
          totalFat: log.totalFat,
        };
      }
      totalCalories += log.totalCalories;
      totalProtein += log.totalProtein;
      totalCarbohydrates += log.totalCarbohydrates;
      totalFat += log.totalFat;
    });

    return ApiResponse.success(res, 'Daily nutrition retrieved successfully', {
      date,
      targets,
      totals: {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein * 10) / 10,
        carbohydrates: Math.round(totalCarbohydrates * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        remainingCalories: Math.max(0, targets.targetCalories - Math.round(totalCalories)),
      },
      meals: Object.values(mealsMap),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log a food item into a meal for a date.
 * POST /api/v1/nutrition/log
 */
export const logFoodItem = async (req, res, next) => {
  try {
    const { date = getTodayDateString(), mealType, foodId, foodName, servingSize, servingUnit, servings = 1, calories, protein, carbohydrates, fat } = req.body;

    if (
      !mealType ||
      ![
        'Breakfast',
        'Lunch',
        'Dinner',
        'Veg Foods',
        'Non-Veg Foods',
        'Snacks',
      ].includes(mealType)
    ) {
      throw ApiError.badRequest('Valid meal type is required (Breakfast, Lunch, Dinner, Veg Foods, Non-Veg Foods, Snacks)');
    }

    if (!foodName || calories === undefined) {
      throw ApiError.badRequest('Food item name and calories are required');
    }

    const mult = Number(servings) || 1;
    const item = {
      food: foodId || undefined,
      foodName,
      servingSize: Number(servingSize) || 100,
      servingUnit: servingUnit || 'g',
      servings: mult,
      calories: Math.round(Number(calories) * mult),
      protein: Math.round(Number(protein || 0) * mult * 10) / 10,
      carbohydrates: Math.round(Number(carbohydrates || 0) * mult * 10) / 10,
      fat: Math.round(Number(fat || 0) * mult * 10) / 10,
    };

    let log = await NutritionLog.findOne({ user: req.user._id, date, mealType });

    if (!log) {
      log = new NutritionLog({
        user: req.user._id,
        date,
        mealType,
        items: [item],
      });
    } else {
      log.items.push(item);
    }

    await log.save();

    return ApiResponse.success(res, 'Food logged successfully', { meal: log });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a logged food item.
 * DELETE /api/v1/nutrition/log/:logId/item/:itemId
 */
export const removeFoodItem = async (req, res, next) => {
  try {
    const { logId, itemId } = req.params;

    const log = await NutritionLog.findOne({ _id: logId, user: req.user._id });
    if (!log) {
      throw ApiError.notFound('Meal log not found');
    }

    log.items = log.items.filter((it) => it._id.toString() !== itemId);
    await log.save();

    return ApiResponse.success(res, 'Food item removed successfully', { meal: log });
  } catch (error) {
    next(error);
  }
};

/**
 * Auto-seed standard staple foods if collection is empty.
 */
export const seedFoodsIfEmpty = async () => {
  try {
    const count = await Food.countDocuments();
    if (count > 0) return;

    const standardFoods = [
      {
        name: 'Boneless Skinless Chicken Breast',
        brand: 'Generic Whole Food',
        servingSize: 100,
        servingUnit: 'g',
        calories: 165,
        protein: 31,
        carbohydrates: 0,
        fat: 3.6,
        category: 'Proteins',
        isVerified: true,
      },
      {
        name: 'Whole Large Egg',
        brand: 'Generic Whole Food',
        servingSize: 50,
        servingUnit: 'piece',
        calories: 72,
        protein: 6.3,
        carbohydrates: 0.4,
        fat: 4.8,
        category: 'Proteins',
        isVerified: true,
      },
      {
        name: 'Egg Whites',
        brand: 'Generic Whole Food',
        servingSize: 100,
        servingUnit: 'g',
        calories: 52,
        protein: 11,
        carbohydrates: 0.7,
        fat: 0.2,
        category: 'Proteins',
        isVerified: true,
      },
      {
        name: 'Rolled Oats',
        brand: 'Generic Whole Food',
        servingSize: 100,
        servingUnit: 'g',
        calories: 389,
        protein: 16.9,
        carbohydrates: 66.3,
        fat: 6.9,
        category: 'Carbohydrates',
        isVerified: true,
      },
      {
        name: 'Brown Rice (Cooked)',
        brand: 'Generic Whole Food',
        servingSize: 100,
        servingUnit: 'g',
        calories: 112,
        protein: 2.6,
        carbohydrates: 23.5,
        fat: 0.9,
        category: 'Carbohydrates',
        isVerified: true,
      },
      {
        name: 'Atlantic Salmon (Cooked)',
        brand: 'Generic Whole Food',
        servingSize: 100,
        servingUnit: 'g',
        calories: 206,
        protein: 22,
        carbohydrates: 0,
        fat: 12.3,
        category: 'Proteins',
        isVerified: true,
      },
      {
        name: 'Non-Fat Greek Yogurt',
        brand: 'Generic Whole Food',
        servingSize: 100,
        servingUnit: 'g',
        calories: 59,
        protein: 10,
        carbohydrates: 3.6,
        fat: 0.4,
        category: 'Dairy',
        isVerified: true,
      },
      {
        name: 'Whey Protein Isolate',
        brand: 'Standard Supplement',
        servingSize: 30,
        servingUnit: 'scoop',
        calories: 120,
        protein: 25,
        carbohydrates: 2,
        fat: 1,
        category: 'Proteins',
        isVerified: true,
      },
      {
        name: 'Sweet Potato (Baked)',
        brand: 'Generic Whole Food',
        servingSize: 100,
        servingUnit: 'g',
        calories: 90,
        protein: 2,
        carbohydrates: 20.7,
        fat: 0.2,
        category: 'Carbohydrates',
        isVerified: true,
      },
      {
        name: 'Natural Peanut Butter',
        brand: 'Generic Whole Food',
        servingSize: 32,
        servingUnit: 'tbsp (2 tbsp)',
        calories: 190,
        protein: 8,
        carbohydrates: 7,
        fat: 16,
        category: 'Snacks & Fats',
        isVerified: true,
      },
      {
        name: 'Banana',
        brand: 'Generic Whole Food',
        servingSize: 118,
        servingUnit: 'medium piece',
        calories: 105,
        protein: 1.3,
        carbohydrates: 27,
        fat: 0.3,
        category: 'Fruits & Vegetables',
        isVerified: true,
      },
      {
        name: 'Broccoli (Steamed)',
        brand: 'Generic Whole Food',
        servingSize: 100,
        servingUnit: 'g',
        calories: 35,
        protein: 2.4,
        carbohydrates: 7.2,
        fat: 0.4,
        category: 'Fruits & Vegetables',
        isVerified: true,
      },
      {
        name: 'Almonds',
        brand: 'Generic Whole Food',
        servingSize: 28,
        servingUnit: 'oz (handful)',
        calories: 164,
        protein: 6,
        carbohydrates: 6,
        fat: 14,
        category: 'Snacks & Fats',
        isVerified: true,
      },
      {
        name: 'Extra Virgin Olive Oil',
        brand: 'Generic Whole Food',
        servingSize: 14,
        servingUnit: 'tbsp',
        calories: 119,
        protein: 0,
        carbohydrates: 0,
        fat: 13.5,
        category: 'Snacks & Fats',
        isVerified: true,
      },
      {
        name: 'Whole Milk',
        brand: 'Generic Whole Food',
        servingSize: 240,
        servingUnit: 'cup (ml)',
        calories: 149,
        protein: 7.7,
        carbohydrates: 11.7,
        fat: 8,
        category: 'Dairy',
        isVerified: true,
      },
    ];

    await Food.insertMany(standardFoods);
    console.log(`[Nutrition Database] Seeded ${standardFoods.length} standard foods.`);
  } catch (error) {
    console.error('[Nutrition Database] Seeding error:', error.message);
  }
};
