const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
  moveToWishlist,
  getCartRecommendations,
  validateCart
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// All user routes require authentication

// Cart management
router.post('/cart', authenticateToken, addToCart);
router.get('/cart', authenticateToken, getCart);
router.put('/cart/:productId', authenticateToken, updateCartItem);
router.delete('/cart/:productId', authenticateToken, removeFromCart);
router.delete('/cart', authenticateToken, clearCart);
router.get('/cart/count', authenticateToken, getCartCount);

// Cart features
router.post('/cart/:productId/wishlist', authenticateToken, moveToWishlist);
router.get('/cart/recommendations', authenticateToken, getCartRecommendations);
router.get('/cart/validate', authenticateToken, validateCart);

// Legacy routes (keeping for compatibility)
router.get('/orders', authenticateToken, (req, res) => {
  res.json({ message: 'Purchase history feature coming soon', orders: [] });
});

router.get('/wishlist', authenticateToken, (req, res) => {
  res.json({ message: 'Wishlist feature coming soon', wishlist: [] });
});

module.exports = router;