import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';
import Avatar from '../ui/Avatar';
import { formatChatTime } from '../../utils/formatDate';

export default function ChatList({ searchQuery = '', activeChatId, onSelectChat }) {
  const { chats, isLoadingChats } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter((c) => {
      if (c.isGroup) return c.name?.toLowerCase().includes(q);
      const other = c.participants?.find((p) => p._id !== user?._id);
      return other?.displayName?.toLowerCase().includes(q) || other?.username?.toLowerCase().includes(q);
    });
  }, [chats, searchQuery, user?._id]);

  const getChatDisplay = (chat) => {
    if (chat.isGroup) return { name: chat.name, avatar: null, isGroup: true, user: null };
    const other = chat.participants?.find((p) => p._id !== user?._id) || chat.participants?.[0];
    return { name: other?.displayName || other?.username, avatar: null, isGroup: false, user: other };
  };

  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    if (chat.lastMessage.isDeleted) return '🚫 Message deleted';
    const isMe = chat.lastMessage.sender?._id === user?._id;
    const prefix = isMe ? 'You: ' : '';
    if (chat.lastMessage.type === 'image') return `${prefix}📷 Photo`;
    if (chat.lastMessage.type === 'raw') return `${prefix}📎 File`;
    if (chat.lastMessage.type === 'audio') return `${prefix}🎵 Audio`;
    return `${prefix}${chat.lastMessage.content?.substring(0, 45)}` + (chat.lastMessage.content?.length > 45 ? '…' : '');
  };

  if (isLoadingChats) {
    return (
      <div className="p-3 space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-xl animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center px-4">
        <p className="text-slate-400 text-sm">{searchQuery ? 'No chats match your search.' : 'No conversations yet.'}</p>
        <p className="text-slate-300 dark:text-slate-500 text-xs mt-1">{!searchQuery && 'Click + to start a new chat'}</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-0.5">
      <AnimatePresence initial={false}>
        {filtered.map((chat) => {
          const { name, isGroup, user: otherUser } = getChatDisplay(chat);
          const isActive = chat._id === activeChatId;
          const isOnline = !isGroup && onlineUsers.includes(otherUser?._id);

          return (
            <motion.button
              key={chat._id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onSelectChat(chat)}
              className={`chat-item w-full text-left ${isActive ? 'chat-item-active' : ''}`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {isGroup ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {name?.[0]?.toUpperCase()}
                  </div>
                ) : (
                  <Avatar user={{ ...otherUser, status: isOnline ? 'online' : 'offline' }} size="md" showStatus />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold truncate ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-slate-900 dark:text-slate-100'}`}>
                    {name}
                  </span>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {chat.lastMessage?.createdAt ? formatChatTime(chat.lastMessage.createdAt) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{getLastMessagePreview(chat)}</p>
                  {chat.unreadCount > 0 && (
                    <span className="badge flex-shrink-0">{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</span>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
