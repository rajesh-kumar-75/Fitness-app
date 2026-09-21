import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import exerciseRoutes from './exercise.routes.js';
import workoutRoutes from './workout.routes.js';
import nutritionRoutes from './nutrition.routes.js';
import progressRoutes from './progress.routes.js';
import trainerRoutes from './trainer.routes.js';
import chatRoutes from './chat.routes.js';
import adminRoutes from './admin.routes.js';
import { dbDisconnected } from '../middlewares/dbDisconnected.middleware.js';

const router = Router();

// Mount foundational health check routes (active without database)
router.use('/health', healthRoutes);

// Mount database-dependent routes protected by dbDisconnected middleware
router.use('/auth', dbDisconnected, authRoutes);
router.use('/users', dbDisconnected, userRoutes);
router.use('/exercises', dbDisconnected, exerciseRoutes);
router.use('/workouts', dbDisconnected, workoutRoutes);
router.use('/nutrition', dbDisconnected, nutritionRoutes);
router.use('/progress', dbDisconnected, progressRoutes);
router.use('/trainers', dbDisconnected, trainerRoutes);
router.use('/chat', dbDisconnected, chatRoutes);
router.use('/admin', dbDisconnected, adminRoutes);

export default router;
