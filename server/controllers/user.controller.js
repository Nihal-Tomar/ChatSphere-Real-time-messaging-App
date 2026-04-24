import User from '../models/User.model.js';
import ApiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { redisSet, redisDel } from '../config/redis.js';

// ─── Search users ─────────────────────────────────────────────────────────────
export const searchUsers = async (req, res, next) => {
  try {
    const { q = '', page = 1, limit = 20 } = req.query;
    if (!q.trim()) return apiResponse(res, 200, 'Search results', { users: [] });

    const skip = (Number(page) - 1) * Number(limit);
    const users = await User.find({
      $text: { $search: q },
      _id: { $ne: req.user._id },
    })
      .select('username displayName avatar status lastSeen bio')
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return apiResponse(res, 200, 'Search results', { users });
  } catch (err) {
    next(err);
  }
};

// ─── Get user by ID ───────────────────────────────────────────────────────────
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username displayName avatar status lastSeen bio statusMessage')
      .lean();
    if (!user) throw new ApiError('User not found.', 404);
    return apiResponse(res, 200, 'User found', { user });
  } catch (err) {
    next(err);
  }
};

// ─── Update profile ───────────────────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const { displayName, bio, statusMessage } = req.body;
    const user = await User.findById(req.user._id);

    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (statusMessage !== undefined) user.statusMessage = statusMessage;

    await user.save();
    await redisSet(`user:${user._id}`, user.toPublicProfile(), 3600);

    return apiResponse(res, 200, 'Profile updated', { user: user.toPublicProfile() });
  } catch (err) {
    next(err);
  }
};

// ─── Upload avatar ────────────────────────────────────────────────────────────
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError('No file uploaded.', 400);

    const user = await User.findById(req.user._id);

    // Delete old avatar if present
    if (user.avatar.publicId) {
      await deleteFromCloudinary(user.avatar.publicId);
    }

    const result = await uploadToCloudinary(req.file.buffer, 'chatsphere/avatars', 'image');
    user.avatar = { url: result.secure_url, publicId: result.public_id };
    await user.save();
    await redisSet(`user:${user._id}`, user.toPublicProfile(), 3600);

    return apiResponse(res, 200, 'Avatar updated', { avatar: user.avatar });
  } catch (err) {
    next(err);
  }
};

// ─── Update status ────────────────────────────────────────────────────────────
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['online', 'offline', 'away', 'busy'];
    if (!allowed.includes(status)) throw new ApiError('Invalid status value.', 400);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { status, lastSeen: new Date() },
      { new: true }
    );
    await redisDel(`user:${user._id}`);

    return apiResponse(res, 200, 'Status updated', { status: user.status });
  } catch (err) {
    next(err);
  }
};

// ─── Block / Unblock ──────────────────────────────────────────────────────────
export const blockUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user._id.toString()) throw new ApiError('Cannot block yourself.', 400);

    const user = await User.findById(req.user._id);
    const isBlocked = user.blockedUsers.includes(targetId);

    if (isBlocked) {
      user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== targetId);
    } else {
      user.blockedUsers.push(targetId);
    }

    await user.save();
    return apiResponse(res, 200, isBlocked ? 'User unblocked' : 'User blocked', {
      blocked: !isBlocked,
    });
  } catch (err) {
    next(err);
  }
};
