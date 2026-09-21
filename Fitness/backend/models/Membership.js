const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide membership name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Please provide membership price'],
      min: 0,
    },
    duration: {
      type: Number,
      required: [true, 'Please provide membership duration in days'],
      default: 30, // in days
    },
    features: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

const Membership = mongoose.model('Membership', membershipSchema);

module.exports = Membership;
