import React from 'react';
import Avatar from '../shared/Avatar';
import VerifiedBadge from '../shared/VerifiedBadge';
import ProfileStats from './ProfileStats';
import ProfileBio from './ProfileBio';
import ProfileActions from './ProfileActions';
import styles from './ProfileHeader.module.css';

const ProfileHeader = ({
    profile,
    isOwnProfile,
    isFollowing,
    hasStories = false,
    onFollowStatusChange,
    onFollowersClick,
    onFollowingClick
}) => {
    if (!profile) return null;

    return (
        <div className={styles.header}>
            <div className={styles.avatarSection}>
                <Avatar
                    src={profile.avatar_url}
                    alt={profile.username}
                    size="xxl"
                    hasStories={hasStories}
                />
            </div>

            <div className={styles.infoSection}>
                <div className={styles.topRow}>
                    <div className={styles.usernameRow}>
                        <h2 className={styles.username}>{profile.username}</h2>
                        {profile.verified && <VerifiedBadge size={20} />}
                    </div>
                    <ProfileActions
                        profile={profile}
                        isOwnProfile={isOwnProfile}
                        isFollowing={isFollowing}
                        onFollowStatusChange={onFollowStatusChange}
                    />
                </div>

                <ProfileStats
                    postsCount={profile.posts_count}
                    followersCount={profile.followers_count}
                    followingCount={profile.following_count}
                    onFollowersClick={onFollowersClick}
                    onFollowingClick={onFollowingClick}
                />

                <ProfileBio
                    fullName={profile.full_name}
                    bio={profile.bio}
                    website={profile.website}
                    location={profile.location}
                />
            </div>
        </div>
    );
};

export default ProfileHeader;
