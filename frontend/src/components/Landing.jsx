import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowDown, Search, Zap, ShoppingCart } from 'lucide-react';
import vectorcartLogo from '../assets/vectorcartLogo.png';


// Ripple Grid Component
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
              ctx.strokeRect(x - gridSize / 2, y - gridSize / 2, gridSize, gridSize);
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

const Landing = () => {
  const navigate = useNavigate();
  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-emerald-900 relative overflow-hidden">
      {/* Ripple Grid Background */}
      <RippleGrid />

      {/* Additional Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{ zIndex: 2 }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.3) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)`
        }}></div>
      </div>

      {/* Header */}
      <nav className="relative z-10 mb-12 flex items-center justify-between p-6 lg:px-12">
        <div className="flex items-center space-x-2">
          <img 
            src={vectorcartLogo} 
            alt="VectorCart Logo" 
            className="w-8 h-8 object-contain"
          />
          <span className="text-white text-xl font-bold tracking-wide">VECTOR CART</span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleGetStarted}
            className="hidden lg:block bg-emerald-500 hover:bg-emerald-600 text-white px-7 py-2 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
            Get Started
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight max-w-5xl">
          Find Exactly What You Want With
          <br />
          <span className="text-emerald-300">AI powered search</span>
        </h1>

        <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl leading-relaxed">
          VectorCart provides solutions to improve shopping efficiency by automating searches and enhancing the
          user experience with semantic product discovery.
        </p>

        {/* Visual Flow Section */}
        <div className="w-full max-w-7xl mx-auto mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_64px_auto_64px_auto] gap-8 lg:gap-8 items-center justify-items-center">

            {/* Step 1: Type your query */}
            <div className="group">
              <div className="bg-black/30 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-8 lg:w-[360px] hover:bg-black/40 hover:border-emerald-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-400 rounded-full flex items-center justify-center group-hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/30">
                    <Search className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Drop in your product query</h3>
                  <p className="text-emerald-200 text-center leading-relaxed">
                    Tell us what product you are looking for.
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center h-full">
              <ArrowRight className="w-8 h-8 text-emerald-300 animate-pulse" />
            </div>
            <div className="flex lg:hidden justify-center py-4">
              <ArrowDown className="w-8 h-8 text-emerald-300 animate-pulse" />
            </div>

            {/* Step 2: VectorCart finds matches */}
            <div className="group">
              <div className="bg-black/30 backdrop-blur-md border border-teal-500/30 rounded-2xl p-8 lg:w-[360px] hover:bg-black/40 hover:border-teal-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-teal-500/20">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center group-hover:bg-teal-300 transition-colors shadow-lg shadow-teal-500/30">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Semantic search with RAG</h3>
                  <p className="text-emerald-200 text-center leading-relaxed">
                    RAG connects queries with knowledge.
                  </p>
                </div>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="hidden lg:flex items-center justify-center h-full">
              <ArrowRight className="w-8 h-8 text-emerald-300 animate-pulse" />
            </div>
            <div className="flex lg:hidden justify-center py-4">
              <ArrowDown className="w-8 h-8 text-emerald-300 animate-pulse" />
            </div>

            {/* Step 3: Get smarter results */}
            <div className="group">
              <div className="bg-black/30 backdrop-blur-md border border-green-500/30 rounded-2xl p-8 lg:w-[360px] hover:bg-black/40 hover:border-green-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center group-hover:bg-green-300 transition-colors shadow-lg shadow-green-500/30">
                    <ShoppingCart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Find Your Desired Results</h3>
                  <p className="text-emerald-200 text-center leading-relaxed">
                    Fetches you with top relevant results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Get Started Button at bottom */}
        <div className="relative z-10 w-full flex justify-center lg:hidden px-6 mt-2 mb-12">
          <button
            onClick={handleGetStarted}
            className="w-full max-w-sm bg-emerald-500 hover:bg-emerald-600 text-white px-7 py-3 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
            Get Started
          </button>
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

export default Landing;