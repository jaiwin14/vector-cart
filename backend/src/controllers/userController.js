const User = require('../models/User');

/**
 * Add item to user's cart with enhanced validation
 */
const addToCart = async (req, res) => {
  try {
    const { product, quantity = 1 } = req.body;
    
    // Validate product data
    if (!product || !product.id || !product.title || !product.price) {
      return res.status(400).json({ 
        error: 'Complete product information is required (id, title, price)' 
      });
    }

    if (quantity < 1 || quantity > 99) {
      return res.status(400).json({ 
        error: 'Quantity must be between 1 and 99' 
      });
    }
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if product already exists in cart
    const existingItemIndex = user.cart.findIndex(
      item => item.product.id === product.id
    );
    
    if (existingItemIndex !== -1) {
      // Update quantity if product already exists
      const newQuantity = user.cart[existingItemIndex].quantity + parseInt(quantity);
      if (newQuantity > 99) {
        return res.status(400).json({ 
          error: 'Maximum quantity per item is 99' 
        });
      }
      user.cart[existingItemIndex].quantity = newQuantity;
      user.cart[existingItemIndex].addedAt = new Date();
    } else {
      // Add new product to cart
      user.cart.push({
        product: {
          id: product.id,
          title: product.title,
          category: product.category || '',
          brand: product.brand || '',
          price: parseFloat(product.price),
          originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
          discount: product.discount || 0,
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0,
          description: product.description || '',
          image: product.image || '',
          url: product.url || '',
          features: product.features || ''
        },
        quantity: parseInt(quantity),
        addedAt: new Date()
      });
    }
    
    await user.save();
    
    // Calculate cart summary
    const cartSummary = user.cart.reduce((summary, item) => {
      const itemTotal = item.product.price * item.quantity;
      summary.totalItems += item.quantity;
      summary.totalAmount += itemTotal;
      return summary;
    }, { totalItems: 0, totalAmount: 0, itemCount: user.cart.length });
    
    res.json({
      message: 'Product added to cart successfully',
      cart: user.cart,
      summary: {
        totalItems: cartSummary.totalItems,
        totalAmount: parseFloat(cartSummary.totalAmount.toFixed(2)),
        itemCount: cartSummary.itemCount
      },
      addedProduct: {
        id: product.id,
        title: product.title,
        quantity: existingItemIndex !== -1 ? user.cart[existingItemIndex].quantity : parseInt(quantity)
      }
    });
    
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Error adding product to cart' });
  }
};

/**
 * Get user's cart items with enhanced summary
 */
const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('cart fullname email');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Calculate enhanced cart summary
    const cartSummary = user.cart.reduce((summary, item) => {
      const itemTotal = item.product.price * item.quantity;
      summary.totalItems += item.quantity;
      summary.totalAmount += itemTotal;
      
      // Track categories
      if (item.product.category) {
        summary.categories[item.product.category] = (summary.categories[item.product.category] || 0) + 1;
      }
      
      return summary;
    }, { 
      totalItems: 0, 
      totalAmount: 0, 
      itemCount: user.cart.length,
      categories: {}
    });
    
    // Add tax calculation
    const tax = cartSummary.totalAmount * 0.08; // 8% tax
    const finalTotal = cartSummary.totalAmount + tax;
    
    res.json({
      cart: user.cart.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)), // Sort by newest first
      summary: {
        ...cartSummary,
        totalAmount: parseFloat(cartSummary.totalAmount.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        finalTotal: parseFloat(finalTotal.toFixed(2))
      },
      user: {
        fullname: user.fullname,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Error fetching cart' });
  }
};

/**
 * Update cart item quantity with validation
 */
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1 || quantity > 99) {
      return res.status(400).json({ 
        error: 'Quantity must be between 1 and 99' 
      });
    }
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find and update cart item
    const cartItemIndex = user.cart.findIndex(
      item => item.product.id === productId
    );
    
    if (cartItemIndex === -1) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }
    
    const oldQuantity = user.cart[cartItemIndex].quantity;
    user.cart[cartItemIndex].quantity = parseInt(quantity);
    user.cart[cartItemIndex].addedAt = new Date(); // Update timestamp
    
    await user.save();
    
    // Calculate new summary
    const cartSummary = user.cart.reduce((summary, item) => {
      const itemTotal = item.product.price * item.quantity;
      summary.totalItems += item.quantity;
      summary.totalAmount += itemTotal;
      return summary;
    }, { totalItems: 0, totalAmount: 0, itemCount: user.cart.length });
    
    res.json({
      message: `Quantity updated from ${oldQuantity} to ${quantity}`,
      cart: user.cart,
      summary: {
        totalItems: cartSummary.totalItems,
        totalAmount: parseFloat(cartSummary.totalAmount.toFixed(2)),
        itemCount: cartSummary.itemCount
      },
      updatedItem: {
        productId,
        oldQuantity,
        newQuantity: parseInt(quantity)
      }
    });
    
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Error updating cart item' });
  }
};

