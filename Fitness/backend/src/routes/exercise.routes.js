import { Router } from 'express';
import {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
} from '../controllers/exercise.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// All exercise endpoints require authentication
router.use(authenticate);

// Publicly readable for authenticated users (USER, TRAINER, ADMIN)
router.get('/', getExercises);
router.get('/:id', getExerciseById);

// Admin-only mutation endpoints
router.post('/', authorize('ADMIN'), createExercise);
router.put('/:id', authorize('ADMIN'), updateExercise);
router.delete('/:id', authorize('ADMIN'), deleteExercise);

export default router;
