import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, Search, Settings, LogOut, Plus, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import Avatar from '../ui/Avatar';
import ThemeToggle from '../ui/ThemeToggle';
import ChatList from './ChatList';
import NewChatModal from './NewChatModal';
import toast from 'react-hot-toast';

export default function Sidebar({ onSelectChat }) {
  const { user, logout } = useAuthStore();
  const { fetchChats } = useChatStore();
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { chatId } = useParams();
  const navigate = useNavigate();

  useEffect(() => { fetchChats(); }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  return (
    <>
      <aside className="flex h-full flex-col w-full bg-white dark:bg-surface-900 border-r border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">ChatSphere</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={() => setShowNewChat(true)} className="btn-icon" title="New chat">
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations…"
              className="input pl-9 py-2 text-sm bg-slate-50 dark:bg-surface-800 border-slate-200 dark:border-slate-700"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          <ChatList searchQuery={searchQuery} activeChatId={chatId} onSelectChat={onSelectChat} />
        </div>

        {/* User Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/profile')} className="flex-1 flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Avatar user={user} size="sm" showStatus />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.displayName}</p>
              <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
            </div>
          </button>
          <button onClick={handleLogout} className="btn-icon text-slate-400 hover:text-red-500" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <NewChatModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} onSelectChat={onSelectChat} />
    </>
  );
}
