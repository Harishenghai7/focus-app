import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import ProfileGridTile from './ProfileGridTile';
import EmptyState from './EmptyState';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import styles from './ProfileGrid.module.css';

const ProfileGrid = ({ items, loading, hasMore, onLoadMore, onItemClick, emptyMessage, emptyIcon }) => {
    if (loading && items.length === 0) {
        return <LoadingSkeleton type="grid" count={12} />;
    }

    if (!loading && items.length === 0) {
        return <EmptyState message={emptyMessage} icon={emptyIcon} />;
    }

    return (
        <InfiniteScroll
            dataLength={items.length}
            next={onLoadMore}
            hasMore={hasMore}
            loader={<LoadingSkeleton type="grid" count={3} />}
            className={styles.grid}
        >
            {items.map((item) => (
                <ProfileGridTile
                    key={item.id}
                    item={item}
                    onClick={() => onItemClick(item)}
                />
            ))}
        </InfiniteScroll>
    );
};

export default ProfileGrid;
