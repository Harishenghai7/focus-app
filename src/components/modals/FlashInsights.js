// FlashInsights - Polished Pro-Grade with Real Data
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import styles from './FlashInsights.module.css';

const FlashInsights = ({ flashId, onClose }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [insights, setInsights] = useState({
        views: [],
        likes: [],
        shares: [],
        replies: []
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('views');

    useEffect(() => {
        loadInsights();
    }, [flashId]);

    const loadInsights = async () => {
        setLoading(true);

        try {
            // Fetch views (TODO: Implement flash_views table)
            // For now, showing placeholder
            const views = [];

            // Fetch likes from comment_likes where comment is on this flash
            const likesUrl = `${supabaseUrl}/rest/v1/comment_likes?select=*,user:profiles!comment_likes_user_id_fkey(id,username,full_name,avatar_url,verified),comment:comments!comment_likes_comment_id_fkey(flash_id)&comment.flash_id=eq.${flashId}`;
            const likesRes = await fetch(likesUrl, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                }
            });
            const likesData = await likesRes.json();

            // Filter out own likes and duplicates
            const uniqueLikes = likesData
                .filter(like => like.user_id !== user?.id)
                .reduce((acc, like) => {
                    if (!acc.find(l => l.user_id === like.user_id)) {
                        acc.push(like);
                    }
                    return acc;
                }, []);

            // Fetch shares (TODO: Implement flash_shares table)
            const shares = [];

            // Fetch replies (comments on this flash)
            const repliesUrl = `${supabaseUrl}/rest/v1/comments?select=*,user:profiles!comments_user_id_fkey(id,username,full_name,avatar_url,verified)&flash_id=eq.${flashId}&deleted_at=is.null&order=created_at.desc`;
            const repliesRes = await fetch(repliesUrl, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                }
            });
            const repliesData = await repliesRes.json();

            // Filter out own replies
            const otherReplies = repliesData.filter(reply => reply.user_id !== user?.id);

            setInsights({
                views,
                likes: uniqueLikes,
                shares,
                replies: otherReplies
            });
        } catch (error) {
            console.error('Error loading insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActiveData = () => {
        switch (activeTab) {
            case 'views': return insights.views;
            case 'likes': return insights.likes;
            case 'shares': return insights.shares;
            case 'replies': return insights.replies;
            default: return [];
        }
    };

    const getTotalInteractions = () => {
        return insights.views.length + insights.likes.length + insights.shares.length + insights.replies.length;
    };

    const activeData = getActiveData();

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <button className={styles.backBtn} onClick={onClose}>
                        ←
                    </button>
                    <h2 className={styles.title}>Story Insights</h2>
                    <div className={styles.placeholder} />
                </div>

                {/* Stats Summary */}
                <div className={styles.statsSummary}>
                    <div className={styles.statItem}>
                        <div className={styles.statValue}>{insights.views.length}</div>
                        <div className={styles.statLabel}>VIEWS</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statValue}>{insights.likes.length}</div>
                        <div className={styles.statLabel}>LIKES</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statValue}>{insights.shares.length}</div>
                        <div className={styles.statLabel}>SHARES</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statValue}>{insights.replies.length}</div>
                        <div className={styles.statLabel}>REPLIES</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'views' ? styles.active : ''}`}
                        onClick={() => setActiveTab('views')}
                    >
                        <span className={styles.tabIcon}>👁️</span>
                        <span className={styles.tabLabel}>Views</span>
                        <span className={styles.tabCount}>({insights.views.length})</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'likes' ? styles.active : ''}`}
                        onClick={() => setActiveTab('likes')}
                    >
                        <span className={styles.tabIcon}>❤️</span>
                        <span className={styles.tabLabel}>Likes</span>
                        <span className={styles.tabCount}>({insights.likes.length})</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'shares' ? styles.active : ''}`}
                        onClick={() => setActiveTab('shares')}
                    >
                        <span className={styles.tabIcon}>➤</span>
                        <span className={styles.tabLabel}>Shares</span>
                        <span className={styles.tabCount}>({insights.shares.length})</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'replies' ? styles.active : ''}`}
                        onClick={() => setActiveTab('replies')}
                    >
                        <span className={styles.tabIcon}>💬</span>
                        <span className={styles.tabLabel}>Replies</span>
                        <span className={styles.tabCount}>({insights.replies.length})</span>
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}>⏳</div>
                            <p>Loading insights...</p>
                        </div>
                    ) : activeData.length === 0 ? (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>
                                {activeTab === 'views' && '👁️'}
                                {activeTab === 'likes' && '❤️'}
                                {activeTab === 'shares' && '➤'}
                                {activeTab === 'replies' && '💬'}
                            </div>
                            <p className={styles.emptyTitle}>No {activeTab} yet</p>
                            <span className={styles.emptySubtext}>
                                {activeTab === 'views' && 'When people view your story, they\'ll appear here'}
                                {activeTab === 'likes' && 'When people like your story, they\'ll appear here'}
                                {activeTab === 'shares' && 'When people share your story, they\'ll appear here'}
                                {activeTab === 'replies' && 'When people reply to your story, they\'ll appear here'}
                            </span>
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {activeData.map((item) => {
                                const itemUser = item.user || item.profiles;
                                const timeValue = item.viewed_at || item.created_at;

                                return (
                                    <div key={item.id} className={styles.listItem}>
                                        <img
                                            src={itemUser?.avatar_url || '/default-avatar.png'}
                                            alt={itemUser?.username}
                                            className={styles.avatar}
                                            onClick={() => {
                                                navigate(`/profile/${itemUser?.username}`);
                                                onClose();
                                            }}
                                        />
                                        <div className={styles.userInfo}>
                                            <div
                                                className={styles.username}
                                                onClick={() => {
                                                    navigate(`/profile/${itemUser?.username}`);
                                                    onClose();
                                                }}
                                            >
                                                {itemUser?.username}
                                                {itemUser?.verified && <span className={styles.verified}>✓</span>}
                                            </div>
                                            {itemUser?.full_name && (
                                                <div className={styles.fullName}>{itemUser.full_name}</div>
                                            )}
                                            {activeTab === 'replies' && item.content && (
                                                <div className={styles.replyContent}>{item.content}</div>
                                            )}
                                            {timeValue && (
                                                <div className={styles.time}>
                                                    {formatDistanceToNow(new Date(timeValue), { addSuffix: true })}
                                                </div>
                                            )}
                                        </div>
                                        {activeTab !== 'replies' && (
                                            <button className={styles.followBtn}>Follow</button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FlashInsights;
