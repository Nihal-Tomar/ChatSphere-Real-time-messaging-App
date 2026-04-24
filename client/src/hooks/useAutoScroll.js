import { useEffect, useRef } from 'react';

/**
 * Scrolls the given ref element to the bottom.
 * Smooth scroll when smooth=true, instant otherwise.
 */
export const useAutoScroll = (deps = [], smooth = true) => {
  const ref = useRef(null);

  const scrollToBottom = (behavior = smooth ? 'smooth' : 'auto') => {
    if (ref.current) {
      ref.current.scrollTo({ top: ref.current.scrollHeight, behavior });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, deps);

  return { ref, scrollToBottom };
};
