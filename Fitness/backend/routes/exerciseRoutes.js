const express = require('express');
const router = express.Router();
const {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
} = require('../controllers/exerciseController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Public endpoints to browse exercises (no login strictly required, allows immediate access)
router.get('/', getExercises);
router.get('/:id', getExerciseById);

// Admin-protected mutation endpoints
router.post('/', protect, admin, createExercise);
router.put('/:id', protect, admin, updateExercise);
router.delete('/:id', protect, admin, deleteExercise);

module.exports = router;
