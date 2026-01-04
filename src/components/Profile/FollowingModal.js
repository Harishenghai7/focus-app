import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Avatar from '../shared/Avatar';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import Input from '../ui/Input';
import InfiniteScroll from 'react-infinite-scroll-component';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import { useFollowing } from '../../hooks/useFollowing';
import { useFollow } from '../../hooks/useFollow';
import styles from './FollowingModal.module.css';

const FollowingModal = ({ isOpen, onClose, userId }) => {
    const navigate = useNavigate();
    const { following, loading, hasMore, searchQuery, setSearchQuery, loadMore, updateFollowingStatus, unfollowUser } = useFollowing(userId, isOpen);
    const { toggleFollow } = useFollow();
    const [actionLoading, setActionLoading] = useState({});

    const handleUnfollow = async (user) => {
        setActionLoading(prev => ({ ...prev, [user.id]: true }));
        await unfollowUser(user.id);
        setActionLoading(prev => ({ ...prev, [user.id]: false }));
    };

    const handleUserClick = (username) => {
        onClose();
        navigate(`/profile/${username}`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Following" className={styles.modal}>
            <div className={styles.searchContainer}>
                <Input
                    type="text"
                    placeholder="Search following..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Icon name="Search" size={18} />}
                />
            </div>

            <div className={styles.list} id="following-scroll">
                {loading && following.length === 0 ? (
                    <LoadingSkeleton type="list" count={10} />
                ) : following.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Icon name="Users" size={48} />
                        <p>Not following anyone yet</p>
                        {searchQuery && <p className={styles.emptyHint}>Try a different search term</p>}
                    </div>
                ) : (
                    <InfiniteScroll
                        dataLength={following.length}
                        next={loadMore}
                        hasMore={hasMore}
                        loader={<LoadingSkeleton type="list" count={3} />}
                        scrollableTarget="following-scroll"
                    >
                        {following.map((user) => (
                            <div key={user.id} className={styles.item}>
                                <div className={styles.userInfo} onClick={() => handleUserClick(user.username)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flex: 1 }}>
                                    <Avatar src={user.avatar_url} alt={user.username} size="md" />
                                    <div className={styles.info}>
                                        <div className={styles.username}>
                                            {user.username}
                                            {user.verified && <Icon name="BadgeCheck" size={14} className={styles.verified} />}
                                        </div>
                                        <div className={styles.fullName}>{user.full_name}</div>
                                        {user.isMutual && <span className={styles.mutualBadge}>Mutual</span>}
                                    </div>
                                </div>
                                <div className={styles.actions}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUnfollow(user)}
                                        loading={actionLoading[user.id]}
                                    >
                                        Following
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </InfiniteScroll>
                )}
            </div>
        </Modal>
    );
};

export default FollowingModal;
