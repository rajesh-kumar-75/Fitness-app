const Food = require('../models/Food');
const NutritionLog = require('../models/NutritionLog');
const Member = require('../models/Member');
const User = require('../models/User');

// Helper to format today's date as YYYY-MM-DD
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calculate target calories and macronutrients based on member profile
const calculateMacroTargets = (profile) => {
  const weight = profile?.weight || 70; // kg
  const height = profile?.height || 175; // cm
  const age = profile?.age || 25;
  const gender = profile?.gender || 'Male';
  const activityLevel = profile?.activityLevel || 'Moderately Active';
  const goal = profile?.fitnessGoal || 'General Fitness';

  // Mifflin-St Jeor BMR equation
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
  const tdee = Math.round(bmr * (activityMap[activityLevel] || 1.45));

  // Goal calorie adjustment
  let targetCalories = tdee;
  if (goal === 'Weight Loss') targetCalories -= 500;
  else if (goal === 'Muscle Gain') targetCalories += 350;
  else if (goal === 'Strength') targetCalories += 250;
  else if (goal === 'Endurance') targetCalories += 200;

  targetCalories = Math.max(1200, targetCalories);

  // Target macros
  // Protein: ~2.0g per kg bodyweight
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
 * Get foods from food database with search and category filter.
 * GET /api/v1/nutrition/foods
 */
const getFoods = async (req, res) => {
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

    const foods = await Food.find(filter)
      .sort({ isVerified: -1, name: 1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      message: 'Foods retrieved successfully',
      data: {
        foods,
        count: foods.length,
      },
    });
  } catch (error) {
    console.error('Error fetching foods:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve foods',
      error: error.message,
    });
  }
};

/**
 * Create a new custom or verified food item.
 * POST /api/v1/nutrition/foods
 */
const createFood = async (req, res) => {
  try {
    const {
      name,
      brand,
      servingSize,
      servingUnit,
      calories,
      protein,
      carbohydrates,
      fat,
      category,
    } = req.body;

    if (!name || calories === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Food name and calories are required',
      });
    }

    const isVerified = req.user && (req.user.role === 'admin' || req.user.role === 'ADMIN');

    const food = await Food.create({
      name,
      brand: brand || 'Custom Food',
      servingSize: Number(servingSize) || 100,
      servingUnit: servingUnit || 'g',
      calories: Number(calories),
      protein: Number(protein || 0),
      carbohydrates: Number(carbohydrates || 0),
      fat: Number(fat || 0),
      category: category || 'Other',
      isVerified,
      createdBy: req.user ? req.user._id : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Food item created successfully',
      data: { food },
    });
  } catch (error) {
    console.error('Error creating food:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create food item',
      error: error.message,
    });
  }
};

/**
 * Get daily nutrition summary and meals for a given date.
 * GET /api/v1/nutrition/daily?date=YYYY-MM-DD
 */
const getDailyNutrition = async (req, res) => {
  try {
    const date = req.query.date || getTodayDateString();
    const userId = req.user ? req.user._id : null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Try finding member profile for customized targets
    const member = await Member.findOne({ user: userId });
    const targets = calculateMacroTargets(member || {});

    // Fetch meal logs for this user on this date
    const logs = await NutritionLog.find({ user: userId, date });

    const mealsMap = {
      Breakfast: {
        mealType: 'Breakfast',
        items: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbohydrates: 0,
        totalFat: 0,
      },
      Lunch: {
        mealType: 'Lunch',
        items: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbohydrates: 0,
        totalFat: 0,
      },
      Dinner: {
        mealType: 'Dinner',
        items: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbohydrates: 0,
        totalFat: 0,
      },
      Snacks: {
        mealType: 'Snacks',
        items: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbohydrates: 0,
        totalFat: 0,
      },
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
          items: log.items || [],
          totalCalories: log.totalCalories || 0,
          totalProtein: log.totalProtein || 0,
          totalCarbohydrates: log.totalCarbohydrates || 0,
          totalFat: log.totalFat || 0,
        };
      }
      totalCalories += log.totalCalories || 0;
      totalProtein += log.totalProtein || 0;
      totalCarbohydrates += log.totalCarbohydrates || 0;
      totalFat += log.totalFat || 0;
    });

    return res.status(200).json({
      success: true,
      message: 'Daily nutrition retrieved successfully',
      data: {
        date,
        targets,
        totals: {
          calories: Math.round(totalCalories),
          protein: Math.round(totalProtein * 10) / 10,
          carbohydrates: Math.round(totalCarbohydrates * 10) / 10,
          fat: Math.round(totalFat * 10) / 10,
          remainingCalories: Math.max(
            0,
            targets.targetCalories - Math.round(totalCalories)
          ),
        },
        meals: Object.values(mealsMap),
      },
    });
  } catch (error) {
    console.error('Error fetching daily nutrition:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve daily nutrition',
      error: error.message,
    });
  }
};

/**
 * Log a food item into a meal for a date.
 * POST /api/v1/nutrition/log
 */
const logFoodItem = async (req, res) => {
  try {
    const {
      date = getTodayDateString(),
      mealType,
      foodId,
      foodName,
      servingSize,
      servingUnit,
      servings = 1,
      calories,
      protein,
      carbohydrates,
      fat,
    } = req.body;

    if (
      !mealType ||
      !['Breakfast', 'Lunch', 'Dinner', 'Snacks'].includes(mealType)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Valid meal type is required (Breakfast, Lunch, Dinner, Snacks)',
      });
    }

    if (!foodName || calories === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Food item name and calories are required',
      });
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

    let log = await NutritionLog.findOne({
      user: req.user._id,
      date,
      mealType,
    });

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

    return res.status(200).json({
      success: true,
      message: 'Food logged successfully',
      data: { meal: log },
    });
  } catch (error) {
    console.error('Error logging food item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log food item',
      error: error.message,
    });
  }
};

/**
 * Remove a logged food item.
 * DELETE /api/v1/nutrition/log/:logId/item/:itemId
 */
const removeFoodItem = async (req, res) => {
  try {
    const { logId, itemId } = req.params;

    const log = await NutritionLog.findOne({
      _id: logId,
      user: req.user._id,
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Meal log not found',
      });
    }

    log.items = log.items.filter((it) => it._id.toString() !== itemId);
    await log.save();

    return res.status(200).json({
      success: true,
      message: 'Food item removed successfully',
      data: { meal: log },
    });
  } catch (error) {
    console.error('Error removing food item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove food item',
      error: error.message,
    });
  }
};

/**
 * Standard default foods seed dataset
 */
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

/**
 * Auto-seed standard staple foods if collection is empty or missing.
 */
const seedFoodsIfEmpty = async () => {
  try {
    const count = await Food.countDocuments();
    if (count === 0) {
      await Food.insertMany(standardFoods);
      console.log(
        `🥗 [Nutrition Database] Seeded ${standardFoods.length} standard foods into MongoDB.`
      );
    }
  } catch (error) {
    console.error('🥗 [Nutrition Database] Seeding error:', error.message);
  }
};

module.exports = {
  getFoods,
  createFood,
  getDailyNutrition,
  logFoodItem,
  removeFoodItem,
  seedFoodsIfEmpty,
};
