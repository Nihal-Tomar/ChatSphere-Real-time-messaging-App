import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

/**
 * Socket.IO authentication middleware
 * Verifies the JWT passed in the handshake auth object
 */
export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication token missing'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id username displayName avatar status');
    if (!user) return next(new Error('User not found'));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
};
