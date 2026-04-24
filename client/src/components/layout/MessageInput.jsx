import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile, X, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import { useSocketStore } from '../../store/socketStore';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import * as messageApi from '../../api/message.api';
import toast from 'react-hot-toast';

export default function MessageInput({ chat, onMessageSent }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef(null);
  const typingTimeout = useRef(null);
  const { socket } = useSocketStore();
  const { addMessage } = useChatStore();
  const { user } = useAuthStore();

  const emitTyping = useCallback(() => {
    socket?.emit('typing_start', { chatId: chat._id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit('typing_stop', { chatId: chat._id });
    }, 2000);
  }, [socket, chat._id]);

  const handleText = (e) => {
    setText(e.target.value);
    emitTyping();
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) { toast.error('File must be under 25 MB.'); return; }
    setFile(f);
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  const removeFile = () => { setFile(null); setPreview(null); fileRef.current.value = ''; };

  const send = async () => {
    if ((!text.trim() && !file) || sending) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('chatId', chat._id);
      if (text.trim()) fd.append('content', text.trim());
      if (file) fd.append('file', file);

      const { data } = await messageApi.sendMessage(fd, (event) => {
        if (file && event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(percent);
        }
      });
      addMessage(chat._id, data.data.message);
      setText('');
      setFile(null);
      setPreview(null);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = '';
      socket?.emit('typing_stop', { chatId: chat._id });
      onMessageSent?.();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  return (
    <div className="px-4 py-3 bg-white dark:bg-surface-800 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
      {/* File preview */}
      <AnimatePresence>
        {file && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-surface-700 rounded-xl border border-slate-200 dark:border-slate-600">
            {preview ? (
              <img src={preview} alt="preview" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 text-xl">📎</div>
            )}
            <div className="flex-1 min-w-0 relative">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              {sending && uploadProgress > 0 && (
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary-500" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${uploadProgress}%` }} 
                  />
                </div>
              )}
            </div>
            <button onClick={removeFile} disabled={sending} className="btn-icon text-slate-400 hover:text-red-500 flex-shrink-0 disabled:opacity-50"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Emoji */}
        <div className="relative flex-shrink-0">
          <button onClick={() => setShowEmoji(!showEmoji)} className="btn-icon mb-0.5" title="Emoji">
            <Smile size={20} />
          </button>
          <AnimatePresence>
            {showEmoji && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-12 left-0 z-30 shadow-2xl rounded-2xl overflow-hidden"
              >
                <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" height={380} width={320} searchDisabled={false} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* File attach */}
        <button onClick={() => fileRef.current?.click()} className="btn-icon flex-shrink-0 mb-0.5" title="Attach file">
          <Paperclip size={19} />
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile}
          accept="image/*,application/pdf,.doc,.docx,.txt,audio/*,video/*" />

        {/* Text area */}
        <div className="flex-1 bg-slate-50 dark:bg-surface-700 border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 flex items-end gap-2">
          <textarea
            value={text}
            onChange={handleText}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none leading-relaxed max-h-40"
            style={{ minHeight: '24px' }}
          />
        </div>

        {/* Send / Mic */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={send}
          disabled={sending || (!text.trim() && !file)}
          className={`flex-shrink-0 mb-0.5 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
            text.trim() || file
              ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-900/30'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
          }`}
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : text.trim() || file ? (
            <Send size={17} />
          ) : (
            <Mic size={17} />
          )}
        </motion.button>
      </div>
    </div>
  );
}
