/**
 * UniversalActionMenu — Focus Platform
 * 3-dot context menu: Report, Mute, Copy Link, Not Interested.
 * Glassmorphic dropdown for desktop, bottom sheet for mobile.
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
    Flag, BellOff, EyeOff, Link2, Trash2,
    Edit3, UserMinus, Ban
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import styles from './UniversalActionMenu.module.css';

const SPRING = { type: 'spring', damping: 26, stiffness: 320 };
const FADE = { duration: 0.15, ease: 'easeOut' };

const UniversalActionMenu = ({
    isOpen,
    onClose,
    contentId,
    contentType = 'post',         // 'post' | 'boltz'
    authorId,
    onEdit,
    onDelete,
    onNotInterested,
    onToggleComments,
    onShareToFlash,
    anchorRef = null,             // ref to trigger button (for desktop positioning)
}) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const menuRef = useRef(null);
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
    const isOwner = user?.id === authorId;
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // — Close on Escape
    useEffect(() => {
        const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', onEsc);
        return () => document.removeEventListener('keydown', onEsc);
    }, [isOpen, onClose]);

    // — Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
        };
        // slight delay so the open-click doesn't immediately close it
        const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
        return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
    }, [isOpen, onClose]);

    const permalink = useCallback(() => {
        const origin = window.location.origin;
        if (contentType === 'post') return `${origin}/p/${contentId}`;
        if (contentType === 'boltz') return `${origin}/boltz/${contentId}`;
        return `${origin}/${contentType}/${contentId}`;
    }, [contentId, contentType]);

    const handleCopyLink = useCallback(() => {
        const url = permalink();
        navigator.clipboard?.writeText(url).then(() => toast.success('Link copied')).catch(() => {});
        onClose();
    }, [permalink, onClose]);

    const handleReport = useCallback(async () => {
        if (!user) return;
        try {
            await supabase.from('reports').insert({
                reporter_id: user.id,
                content_type: contentType,
                content_id: contentId,
                reason: 'user_report',
                created_at: new Date().toISOString(),
            });
        } catch { /* silently fail */ }
        onClose();
    }, [user, contentType, contentId, onClose]);

    const handleMute = useCallback(async () => {
        if (!user || !authorId) return;
        try {
            await supabase.from('muted_users').upsert({
                user_id: user.id,
                muted_user_id: authorId,
                created_at: new Date().toISOString(),
            });
        } catch { /* silently fail */ }
        onClose();
    }, [user, authorId, onClose]);

    const handleBlock = useCallback(async () => {
        if (!user?.id || !authorId) return;
        try {
            const { error } = await supabase.from('blocked_users').upsert({
                user_id: user.id,
                blocked_user_id: authorId,
                created_at: new Date().toISOString(),
            });
            if (error) throw error;
            toast.success('User blocked');
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        } catch {
            toast.error('Could not block user');
        }
        onClose();
    }, [user?.id, authorId, queryClient, onClose]);

    const handleNotInterested = useCallback(() => {
        onNotInterested?.();
        onClose();
    }, [onNotInterested, onClose]);

    const handleDelete = useCallback(async () => {
        if (onDelete) {
            onDelete();
            onClose();
            return;
        }
        if (!contentId) {
            onClose();
            return;
        }
        try {
            if (contentType === 'post') {
                const { error } = await supabase.from('posts').delete().eq('id', contentId);
                if (error) throw error;
                toast.success('Post deleted');
                queryClient.invalidateQueries({ queryKey: ['posts'] });
            } else if (contentType === 'boltz') {
                const { error } = await supabase.from('boltz').delete().eq('id', contentId);
                if (error) throw error;
                toast.success('Removed');
                queryClient.invalidateQueries({ queryKey: ['boltz'] });
            } else {
                toast.error('Delete not supported for this content type');
            }
        } catch (e) {
            toast.error(e?.message || 'Could not delete');
        }
        onClose();
    }, [onDelete, onClose, contentId, contentType, queryClient]);

    const handleUnfollow = useCallback(async () => {
        if (!user?.id || !authorId) return;
        try {
            const { error } = await supabase
                .from('follows')
                .delete()
                .match({ follower_id: user.id, following_id: authorId });
            if (error) throw error;
            toast.success('Unfollowed');
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        } catch {
            toast.error('Could not unfollow');
        }
        onClose();
    }, [user?.id, authorId, queryClient, onClose]);

    const handleConfirmDelete = useCallback(() => {
        setShowDeleteConfirm(false);
        handleDelete();
    }, [handleDelete]);

    const menuStyle = useMemo(() => {
        if (!isDesktop || !anchorRef?.current) return undefined;
        const r = anchorRef.current.getBoundingClientRect();
        return {
            top: `${r.bottom + 8}px`,
            left: `${Math.max(8, r.right - 240)}px`,
        };
    }, [isDesktop, anchorRef, isOpen]);

    const OWNER_OPTIONS = [
        onEdit && { id: 'edit', label: 'Edit', icon: Edit3, onClick: () => { onEdit?.(); onClose(); } },
        onToggleComments && { id: 'toggle-comments', label: 'Toggle Comments', icon: EyeOff, onClick: () => { onToggleComments(); onClose(); } },
        { id: 'copy', label: 'Copy Link', icon: Link2, onClick: handleCopyLink },
        onShareToFlash && { id: 'share-flash', label: 'Share to Flash', icon: BellOff, onClick: () => { onShareToFlash(); onClose(); } },
        { id: 'delete', label: 'Delete', icon: Trash2, danger: true, onClick: () => setShowDeleteConfirm(true) },
    ].filter(Boolean);

    const VISITOR_OPTIONS = [
        { id: 'copy', label: 'Copy Link', icon: Link2, onClick: handleCopyLink },
        { id: 'notinterested', label: 'Not Interested', icon: EyeOff, onClick: handleNotInterested },
        { id: 'mute', label: 'Mute User', icon: BellOff, onClick: handleMute },
        { id: 'block', label: 'Block User', icon: Ban, danger: true, onClick: handleBlock },
        { id: 'unfollow', label: 'Unfollow', icon: UserMinus, onClick: handleUnfollow },
        { id: 'report', label: 'Report', icon: Flag, danger: true, onClick: handleReport },
    ];

    const options = isOwner ? OWNER_OPTIONS : VISITOR_OPTIONS;

    const sheetVariants = isDesktop
        ? {
            hidden: { opacity: 0, scale: 0.96, y: -6 },
            visible: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.96, y: -6 },
        }
        : {
            hidden: { opacity: 0, y: '100%' },
            visible: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: '100%' },
        };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className={styles.backdrop}
                        data-desktop={isDesktop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={FADE}
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Menu Panel */}
                    <motion.div
                        ref={menuRef}
                        className={styles.menu}
                        data-desktop={isDesktop}
                        style={menuStyle}
                        role="menu"
                        aria-label="Post options"
                        variants={sheetVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={SPRING}
                    >
                        {!isDesktop && <div className={styles.handle} />}

                        <ul className={styles.list}>
                            {options.map((opt) => {
                                const Icon = opt.icon;
                                return (
                                    <li key={opt.id}>
                                        <motion.button
                                            className={`${styles.item} ${opt.danger ? styles.danger : ''}`}
                                            role="menuitem"
                                            onClick={opt.onClick}
                                            whileHover={{ backgroundColor: opt.danger
                                                ? 'rgba(239,68,68,0.08)'
                                                : 'rgba(255,255,255,0.05)' }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <span className={styles.itemIcon}>
                                                <Icon size={19} strokeWidth={2} />
                                            </span>
                                            <span className={styles.itemLabel}>{opt.label}</span>
                                        </motion.button>
                                    </li>
                                );
                            })}
                        </ul>
                    </motion.div>

                    {showDeleteConfirm && (
                        <div className={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
                            <div className={styles.confirmCard} onClick={(e) => e.stopPropagation()}>
                                <p className={styles.confirmTitle}>Delete this post?</p>
                                <p className={styles.confirmText}>This action cannot be undone.</p>
                                <div className={styles.confirmActions}>
                                    <button className={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                                    <button className={styles.deleteBtn} onClick={handleConfirmDelete}>Delete</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </AnimatePresence>
    );
};

export default UniversalActionMenu;
