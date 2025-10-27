import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import vectorcartLogo from '../assets/vectorcartLogo.png';

const RippleGrid = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef();
  const mousePos = useRef({ x: 0, y: 0 });
  const ripples = useRef([]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const doc = document.documentElement;
      const body = document.body;

      const width = doc.clientWidth;
      const height = Math.max(
        body.scrollHeight,
        doc.scrollHeight,
        body.offsetHeight,
        doc.offsetHeight,
        doc.clientHeight
      );

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);
    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(document.body);
    
    // Grid properties
    const gridSize = 40;
    const maxRipples = 5;
    
    const handleMouseMove = (e) => {
      mousePos.current = {
        x: e.clientX,
        y: e.clientY
      };
    };
    
    const handleClick = (e) => {
      const newRipple = {
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 150,
        alpha: 1,
        speed: 3
      };
      
      ripples.current.push(newRipple);
      if (ripples.current.length > maxRipples) {
        ripples.current.shift();
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.lineWidth = 1;
      
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Draw ripples
      ripples.current = ripples.current.filter(ripple => {
        ripple.radius += ripple.speed;
        ripple.alpha = 1 - (ripple.radius / ripple.maxRadius);
        
        if (ripple.alpha <= 0) return false;
        
        ctx.strokeStyle = `rgba(16, 185, 129, ${ripple.alpha * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Enhanced grid effect around ripple
        const gridX = Math.floor(ripple.x / gridSize) * gridSize;
        const gridY = Math.floor(ripple.y / gridSize) * gridSize;
        
        for (let i = -2; i <= 2; i++) {
          for (let j = -2; j <= 2; j++) {
            const x = gridX + i * gridSize;
            const y = gridY + j * gridSize;
            const distance = Math.sqrt((x - ripple.x) ** 2 + (y - ripple.y) ** 2);
            
            if (distance < ripple.radius && distance > ripple.radius - 20) {
              ctx.strokeStyle = `rgba(6, 182, 212, ${ripple.alpha * 0.6})`;
              ctx.lineWidth = 1.5;
              ctx.strokeRect(x - gridSize/2, y - gridSize/2, gridSize, gridSize);
            }
          }
        }
        
        return true;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
      ro.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: ''
  });

  const API_BASE_URL = 'https://vector-cart.onrender.com/api';

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload);

      if (response.data.token) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Navigate to query page
        navigate('/query');
      }
    } catch (error) {
      setError(
        error.response?.data?.error || 
        'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      fullname: '',
      email: '',
      password: ''
    });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-emerald-900 relative overflow-hidden">
      <RippleGrid />
      <div className="absolute inset-0 opacity-20" style={{ zIndex: 2 }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.3) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)`
        }}></div>
      </div>

      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-12">
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleBackToHome}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <img 
              src={vectorcartLogo} 
              alt="VectorCart Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-white text-xl font-bold tracking-wide">VECTOR CART</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[85vh] px-6">
        <div className="w-full max-w-md">
          {/* Login/Register Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Join VECTOR CART'}
              </h1>
              <p className="text-white/70">
                {isLogin 
                  ? 'Sign in to continue your AI shopping spree' 
                  : 'Create your account to get started'
                }
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name (Register only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type="text"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleInputChange}
                      required={!isLogin}
                      placeholder="Enter your full name"
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-white/60 text-xs">
                    Password must be at least 6 characters long
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white py-3 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                  </div>
                ) : (
                  isLogin ? 'Login' : 'Register'
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-8 text-center">
              <p className="text-white/70">
                {isLogin ? "Don't have an account yet? " : "Already Registered? "}
                <button
                  onClick={toggleMode}
                  className="text-emerald-300 hover:text-emerald-200 font-medium transition-colors underline"
                >
                  {isLogin ? 'Register' : 'Login'}
                </button>
              </p>
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm mb-4">
              Experience the power of AI-driven shopping
            </p>
            <div className="flex justify-center space-x-6 text-white/50 text-xs">
              <span>🔍 Semantic Search</span>
              <span>🤖 RAG based Instant Results</span>
            </div>
          </div>
        </div>
      </div>
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

export default Login;