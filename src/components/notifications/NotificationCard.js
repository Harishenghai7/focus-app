import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UserPlus, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import UserAvatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import styles from './NotificationCard.module.css';

const TYPE_ICONS = {
    // Interactions
    like: 'Heart', comment: 'MessageCircle', follow: 'UserPlus', mention: 'AtSign',
    message: 'MessageSquare', share: 'Send', tag: 'Tag', boltz_like: 'Zap',
    boltz_comment: 'MessageCircle', reply: 'CornerDownRight',

    // Security
    login_new_device: 'Smartphone', suspicious_login: 'AlertTriangle',
    password_change: 'Key', account_locked: 'Lock', security_alert: 'ShieldAlert',
    session_revoked: 'LogOut', two_factor_enabled: 'ShieldCheck',

    // Verification
    badge_granted: 'Award', trust_level_up: 'TrendingUp', trust_level_down: 'TrendingDown',
    vouched: 'ThumbsUp', guardian_action: 'UserCheck', teen_alert: 'AlertCircle',
    focusid_upgrade: 'Verified', verification_approved: 'CheckCircle',

    system: 'Bell',
};

const TYPE_COLORS = {
    // Interactions
    like: '#ff3040', comment: '#7C3AED', follow: '#2563EB', mention: '#059669',
    message: '#D97706', share: '#7C3AED', tag: '#9333EA',

    // Security
    login_new_device: '#f59e0b', suspicious_login: '#ef4444', password_change: '#3b82f6',
    account_locked: '#dc2626', security_alert: '#ef4444',

    // Verification
    badge_granted: '#8B5CF6', trust_level_up: '#10b981', trust_level_down: '#ef4444',
    vouched: '#3b82f6', focusid_upgrade: '#8B5CF6', verification_approved: '#10b981',

    system: '#666',
};

const getNotificationText = (n) => {
    const name = n.actor?.full_name || n.actor?.username || 'Someone';
    switch (n.type) {
        case 'like': return <><strong>{name}</strong> liked your post</>;
        case 'comment': return <><strong>{name}</strong> commented: <span className={styles.preview}>"{(n.body || '').slice(0, 60)}"</span></>;
        case 'follow': return <><strong>{name}</strong> started following you</>;
        case 'mention': return <><strong>{name}</strong> mentioned you in a comment</>;
        case 'message': return <><strong>{name}</strong> sent you a message</>;
        case 'share': return <><strong>{name}</strong> shared your post</>;
        case 'tag': return <><strong>{name}</strong> tagged you in a post</>;
        case 'boltz_like': return <><strong>{name}</strong> liked your boltz</>;

        // Security
        case 'login_new_device': return <>New login detected from an unrecognized device</>;
        case 'suspicious_login': return <strong style={{color: '#ef4444'}}>Suspicious login attempt blocked</strong>;
        case 'password_change': return <>Your password was recently changed</>;
        case 'security_alert': return <strong>{n.body || 'Security Alert!'}</strong>;

        // Verification
        case 'badge_granted': return <>Congratulations! You've been granted the verified badge</>;
        case 'trust_level_up': return <>Your Trust Tier has been upgraded</>;
        case 'verification_approved': return <>Your Focus ID verification was approved</>;

        default: return n.body || 'New notification';
    }
};

const NotificationCard = ({ notification: n, onMarkAsRead, onDelete }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [followState, setFollowState] = useState('idle'); // idle | loading | followed

    const isUnread = !(n.is_read ?? n.read);
    const iconName = TYPE_ICONS[n.type] || 'Bell';
    const iconColor = TYPE_COLORS[n.type] || '#666';

    const handleClick = () => {
        if (isUnread) onMarkAsRead(n.id);
        
        // INTERACTION DEEP LINKS
        if (['like', 'comment', 'mention', 'tag', 'share', 'reply', 'boltz_like', 'boltz_comment'].includes(n.type) && n.content_id) {
            const openComments = ['comment', 'reply', 'boltz_comment'].includes(n.type);
            navigate(n.content_type === 'boltz' ? `/boltz/${n.content_id}` : `/p/${n.content_id}`, {
                state: openComments ? { openComments: true, source: 'notification' } : undefined
            });
        } else if (n.type === 'follow' && n.actor?.username) {
            navigate(`/profile/${n.actor.username}`);
        } else if (n.type === 'message') {
            navigate(n.conversation_id ? `/messages/${n.conversation_id}` : '/messages');
        } 
        
        // SECURITY DEEP LINKS
        else if (['login_new_device', 'session_revoked', 'suspicious_login', 'password_change', 'account_locked', 'security_alert'].includes(n.type)) {
            navigate('/settings', { state: { section: 'security' } });
        }
        
        // VERIFICATION DEEP LINKS
        else if (['badge_granted', 'badge_revoked', 'trust_level_up', 'trust_level_down', 'vouched', 'focusid_upgrade', 'verification_approved', 'verification_rejected'].includes(n.type)) {
            navigate('/verification-center');
        }
    };

    const handleFollow = async (e) => {
        e.stopPropagation();
        if (!user || followState !== 'idle') return;
        setFollowState('loading');
        try {
            await supabase.from('follows').insert({
                follower_id: user.id,
                following_id: n.actor?.id,
            });
            setFollowState('followed');
        } catch {
            setFollowState('idle');
        }
    };

    return (
        <div
            className={`${styles.card} ${isUnread ? styles.unread : ''}`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
        >
            {/* Unread accent */}
            {isUnread && <div className={styles.unreadAccent} />}

            {/* Avatar + type badge */}
            <div className={styles.avatarArea}>
                <UserAvatar
                    src={n.actor?.avatar_url}
                    username={n.actor?.username}
                    fullName={n.actor?.full_name}
                    size="md"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (n.actor?.username) navigate(`/profile/${n.actor.username}`);
                    }}
                />
                <div
                    className={styles.typeBadge}
                    style={{ background: iconColor }}
                    aria-hidden="true"
                >
                    <Icon name={iconName} size={12} />
                </div>
            </div>

            {/* Content */}
            <div className={styles.content}>
                <p className={styles.text}>{getNotificationText(n)}</p>
                <span className={styles.time}>
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true }).replace('about ', '')}
                </span>

                {/* Follow-back button */}
                {n.type === 'follow' && followState !== 'followed' && (
                    <button
                        className={styles.followBtn}
                        onClick={handleFollow}
                        disabled={followState === 'loading'}
                    >
                        {followState === 'loading' ? '…' : 'Follow back'}
                    </button>
                )}
                {n.type === 'follow' && followState === 'followed' && (
                    <span className={styles.followedBadge}>
                        <Check size={12} /> Following
                    </span>
                )}
            </div>

            {/* Post thumbnail */}
            {n.metadata?.preview_image && (
                <div className={styles.thumbnail}>
                    <img src={n.metadata.preview_image} alt="" />
                </div>
            )}

            {/* Delete */}
            <button
                className={styles.deleteBtn}
                onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
                aria-label="Dismiss"
            >
                <X size={14} />
            </button>
        </div>
    );
};

export default NotificationCard;
