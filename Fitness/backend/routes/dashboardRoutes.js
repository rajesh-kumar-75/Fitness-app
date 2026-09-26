const express = require('express');
const {
  getAdminDashboard,
  getTrainerDashboard,
  getMemberDashboard,
  getDailySteps,
  updateDailySteps,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/admin', protect, admin, getAdminDashboard);
router.get('/trainer', protect, getTrainerDashboard);
router.get('/member', protect, getMemberDashboard);

// Daily Step Count Tracker endpoints
router.get('/steps', protect, getDailySteps);
router.patch('/steps', protect, updateDailySteps);
router.put('/steps', protect, updateDailySteps);

module.exports = router;

