import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { useChatStore } from '../store/chatStore';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export const useSocket = () => {
  const { token, user } = useAuthStore();
  const { setSocket, setOnlineUsers, addOnlineUser, removeOnlineUser } = useSocketStore();
  const { addMessage, updateMessage, removeMessage, updateReactions, setTyping, updateChatLastMessage, incrementUnread, activeChat } = useChatStore();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;
    setSocket(socket);

    socket.on('connect', () => console.log('🟢 Socket connected'));
    socket.on('disconnect', (reason) => console.log('🔴 Socket disconnected:', reason));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));

    // Presence
    socket.on('online_users', (users) => setOnlineUsers(users));
    socket.on('presence_update', ({ userId, status }) => {
      if (status === 'online') addOnlineUser(userId);
      else removeOnlineUser(userId);
    });

    // New message
    socket.on('new_message', (message) => {
      const chatId = message.chat;
      addMessage(chatId, message);
      updateChatLastMessage(chatId, message);
      if (activeChat?._id !== chatId) {
        incrementUnread(chatId);
        if (message.sender._id !== user._id) {
          toast(`💬 ${message.sender.displayName}: ${message.content?.substring(0, 50) || '📎 Attachment'}`, { duration: 3000 });
        }
      }
    });

    // Message edit / delete / react
    socket.on('message_edited', ({ messageId, content, editedAt, chat }) => updateMessage(chat, messageId, { content, isEdited: true, editedAt }));
    socket.on('message_deleted', ({ messageId, chatId }) => removeMessage(chatId, messageId));
    socket.on('message_reaction', ({ messageId, reactions, chatId }) => updateReactions(chatId, messageId, reactions));

    // Typing
    socket.on('user_typing', ({ chatId, userId }) => setTyping(chatId, userId, true));
    socket.on('user_stopped_typing', ({ chatId, userId }) => setTyping(chatId, userId, false));

    return () => {
      socket.disconnect();
      setSocket(null);
    };
  }, [token, user?._id]);

  return socketRef.current;
};
