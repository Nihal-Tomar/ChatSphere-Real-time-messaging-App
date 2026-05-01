import { useState, useEffect } from 'react';
import { Search, Users, MessageSquare } from 'lucide-react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import { useDebounce } from '../../hooks/useDebounce';
import { searchUsers } from '../../api/user.api';
import { accessOrCreateChat, createGroupChat } from '../../api/chat.api';
import { useChatStore } from '../../store/chatStore';
import toast from 'react-hot-toast';

export default function NewChatModal({ isOpen, onClose, onSelectChat }) {
  const [tab, setTab] = useState('dm');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const { addOrUpdateChat } = useChatStore();
  const debouncedQ = useDebounce(query, 350);

  const search = async () => {
    if (!debouncedQ) return setResults([]);
    try {
      const { data } = await searchUsers(debouncedQ);
      setResults(data.data.users);
    } catch { setResults([]); }
  };

  useEffect(() => { search(); }, [debouncedQ]);

  const startDM = async (u) => {
    setLoading(true);
    try {
      const { data } = await accessOrCreateChat(u._id);
      addOrUpdateChat(data.data.chat);
      onSelectChat(data.data.chat);
      onClose();
    } catch (err) {
      toast.error('Could not open chat.');
    } finally { setLoading(false); }
  };

  const createGroup = async () => {
    if (!groupName.trim()) return toast.error('Enter a group name.');
    if (selected.length < 2) return toast.error('Select at least 2 members.');
    setLoading(true);
    try {
      const { data } = await createGroupChat({ name: groupName, participantIds: selected.map((u) => u._id) });
      addOrUpdateChat(data.data.chat);
      onSelectChat(data.data.chat);
      onClose();
    } catch { toast.error('Could not create group.'); }
    finally { setLoading(false); }
  };

  const toggleSelect = (u) => setSelected((s) => s.find((x) => x._id === u._id) ? s.filter((x) => x._id !== u._id) : [...s, u]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Conversation" size="md">
      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-surface-700 rounded-xl p-1 mb-4">
        {[{ id: 'dm', icon: <MessageSquare size={14} />, label: 'Direct Message' }, { id: 'group', icon: <Users size={14} />, label: 'Group Chat' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white dark:bg-surface-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'group' && (
        <input value={groupName} onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name…" className="input mb-3" />
      )}

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(e) => { setQuery(e.target.value); search(); }}
          placeholder="Search people…" className="input pl-9 text-sm" />
      </div>

      {tab === 'group' && selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((u) => (
            <span key={u._id} onClick={() => toggleSelect(u)}
              className="flex items-center gap-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full px-3 py-1 text-xs font-medium cursor-pointer hover:bg-primary-200">
              {u.displayName} ×
            </span>
          ))}
        </div>
      )}

      <div className="space-y-1 max-h-60 overflow-y-auto">
        {results.length === 0 && query && <p className="text-center text-sm text-slate-400 py-4">No users found</p>}
        {results.map((u) => {
          const isChosen = selected.find((x) => x._id === u._id);
          return (
            <button key={u._id}
              onClick={() => tab === 'dm' ? startDM(u) : toggleSelect(u)}
              className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${isChosen ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
              <Avatar user={u} size="sm" showStatus />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{u.displayName}</p>
                <p className="text-xs text-slate-400">@{u.username}</p>
              </div>
              {tab === 'group' && isChosen && <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs">✓</div>}
            </button>
          );
        })}
      </div>

      {tab === 'group' && (
        <button onClick={createGroup} disabled={loading} className="btn-primary w-full mt-4">
          {loading ? 'Creating…' : `Create Group${selected.length > 0 ? ` (${selected.length})` : ''}`}
        </button>
      )}
    </Modal>
  );
}
