import { useState, useEffect, RefObject, useCallback, useMemo } from 'react';

interface Dimensions {
  width: number | undefined;
  height: number | undefined;
}

// Helper function to debounce function calls
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function useResizeObserver(
  ref: RefObject<HTMLElement>,
  delay = 16 // Roughly matches 60fps
): Dimensions {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: undefined,
    height: undefined,
  });

  // Memoize the callback to prevent recreation on each render
  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    if (entries[0]) {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    }
  }, []);

  // Debounce the resize handler for better performance
  const debouncedHandleResize = useMemo(
    () => debounce(handleResize, delay),
    [handleResize, delay]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Get initial dimensions
    setDimensions({
      width: element.clientWidth,
      height: element.clientHeight,
    });

    // Create the observer with the debounced callback
    const resizeObserver = new ResizeObserver(debouncedHandleResize);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref, debouncedHandleResize]);

  // Memoize the dimensions object to prevent unnecessary re-renders
  return useMemo(() => dimensions, [dimensions.width, dimensions.height]);
} 