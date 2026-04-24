import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import ApiError from '../utils/apiError.js';

/**
 * Protect routes — verifies JWT and attaches req.user
 */
export const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new ApiError('Not authenticated. Please log in.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password -refreshTokens');
    if (!user) {
      return next(new ApiError('User no longer exists.', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new ApiError('Invalid token.', 401));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError('Token expired. Please log in again.', 401));
    }
    next(err);
  }
};

/**
 * Restrict access by role (for future admin features)
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

/**
 * Optional auth — attaches user if token present, doesn't fail if not
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch {
    // silently ignore
  }
  next();
};
