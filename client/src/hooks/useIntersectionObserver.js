import { useEffect, useRef, useCallback } from 'react';

/**
 * Fires `callback` when the observed element enters the viewport.
 * Used for infinite scroll (load older messages when scrolling up).
 */
export const useIntersectionObserver = (callback, options = {}) => {
  const ref = useRef(null);
  const savedCallback = useRef(callback);

  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) savedCallback.current(); },
      { threshold: 0.1, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
};
