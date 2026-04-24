import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/layout/Sidebar';
import ChatWindow from '../components/layout/ChatWindow';

export default function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { activeChat, setActiveChat, chats } = useChatStore();
  const { user } = useAuthStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);

  // Connect socket
  useSocket();

  // Sync activeChat with URL param
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const found = chats.find((c) => c._id === chatId);
      if (found) setActiveChat(found);
    }
  }, [chatId, chats]);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    navigate(`/chat/${chat._id}`);
    setMobileSidebarOpen(false);
  };

  const handleBack = () => {
    setMobileSidebarOpen(true);
    setActiveChat(null);
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-900">
      {/* Sidebar */}
      <div className={`
        ${mobileSidebarOpen ? 'flex' : 'hidden'} lg:flex
        w-full lg:w-80 xl:w-96 flex-shrink-0 h-full
        border-r border-slate-200 dark:border-slate-800
      `}>
        <Sidebar onSelectChat={handleSelectChat} />
      </div>

      {/* Main */}
      <div className={`
        ${!mobileSidebarOpen ? 'flex' : 'hidden'} lg:flex
        flex-1 h-full overflow-hidden
      `}>
        {activeChat ? (
          <ChatWindow chat={activeChat} onBack={handleBack} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500/20 to-primary-700/20 flex items-center justify-center"
      >
        <MessageSquare size={40} className="text-primary-500" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Your conversations</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-xs">
          Select a conversation from the sidebar or click + to start a new one.
        </p>
      </motion.div>
    </div>
  );
}
