import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

// Cart Context
const CartContext = createContext();

// Cart Actions
const CART_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_CART: 'SET_CART',
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  SET_ERROR: 'SET_ERROR',
  SET_COUNT: 'SET_COUNT'
};

// Initial state
const initialState = {
  items: [],
  count: 0,
  totalAmount: 0,
  loading: false,
  error: null
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case CART_ACTIONS.SET_CART:
      return {
        ...state,
        items: action.payload.cart || [],
        count: action.payload.summary?.totalItems || 0,
        totalAmount: action.payload.summary?.totalAmount || 0,
        loading: false,
        error: null
      };
    
    case CART_ACTIONS.ADD_ITEM:
      return {
        ...state,
        items: action.payload.cart || state.items,
        count: action.payload.cartItemCount || state.count,
        totalAmount: action.payload.summary?.totalAmount || state.totalAmount
      };
    
    case CART_ACTIONS.UPDATE_ITEM:
      return {
        ...state,
        items: state.items.map(item =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    
    case CART_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.product.id !== action.payload.productId),
        count: Math.max(0, state.count - action.payload.quantity)
      };
    
    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: [],
        count: 0,
        totalAmount: 0
      };
    
    case CART_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case CART_ACTIONS.SET_COUNT:
      return { ...state, count: action.payload };
    
    default:
      return state;
  }
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const API_BASE_URL = 'https://vector-cart.onrender.com/api';

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Fetch cart from backend
  const fetchCart = async () => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      const response = await axios.get(`${API_BASE_URL}/user/cart`, {
        headers: getAuthHeaders()
      });
      
      dispatch({ type: CART_ACTIONS.SET_CART, payload: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'Error loading cart' });
      return null;
    }
  };

  // Add item to cart
  const addToCart = async (product, quantity = 1) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/user/cart`,
        { product, quantity },
        { 
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          }
        }
      );
      
      dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding to cart:', error);
      const errorMessage = error.response?.data?.error || 'Error adding to cart';
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/user/cart/${productId}`,
        { quantity },
        { 
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          }
        }
      );
      
      dispatch({ type: CART_ACTIONS.SET_CART, payload: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating quantity:', error);
      const errorMessage = error.response?.data?.error || 'Error updating quantity';
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/user/cart/${productId}`, {
        headers: getAuthHeaders()
      });
      
      dispatch({ type: CART_ACTIONS.SET_CART, payload: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error removing from cart:', error);
      const errorMessage = error.response?.data?.error || 'Error removing from cart';
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/user/cart`, {
        headers: getAuthHeaders()
      });
      
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error clearing cart:', error);
      const errorMessage = error.response?.data?.error || 'Error clearing cart';
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Get cart count
  const getCartCount = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user/cart/count`, {
        headers: getAuthHeaders()
      });
      
      dispatch({ type: CART_ACTIONS.SET_COUNT, payload: response.data.cartItemCount });
      return response.data.cartItemCount;
    } catch (error) {
      console.error('Error getting cart count:', error);
      return 0;
    }
  };

  // Load cart on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCart();
    }
  }, []);

  const value = {
    ...state,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;