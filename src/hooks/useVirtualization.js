import { useRef, useCallback } from 'react';

/**
 * useVirtualization
 * Virtualize long lists for performance.
 * @param {Array} items - List of items
 * @param {number} itemHeight - Height of each item
 * @param {number} containerHeight - Height of container
 * @returns {Object} { visibleItems, start, end, containerRef }
 * @example
 * const { visibleItems, containerRef } = useVirtualization(items, 50, 400);
 */
export default function useVirtualization(items, itemHeight, containerHeight) {
  const containerRef = useRef();
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(Math.ceil(containerHeight / itemHeight));
  const visibleItems = items.slice(start, end);
  const onScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const newStart = Math.floor(scrollTop / itemHeight);
    setStart(newStart);
    setEnd(newStart + Math.ceil(containerHeight / itemHeight));
  }, [itemHeight, containerHeight]);
  return { visibleItems, start, end, containerRef, onScroll };
}
