import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Shield, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import UserAvatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { getPriority, PRIORITY, humanTime } from '../../services/notificationService';
import styles from './NotificationCard.module.css';

const TYPE_ICONS = {
    like: 'Heart', comment: 'MessageCircle', follow: 'UserPlus', mention: 'AtSign',
    message: 'MessageSquare', share: 'Send', tag: 'Tag', boltz_like: 'Zap',
    boltz_comment: 'MessageCircle', reply: 'CornerDownRight',
    login_new_device: 'Smartphone', suspicious_login: 'AlertTriangle',
    password_change: 'Key', account_locked: 'Lock', security_alert: 'ShieldAlert',
    session_revoked: 'LogOut', two_factor_enabled: 'ShieldCheck',
    badge_granted: 'Award', trust_level_up: 'TrendingUp', trust_level_down: 'TrendingDown',
    vouched: 'ThumbsUp', guardian_action: 'UserCheck', teen_alert: 'AlertCircle',
    focusid_upgrade: 'BadgeCheck', verification_approved: 'CheckCircle',
    system: 'Bell',
};

const TYPE_COLORS = {
    like: '#f472b6', comment: '#a78bfa', follow: '#60a5fa', mention: '#34d399',
    message: '#fbbf24', share: '#a78bfa', tag: '#c084fc',
    boltz_like: '#e5e7eb', boltz_comment: '#a78bfa', reply: '#818cf8',
    login_new_device: '#f59e0b', suspicious_login: '#ef4444', password_change: '#60a5fa',
    account_locked: '#dc2626', security_alert: '#ef4444', session_revoked: '#f97316',
    badge_granted: '#8b5cf6', trust_level_up: '#10b981', trust_level_down: '#ef4444',
    vouched: '#3b82f6', focusid_upgrade: '#8b5cf6', verification_approved: '#10b981',
    system: '#94a3b8',
};

const getNotifText = (n) => {
    const actors = n.grouped_actors || [n.actor];
    const name = actors[0]?.full_name || actors[0]?.username || 'Someone';
    const cnt = (n.group_count || 1) - 1;
    const others = cnt > 0 ? <span className={styles.othersText}> and {cnt} {cnt === 1 ? 'other' : 'others'}</span> : null;

    switch (n.type) {
        case 'like': return <><strong>{name}</strong>{others} liked your post</>;
        case 'comment': return <><strong>{name}</strong> commented: <span className={styles.preview}>"{(n.body || n.content || '').slice(0, 50)}"</span></>;
        case 'follow': return <><strong>{name}</strong>{others} started following you</>;
        case 'mention': return <><strong>{name}</strong> mentioned you</>;
        case 'message': return <><strong>{name}</strong> sent you a message</>;
        case 'share': return <><strong>{name}</strong>{others} shared your post</>;
        case 'tag': return <><strong>{name}</strong> tagged you in a post</>;
        case 'boltz_like': return <><strong>{name}</strong>{others} liked your boltz</>;
        case 'boltz_comment': return <><strong>{name}</strong> commented on your boltz</>;
        case 'reply': return <><strong>{name}</strong> replied: <span className={styles.preview}>"{(n.body || n.content || '').slice(0, 50)}"</span></>;
        case 'login_new_device': return <><strong className={styles.warningText}>New Device Login</strong> — Unrecognized device</>;
        case 'suspicious_login': return <><strong className={styles.dangerText}>⚠ Suspicious Login Blocked</strong></>;
        case 'password_change': return <><strong className={styles.infoText}>Password Changed</strong></>;
        case 'security_alert': return <><strong className={styles.dangerText}>Security Alert</strong> {n.body}</>;
        case 'account_locked': return <><strong className={styles.dangerText}>Account Locked</strong></>;
        case 'session_revoked': return <><strong className={styles.warningText}>Session Ended</strong></>;
        case 'badge_granted': return <><strong className={styles.successText}>Badge Granted!</strong></>;
        case 'trust_level_up': return <><strong className={styles.successText}>Trust Level Up!</strong></>;
        case 'verification_approved': return <><strong className={styles.successText}>Verification Approved</strong></>;
        case 'focusid_upgrade': return <><strong className={styles.accentText}>Sovereign ID Upgraded</strong></>;
        default: return n.content || n.body || n.text || 'New notification';
    }
};

