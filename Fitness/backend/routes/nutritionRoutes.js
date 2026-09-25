const express = require('express');
const {
  getFoods,
  createFood,
  getDailyNutrition,
  logFoodItem,
  removeFoodItem,
} = require('../controllers/nutritionController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Foods database endpoints (GET /foods allows optionalAuth for public search and browsing)
router.get('/foods', optionalAuth, getFoods);
router.post('/foods', protect, createFood);

// Daily tracking and meal log endpoints (User-specific, require authentication)
router.get('/daily', protect, getDailyNutrition);
router.post('/log', protect, logFoodItem);
router.delete('/log/:logId/item/:itemId', protect, removeFoodItem);

module.exports = router;
