const express = require('express');
const {
  getMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
  subscribeMembership,
} = require('../controllers/membershipController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.route('/')
  .get(getMemberships)
  .post(protect, admin, createMembership);

router.post('/subscribe', protect, subscribeMembership);

router.route('/:id')
  .get(getMembershipById)
  .put(protect, admin, updateMembership)
  .delete(protect, admin, deleteMembership);

module.exports = router;
