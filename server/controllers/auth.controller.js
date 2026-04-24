import { body } from 'express-validator';
import User from '../models/User.model.js';
import { generateToken, generateRefreshToken } from '../utils/jwt.utils.js';
import ApiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import { redisSet, redisGet, redisDel } from '../config/redis.js';

// ─── Register ────────────────────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new ApiError(
        existingUser.email === email ? 'Email already in use.' : 'Username already taken.',
        409
      );
    }

    const user = await User.create({ username, email, password, displayName: displayName || username });
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push(refreshToken);
    await user.save({ validateBeforeSave: false });

    // Cache basic user data
    await redisSet(`user:${user._id}`, user.toPublicProfile(), 3600);

    return apiResponse(res, 201, 'Account created successfully', {
      user: user.toPublicProfile(),
      token,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError('Invalid email or password.', 401);
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push(refreshToken);
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    await redisSet(`user:${user._id}`, user.toPublicProfile(), 3600);

    return apiResponse(res, 200, 'Logged in successfully', {
      user: user.toPublicProfile(),
      token,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
      user.status = 'offline';
      user.lastSeen = new Date();
      await user.save({ validateBeforeSave: false });
      await redisDel(`user:${user._id}`);
    }
    return apiResponse(res, 200, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError('Refresh token required.', 400);

    const { verifyToken } = await import('../utils/jwt.utils.js');
    const decoded = verifyToken(refreshToken);

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      throw new ApiError('Invalid refresh token.', 401);
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    return apiResponse(res, 200, 'Token refreshed', { token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

// ─── Get current user ────────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    return apiResponse(res, 200, 'User fetched', { user: req.user.toPublicProfile() });
  } catch (err) {
    next(err);
  }
};

// ─── Validators ──────────────────────────────────────────────────────────────
export const registerValidators = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];
