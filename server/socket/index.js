import User from '../models/User.model.js';
import Chat from '../models/Chat.model.js';
import { socketAuth } from './socketAuth.js';

// Map: userId -> Set of socketIds (supports multiple tabs)
const onlineUsers = new Map();

export const initSocketHandlers = (io) => {
  // Apply JWT auth middleware
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🟢 Socket connected: ${socket.user.username} (${socket.id})`);

    // ── Track online presence ──────────────────────────────────────────────────
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Update DB status to online
    await User.findByIdAndUpdate(userId, { status: 'online', lastSeen: new Date() });

    // Join all user's chat rooms
    const chats = await Chat.find({ participants: userId }).select('_id');
    chats.forEach((chat) => socket.join(chat._id.toString()));

    // Broadcast online status to contacts
    broadcastPresence(io, userId, 'online');

    // Send current online users list to newly connected client
    socket.emit('online_users', [...onlineUsers.keys()]);

    // ── Join a specific chat room ──────────────────────────────────────────────
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      socket.emit('joined_chat', { chatId });
    });

    // ── Leave a chat room ──────────────────────────────────────────────────────
    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
    });

    // ── Typing indicators ──────────────────────────────────────────────────────
    socket.on('typing_start', ({ chatId }) => {
      socket.to(chatId).emit('user_typing', {
        chatId,
        userId,
        username: socket.user.username,
        displayName: socket.user.displayName,
      });
    });

    socket.on('typing_stop', ({ chatId }) => {
      socket.to(chatId).emit('user_stopped_typing', { chatId, userId });
    });

    // ── Message delivered acknowledgement ──────────────────────────────────────
    socket.on('message_delivered', async ({ messageId, chatId }) => {
      io.to(chatId).emit('message_status_update', {
        messageId,
        status: 'delivered',
        userId,
      });
    });

    // ── Read receipt ───────────────────────────────────────────────────────────
    socket.on('messages_seen', async ({ chatId }) => {
      io.to(chatId).emit('messages_read', { chatId, userId, readAt: new Date() });
    });

    // ── Disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔴 Socket disconnected: ${socket.user.username} (${socket.id})`);
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          const now = new Date();
          await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: now });
          broadcastPresence(io, userId, 'offline', now);
        }
      }
    });

    // ── Error handling ─────────────────────────────────────────────────────────
    socket.on('error', (err) => {
      console.error(`Socket error [${socket.user?.username}]:`, err.message);
    });
  });
};

/**
 * Broadcast online/offline status to all rooms the user is part of
 */
const broadcastPresence = async (io, userId, status, lastSeen = new Date()) => {
  const chats = await Chat.find({ participants: userId }).select('_id');
  chats.forEach((chat) => {
    io.to(chat._id.toString()).emit('presence_update', { userId, status, lastSeen });
  });
};

export const getOnlineUsers = () => [...onlineUsers.keys()];
