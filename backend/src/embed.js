const { HfInference } = require('@huggingface/inference');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class EmbeddingService {
  constructor() {
    const hfToken = process.env.HUGGINGFACE_API_TOKEN;
    this.hf = hfToken && hfToken.startsWith('hf_') ? new HfInference(hfToken) : null;
    this.model = 'sentence-transformers/all-MiniLM-L6-v2';

    const googleKey = process.env.GEMINI_API_KEY; // keep one env var name
    this.genAI = googleKey ? new GoogleGenerativeAI(googleKey) : null;
  }
  
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    const cleanText = this.preprocessText(text);
    if (!cleanText) {
      throw new Error('No valid text content to embed after preprocessing');
    }

    // Try HF first
    try {
      if (!this.hf) throw new Error('HF not configured');
      const response = await this.hf.featureExtraction({
        model: this.model,
        inputs: cleanText,
        wait_for_model: true
      });
      const embedding = Array.isArray(response) && Array.isArray(response[0]) ? response[0] : response;
      if (!Array.isArray(embedding)) throw new Error('Unexpected embedding response format');
      return embedding;
    } catch (err) {
      // Fallback to Google if configured
      if (!this.genAI) throw new Error(`HF featureExtraction failed: ${err?.message || err}`);
      const m = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const r = await m.embedContent(cleanText);
      return r.embedding.values;
    }
  }

  async generateEmbeddings(texts) {
    const embeddings = [];
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(batch.map(t => this.generateEmbedding(t)));
      embeddings.push(...batchEmbeddings);
      if (i + batchSize < texts.length) await this.delay(100);
    }
    return embeddings;
  }

  async generateProductEmbedding(product) {
    const textParts = [
      product.product_name || '',
      product.category || product.product_category_tree || '',
      product.description || product.about_product || '',
      product.brand || '',
      product.product_specifications || ''
    ].filter(part => part && part.trim().length > 0);
    const combinedText = textParts.join(' ');
    return this.generateEmbedding(combinedText);
  }

  preprocessText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?-]/g, '')
      .trim()
      .toLowerCase()
      .substring(0, 512);
  }

  delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

module.exports = new EmbeddingService();