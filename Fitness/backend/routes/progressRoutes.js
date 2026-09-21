const express = require('express');
const {
  getWorkoutHistory,
  getStrengthProgress,
  getProgressOverview,
  getMeasurements,
  addMeasurement,
  deleteMeasurement,
  getWeightProgress,
} = require('../controllers/progressController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Body measurements & weight tracking
router.get('/measurements', optionalAuth, getMeasurements);
router.post('/measurements', optionalAuth, addMeasurement);
router.delete('/measurements/:id', optionalAuth, deleteMeasurement);
router.get('/weight', optionalAuth, getWeightProgress);

// Strength progression & workout history
router.get('/strength', optionalAuth, getStrengthProgress);
router.get('/workouts', optionalAuth, getWorkoutHistory);
router.get('/overview', optionalAuth, getProgressOverview);

module.exports = router;
