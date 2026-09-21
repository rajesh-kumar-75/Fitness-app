const express = require('express');
const {
  checkIn,
  checkOut,
  getAttendance,
  getMemberAttendance,
  getTodayAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.post('/check-in', protect, checkIn);
router.put('/check-out', protect, checkOut);
router.get('/today', protect, getTodayAttendance);
router.get('/member/:memberId', protect, getMemberAttendance);
router.get('/', protect, admin, getAttendance);

module.exports = router;
