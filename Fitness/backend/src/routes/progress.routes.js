import { Router } from 'express';
import {
  getMeasurements,
  addMeasurement,
  deleteMeasurement,
  getWeightProgress,
} from '../controllers/measurement.controller.js';
import {
  getStrengthProgress,
  getWorkoutHistory,
  getProgressOverview,
} from '../controllers/analytics.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all progress and analytics routes
router.use(authenticate);

// Body measurements & weight tracking
router.get('/measurements', getMeasurements);
router.post('/measurements', addMeasurement);
router.delete('/measurements/:id', deleteMeasurement);
router.get('/weight', getWeightProgress);

// Strength progression & workout history
router.get('/strength', getStrengthProgress);
router.get('/workouts', getWorkoutHistory);
router.get('/overview', getProgressOverview);

export default router;
