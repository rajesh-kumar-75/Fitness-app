const express = require('express');
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getMyProfile,
  updateMyProfile,
} = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.route('/profile')
  .get(protect, getMyProfile)
  .put(protect, updateMyProfile);

router.route('/profile/me')
  .get(protect, getMyProfile)
  .put(protect, updateMyProfile);

router.route('/')
  .get(protect, admin, getMembers)
  .post(protect, admin, createMember);

router.route('/:id')
  .get(protect, getMemberById)
  .put(protect, admin, updateMember)
  .delete(protect, admin, deleteMember);

module.exports = router;
