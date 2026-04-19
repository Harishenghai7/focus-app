import React from 'react';
import UserAvatar from '../ui/Avatar';
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
    onFollowingClick,
}) => {
    if (!profile) return null;

    return (
        <div className={styles.header}>
            <div className={styles.bannerSurface} aria-hidden="true">
                {profile.banner_url || profile.cover_url ? (
                    <img src={profile.banner_url || profile.cover_url} alt="" className={styles.bannerImage} />
                ) : (
                    <div className={styles.bannerFallback}>
                        <span className={styles.bannerMark}>F</span>
                        <span className={styles.bannerText}>FocuslyMascot</span>
                    </div>
                )}
            </div>
            {/* ── Avatar ──────────────────────────────────── */}
            <div className={styles.avatarSection}>
                <UserAvatar
                    src={profile.avatar_url}
                    username={profile.username}
                    fullName={profile.full_name}
                    size="3xl"
                    hasStory={hasStories}
                    className={styles.avatar}
                />
            </div>

            {/* ── Info ────────────────────────────────────── */}
            <div className={styles.infoSection}>
                {/* Name + actions row */}
                <div className={styles.topRow}>
                    <div className={styles.nameGroup}>
                        <div className={styles.usernameRow}>
                            <h2 className={styles.username}>
                                {profile.username}
                            </h2>
                            {profile.is_verified && (
                                <VerifiedBadge size={18} />
                            )}
                        </div>
                        {profile.full_name && (
                            <p className={styles.fullName}>{profile.full_name}</p>
                        )}
                    </div>

                    <ProfileActions
                        profile={profile}
                        isOwnProfile={isOwnProfile}
                        isFollowing={isFollowing}
                        onFollowStatusChange={onFollowStatusChange}
                    />
                </div>

                {/* Stats */}
                <ProfileStats
                    postsCount={profile.posts_count}
                    followersCount={profile.followers_count}
                    followingCount={profile.following_count}
                    onFollowersClick={onFollowersClick}
                    onFollowingClick={onFollowingClick}
                />

                {/* Bio */}
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
