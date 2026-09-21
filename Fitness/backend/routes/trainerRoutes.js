const express = require('express');
const {
  getPublicTrainers,
  getMyTrainer,
  connectWithTrainer,
  getTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  getTrainerMembers,
  getClientWorkoutHistory,
  getClientProgress,
  getClientStrengthProgress,
  getClientMeasurements,
} = require('../controllers/trainerController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

// 1. Specific non-parameterized routes (MUST BE DECLARED FIRST to prevent route shadowing)
router.get('/public', getPublicTrainers);
router.get('/my-trainer', protect, getMyTrainer);
router.post('/:trainerId/connect', protect, connectWithTrainer);

// Client inspection routes for trainers
router.get('/clients/:clientId/workouts', protect, getClientWorkoutHistory);
router.get('/clients/:clientId/progress', protect, getClientProgress);
router.get('/clients/:clientId/strength', protect, getClientStrengthProgress);
router.get('/clients/:clientId/measurements', protect, getClientMeasurements);

// 2. Collection root routes
router.route('/')
  .get(getTrainers)
  .post(protect, admin, createTrainer);

// 3. Sub-resource routes
router.get('/:id/members', protect, getTrainerMembers);

// 4. Parameterized ID routes
router.route('/:id')
  .get(getTrainerById)
  .put(protect, admin, updateTrainer)
  .delete(protect, admin, deleteTrainer);

module.exports = router;
