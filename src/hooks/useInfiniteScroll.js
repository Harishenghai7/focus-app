import { useRef, useCallback } from 'react';

export const useInfiniteScroll = ({ onLoadMore, hasNextPage, loading, disabled }) => {
    const observer = useRef();

    const lastElementRef = useCallback(
        (node) => {
            if (loading || disabled) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasNextPage) {
                    onLoadMore();
                }
            });

            if (node) observer.current.observe(node);
        },
        [loading, hasNextPage, onLoadMore, disabled]
    );

    return [lastElementRef];
};
