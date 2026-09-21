const express = require('express');
const { getProfile, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

router.route('/profile/me')
  .get(getProfile)
  .put(updateProfile);

router.route('/me')
  .get(getProfile)
  .put(updateProfile);

module.exports = router;
