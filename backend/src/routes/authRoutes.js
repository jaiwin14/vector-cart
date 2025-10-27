const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword, 
  logout 
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);
router.post('/logout', authenticateToken, logout);

// Token validation route
router.get('/validate', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user._id,
      fullname: req.user.fullname,
      email: req.user.email
    }
  });
});

module.exports = router;