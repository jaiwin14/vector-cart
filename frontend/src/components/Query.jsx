import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, LogOut, ShoppingCart, ExternalLink, Plus, Star } from 'lucide-react';
import axios from 'axios';
import vectorcartLogo from '../assets/vectorcartLogo.png';
import Notification from './Notification';

// Split Text Animation Component
const SplitText = ({ children, delay = 0, duration = 0.5 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const text = React.useMemo(() => {
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) {
      const parts = children.filter((c) => typeof c === 'string');
      return parts.length ? parts.join('') : null;
    }
    return null;
  }, [children]);

  if (text == null) {
    return <span>{children}</span>;
  }

  const letters = text.split('').map((letter, index) => (
    <span
      key={index}
      className={`inline-block transform transition-all duration-${Math.floor(duration * 1000)} ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      {letter === ' ' ? '\u00A0' : letter}
    </span>
  ));

  return <span>{letters}</span>;
};

// Orb Background Component
const OrbBackground = ({ children }) => {
  return (
    <div className="relative">
      {/* Animated Orb */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 md:w-[600px] md:h-[600px] opacity-30">
        <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-4 left-4 w-full h-full rounded-full bg-gradient-to-l from-cyan-400 via-blue-500 to-purple-600 blur-2xl animate-bounce-slow opacity-70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

const Query = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showQuery, setShowQuery] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false); // Changed from true to false
  const [aiResponse, setAiResponse] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const API_BASE_URL = 'https://vector-cart.onrender.com/api';

  // Helper function to parse image URL from JSON array or string
  const parseImageUrl = (imageData) => {
    if (!imageData) return null;

    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(imageData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const url = parsed[0];
        // Convert HTTP to HTTPS
        let processedUrl = url.startsWith('http://') ? url.replace('http://', 'https://') : url;
        
        // Use backend proxy to avoid CORS issues
        return `${API_BASE_URL}/products/image-proxy?url=${encodeURIComponent(processedUrl)}`;
      }
    } catch (error) {
      // If parsing fails, treat as single URL
      if (typeof imageData === 'string' && imageData.startsWith('http')) {
        let processedUrl = imageData.startsWith('http://') ? imageData.replace('http://', 'https://') : imageData;
        return `${API_BASE_URL}/products/image-proxy?url=${encodeURIComponent(processedUrl)}`;
      }
    }

    return null;
  };

  // Get user data on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Handle welcome message timing
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
        setTimeout(() => setShowQuery(true), 500);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev === 0 ? 1 : 0));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/products/search`,
        { query: searchQuery, limit: 12 },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setProducts(response.data.products || []);
      setAiResponse(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setNotification({
        show: true,
        message: 'Error searching products. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (item) => {
    try {
      // Debug: Log the item structure
      console.log('Item being added to cart:', item);
      console.log('Product data:', item.product);

      // Create a product object with required fields
      const productData = {
        ...item.product,
        // Generate an ID from title and price if not present
        id: item.product.id || `${item.product.title?.replace(/[^a-zA-Z0-9]/g, '')}_${item.product.price}`.toLowerCase(),
        // Ensure price is a number
        price: parseFloat(item.product.price) || 0,
        // Ensure title exists
        title: item.product.title || 'Unknown Product'
      };

      // Validate that required fields exist
      if (!productData.id || !productData.title || !productData.price) {
        console.error('Missing required product fields:', {
          hasId: !!productData.id,
          hasTitle: !!productData.title,
          hasPrice: !!productData.price
        });

        setNotification({
          show: true,
          message: 'Product data is incomplete. Please try again.',
          type: 'error'
        });
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/user/cart`,
        {
          product: productData,
          quantity: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Show success notification
      setNotification({
        show: true,
        message: 'Product has been added to your cart',
        type: 'success'
      });

    } catch (error) {
      console.error('Add to cart error:', error);

      // Show error notification
      setNotification({
        show: true,
        message: 'Error adding product to cart. Please try again.',
        type: 'error'
      });
    }
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
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
      {/* Header */}
      <nav className="relative z-20 flex items-center justify-between p-6 lg:px-12">
        <div className="flex items-center space-x-2">
          <img
            src={vectorcartLogo}
            alt="VectorCart Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="text-white text-xl font-bold tracking-wide">VECTOR CART</span>
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
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-white/80 text-sm">Welcome back,</p>
                <p className="text-white font-medium">{user.fullname}</p>
              </div>
              <button
                onClick={() => navigate('/cart')}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center space-x-3"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Your Cart</span>
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

      {/* Main Content with Orb Background */}
      <OrbBackground>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-6">

          {/* Welcome Message */}
          {showWelcome && (
            <div className={`text-center mb-8 transition-all duration-1000 transform ${showWelcome ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'
              }`}>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
                <SplitText delay={500}>
                  Hello, {user.fullname}
                </SplitText>
              </h1>
            </div>
          )}

          {/* Query Message */}
          {showQuery && (
            <div className={`text-center mb-12 transition-all duration-1000 transform ${showQuery ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
              }`}>
              <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-snug">
                <SplitText delay={0}>
                  Share your product needs
                </SplitText>
              </h2>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type in here"
                    className="w-full px-6 py-3 sm:py-4 pl-12 pr-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white text-base sm:text-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                  <button
                    type="submit"
                    disabled={loading || !searchQuery.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white px-4 py-2 rounded-xl font-medium transition-all disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* AI Response Summary */}
          {aiResponse && !loading && (
            <div className="w-full max-w-4xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3">AI Analysis</h3>
                <p className="text-white/80 mb-4">{aiResponse.explanation}</p>
                <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-lg p-4">
                  <p className="text-emerald-200 font-medium">{aiResponse.summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center">
              {/* Enhanced Ecommerce Loading Animation */}
              <div className="relative w-20 h-20 mx-auto mt-12 mb-6">
                {/* Main shopping bag */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-12 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-lg shadow-lg">
                  {/* Bag opening */}
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-14 h-3 bg-gradient-to-b from-emerald-300 to-emerald-500 rounded-t-lg"></div>
                  {/* Bag handles */}
                  <div className="absolute -top-2 left-2 w-3 h-2 bg-emerald-300 rounded-full"></div>
                  <div className="absolute -top-2 right-2 w-3 h-2 bg-emerald-300 rounded-full"></div>
                </div>
                
                {/* Floating products with different animations */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-emerald-300 rounded-full animate-bounce shadow-lg"></div>
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-emerald-200 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.3s' }}></div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.6s' }}></div>
                
                {/* Sparkle effects */}
                <div className="absolute top-2 left-4 w-1 h-1 bg-yellow-300 rounded-full animate-ping"></div>
                <div className="absolute top-4 right-3 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-2 left-3 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
              </div>

              <p className="text-white/70 transition-opacity duration-500 ease-in-out">
                {loadingStep === 0
                  ? "Semantic Search is being performed..."
                  : "Fetching products via RAG..."}
              </p>
            </div>
          )}


          {/* Products Grid */}
          {products.length > 0 && !loading && (
            <div className="w-full max-w-7xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                Found {products.length} Products
              </h3>

              <div className="grid grid-cols-1 gap-6">
                {products.map((item, index) => {
                  const product = item.product;
                  return (
                    <div
                      key={product.id || index}
                      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Product Details */}
                        <div className="flex-1 space-y-4">
                          {/* Title and Rating */}
                          <div>
                            <h4 className="text-xl font-bold text-white mb-2 line-clamp-2">
                              {product.title}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-white/80">
                                  {product.rating || 'N/A'}
                                </span>
                                <span className="text-white/60">
                                  ({product.reviewCount || 0} reviews)
                                </span>
                              </div>
                              <span className="text-emerald-300 font-semibold">
                                ₹{product.price}
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-white/50 line-through">
                                  ₹{product.originalPrice}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* AI Recommendation */}
                          {item.recommendation && (
                            <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-lg p-4">
                              <h5 className="text-emerald-300 font-semibold mb-2">Why this product?</h5>
                              <p className="text-white/80 text-sm mb-2">{item.recommendation.reason}</p>
                              <p className="text-emerald-200 text-sm font-medium">{item.recommendation.keyBenefits}</p>
                            </div>
                          )}

                          {/* Product Info */}
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {product.category && (
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                                  {product.category}
                                </span>
                              )}
                              {product.brand && (
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                                  {product.brand}
                                </span>
                              )}
                              {product.discount > 0 && (
                                <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">
                                  {product.discount}% OFF
                                </span>
                              )}
                            </div>

                            {product.description && (
                              <p className="text-white/70 text-sm line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={() => handleViewProduct(product.url)}
                              className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>View Product</span>
                            </button>

                            <button
                              onClick={() => handleAddToCart(item)}
                              className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add to Cart</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Review Summary */}
                      {item.reviewSummary && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-white/60 text-sm italic">
                            "{item.reviewSummary}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* No Results */}
              {products.length === 0 && aiResponse && (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-white mb-2">No Products Found</h3>
                  <p className="text-white/70">Try adjusting your search query or using different keywords.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </OrbBackground>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}

      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.show}
        onClose={closeNotification}
        duration={3000}
        position="bottom-center"
      />

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

export default Query;