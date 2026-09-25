import mongoose from 'mongoose';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Veg Foods', 'Non-Veg Foods', 'Snacks'];

const nutritionItemSchema = new mongoose.Schema({
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
  },
  foodName: {
    type: String,
    required: [true, 'Food item name is required'],
    trim: true,
  },
  servingSize: {
    type: Number,
    required: true,
    default: 100,
  },
  servingUnit: {
    type: String,
    required: true,
    default: 'g',
  },
  servings: {
    type: Number,
    required: true,
    min: [0.1, 'Servings must be at least 0.1'],
    default: 1,
  },
  calories: {
    type: Number,
    required: true,
    min: 0,
  },
  protein: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  carbohydrates: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  fat: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
});

const nutritionLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Date string (YYYY-MM-DD) is required'],
      index: true,
    },
    mealType: {
      type: String,
      enum: {
        values: MEAL_TYPES,
        message: '{VALUE} is not a valid meal type',
      },
      required: [true, 'Meal type is required'],
    },
    items: [nutritionItemSchema],
    totalCalories: {
      type: Number,
      default: 0,
    },
    totalProtein: {
      type: Number,
      default: 0,
    },
    totalCarbohydrates: {
      type: Number,
      default: 0,
    },
    totalFat: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index so each user has at most one log entry per mealType per date
nutritionLogSchema.index({ user: 1, date: 1, mealType: 1 }, { unique: true });

// Pre-save hook to recalculate meal totals
nutritionLogSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    this.totalCalories = Math.round(
      this.items.reduce((acc, item) => acc + (item.calories || 0), 0)
    );
    this.totalProtein = Math.round(
      this.items.reduce((acc, item) => acc + (item.protein || 0), 0) * 10
    ) / 10;
    this.totalCarbohydrates = Math.round(
      this.items.reduce((acc, item) => acc + (item.carbohydrates || 0), 0) * 10
    ) / 10;
    this.totalFat = Math.round(
      this.items.reduce((acc, item) => acc + (item.fat || 0), 0) * 10
    ) / 10;
  } else {
    this.totalCalories = 0;
    this.totalProtein = 0;
    this.totalCarbohydrates = 0;
    this.totalFat = 0;
  }
  next();
});

export const NutritionLog = mongoose.model('NutritionLog', nutritionLogSchema);
export default NutritionLog;
