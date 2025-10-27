const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Register new user
 */
const register = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    
    // Validate required fields
    if (!fullname || !email || !password) {
      return res.status(400).json({ 
        error: 'Please provide fullname, email, and password' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists with this email' 
      });
    }
    
    // Create new user
    const user = new User({
      fullname,
      email,
      password
    });
    
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    // Return user data and token
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        cart: user.cart
      },
      token
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Server error during registration' });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Please provide email and password' 
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    // Return user data and token
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        cart: user.cart
      },
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        cart: user.cart,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const { fullname } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update fields
    if (fullname) user.fullname = fullname;
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        cart: user.cart
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Please provide current password and new password' 
      });
    }
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error changing password' });
  }
};

/**
 * Logout (client-side token removal, but we can track it)
 */
const logout = async (req, res) => {
  try {
    // In a more complex setup, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
};