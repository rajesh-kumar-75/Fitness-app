import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    plan: {
      type: String,
      enum: {
        values: ['Free', 'Pro', 'Elite'],
        message: '{VALUE} is not a valid subscription plan',
      },
      default: 'Free',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'cancelled', 'expired', 'past_due'],
        message: '{VALUE} is not a valid subscription status',
      },
      default: 'active',
      index: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
