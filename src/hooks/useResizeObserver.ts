import { useState, useEffect, RefObject } from 'react';

interface Dimensions {
  width: number | undefined;
  height: number | undefined;
}

export function useResizeObserver(
  ref: RefObject<HTMLElement>
): Dimensions {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  return dimensions;
} 