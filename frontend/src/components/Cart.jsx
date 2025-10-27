import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ShoppingCart, Minus, Plus, Trash2, ArrowLeft, ExternalLink, Star } from 'lucide-react';
import axios from 'axios';
import vectorcartLogo from '../assets/vectorcartLogo.png';

const Cart = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cartSummary, setCartSummary] = useState({
    totalItems: 0,
    totalAmount: 0,
    itemCount: 0
  });

  const API_BASE_URL = 'https://vector-cart.onrender.com/api';

  const parseImageUrl = (imageData) => {
    if (!imageData) return null;

    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(imageData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const url = parsed[0];
        // Convert HTTP to HTTPS
        return url.startsWith('http://') ? url.replace('http://', 'https://') : url;
      }
    } catch (error) {
      // If parsing fails, treat as single URL
      if (typeof imageData === 'string' && imageData.startsWith('http')) {
        // Convert HTTP to HTTPS
        return imageData.startsWith('http://') ? imageData.replace('http://', 'https://') : imageData;
      }
    }

    return null;
  };

  // Get user data and cart on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchCartItems();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchCartItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/user/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setCartItems(response.data.cart || []);
      setCartSummary(response.data.summary || { totalItems: 0, totalAmount: 0, itemCount: 0 });
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/user/cart/${productId}`,
        { quantity: newQuantity },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Update local state
      setCartItems(items => 
        items.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
      
      // Recalculate summary
      await fetchCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Error updating quantity. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const removeFromCart = async (productId) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/user/cart/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update local state
      setCartItems(items => items.filter(item => item.product.id !== productId));
      
      // Recalculate summary
      await fetchCartItems();
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Error removing product. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/user/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setCartItems([]);
      setCartSummary({ totalItems: 0, totalAmount: 0, itemCount: 0 });
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('Error clearing cart. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleViewProduct = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-emerald-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-emerald-900 relative overflow-hidden">
      {/* Background Orb Effect */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 md:w-[600px] md:h-[600px] opacity-20">
        <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-4 left-4 w-full h-full rounded-full bg-gradient-to-l from-cyan-400 via-blue-500 to-purple-600 blur-2xl animate-bounce-slow opacity-50"></div>
      </div>

      {/* Header */}
      <nav className="relative z-20 flex items-center justify-between p-6 lg:px-12">
        <div className="flex items-center space-x-4">
          
          <div className="flex items-center space-x-2">
          <img 
            src={vectorcartLogo} 
            alt="VectorCart Logo" 
            className="w-8 h-8 object-contain"
          />
          <span className="text-white text-xl font-bold tracking-wide">VECTOR CART</span>
        </div>
        </div>
        
        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 hover:bg-white/20 transition-all"
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-medium hidden sm:block">{user.fullname}</span>
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden">
              <button
                onClick={() => navigate('/query')}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center space-x-3"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Search</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center space-x-3"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 px-6 lg:px-12 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Your Shopping Cart
            </h1>
            <p className="text-white/70 text-lg">
              {cartSummary.itemCount > 0 
                ? `${cartSummary.itemCount} item${cartSummary.itemCount > 1 ? 's' : ''} in your cart`
                : 'Your cart is empty'
              }
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/70">Loading your cart...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="w-24 h-24 text-white/30 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
              <p className="text-white/70 mb-8">Start shopping to add products to your cart</p>
              <button
                onClick={() => navigate('/query')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold transition-all"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">Cart Items</h2>
                  {cartItems.length > 0 && (
                    <button
                      onClick={clearCart}
                      disabled={updating}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {cartItems.map((item, index) => {
                  const product = item.product;
                  const itemTotal = product.price * item.quantity;
                  
                  return (
                    <div
                      key={product.id || index}
                      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all"
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Product Image */}
                        {/* <div className="flex-shrink-0">
                          <div className="w-full md:w-32 h-32 bg-white/5 rounded-xl overflow-hidden">
                            {parseImageUrl(product.image) ? (
                              <img
                                src={parseImageUrl(product.image)}
                                alt={product.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNDE0MTQxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/50 text-xs">
                                No Image
                              </div>
                            )}
                          </div>
                        </div> */}

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                                {product.title}
                              </h3>
                              
                              <div className="flex items-center space-x-4 mb-3">
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-white/80 text-sm">
                                    {product.rating || 'N/A'}
                                  </span>
                                </div>
                                <span className="text-emerald-300 font-semibold">
                                ₹{product.price}
                                </span>
                                {product.originalPrice && product.originalPrice > product.price && (
                                  <span className="text-white/50 line-through text-sm">
                                    ₹{product.originalPrice}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2 mb-4">
                                {product.category && (
                                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                                    {product.category}
                                  </span>
                                )}
                                {product.brand && (
                                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                                    {product.brand}
                                  </span>
                                )}
                              </div>

                              <p className="text-white/60 text-sm mb-4">
                                Added on {new Date(item.addedAt).toLocaleDateString()}
                              </p>
                            </div>

                            {/* Price and Controls */}
                            <div className="flex flex-col items-end space-y-4">
                              <div className="text-right">
                                <p className="text-white/60 text-sm">Item Total</p>
                                <p className="text-2xl font-bold text-emerald-300">
                                  ₹{itemTotal.toFixed(2)}
                                </p>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => updateQuantity(product.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1 || updating}
                                  className="w-8 h-8 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                
                                <span className="text-white font-semibold min-w-[3rem] text-center">
                                  {item.quantity}
                                </span>
                                
                                <button
                                  onClick={() => updateQuantity(product.id, item.quantity + 1)}
                                  disabled={updating}
                                  className="w-8 h-8 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewProduct(product.url)}
                                  className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-all"
                                  title="View Product"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => removeFromCart(product.id)}
                                  disabled={updating}
                                  className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/20 rounded-lg text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Remove from Cart"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cart Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 sticky top-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-white/80">
                      <span>Items ({cartSummary.totalItems})</span>
                      <span>₹{cartSummary.totalAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-white/80">
                      <span>GST</span>
                      <span>₹{(cartSummary.totalAmount * 0.18).toFixed(2)}</span>
                    </div>
                    
                    <hr className="border-white/20" />
                    
                    <div className="flex justify-between text-xl font-bold text-white">
                      <span>Total</span>
                      <span className="text-emerald-300">
                        ₹{(cartSummary.totalAmount * 1.08).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/query')}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-[1.02]"
                    >
                      Continue Shopping
                    </button>
                  </div>

                  {/* Cart Actions */}
                  {cartItems.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <button
                        onClick={clearCart}
                        disabled={updating}
                        className="w-full text-red-400 hover:text-red-300 py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating ? 'Updating...' : 'Clear Cart'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
      <footer className="relative z-10 w-full bg-black/30 backdrop-blur-md border-t border-emerald-500/20 mt-12 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-center md:text-left space-y-4 md:space-y-0">

          {/* Copyright */}
          <p className="text-sm text-emerald-200">
            © 2025 <span className="font-semibold">VECTOR CART</span>. <br />Maintained by Jaiwin Mehta.
          </p>

          {/* Social Links */}
          <div className="flex items-center space-x-6">
            <h3 className="text-sm text-emerald-200 font-semibold">Connect with me :</h3>
            <a
              href="https://www.linkedin.com/in/jaiwin-mehta-134978199"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:text-emerald-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="w-6 h-6">
                <path d="M20.451 20.451h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.356V9h3.414v1.561h.049c.476-.9 1.637-1.852 3.368-1.852 3.6 0 4.268 2.37 4.268 5.455v6.287zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.451H3.56V9h3.554v11.451zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.225.792 24 1.771 24h20.451C23.2 24 24 23.225 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
              </svg>
            </a>
            <a
              href="https://github.com/jaiwin14"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:text-emerald-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="w-6 h-6">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.744.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.107-.776.418-1.305.762-1.604-2.665-.3-5.466-1.335-5.466-5.931 0-1.312.469-2.381 1.235-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.018.005 2.042.138 3.003.404 2.292-1.552 3.298-1.23 3.298-1.23.653 1.653.242 2.873.118 3.176.77.84 1.233 1.909 1.233 3.221 0 4.609-2.803 5.628-5.475 5.922.43.372.823 1.102.823 2.222v3.293c0 .321.218.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Cart;