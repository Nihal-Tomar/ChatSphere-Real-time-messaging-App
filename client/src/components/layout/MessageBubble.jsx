import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Pin, Pencil, Trash2, SmilePlus, Reply, MoreHorizontal } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import * as messageApi from '../../api/message.api';
import Avatar from '../ui/Avatar';
import { formatMessageTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const EMOJI_SET = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function MessageBubble({ message, chat, isOwn, showAvatar }) {
  const { user } = useAuthStore();
  const { updateMessage, removeMessage, updateReactions } = useChatStore();
  const [showActions, setShowActions] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const editRef = useRef(null);

  const isDeleted = message.isDeleted;
  const hasImage = message.attachments?.some((a) => a.resourceType === 'image');
  const hasFile = message.attachments?.some((a) => a.resourceType === 'raw');

  const handleReact = async (emoji) => {
    try {
      const { data } = await messageApi.reactToMessage(message._id, emoji);
      updateReactions(chat._id, message._id, data.data.reactions);
    } catch { toast.error('Could not react.'); }
    setShowEmojis(false);
  };

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === message.content) { setEditing(false); return; }
    try {
      await messageApi.editMessage(message._id, editContent);
      updateMessage(chat._id, message._id, { content: editContent, isEdited: true });
    } catch { toast.error('Could not edit message.'); }
    setEditing(false);
  };

  const handleDelete = async () => {
    try {
      await messageApi.deleteMessage(message._id);
      removeMessage(chat._id, message._id);
    } catch { toast.error('Could not delete message.'); }
  };

  const handlePin = async () => {
    try {
      await messageApi.pinMessage(message._id);
      toast.success(message.isPinned ? 'Unpinned' : 'Message pinned 📌');
    } catch { toast.error('Could not pin message.'); }
  };

  // Group reactions by emoji
  const groupedReactions = message.reactions?.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push(r.user);
    return acc;
  }, {}) || {};

  const readStatus = () => {
    if (!isOwn) return null;
    if (message.readBy?.length > 0) return <CheckCheck size={14} className="text-primary-300" />;
    if (message.deliveredTo?.length > 0) return <CheckCheck size={14} className="text-slate-400" />;
    return <Check size={14} className="text-slate-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 mb-1 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojis(false); }}
    >
      {/* Avatar (group chats only) */}
      {showAvatar && !isOwn ? (
        <Avatar user={message.sender} size="xs" className="mb-1 flex-shrink-0" />
      ) : (
        <div className="w-6 flex-shrink-0" />
      )}

      {/* Bubble */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name (group) */}
        {showAvatar && !isOwn && (
          <span className="text-xs text-primary-500 dark:text-primary-400 font-semibold mb-1 ml-1">
            {message.sender?.displayName}
          </span>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl mb-1 max-w-full text-xs border-l-4 border-primary-400 ${isOwn ? 'bg-primary-800/50 text-primary-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            <span className="font-semibold truncate">{message.replyTo.sender?.displayName}:</span>
            <span className="truncate opacity-80">{message.replyTo.content?.substring(0, 60)}</span>
          </div>
        )}

        {/* Main bubble */}
        <div className={`relative px-3.5 py-2.5 shadow-sm ${isDeleted ? 'bubble-deleted opacity-60 bg-slate-100 dark:bg-slate-800 rounded-2xl' : isOwn ? 'bubble-sent' : 'bubble-received'}`}>
          {/* Image attachment */}
          {hasImage && message.attachments.filter((a) => a.resourceType === 'image').map((att, i) => (
            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
              <img src={att.url} alt="attachment" className="max-w-[240px] rounded-xl mb-1.5 cursor-pointer hover:opacity-90 transition-opacity" />
            </a>
          ))}

          {/* File attachment */}
          {hasFile && message.attachments.filter((a) => a.resourceType === 'raw').map((att, i) => (
            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'} transition-colors mb-1.5`}>
              📎 <span className="truncate max-w-[160px]">{att.name}</span>
            </a>
          ))}

          {/* Editing */}
          {editing ? (
            <div className="flex flex-col gap-2">
              <textarea ref={editRef} value={editContent} onChange={(e) => setEditContent(e.target.value)}
                className="bg-transparent text-sm resize-none focus:outline-none min-w-[160px]" rows={2}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); } }}
                autoFocus />
              <div className="flex gap-2 text-xs">
                <button onClick={handleEdit} className="text-emerald-300 hover:text-emerald-200 font-medium">Save</button>
                <button onClick={() => setEditing(false)} className="text-slate-300 hover:text-white">Cancel</button>
              </div>
            </div>
          ) : (
            <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isDeleted ? 'italic' : ''}`}>
              {message.content}
            </p>
          )}

          {/* Timestamp + edited + status */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {message.isEdited && <span className="text-[10px] opacity-60">edited</span>}
            <span className="text-[10px] opacity-60">{formatMessageTime(message.createdAt)}</span>
            {readStatus()}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(groupedReactions).map(([emoji, users]) => (
              <button key={emoji} onClick={() => handleReact(emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all border ${
                  users.includes(user?._id)
                    ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-300 dark:border-primary-700'
                    : 'bg-white dark:bg-surface-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}>
                {emoji} <span className="font-medium text-slate-600 dark:text-slate-400">{users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons (shown on hover) */}
      <AnimatePresence>
        {showActions && !isDeleted && !editing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`flex items-center gap-0.5 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}
          >
            {/* Emoji react */}
            <div className="relative">
              <button onClick={() => setShowEmojis(!showEmojis)} className="btn-icon text-slate-400 hover:text-slate-600 p-1.5">
                <SmilePlus size={15} />
              </button>
              <AnimatePresence>
                {showEmojis && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`absolute bottom-full mb-1 flex gap-1 bg-white dark:bg-surface-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 shadow-xl z-20 ${isOwn ? 'right-0' : 'left-0'}`}
                  >
                    {EMOJI_SET.map((e) => (
                      <button key={e} onClick={() => handleReact(e)}
                        className="text-lg hover:scale-125 transition-transform">{e}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isOwn && (
              <>
                <button onClick={() => { setEditing(true); setEditContent(message.content); }} className="btn-icon text-slate-400 hover:text-slate-600 p-1.5">
                  <Pencil size={14} />
                </button>
                <button onClick={handleDelete} className="btn-icon text-slate-400 hover:text-red-500 p-1.5">
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button onClick={handlePin} className="btn-icon text-slate-400 hover:text-slate-600 p-1.5">
              <Pin size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
