const { Pinecone } = require('@pinecone-database/pinecone');
const embeddingService = require('../embed');
require('dotenv').config();

class VectorService {
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    this.indexName = process.env.PINECONE_INDEX_NAME;
    this.index = null;
  }

  /**
   * Initialize Pinecone index
   */
  async initialize() {
    try {
      this.index = this.pinecone.index(this.indexName);
      console.log(`✅ Connected to Pinecone index: ${this.indexName}`);
    } catch (error) {
      console.error('❌ Error initializing Pinecone:', error);
      throw error;
    }
  }

  /**
   * Store product embeddings in Pinecone
   * @param {Array} products - Array of product objects with embeddings
   */
  async storeEmbeddings(products) {
    try {
      if (!this.index) {
        await this.initialize();
      }

      console.log(`🔄 Storing ${products.length} embeddings in Pinecone...`);

      // Prepare vectors for upsert
      // Prepare vectors for upsert
      const vectors = products.map((product, index) => ({
        id: product.product_id || product.id || `product_${index}`,
        values: product.embedding,
        metadata: {
          // names expected by frontend/response
          title: product.title || product.product_name,
          category: product.category,
          brand: product.brand,
          price: this.cleanPrice(product.price ?? product.discounted_price ?? product.actual_price),
          originalPrice: this.cleanPrice(product.originalPrice ?? product.actual_price ?? product.discounted_price),
          discount: Number(product.discount ?? product.discount_percentage) || 0,
          rating: Number(product.rating) || 0,
          reviewCount: Number(product.reviewCount ?? product.rating_count) || 0,
          description: (product.description ?? product.about_product ?? product.review_content ?? '')
            .toString()
            .substring(0, 500),
          image: product.image || product.img_link,
          url: this.cleanUrl(product.url || product.product_link),
          features: (product.features ?? product.review_title ?? '').toString().substring(0, 300)
        }
      }));

      // Upsert in batches of 100 (Pinecone limit)
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await this.index.upsert(batch);
        console.log(`✅ Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);

        // Small delay between batches
        if (i + batchSize < vectors.length) {
          await this.delay(1000);
        }
      }

      console.log('🎉 All embeddings stored successfully!');
    } catch (error) {
      console.error('❌ Error storing embeddings:', error);
      throw error;
    }
  }

  /**
 * Perform semantic search
 * @param {string} query - User query
 * @param {number} topK - Number of results to return (default: 10)
 * @param {number} minScore - Minimum similarity score to accept (0-1, default: 0)
 * @returns {Promise<Array>} - Array of similar products
 */
  async semanticSearch(query, topK = 10, minScore = 0) {
    try {
      if (!this.index) {
        await this.initialize();
      }

      // Generate embedding for the query
      console.log('🔍 Generating embedding for query:', query);
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Search in Pinecone
      const searchResponse = await this.index.query({
        vector: queryEmbedding,
        topK: topK,
        includeMetadata: true,
        includeValues: false
      });

      // Extract and format results
      const results = (searchResponse.matches || []).map(match => ({
        id: match.id,
        score: match.score,
        product: match.metadata
      }));

      // Apply similarity threshold filter
      const filtered = results.filter(r => typeof r.score === 'number' && r.score >= minScore);
      const avgScore = results.length ? (results.reduce((s, r) => s + (r.score || 0), 0) / results.length).toFixed(3) : '0.000';
      console.log(`✅ Found ${results.length} similar products (avg score: ${avgScore}). After minScore ${minScore}: ${filtered.length}`);
      return filtered;
    } catch (error) {
      console.error('❌ Error performing semantic search:', error);
      throw error;
    }
  }


  /**
   * Get product recommendations based on a product
   * @param {string} productId - Product ID
   * @param {number} topK - Number of recommendations (default: 5)
   * @returns {Promise<Array>} - Array of recommended products
   */
  async getRecommendations(productId, topK = 5) {
    try {
      if (!this.index) {
        await this.initialize();
      }

      // Fetch the product vector
      const fetchResponse = await this.index.fetch([productId]);
      if (!fetchResponse.vectors[productId]) {
        throw new Error('Product not found');
      }

      const productVector = fetchResponse.vectors[productId].values;

      // Find similar products
      const searchResponse = await this.index.query({
        vector: productVector,
        topK: topK + 1, // +1 because the product itself will be included
        includeMetadata: true,
        includeValues: false
      });

      // Filter out the original product and return recommendations
      const recommendations = searchResponse.matches
        .filter(match => match.id !== productId)
        .slice(0, topK)
        .map(match => ({
          id: match.id,
          score: match.score,
          product: match.metadata
        }));

      return recommendations;
    } catch (error) {
      console.error('❌ Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   * @returns {Promise<Object>} - Index stats
   */
  async getIndexStats() {
    try {
      if (!this.index) {
        await this.initialize();
      }

      const stats = await this.index.describeIndexStats();
      return stats;
    } catch (error) {
      console.error('❌ Error getting index stats:', error);
      throw error;
    }
  }

  /**
 * Utility function to add delay
 * @param {number} ms - Milliseconds to delay
 */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean price string and convert to number
   * @param {string} priceStr - Price string (e.g., "₹399", "$29.99")
   * @returns {number} - Cleaned price as number
   */
  cleanPrice(priceStr) {
    if (!priceStr || priceStr === '') return 0;
    const cleaned = priceStr.toString().replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Clean URL string
   * @param {string} urlStr - URL string
   * @returns {string} - Cleaned URL or empty string
   */
  cleanUrl(urlStr) {
    if (!urlStr || urlStr === '') return '';
    return urlStr.toString().trim();
  }
}

module.exports = new VectorService();