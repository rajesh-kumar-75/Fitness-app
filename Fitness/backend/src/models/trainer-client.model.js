import mongoose from 'mongoose';

const trainerClientSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trainer reference is required'],
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'active', 'rejected', 'terminated'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
      index: true,
    },
    requestMessage: {
      type: String,
      trim: true,
      maxlength: [500, 'Request message cannot exceed 500 characters'],
      default: '',
    },
    assignedWorkoutPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutPlan',
      default: null,
    },
    assignedDietPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DietPlan',
      default: null,
    },
    connectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring each client has at most one connection record per trainer
trainerClientSchema.index({ trainer: 1, client: 1 }, { unique: true });

export const TrainerClient = mongoose.model('TrainerClient', trainerClientSchema);
export default TrainerClient;
