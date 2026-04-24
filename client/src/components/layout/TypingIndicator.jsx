import { motion } from 'framer-motion';

export default function TypingIndicator({ users, chat }) {
  if (!users || users.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="flex items-end gap-2 mb-1"
    >
      <div className="w-6 flex-shrink-0" />
      <div className="bubble-received px-4 py-2.5 flex items-center gap-1.5">
        <span className="text-xs text-slate-400 mr-1">
          {users.length === 1 ? 'typing' : `${users.length} people typing`}
        </span>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-400"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
