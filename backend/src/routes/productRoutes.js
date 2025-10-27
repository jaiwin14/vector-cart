const express = require('express');
const router = express.Router();
const axios = require('axios');
const {
  searchProducts,
  getRecommendations,
  compareProducts,
  getProductById,
  getTrendingProducts,
  getProductsByCategory
} = require('../controllers/productController');
const { optionalAuth } = require('../middleware/auth');

// Product search - main RAG functionality
router.post('/search', optionalAuth, searchProducts);

// Image proxy route
router.get('/image-proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing image URL');
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    res.set('Content-Type', response.headers['content-type']);
    res.send(response.data);
  } catch (err) {
    res.status(404).send('Image not found');
  }
});

// Get product by ID
router.get('/:productId', optionalAuth, getProductById);

// Get product recommendations
router.get('/:productId/recommendations', optionalAuth, getRecommendations);

// Compare multiple products
router.post('/compare', optionalAuth, compareProducts);

// Get trending/popular products
router.get('/trending/all', optionalAuth, getTrendingProducts);

// Get products by category
router.get('/category/:category', optionalAuth, getProductsByCategory);

module.exports = router;