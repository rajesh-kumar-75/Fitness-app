const express = require('express');
const {
  getAdminDashboard,
  getTrainerDashboard,
  getMemberDashboard,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/admin', protect, admin, getAdminDashboard);
router.get('/trainer', protect, getTrainerDashboard);
router.get('/member', protect, getMemberDashboard);

module.exports = router;
