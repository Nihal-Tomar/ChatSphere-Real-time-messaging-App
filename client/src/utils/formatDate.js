import { format, formatDistance, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Format timestamp for chat list (last message time)
 * Shows time for today, 'Yesterday', or date for older
 */
export const formatChatTime = (dateString) => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd/MM/yy');
};

/**
 * Format timestamp for message bubbles (HH:mm)
 */
export const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
  return format(date, 'HH:mm');
};

/**
 * Format last seen (e.g., "2 minutes ago")
 */
export const formatLastSeen = (dateString) => {
  if (!dateString) return 'a while ago';
  const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
  return formatDistance(date, new Date(), { addSuffix: true });
};

/**
 * Full date for separators (e.g., "January 12, 2024")
 */
export const formatSeparatorDate = (dateString) => {
  const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};
