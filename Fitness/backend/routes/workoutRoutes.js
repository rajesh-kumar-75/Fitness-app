const express = require('express');
const {
  getWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getWorkoutsByCategory,
  getWorkoutsByDifficulty,
  assignWorkout,
} = require('../controllers/workoutController');
const {
  getMyActivePlan,
  getWorkoutPlans,
  getWorkoutPlanById,
  adoptWorkoutPlan,
  getActiveWorkoutLog,
  getWorkoutHistory,
  startWorkoutSession,
  updateWorkoutProgress,
  completeWorkoutSession,
  cancelWorkoutSession,
} = require('../controllers/workoutPlanController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// --- 1. Workout Plans & Weekly Schedule Endpoints ---
router.get('/plans/my-plan', optionalAuth, getMyActivePlan);
router.get('/plans', optionalAuth, getWorkoutPlans);
router.get('/plans/:id', optionalAuth, getWorkoutPlanById);
router.post('/plans/:id/adopt', optionalAuth, adoptWorkoutPlan);

// --- 2. Workout Logs & Tracking Endpoints ---
router.get('/logs/active', optionalAuth, getActiveWorkoutLog);
router.get('/logs/history', optionalAuth, getWorkoutHistory);
router.post('/logs/start', optionalAuth, startWorkoutSession);
router.put('/logs/:id/progress', optionalAuth, updateWorkoutProgress);
router.put('/logs/:id/complete', optionalAuth, completeWorkoutSession);
router.put('/logs/:id/cancel', optionalAuth, cancelWorkoutSession);

// --- 3. General Workout Routines Endpoints ---
router.route('/')
  .get(getWorkouts)
  .post(protect, createWorkout);

router.get('/category/:category', getWorkoutsByCategory);
router.get('/difficulty/:difficulty', getWorkoutsByDifficulty);
router.post('/:id/assign', protect, assignWorkout);

// --- 4. Single Workout Routine by ID ---
router.route('/:id')
  .get(getWorkoutById)
  .put(protect, updateWorkout)
  .delete(protect, deleteWorkout);

module.exports = router;
