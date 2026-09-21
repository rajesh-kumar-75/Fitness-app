import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

// Profile endpoints
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
