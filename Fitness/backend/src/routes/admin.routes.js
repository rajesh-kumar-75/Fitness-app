import { Router } from 'express';
import {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getTrainers,
  updateTrainer,
  getWorkoutsOverview,
  deleteWorkoutPlan,
  getSubscriptions,
  updateSubscriptionStatus,
  getPayments,
  getReports,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Strict RBAC: All admin routes require valid authentication and ADMIN role
router.use(authenticate, authorize('ADMIN'));

// Platform Statistics
router.get('/stats', getDashboardStats);

// User Management
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Trainer Management
router.get('/trainers', getTrainers);
router.patch('/trainers/:id', updateTrainer);

// Workout Oversight
router.get('/workouts', getWorkoutsOverview);
router.delete('/workouts/:id', deleteWorkoutPlan);

// Subscriptions & Payments
router.get('/subscriptions', getSubscriptions);
router.patch('/subscriptions/:id', updateSubscriptionStatus);
router.get('/payments', getPayments);

// Analytical Reports
router.get('/reports', getReports);

export default router;