/**
 * Remove item from cart with confirmation
 */
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find the item before removing
    const itemToRemove = user.cart.find(item => item.product.id === productId);
    if (!itemToRemove) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }
    
    // Remove item from cart
    const initialCartLength = user.cart.length;
    user.cart = user.cart.filter(item => item.product.id !== productId);
    
    await user.save();
    
    // Calculate new summary
    const cartSummary = user.cart.reduce((summary, item) => {
      const itemTotal = item.product.price * item.quantity;
      summary.totalItems += item.quantity;
      summary.totalAmount += itemTotal;
      return summary;
    }, { totalItems: 0, totalAmount: 0, itemCount: user.cart.length });
    
    res.json({
      message: `${itemToRemove.product.title} removed from cart`,
      cart: user.cart,
      summary: {
        totalItems: cartSummary.totalItems,
        totalAmount: parseFloat(cartSummary.totalAmount.toFixed(2)),
        itemCount: cartSummary.itemCount
      },
      removedItem: {
        productId,
        title: itemToRemove.product.title,
        quantity: itemToRemove.quantity
      }
    });
    
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Error removing product from cart' });
  }
};

/**
 * Clear entire cart with confirmation
 */
const clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const itemCount = user.cart.length;
    const totalItems = user.cart.reduce((total, item) => total + item.quantity, 0);
    
    user.cart = [];
    await user.save();
    
    res.json({
      message: `Cart cleared successfully. Removed ${itemCount} products (${totalItems} items)`,
      cart: [],
      summary: {
        totalItems: 0,
        totalAmount: 0,
        itemCount: 0
      },
      clearedStats: {
        itemCount,
        totalItems
      }
    });
    
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Error clearing cart' });
  }
};

/**
 * Get cart item count for badge display
 */
const getCartCount = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('cart');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const cartItemCount = user.cart.reduce((total, item) => total + item.quantity, 0);
    
    res.json({
      cartItemCount,
      cartLength: user.cart.length,
      hasItems: user.cart.length > 0
    });
    
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({ error: 'Error fetching cart count' });
  }
};

/**
 * Move item to wishlist (future feature)
 */
const moveToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // This would be implemented when wishlist feature is added
    res.json({
      message: 'Wishlist feature coming soon',
      productId
    });
  } catch (error) {
    console.error('Move to wishlist error:', error);
    res.status(500).json({ error: 'Error moving to wishlist' });
  }
};

/**
 * Get similar products for cart items (for upselling)
 */
const getCartRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('cart');
    
    if (!user || user.cart.length === 0) {
      return res.json({
        recommendations: [],
        message: 'Add items to cart to see recommendations'
      });
    }
    
    // This would integrate with your vector service to find related products
    // For now, return empty recommendations
    res.json({
      recommendations: [],
      message: 'Recommendations based on cart items coming soon',
      cartItemCount: user.cart.length
    });
    
  } catch (error) {
    console.error('Get cart recommendations error:', error);
    res.status(500).json({ error: 'Error fetching recommendations' });
  }
};

/**
 * Validate cart before checkout
 */
const validateCart = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('cart');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Validate each cart item
    const invalidItems = [];
    const validItems = [];
    
    user.cart.forEach(item => {
      if (!item.product.id || !item.product.title || !item.product.price || item.quantity < 1) {
        invalidItems.push(item);
      } else {
        validItems.push(item);
      }
    });
    
    if (invalidItems.length > 0) {
      return res.status(400).json({
        error: 'Some cart items are invalid',
        invalidItems: invalidItems.length,
        validItems: validItems.length
      });
    }
    
    // Calculate final totals
    const subtotal = validItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const shipping = 0; // Free shipping
    const total = subtotal + tax + shipping;
    
    res.json({
      valid: true,
      summary: {
        itemCount: validItems.length,
        totalItems: validItems.reduce((total, item) => total + item.quantity, 0),
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        shipping: shipping,
        total: parseFloat(total.toFixed(2))
      },
      items: validItems
    });
    
  } catch (error) {
    console.error('Validate cart error:', error);
    res.status(500).json({ error: 'Error validating cart' });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
  moveToWishlist,
  getCartRecommendations,
  validateCart
};