import { Router } from 'express';
import {
  getWorkoutPlans,
  getMyActivePlan,
  getWorkoutPlanById,
  createWorkoutPlan,
  updateWorkoutPlan,
  adoptWorkoutPlan,
  assignWorkoutPlan,
  deleteWorkoutPlan,
} from '../controllers/workout-plan.controller.js';
import {
  startWorkout,
  getActiveSession,
  updateWorkoutProgress,
  completeWorkout,
  cancelWorkout,
  getWorkoutHistory,
} from '../controllers/workout-log.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// All workout routes require authentication
router.use(authenticate);

// --- Workout Plans Endpoints ---
router.get('/plans', getWorkoutPlans);
router.get('/plans/my-plan', getMyActivePlan);
router.get('/plans/:id', getWorkoutPlanById);
router.post('/plans', createWorkoutPlan);
router.put('/plans/:id', updateWorkoutPlan);
router.post('/plans/:id/adopt', adoptWorkoutPlan);
router.post('/plans/:id/assign', authorize('TRAINER', 'ADMIN'), assignWorkoutPlan);
router.delete('/plans/:id', deleteWorkoutPlan);

// --- Workout Tracking & Logs Endpoints ---
router.post('/logs/start', startWorkout);
router.get('/logs/active', getActiveSession);
router.put('/logs/:id/progress', updateWorkoutProgress);
router.put('/logs/:id/complete', completeWorkout);
router.put('/logs/:id/cancel', cancelWorkout);
router.get('/logs/history', getWorkoutHistory);

export default router;
