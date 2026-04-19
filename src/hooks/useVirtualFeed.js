import { useMemo } from 'react';

export const useVirtualFeed = (items = []) => {
  return useMemo(
    () => ({
      data: items,
      overscan: 300,
      increaseViewportBy: { top: 800, bottom: 1200 },
      totalCount: items.length,
    }),
    [items]
  );
};
