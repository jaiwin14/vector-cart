const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class ResponseService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }
  
  /**
   * Generate structured response for product recommendations
   * @param {string} userQuery - Original user query
   * @param {Array} similarProducts - Array of similar products from vector search
   * @returns {Promise<Object>} - Structured response with recommendations and explanations
   */
  async generateProductResponse(userQuery, similarProducts) {
    try {
      if (!similarProducts || similarProducts.length === 0) {
        return {
          query: userQuery,
          response: "I couldn't find any products matching your query. Please try with different keywords.",
          products: [],
          summary: "No products found"
        };
      }
      
      // Prepare product information for the prompt
      const productsInfo = similarProducts.map((item, index) => {
        const product = item.product;
        return `
Product ${index + 1}:
- Title: ${product.title}
- Category: ${product.category}
- Brand: ${product.brand}
- Price: ₹${product.price}
- Original Price: ₹${product.originalPrice}
- Discount: ${product.discount}%
- Rating: ${product.rating}/5
- Review Count: ${product.reviewCount}
- Description: ${product.description}
- Features: ${product.features}
- Similarity Score: ${item.score?.toFixed(3)}
        `;
      }).join('\n');
      
      const prompt = `
You are a helpful AI shopping assistant for VectorCart. A user searched for: "${userQuery}"

Here are the most relevant products found based on semantic similarity:
${productsInfo}

Please provide:
1. A compelling explanation (2-3 sentences) of why these products match the user's query
2. For each product, provide a brief recommendation explaining why it's a good choice
3. Generate a concise 18-20 word summary highlighting the key benefits based on ratings and features

Format your response as a JSON object with the following structure:
{
  "explanation": "Overall explanation of why these products match the query",
  "recommendations": [
    {
      "productIndex": 0,
      "reason": "Why this specific product is recommended",
      "keyBenefits": "Main selling points"
    }
  ],
  "summary": "18-20 word summary of all products highlighting ratings and key features"
}

Important guidelines:
- Keep recommendations concise but informative
- Focus on actual product features and ratings
- Make the summary exactly 18-20 words
- Be honest about product quality based on ratings
- Consider price-to-value ratio in recommendations
      `;
      
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse the JSON response
      let parsedResponse;
      try {
        // Clean the response text to extract JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        // Fallback response
        parsedResponse = {
          explanation: "I found several products that match your search criteria based on their features and categories.",
          recommendations: similarProducts.slice(0, 3).map((item, index) => ({
            productIndex: index,
            reason: `This product has a rating of ${item.product.rating}/5 with ${item.product.reviewCount} reviews and offers good value.`,
            keyBenefits: `Quality ${item.product.category} from ${item.product.brand} at competitive price.`
          })),
          summary: `Top rated products with ${similarProducts[0]?.product.rating}/5 stars offering excellent features and competitive pricing.`
        };
      }
      
      // Enhance products with recommendations
      const enhancedProducts = similarProducts.map((item, index) => {
        const recommendation = parsedResponse.recommendations.find(r => r.productIndex === index);
        return {
          ...item,
          recommendation: recommendation || {
            reason: "Good match for your search criteria",
            keyBenefits: "Quality product with competitive features"
          }
        };
      });
      
      return {
        query: userQuery,
        explanation: parsedResponse.explanation,
        products: enhancedProducts,
        summary: parsedResponse.summary,
        totalResults: similarProducts.length
      };
      
    } catch (error) {
      console.error('Error generating product response:', error);
      
      // Fallback response
      return {
        query: userQuery,
        explanation: "I found several products that match your search. Here are the most relevant options based on your query.",
        products: similarProducts.map(item => ({
          ...item,
          recommendation: {
            reason: "Selected based on similarity to your search query",
            keyBenefits: `${item.product.rating}/5 stars with ${item.product.reviewCount} reviews`
          }
        })),
        summary: "Quality products matching your search with competitive pricing and good ratings.",
        totalResults: similarProducts.length
      };
    }
  }
  
  /**
   * Generate review summary for a specific product
   * @param {Object} product - Product object
   * @returns {Promise<string>} - 18-20 word review summary
   */
  async generateReviewSummary(product) {
    try {
      const prompt = `
Generate a concise 18-20 word summary of this product based on its information:

Product: ${product.title}
Rating: ${product.rating}/5 stars
Review Count: ${product.reviewCount} reviews
Price: ${product.price}
Features: ${product.features}
Description: ${product.description}

Create a summary that highlights the key customer sentiment and product quality. Make it exactly 18-20 words.
      `;
      
      const result = await this.model.generateContent(prompt);
      const summary = result.response.text().trim();
      
      // Ensure the summary is within word limit
      const words = summary.split(' ');
      if (words.length > 20) {
        return words.slice(0, 20).join(' ') + '.';
      } else if (words.length < 18) {
        return summary + ' Excellent choice for customers seeking quality and value.';
      }
      
      return summary;
    } catch (error) {
      console.error('Error generating review summary:', error);
      return `Highly rated ${product.category} with ${product.rating}/5 stars from ${product.reviewCount} satisfied customers offering excellent value.`;
    }
  }
  
  /**
   * Generate comparison between multiple products
   * @param {Array} products - Array of products to compare
   * @returns {Promise<Object>} - Comparison analysis
   */
  async generateComparison(products) {
    try {
      if (!products || products.length < 2) {
        throw new Error('Need at least 2 products for comparison');
      }
      
      const productsInfo = products.map((product, index) => `
Product ${index + 1}: ${product.title}
- Price: ${product.price}
- Rating: ${product.rating}/5 (${product.reviewCount} reviews)
- Brand: ${product.brand}
- Category: ${product.category}
- Key Features: ${product.features}
      `).join('\n');
      
      const prompt = `
Compare these products and provide insights:
${productsInfo}

Provide a JSON response with:
{
  "bestOverall": "Product index (0-based) that offers best overall value",
  "bestPrice": "Product index with best price point",
  "bestRated": "Product index with highest rating",
  "comparison": "2-3 sentence comparison highlighting key differences",
  "recommendation": "Which product to choose and why"
}
      `;
      
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid comparison response format');
      }
      
    } catch (error) {
      console.error('Error generating comparison:', error);
      return {
        bestOverall: 0,
        bestPrice: 0,
        bestRated: 0,
        comparison: "All products offer good value with different strengths in pricing, features, and customer satisfaction.",
        recommendation: "Choose based on your specific needs and budget preferences."
      };
    }
  }
}

module.exports = new ResponseService();