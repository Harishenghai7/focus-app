import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useFocusUser } from '../../context/FocusUserContext';
import { FaCheckCircle, FaShieldAlt, FaStar, FaUserPlus } from 'react-icons/fa';
import styles from './TrustedCreatorsSpotlight.module.css';

const TrustedCreatorsSpotlight = () => {
    const { user } = useFocusUser();
    const navigate = useNavigate();
    const [creators, setCreators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followedIds, setFollowedIds] = useState(new Set());

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;

        const fetchCreators = async () => {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url, bio, is_verified, followers_count')
                    .neq('id', user.id)
                    .eq('is_verified', true)
                    .order('followers_count', { ascending: false, nullsFirst: false })
                    .limit(8);

                if (!cancelled && data) setCreators(data);
            } catch (err) {
                console.error('[TrustedCreators] fetch error:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchCreators();
        return () => { cancelled = true; };
    }, [user?.id]);

    const handleFollow = async (creatorId) => {
        if (!user?.id) return;

        // Optimistic update
        setFollowedIds(prev => {
            const next = new Set(prev);
            if (next.has(creatorId)) next.delete(creatorId);
            else next.add(creatorId);
            return next;
        });

        try {
            if (!followedIds.has(creatorId)) {
                await supabase.from('followers')
                    .insert({ follower_id: user.id, following_id: creatorId });
            } else {
                await supabase.from('followers')
                    .delete()
                    .match({ follower_id: user.id, following_id: creatorId });
            }
        } catch (err) {
            // Revert
            setFollowedIds(prev => {
                const next = new Set(prev);
                if (next.has(creatorId)) next.delete(creatorId);
                else next.add(creatorId);
                return next;
            });
        }
    };

    const formatCount = (n) => {
        if (!n) return '0';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    };

    if (!loading && creators.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <FaStar className={styles.headerIcon} />
                    <span className={styles.headerTitle}>Trusted Creators</span>
                </div>
                <button className={styles.seeAll} onClick={() => navigate('/explore')}>
                    See all
                </button>
            </div>

            <div className={styles.carousel}>
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className={styles.skeletonCard} />
                    ))
                ) : (
                    creators.map((creator) => {
                        const isFollowing = followedIds.has(creator.id);
                        return (
                            <article key={creator.id} className={styles.card}>
                                <div className={styles.cardTop} onClick={() => navigate(`/profile/${creator.username}`)}>
                                    <div className={styles.avatarRing}>
                                        {creator.avatar_url ? (
                                            <img src={creator.avatar_url} alt={creator.username} className={styles.avatar} />
                                        ) : (
                                            <div className={styles.avatarFallback}>
                                                {(creator.full_name || creator.username || '?')[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <span className={styles.trustBadge}>
                                            <FaShieldAlt />
                                        </span>
                                    </div>
                                    <h3 className={styles.name}>{creator.full_name || creator.username}</h3>
                                    <span className={styles.handle}>@{creator.username}</span>
                                    <span className={styles.followers}>{formatCount(creator.followers_count)} followers</span>
                                </div>

                                <button
                                    className={`${styles.followBtn} ${isFollowing ? styles.followingBtn : ''}`}
                                    onClick={() => handleFollow(creator.id)}
                                >
                                    {isFollowing ? (
                                        <><FaCheckCircle /> Following</>
                                    ) : (
                                        <><FaUserPlus /> Follow</>
                                    )}
                                </button>
                            </article>
                        );
                    })
                )}
            </div>
        </section>
    );
};

export default TrustedCreatorsSpotlight;
