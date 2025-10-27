import React, { useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

const Notification = ({ 
  message, 
  type = 'success', 
  isVisible, 
  onClose, 
  duration = 3000,
  position = 'bottom-center'
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/20 border-emerald-400/30';
      case 'error':
        return 'bg-red-500/20 border-red-400/30';
      case 'info':
        return 'bg-blue-500/20 border-blue-400/30';
      default:
        return 'bg-emerald-500/20 border-emerald-400/30';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-center':
        return 'top-6 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-6 right-6';
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-center':
      default:
        return 'bottom-6 left-1/2 transform -translate-x-1/2';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 animate-slide-up`}>
      <div className={`${getBackgroundColor()} backdrop-blur-md border rounded-xl p-4 shadow-2xl max-w-sm mx-auto`}>
        <div className="flex items-center space-x-3">
          {getIcon()}
          <p className="text-white font-medium flex-1">{message}</p>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;