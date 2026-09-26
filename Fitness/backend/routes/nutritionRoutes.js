const express = require('express');
const multer = require('multer');
const {
  getFoods,
  createFood,
  getDailyNutrition,
  logFoodItem,
  removeFoodItem,
  scanMacroImage,
  getWaterIntake,
  logWaterIntake,
  resetWaterIntake,
  getGroceryList,
  updateGroceryList,
} = require('../controllers/nutritionController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Multer memory storage configuration for vision image uploads (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP) are allowed!'), false);
    }
  },
});

// Foods database endpoints (GET /foods allows optionalAuth for public search and browsing)
router.get('/foods', optionalAuth, getFoods);
router.post('/foods', protect, createFood);

// Daily tracking and meal log endpoints (User-specific, require authentication)
router.get('/daily', protect, getDailyNutrition);
router.post('/log', protect, logFoodItem);
router.delete('/log/:logId/item/:itemId', protect, removeFoodItem);

// Macro Image & Label Scanner
router.post('/scan', protect, upload.single('image'), scanMacroImage);

// Water & Hydration Tracker
router.get('/water', protect, getWaterIntake);
router.post('/water/log', protect, logWaterIntake);
router.post('/water/reset', protect, resetWaterIntake);

// Automated Meal Prep & Grocery Checklist
router.get('/grocery-list', protect, getGroceryList);
router.patch('/grocery-list', protect, updateGroceryList);

module.exports = router;

