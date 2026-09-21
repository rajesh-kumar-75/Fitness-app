const express = require('express');
const {
  getFoods,
  createFood,
  getDailyNutrition,
  logFoodItem,
  removeFoodItem,
} = require('../controllers/nutritionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All nutrition routes require authentication
router.use(protect);

// Foods database endpoints
router.get('/foods', getFoods);
router.post('/foods', createFood);

// Daily tracking and meal log endpoints
router.get('/daily', getDailyNutrition);
router.post('/log', logFoodItem);
router.delete('/log/:logId/item/:itemId', removeFoodItem);

module.exports = router;
