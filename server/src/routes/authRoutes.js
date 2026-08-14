const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getSavedAddress,
  updateSavedAddress,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Saved Address endpoints (protected by user session/JWT)
router.get('/saved-address', protect, getSavedAddress);
router.put('/saved-address', protect, updateSavedAddress);

module.exports = router;
