import { Router } from 'express';
import {
  getTrainerProfile,
  updateTrainerProfile,
  getPublicTrainers,
  getClients,
  respondToConnectionRequest,
  getClientDetails,
  assignWorkoutPlanToClient,
  createAndAssignDietPlan,
  getClientDietPlan,
  getClientProgress,
  getClientStrengthProgress,
  getClientWorkoutHistory,
  getClientMeasurements,
  connectWithTrainer,
  getMyTrainer,
} from '../controllers/trainer.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all trainer routes with authentication
router.use(authenticate);

// User-side connection endpoints
router.get('/public', getPublicTrainers);
router.post('/:trainerId/connect', connectWithTrainer);
router.get('/my-trainer', getMyTrainer);
router.get('/clients/:clientId/diet-plan', getClientDietPlan);

// Trainer & Admin restricted endpoints
router.get('/profile', authorize('TRAINER', 'ADMIN'), getTrainerProfile);
router.put('/profile', authorize('TRAINER', 'ADMIN'), updateTrainerProfile);

// Client roster & management
router.get('/clients', authorize('TRAINER', 'ADMIN'), getClients);
router.post('/clients/:clientId/respond', authorize('TRAINER', 'ADMIN'), respondToConnectionRequest);
router.get('/clients/:clientId', authorize('TRAINER', 'ADMIN'), getClientDetails);

// Plan assignments
router.post('/clients/:clientId/workout-plan', authorize('TRAINER', 'ADMIN'), assignWorkoutPlanToClient);
router.post('/clients/:clientId/diet-plan', authorize('TRAINER', 'ADMIN'), createAndAssignDietPlan);

// Client progress inspection
router.get('/clients/:clientId/progress', authorize('TRAINER', 'ADMIN'), getClientProgress);
router.get('/clients/:clientId/strength', authorize('TRAINER', 'ADMIN'), getClientStrengthProgress);
router.get('/clients/:clientId/workouts', authorize('TRAINER', 'ADMIN'), getClientWorkoutHistory);
router.get('/clients/:clientId/measurements', authorize('TRAINER', 'ADMIN'), getClientMeasurements);

export default router;
