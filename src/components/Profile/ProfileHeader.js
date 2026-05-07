import React from 'react';
import { motion } from 'framer-motion';
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

    const isTrustShieldVerified = profile.is_verified && profile.trust_level >= 4;

    return (
        <motion.div
            className={styles.header}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className={styles.bannerSurface} aria-hidden="true">
                {profile.banner_url || profile.cover_url ? (
                    <img src={profile.banner_url || profile.cover_url} alt="" className={styles.bannerImage} />
                ) : (
                    <div className={styles.bannerFallback}>
                        <span className={styles.bannerMark}>F</span>
                        <span className={styles.bannerText}>Focusly</span>
                    </div>
                )}
                {/* Obsidian blur overlay */}
                <div className={styles.bannerOverlay} />
            </div>

            {/* ── Avatar with Sovereign Pulse ──────────────────────────────────── */}
            <div className={`${styles.avatarSection} ${isTrustShieldVerified ? styles.sovereignAvatar : ''}`}>
                <motion.div
                    className={styles.avatarWrapper}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <UserAvatar
                        src={profile.avatar_url}
                        username={profile.username}
                        fullName={profile.full_name}
                        size="3xl"
                        hasStory={hasStories}
                        isVerified={profile.is_verified}
                        className={styles.avatar}
                    />
                    {isTrustShieldVerified && (
                        <div className={styles.sovereignPulse} aria-hidden="true" />
                    )}
                </motion.div>
            </div>

            {/* ── Info Section ────────────────────────────────────── */}
            <div className={styles.infoSection}>
                {/* Name + actions row */}
                <div className={styles.topRow}>
                    <div className={styles.nameGroup}>
                        <div className={styles.usernameRow}>
                            <h2 className={styles.username}>
                                {profile.username}
                            </h2>
                            {profile.is_verified && (
                                <VerifiedBadge size={20} trustShield={isTrustShieldVerified} />
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

                {/* Stats with glassmorphism cards */}
                <ProfileStats
                    postsCount={profile.posts_count}
                    followersCount={profile.followers_count}
                    followingCount={profile.following_count}
                    onFollowersClick={onFollowersClick}
                    onFollowingClick={onFollowingClick}
                />

                {/* Bio with satin typography */}
                <ProfileBio
                    fullName={profile.full_name}
                    bio={profile.bio}
                    website={profile.website}
                    location={profile.location}
                />
            </div>
        </motion.div>
    );
};

export default ProfileHeader;
