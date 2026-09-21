import { Router } from 'express';
import {
  getFoods,
  createFood,
  getDailyNutrition,
  logFoodItem,
  removeFoodItem,
} from '../controllers/nutrition.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all nutrition routes
router.use(authenticate);

// Food database routes
router.get('/foods', getFoods);
router.post('/foods', createFood);

// Daily nutrition tracking routes
router.get('/daily', getDailyNutrition);
router.post('/log', logFoodItem);
router.delete('/log/:logId/item/:itemId', removeFoodItem);

export default router;
