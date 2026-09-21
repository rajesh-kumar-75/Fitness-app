const mongoose = require('mongoose');

const dietMealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Meal name is required'],
    trim: true,
  },
  time: {
    type: String,
    trim: true,
    default: '',
  },
  targetCalories: {
    type: Number,
    required: true,
    min: 0,
  },
  targetProtein: {
    type: Number,
    min: 0,
    default: 0,
  },
  targetCarbs: {
    type: Number,
    min: 0,
    default: 0,
  },
  targetFat: {
    type: Number,
    min: 0,
    default: 0,
  },
  suggestedFoods: {
    type: [String],
    default: [],
  },
  instructions: {
    type: String,
    trim: true,
    default: '',
  },
});

const dietPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Diet plan title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      required: [true, 'Trainer reference is required'],
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client reference is required'],
      index: true,
    },
    targetCalories: {
      type: Number,
      required: [true, 'Daily target calories is required'],
      min: [500, 'Target calories must be at least 500'],
    },
    targetProtein: {
      type: Number,
      required: [true, 'Target protein (g) is required'],
      min: 0,
    },
    targetCarbs: {
      type: Number,
      required: [true, 'Target carbohydrates (g) is required'],
      min: 0,
    },
    targetFat: {
      type: Number,
      required: [true, 'Target fat (g) is required'],
      min: 0,
    },
    meals: [dietMealSchema],
    guidelines: {
      type: [String],
      default: [
        'Stay adequately hydrated by drinking 3-4 liters of water daily.',
        'Prioritize whole food protein sources with every meal.',
        'Avoid sugary beverages and highly processed snacks.',
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const DietPlan = mongoose.model('DietPlan', dietPlanSchema);

module.exports = DietPlan;
