/**
 * Calculate cart summary from cart items
 * @param {Array} cartItems - Array of cart items
 * @returns {Object} - Cart summary with totals
 */
export const calculateCartSummary = (cartItems) => {
    return cartItems.reduce((summary, item) => {
      const itemTotal = item.product.price * item.quantity;
      summary.totalItems += item.quantity;
      summary.totalAmount += itemTotal;
      summary.itemCount = cartItems.length;
      return summary;
    }, { totalItems: 0, totalAmount: 0, itemCount: 0 });
  };
  
  /**
   * Format price with currency
   * @param {number} price - Price value
   * @param {string} currency - Currency symbol
   * @returns {string} - Formatted price
   */
  export const formatPrice = (price, currency = '$') => {
    return `${currency}${parseFloat(price).toFixed(2)}`;
  };
  
  /**
   * Format date for display
   * @param {string|Date} date - Date to format
   * @returns {string} - Formatted date
   */
  export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  /**
   * Calculate discount percentage
   * @param {number} originalPrice - Original price
   * @param {number} currentPrice - Current price
   * @returns {number} - Discount percentage
   */
  export const calculateDiscount = (originalPrice, currentPrice) => {
    if (!originalPrice || originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };
  
  /**
   * Validate product data before adding to cart
   * @param {Object} product - Product object
   * @returns {boolean} - Is valid product
   */
  export const validateProduct = (product) => {
    return product && 
           product.id && 
           product.title && 
           typeof product.price === 'number' && 
           product.price > 0;
  };
  
  /**
   * Get product image with fallback
   * @param {string} imageUrl - Product image URL
   * @returns {string} - Image URL or fallback
   */
  export const getProductImage = (imageUrl) => {
    if (!imageUrl) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNDE0MTQxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
    return imageUrl;
  };