import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['completed', 'pending', 'failed', 'refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'completed',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'Credit Card',
      trim: true,
    },
    transactionId: {
      type: String,
      unique: true,
      required: [true, 'Transaction ID is required'],
      index: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