const NotificationCard = ({ notification: n, onMarkAsRead, onDelete }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [followState, setFollowState] = useState('idle');
    const [isExiting, setIsExiting] = useState(false);
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const [swipeX, setSwipeX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);

    const isUnread = !(n.is_read ?? n.read);
    const priority = getPriority(n.type);
    const isCritical = priority === PRIORITY.CRITICAL;
    const isHigh = priority === PRIORITY.HIGH;
    const isSecurity = ['login_new_device','session_revoked','suspicious_login','password_change','account_locked','security_alert'].includes(n.type);
    const isVerification = ['badge_granted','badge_revoked','trust_level_up','trust_level_down','vouched','focusid_upgrade','verification_approved','verification_rejected'].includes(n.type);
    const isTrusted = n.actor?.trust_shield_verified || n.actor?.verified;
    const iconName = TYPE_ICONS[n.type] || 'Bell';
    const iconColor = TYPE_COLORS[n.type] || '#94a3b8';
    const actors = n.grouped_actors || [n.actor];

    const cardClass = [
        styles.card,
        isExiting && styles.exiting,
        isCritical && styles.criticalCard,
        !isCritical && isSecurity && styles.securityCard,
        isVerification && styles.verificationCard,
        isHigh && !isSecurity && !isVerification && styles.highCard,
        isUnread && styles.unread,
    ].filter(Boolean).join(' ');

    const handleClick = () => {
        if (Math.abs(swipeX) > 10) return;
        if (isUnread) onMarkAsRead(n.id);
        if (['like','comment','mention','tag','share','reply','boltz_like','boltz_comment'].includes(n.type) && n.content_id) {
            const openComments = ['comment','reply','boltz_comment'].includes(n.type);
            navigate(n.content_type === 'boltz' ? `/boltz/${n.content_id}` : `/p/${n.content_id}`, {
                state: openComments ? { openComments: true, source: 'notification' } : undefined
            });
        } else if (n.type === 'follow' && n.actor?.username) {
            navigate(`/profile/${n.actor.username}`);
        } else if (n.type === 'message') {
            navigate(n.conversation_id ? `/messages/${n.conversation_id}` : '/messages');
        } else if (isSecurity) {
            navigate('/settings', { state: { section: 'security' } });
        } else if (isVerification) {
            navigate('/verification-center');
        }
    };

    const handleFollow = async (e) => {
        e.stopPropagation();
        if (!user || followState !== 'idle') return;
        setFollowState('loading');
        try {
            await supabase.from('follows').insert({ follower_id: user.id, following_id: n.actor?.id });
            setFollowState('followed');
        } catch { setFollowState('idle'); }
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setIsExiting(true);
        setTimeout(() => onDelete(n.id), 300);
    };

    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; };
    const handleTouchMove = (e) => {
        if (touchStartX.current === null) return;
        const dx = e.touches[0].clientX - touchStartX.current;
        const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
        if (dy > Math.abs(dx)) return;
        setIsSwiping(true);
        setSwipeX(Math.max(-100, Math.min(100, dx)));
    };
    const handleTouchEnd = useCallback(() => {
        if (swipeX < -60) { setIsExiting(true); setTimeout(() => onDelete(n.id), 300); }
        else if (swipeX > 60 && isUnread) { onMarkAsRead(n.id); }
        setSwipeX(0); setIsSwiping(false); touchStartX.current = null;
    }, [swipeX, isUnread, n.id, onDelete, onMarkAsRead]);

    const renderAvatars = () => {
        if (actors.length <= 1) {
            return <UserAvatar src={n.actor?.avatar_url} username={n.actor?.username} fullName={n.actor?.full_name} size="md"
                onClick={(e) => { e.stopPropagation(); if (n.actor?.username) navigate(`/profile/${n.actor.username}`); }} />;
        }
        return (
            <div className={styles.stackedAvatars}>
                {actors.slice(0, 3).map((a, i) => (
                    <div key={a?.id || i} className={styles.stackedAvatar} style={{ '--si': i }}>
                        <UserAvatar src={a?.avatar_url} username={a?.username} fullName={a?.full_name} size="sm" />
                    </div>
                ))}
                {actors.length > 3 && <div className={styles.stackedMore}>+{actors.length - 3}</div>}
            </div>
        );
    };

    return (
        <div className={cardClass} onClick={handleClick} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
            style={isSwiping ? { transform: `translateX(${swipeX}px)`, transition: 'none' } : undefined}
        >
            {isSwiping && <>
                <div className={`${styles.swipeReveal} ${styles.swipeRight}`}><Check size={18} /><span>Read</span></div>
                <div className={`${styles.swipeReveal} ${styles.swipeLeft}`}><X size={18} /><span>Delete</span></div>
            </>}
            {isUnread && <div className={`${styles.priorityAccent} ${styles[`accent_${priority}`]}`} />}
            <div className={styles.avatarArea}>
                {renderAvatars()}
                {isTrusted && <div className={styles.trustBadge} title="Verified"><Shield size={9} /></div>}
                <div className={styles.typeBadge} style={{ background: iconColor }}><Icon name={iconName} size={11} /></div>
            </div>
            <div className={styles.content}>
                <p className={styles.text}>{getNotifText(n)}</p>
                <div className={styles.meta}>
                    <span className={styles.time}>{humanTime(n.created_at)}</span>
                    {n.group_count > 1 && <span className={styles.groupBadge}><Users size={11} />{n.group_count}</span>}
                </div>
                {n.type === 'follow' && followState !== 'followed' && (
                    <button className={styles.actionBtn} onClick={handleFollow} disabled={followState === 'loading'}>
                        {followState === 'loading' ? '…' : 'Follow back'}
                    </button>
                )}
                {n.type === 'follow' && followState === 'followed' && (
                    <span className={styles.followedBadge}><Check size={12} /> Following</span>
                )}
                {isSecurity && (
                    <button className={styles.securityAction} onClick={(e) => { e.stopPropagation(); navigate('/settings', { state: { section: 'security' } }); }}>
                        Review Security <ChevronRight size={14} />
                    </button>
                )}
            </div>
            {n.metadata?.preview_image && <div className={styles.thumbnail}><img src={n.metadata.preview_image} alt="" loading="lazy" /></div>}
            <button className={styles.deleteBtn} onClick={handleDelete} aria-label="Dismiss"><X size={14} /></button>
        </div>
    );
};

export default NotificationCard;
