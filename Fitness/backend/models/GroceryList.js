const mongoose = require('mongoose');

const groceryItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Proteins', 'Produce', 'Pantry/Grains', 'Dairy', 'Other'],
    default: 'Other',
  },
  quantity: {
    type: Number,
    default: 1,
    min: 0,
  },
  unit: {
    type: String,
    default: 'units',
    trim: true,
  },
  isChecked: {
    type: Boolean,
    default: false,
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
});

const groceryListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    weekStartDate: {
      type: String, // YYYY-MM-DD (Monday of the week)
      required: [true, 'Week start date (YYYY-MM-DD) is required'],
      index: true,
    },
    items: [groceryItemSchema],
  },
  {
    timestamps: true,
  }
);

groceryListSchema.index({ user: 1, weekStartDate: 1 }, { unique: true });

const GroceryList = mongoose.model('GroceryList', groceryListSchema);

module.exports = GroceryList;
