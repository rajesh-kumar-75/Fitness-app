const mongoose = require('mongoose');

const FOOD_CATEGORIES = [
  'Proteins',
  'Carbohydrates',
  'Fruits & Vegetables',
  'Dairy',
  'Snacks & Fats',
  'Beverages',
  'Other',
];

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      default: 'Generic / Whole Food',
    },
    servingSize: {
      type: Number,
      required: [true, 'Serving size is required'],
      min: [1, 'Serving size must be positive'],
      default: 100,
    },
    servingUnit: {
      type: String,
      required: [true, 'Serving unit is required'],
      trim: true,
      default: 'g',
    },
    calories: {
      type: Number,
      required: [true, 'Calories count is required'],
      min: [0, 'Calories cannot be negative'],
    },
    protein: {
      type: Number,
      required: [true, 'Protein in grams is required'],
      min: [0, 'Protein cannot be negative'],
      default: 0,
    },
    carbohydrates: {
      type: Number,
      required: [true, 'Carbohydrates in grams is required'],
      min: [0, 'Carbohydrates cannot be negative'],
      default: 0,
    },
    fat: {
      type: Number,
      required: [true, 'Fat in grams is required'],
      min: [0, 'Fat cannot be negative'],
      default: 0,
    },
    category: {
      type: String,
      enum: {
        values: FOOD_CATEGORIES,
        message: '{VALUE} is not a supported food category',
      },
      default: 'Other',
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Text index on name and brand for fast keyword search
foodSchema.index({ name: 'text', brand: 'text' });

const Food = mongoose.model('Food', foodSchema);

module.exports = Food;
