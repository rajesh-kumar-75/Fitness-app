const express = require('express');
const {
  createPayment,
  getPayments,
  getPaymentById,
  getMemberPayments,
  updatePaymentStatus,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, admin, getPayments)
  .post(protect, createPayment);

router.get('/member/:memberId', protect, getMemberPayments);

router.route('/:id')
  .get(protect, getPaymentById);

router.put('/:id/status', protect, admin, updatePaymentStatus);

module.exports = router;
