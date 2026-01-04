import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Avatar from '../shared/Avatar';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import Input from '../ui/Input';
import InfiniteScroll from 'react-infinite-scroll-component';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import { useFollowers } from '../../hooks/useFollowers';
import { useFollow } from '../../hooks/useFollow';
import styles from './FollowersModal.module.css';

const FollowersModal = ({ isOpen, onClose, userId, isOwnProfile }) => {
    const navigate = useNavigate();
    const { followers, loading, hasMore, searchQuery, setSearchQuery, loadMore, updateFollowerStatus, removeFollower } = useFollowers(userId, isOpen);
    const { toggleFollow } = useFollow();
    const [actionLoading, setActionLoading] = useState({});

    console.log('[FollowersModal] followers:', followers, 'loading:', loading, 'searchQuery:', searchQuery);

    const handleFollowToggle = async (follower) => {
        setActionLoading(prev => ({ ...prev, [follower.id]: true }));
        await toggleFollow(follower.id, follower.isFollowing, (userId, updates) => {
            updateFollowerStatus(userId, updates);
        });
        setActionLoading(prev => ({ ...prev, [follower.id]: false }));
    };

    const handleRemove = async (followerId) => {
        if (window.confirm('Remove this follower?')) {
            await removeFollower(followerId);
        }
    };

    const handleUserClick = (username) => {
        onClose(); // Close the modal
        navigate(`/profile/${username}`); // Navigate to user's profile
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Followers" className={styles.modal}>
            <div className={styles.searchContainer}>
                <Input
                    type="text"
                    placeholder="Search followers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Icon name="Search" size={18} />}
                />
            </div>

            <div className={styles.list} id="followers-scroll">
                {loading && followers.length === 0 ? (
                    <LoadingSkeleton type="list" count={10} />
                ) : followers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Icon name="Users" size={48} />
                        <p>No followers yet</p>
                        {searchQuery && <p className={styles.emptyHint}>Try a different search term</p>}
                    </div>
                ) : (
                    <InfiniteScroll
                        dataLength={followers.length}
                        next={loadMore}
                        hasMore={hasMore}
                        loader={<LoadingSkeleton type="list" count={3} />}
                        scrollableTarget="followers-scroll"
                    >
                        {followers.map((follower) => (
                            <div key={follower.id} className={styles.item}>
                                <div className={styles.userInfo} onClick={() => handleUserClick(follower.username)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flex: 1 }}>
                                    <Avatar src={follower.avatar_url} alt={follower.username} size="md" />
                                    <div className={styles.info}>
                                        <div className={styles.username}>
                                            {follower.username}
                                            {follower.verified && <Icon name="BadgeCheck" size={14} className={styles.verified} />}
                                        </div>
                                        <div className={styles.fullName}>{follower.full_name}</div>
                                        {follower.isMutual && <span className={styles.mutualBadge}>Mutual</span>}
                                    </div>
                                </div>
                                <div className={styles.actions}>
                                    {isOwnProfile ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemove(follower.id)}
                                        >
                                            Remove
                                        </Button>
                                    ) : (
                                        <Button
                                            variant={follower.isFollowing ? "outline" : "primary"}
                                            size="sm"
                                            onClick={() => handleFollowToggle(follower)}
                                            loading={actionLoading[follower.id]}
                                        >
                                            {follower.isFollowing ? 'Following' : 'Follow'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </InfiniteScroll>
                )}
            </div>
        </Modal>
    );
};

export default FollowersModal;
