const vectorService = require('../services/vectorService');
const responseService = require('../response');

/**
 * Search products using semantic search
 */
const searchProducts = async (req, res) => {
  try {
    const { query, limit = 10, minScore = 0.45 } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Please provide a valid search query' 
      });
    }
    
    console.log(`🔍 User search query: "${query}"`);
    
    // Perform semantic search
    const similarProducts = await vectorService.semanticSearch(
      query,
      parseInt(limit),
      parseFloat(minScore)
    );
    
    if (!similarProducts || similarProducts.length === 0) {
      return res.json({
        query,
        products: [],
        message: 'No products found matching your query. Try different keywords.',
        totalResults: 0
      });
    }
    
    // Generate AI response with product recommendations
    const aiResponse = await responseService.generateProductResponse(query, similarProducts);
    
    res.json({
      ...aiResponse,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ 
      error: 'Error searching products. Please try again.' 
    });
  }
};

/**
 * Get product recommendations based on a specific product
 */
const getRecommendations = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;
    
    if (!productId) {
      return res.status(400).json({ 
        error: 'Product ID is required' 
      });
    }
    
    // Get recommendations from vector service
    const recommendations = await vectorService.getRecommendations(productId, parseInt(limit));
    
    if (!recommendations || recommendations.length === 0) {
      return res.json({
        productId,
        recommendations: [],
        message: 'No recommendations found for this product.',
        totalResults: 0
      });
    }
    
    // Generate AI explanation for recommendations
    const aiResponse = await responseService.generateProductResponse(
      `Products similar to ${productId}`, 
      recommendations
    );
    
    res.json({
      productId,
      recommendations: aiResponse.products,
      explanation: aiResponse.explanation,
      summary: aiResponse.summary,
      totalResults: recommendations.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get recommendations error:', error);
    
    if (error.message === 'Product not found') {
      return res.status(404).json({ 
        error: 'Product not found in our database' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error getting recommendations. Please try again.' 
    });
  }
};

/**
 * Compare multiple products
 */
const compareProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({ 
        error: 'Please provide at least 2 product IDs for comparison' 
      });
    }
    
    if (productIds.length > 5) {
      return res.status(400).json({ 
        error: 'Maximum 5 products can be compared at once' 
      });
    }
    
    // Fetch product details for each ID
    const products = [];
    for (const productId of productIds) {
      try {
        const results = await vectorService.semanticSearch(`product_id:${productId}`, 1);
        if (results && results.length > 0) {
          products.push(results[0].product);
        }
      } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
      }
    }
    
    if (products.length < 2) {
      return res.status(404).json({ 
        error: 'Not enough valid products found for comparison' 
      });
    }
    
    // Generate AI comparison
    const comparison = await responseService.generateComparison(products);
    
    res.json({
      products,
      comparison,
      totalProducts: products.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Compare products error:', error);
    res.status(500).json({ 
      error: 'Error comparing products. Please try again.' 
    });
  }
};

/**
 * Get product details by ID
 */
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({ 
        error: 'Product ID is required' 
      });
    }
    
    // Search for the specific product
    const results = await vectorService.semanticSearch(`${productId}`, 1);
    
    if (!results || results.length === 0) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }
    
    const product = results[0].product;
    
    // Generate review summary
    const reviewSummary = await responseService.generateReviewSummary(product);
    
    res.json({
      product: {
        ...product,
        reviewSummary
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ 
      error: 'Error fetching product details. Please try again.' 
    });
  }
};

/**
 * Get trending/popular products
 */
const getTrendingProducts = async (req, res) => {
  try {
    const { limit = 20, category } = req.query;
    
    let query = 'popular trending products';
    if (category) {
      query += ` ${category}`;
    }
    
    // Get popular products based on ratings and reviews
    const products = await vectorService.semanticSearch(query, parseInt(limit));
    
    if (!products || products.length === 0) {
      return res.json({
        products: [],
        message: 'No trending products found.',
        totalResults: 0
      });
    }
    
    // Sort by rating and review count
    const sortedProducts = products.sort((a, b) => {
      const scoreA = (a.product.rating * 0.7) + (Math.log(a.product.reviewCount + 1) * 0.3);
      const scoreB = (b.product.rating * 0.7) + (Math.log(b.product.reviewCount + 1) * 0.3);
      return scoreB - scoreA;
    });
    
    res.json({
      products: sortedProducts,
      category: category || 'all',
      totalResults: sortedProducts.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get trending products error:', error);
    res.status(500).json({ 
      error: 'Error fetching trending products. Please try again.' 
    });
  }
};

/**
 * Get products by category
 */
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, minRating = 0 } = req.query;
    
    if (!category) {
      return res.status(400).json({ 
        error: 'Category is required' 
      });
    }
    
    // Search for products in the specific category
    const products = await vectorService.semanticSearch(category, parseInt(limit) * 2);
    
    // Filter products that actually belong to the category and meet rating criteria
    const filteredProducts = products.filter(item => {
      const product = item.product;
      return product.category?.toLowerCase().includes(category.toLowerCase()) &&
             product.rating >= parseFloat(minRating);
    }).slice(0, parseInt(limit));
    
    res.json({
      category,
      products: filteredProducts,
      totalResults: filteredProducts.length,
      filters: { minRating: parseFloat(minRating) },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ 
      error: 'Error fetching category products. Please try again.' 
    });
  }
};

module.exports = {
  searchProducts,
  getRecommendations,
  compareProducts,
  getProductById,
  getTrendingProducts,
  getProductsByCategory
};