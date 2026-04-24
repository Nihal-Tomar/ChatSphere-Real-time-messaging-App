import { motion } from 'framer-motion';

const sizeMap = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg', '2xl': 'w-20 h-20 text-xl' };
const statusDotSize = { xs: 'w-1.5 h-1.5', sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3', xl: 'w-3.5 h-3.5', '2xl': 'w-4 h-4' };

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const getGradient = (name = '') => {
  const gradients = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600', 'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600', 'from-cyan-500 to-sky-600',
  ];
  const idx = name.charCodeAt(0) % gradients.length;
  return gradients[idx];
};

export default function Avatar({ user, size = 'md', showStatus = false, className = '' }) {
  const sizeClass = sizeMap[size] || sizeMap.md;
  const dotClass = statusDotSize[size] || statusDotSize.md;
  const name = user?.displayName || user?.username || '?';
  const statusColor = { online: 'bg-emerald-500', offline: 'bg-slate-400', away: 'bg-amber-400', busy: 'bg-red-500' };

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {user?.avatar?.url ? (
        <img
          src={user.avatar.url}
          alt={name}
          className={`${sizeClass} rounded-full object-cover ring-2 ring-white/20`}
        />
      ) : (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br ${getGradient(name)} flex items-center justify-center font-bold text-white`}>
          {getInitials(name)}
        </div>
      )}
      {showStatus && user?.status && (
        <span className={`absolute bottom-0 right-0 ${dotClass} rounded-full border-2 border-white dark:border-surface-800 ${statusColor[user.status] || 'bg-slate-400'}`} />
      )}
    </div>
  );
}
