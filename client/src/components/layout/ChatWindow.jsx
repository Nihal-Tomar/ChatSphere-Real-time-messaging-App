import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, Search, MoreVertical, ChevronLeft, Pin } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useSocketStore } from '../../store/socketStore';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import Avatar from '../ui/Avatar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

export default function ChatWindow({ chat, onBack }) {
  const { user } = useAuthStore();
  const { messages, fetchMessages, hasMore, isLoadingMessages, typingUsers, markChatAsRead } = useChatStore();
  const { onlineUsers } = useSocketStore();

  const chatMessages = messages[chat._id] || [];
  const { ref: scrollRef, scrollToBottom } = useAutoScroll([chatMessages.length]);

  const isGroup = chat.isGroup;
  const otherUser = !isGroup ? chat.participants?.find((p) => p._id !== user?._id) : null;
  const chatName = isGroup ? chat.name : otherUser?.displayName || otherUser?.username;
  const isOtherOnline = !isGroup && onlineUsers.includes(otherUser?._id);
  const typingSet = typingUsers[chat._id] || new Set();
  const isTyping = typingSet.size > 0;

  useEffect(() => {
    fetchMessages(chat._id, true);
    markChatAsRead(chat._id);
  }, [chat._id]);

  // Infinite scroll — load older messages when top sentinel enters viewport
  const loadMore = useCallback(() => {
    if (hasMore[chat._id] && !isLoadingMessages) fetchMessages(chat._id);
  }, [chat._id, hasMore, isLoadingMessages]);

  const topSentinelRef = useIntersectionObserver(loadMore);

  // Group messages by date
  const groupedMessages = groupByDate(chatMessages);

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-surface-800 border-b border-slate-100 dark:border-slate-700 shadow-sm flex-shrink-0">
        <button onClick={onBack} className="btn-icon lg:hidden -ml-1">
          <ChevronLeft size={20} />
        </button>

        {isGroup ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
            {chatName?.[0]}
          </div>
        ) : (
          <Avatar user={{ ...otherUser, status: isOtherOnline ? 'online' : 'offline' }} size="md" showStatus />
        )}

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{chatName}</h2>
          <p className="text-xs text-slate-400">
            {isGroup
              ? `${chat.participants?.length} members`
              : isOtherOnline ? '🟢 Online' : otherUser?.status === 'away' ? '🟡 Away' : '⚫ Offline'}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button className="btn-icon" title="Voice call"><Phone size={17} /></button>
          <button className="btn-icon" title="Video call"><Video size={17} /></button>
          <button className="btn-icon" title="Search"><Search size={17} /></button>
          <button className="btn-icon" title="More"><MoreVertical size={17} /></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-chat-pattern dark:bg-none">
        {/* Top sentinel for infinite scroll */}
        <div ref={topSentinelRef} className="h-1" />

        {isLoadingMessages && chatMessages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}

        {hasMore[chat._id] && chatMessages.length > 0 && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-slate-300/30 border-t-slate-400 rounded-full animate-spin" />
          </div>
        )}

        <AnimatePresence initial={false}>
          {groupedMessages.map(({ date, msgs }) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-400 bg-surface-50 dark:bg-surface-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  {date}
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>
              {msgs.map((msg, i) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  chat={chat}
                  isOwn={msg.sender?._id === user?._id}
                  showAvatar={isGroup && msg.sender?._id !== msgs[i - 1]?.sender?._id}
                />
              ))}
            </div>
          ))}
        </AnimatePresence>

        {isTyping && <TypingIndicator users={[...typingSet]} chat={chat} />}
      </div>

      {/* Input */}
      <MessageInput chat={chat} onMessageSent={scrollToBottom} />
    </div>
  );
}

function groupByDate(messages) {
  const groups = {};
  messages.forEach((msg) => {
    const d = new Date(msg.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label;
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  });
  return Object.entries(groups).map(([date, msgs]) => ({ date, msgs }));
}
