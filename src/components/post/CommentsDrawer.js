import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Send, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import UserAvatar from '../ui/Avatar';
import { pickDisplayLabel } from '../../utils/displayName';
import { normalizeHydratedProfile } from '../../utils/identityHydration';
import {
    setCommentLiked,
    fetchUserLikedCommentIds,
    bumpCommentLikeCount,
} from '../../utils/commentLikesApi';
import { linkifyText } from '../../utils/linkifyText';
import styles from './CommentsDrawer.module.css';

const buildCommentsQueryKey = (targetId, targetType) => ['comments-drawer', targetType, targetId];

const normalizeCommentRow = (row) => {
    if (!row) return row;
    const parent = row.parent_id ?? row.parent_comment_id ?? null;
    const rawProfile = row.profiles || row.user || null;
    const safeProfile = normalizeHydratedProfile(
        Array.isArray(rawProfile) ? rawProfile[0] : rawProfile,
        row.user_id
    );
    return {
        ...row,
        text: row.text ?? row.content ?? '',
        content: row.content ?? row.text ?? '',
        parent_id: parent,
        likes_count: row.likes_count ?? 0,
        profiles: safeProfile,
    };
};

const nestComments = (flat) => {
    const withChildren = (flat || []).map((c) => ({ ...c, childReplies: [] }));
    const byId = Object.fromEntries(withChildren.map((c) => [c.id, c]));
    const roots = [];
    withChildren.forEach((row) => {
        if (row.parent_id && byId[row.parent_id]) byId[row.parent_id].childReplies.push(row);
        else roots.push(row);
    });
    const sortByTime = (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0);
    roots.sort(sortByTime);
    roots.forEach((r) => r.childReplies.sort(sortByTime));
    return roots;
};

const bumpPostCommentsCount = (queryClient, targetPostId, delta) => {
    queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
        if (!old?.pages) return old;
        return {
            ...old,
            pages: old.pages.map((page) => ({
                ...page,
                posts: (page.posts || []).map((p) =>
                    p.id === targetPostId
                        ? {
                              ...p,
                              comments_count: Math.max(0, (p.comments_count || 0) + delta),
                          }
                        : p
                ),
            })),
        };
    });
};

const flattenTree = (roots) => {
    const out = [];
    const walk = (node) => {
        out.push(node);
        (node.childReplies || []).forEach(walk);
    };
    (roots || []).forEach(walk);
    return out;
};

const updateLikeInTree = (roots, commentId, delta) => {
    const mapNode = (node) => {
        if (node.id === commentId) {
            return {
                ...node,
                likes_count: Math.max(0, (node.likes_count || 0) + delta),
                childReplies: (node.childReplies || []).map(mapNode),
            };
        }
        return {
            ...node,
            childReplies: (node.childReplies || []).map(mapNode),
        };
    };
    return (roots || []).map(mapNode);
};

const CommentsDrawer = ({ postId, targetId, targetType = 'post', onClose }) => {
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();
    const effectiveTargetId = targetId || postId;
    const commentsTable = targetType === 'boltz' ? 'comments' : 'post_comments';
    const targetColumn = targetType === 'boltz' ? 'boltz_id' : 'post_id';
    const { data: commentRoots = [], isLoading: loading } = useQuery({
        queryKey: buildCommentsQueryKey(effectiveTargetId, targetType),
        queryFn: async () => {
            const embedded = await supabase
                .from(commentsTable)
                .select('*, profiles:user_id(id, username, full_name, avatar_url, is_verified, trust_tier)')
                .eq(targetColumn, effectiveTargetId)
                .order('created_at', { ascending: true })
                .limit(200);
            if (embedded.error) throw embedded.error;
            return nestComments((embedded.data || []).map(normalizeCommentRow));
        },
        enabled: Boolean(effectiveTargetId),
        staleTime: 60_000,
    });
    const [text, setText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [likedIds, setLikedIds] = useState(() => new Set());
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const flatList = useMemo(() => flattenTree(commentRoots), [commentRoots]);
    const totalComments = flatList.length;
    const commentIdsKey = useMemo(
        () =>
            flatList
                .map((c) => c.id)
                .filter(Boolean)
                .sort()
                .join(','),
        [flatList]
    );

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!user?.id || !commentIdsKey) return;
        let cancelled = false;
        (async () => {
            const ids = commentIdsKey.split(',').filter(Boolean);
            const liked = await fetchUserLikedCommentIds(user.id, ids);
            if (!cancelled) setLikedIds(liked);
        })();
        return () => {
            cancelled = true;
        };
    }, [user?.id, postId, commentIdsKey]);

    useEffect(() => {
        const channel = supabase
            .channel(`comments:${targetType}:${effectiveTargetId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: commentsTable,
                    filter: `${targetColumn}=eq.${effectiveTargetId}`,
                },
                () => {
                    queryClient.invalidateQueries({
                        queryKey: buildCommentsQueryKey(effectiveTargetId, targetType),
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comment_likes',
                },
                () => {
                    queryClient.invalidateQueries({
                        queryKey: buildCommentsQueryKey(effectiveTargetId, targetType),
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [commentsTable, effectiveTargetId, queryClient, targetColumn, targetType]);

    const handleLikeComment = useCallback(
        async (comment) => {
            if (!user?.id) {
                toast.info('Sign in to like comments');
                return;
            }
            const id = comment.id;
            const liked = likedIds.has(id);
            try {
                await setCommentLiked(id, user.id, !liked);
                // Keep row counters in sync for deployments without DB triggers.
                await bumpCommentLikeCount(id, liked ? -1 : 1).catch(() => {});
                setLikedIds((prev) => {
                    const n = new Set(prev);
                    if (liked) n.delete(id);
                    else n.add(id);
                    return n;
                });
                queryClient.setQueryData(buildCommentsQueryKey(effectiveTargetId, targetType), (old) =>
                    updateLikeInTree(old || [], id, liked ? -1 : 1)
                );
            } catch {
                toast.error('Could not update comment like');
            }
        },
        [effectiveTargetId, likedIds, queryClient, targetType, user?.id]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() || !user || submitting) return;

        setSubmitting(true);
        const raw = text.trim();
        const content = replyingTo ? `@${replyingTo.username || 'user'} ${raw}` : raw;

        try {
            const row = {
                user_id: user.id,
                text: content,
            };
            row[targetColumn] = effectiveTargetId;
            if (replyingTo?.id) {
                row[targetType === 'boltz' ? 'parent_id' : 'parent_comment_id'] = replyingTo.id;
            }

            const { error } = await supabase.from(commentsTable).insert(row).select('*').single();

            if (error) throw error;

            setText('');
            setReplyingTo(null);
            queryClient.invalidateQueries({
                queryKey: buildCommentsQueryKey(effectiveTargetId, targetType),
            });
            if (targetType === 'post') bumpPostCommentsCount(queryClient, effectiveTargetId, 1);
        } catch (err) {
            toast.error('Could not post comment');
            console.error('Comment error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const renderComment = useCallback(
        (comment, depth = 0) => {
            const rawProf = comment.profiles;
            const author = Array.isArray(rawProf) ? rawProf[0] : rawProf || {};
            const uname = author.username || '';
            const nameLabel = pickDisplayLabel(
                author.full_name,
                uname,
                author.id ? `user_${String(author.id).slice(0, 8)}` : 'user'
            );
            const isLiked = likedIds.has(comment.id);
            const baseLikes = comment.likes_count || 0;
            const displayLikes = baseLikes;

            return (
                <div key={comment.id}>
                    <div
                        className={`${styles.commentRow} ${
                            depth > 0 ? styles.replyRow : ''
                        } ${comment.isOptimistic ? styles.optimistic : ''}`}
                        style={depth ? { marginLeft: Math.min(depth * 14, 42) } : undefined}
                    >
                        {depth > 0 && (
                            <>
                                <div className={styles.replyLine} aria-hidden />
                                <div className={styles.replyBranch} aria-hidden />
                            </>
                        )}
                        <UserAvatar
                            src={author.avatar_url}
                            username={uname || nameLabel}
                            fullName={author.full_name}
                            size="sm"
                            className={styles.commentAvatar}
                        />
                        <div className={styles.commentBody}>
                            <div className={styles.commentBubble}>
                                <span className={styles.commentUsername}>
                                    {nameLabel}
                                    {author.is_verified && (
                                        <span className={styles.verified}>✓</span>
                                    )}
                                </span>
                                <p className={styles.commentText}>
                                    {linkifyText(comment.content, styles.mention)}
                                </p>
                            </div>
                            <div className={styles.commentMeta}>
                                <span className={styles.commentTime}>
                                    {formatDistanceToNow(new Date(comment.created_at), {
                                        addSuffix: true,
                                    }).replace('about ', '')}
                                </span>
                                {displayLikes > 0 && (
                                    <span className={styles.commentLikeCount}>
                                        {displayLikes}{' '}
                                        {displayLikes === 1 ? 'like' : 'likes'}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    className={styles.replyBtn}
                                    onClick={() => {
                                        setReplyingTo({
                                            id: comment.id,
                                            username: uname || nameLabel,
                                        });
                                        inputRef.current?.focus();
                                    }}
                                >
                                    Reply
                                </button>
                            </div>
                        </div>
                        <button
                            type="button"
                            className={`${styles.commentLikeBtn} ${
                                isLiked ? styles.commentLiked : ''
                            }`}
                            onClick={() => handleLikeComment(comment)}
                            aria-label="Like comment"
                        >
                            <Heart
                                size={14}
                                fill={isLiked ? '#ff3040' : 'none'}
                                stroke={isLiked ? '#ff3040' : 'currentColor'}
                            />
                        </button>
                    </div>
                    {(comment.childReplies || []).map((ch) => renderComment(ch, depth + 1))}
                </div>
            );
        },
        [likedIds, handleLikeComment]
    );

    return (
        <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
            <div className={styles.drawer}>
                <div className={styles.handle} />

                <div className={styles.header}>
                    <span className={styles.title}>
                        Comments{' '}
                        {totalComments > 0 && (
                            <span className={styles.count}>({totalComments})</span>
                        )}
                    </span>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.list} ref={listRef}>
                    {loading ? (
                        <div className={styles.loading}>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={styles.skeleton}>
                                    <div className={styles.skeletonAvatar} />
                                    <div className={styles.skeletonContent}>
                                        <div
                                            className={styles.skeletonLine}
                                            style={{ width: '40%' }}
                                        />
                                        <div
                                            className={styles.skeletonLine}
                                            style={{ width: '80%' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : commentRoots.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No comments yet.</p>
                            <p className={styles.emptyHint}>Be the first to comment!</p>
                        </div>
                    ) : (
                        commentRoots.map((c) => renderComment(c, 0))
                    )}
                </div>

                <form className={styles.inputBar} onSubmit={handleSubmit}>
                    {replyingTo && (
                        <div className={styles.replyingTo}>
                            <span>
                                Replying to <strong>@{replyingTo.username || 'user'}</strong>
                            </span>
                            <button type="button" onClick={() => setReplyingTo(null)}>
                                <X size={12} />
                            </button>
                        </div>
                    )}
                    <div className={styles.inputRow}>
                        <UserAvatar
                            src={normalizeHydratedProfile(profile, user?.id, user?.user_metadata || null).avatar_url}
                            username={normalizeHydratedProfile(profile, user?.id, user?.user_metadata || null).username}
                            size="sm"
                        />
                        <input
                            ref={inputRef}
                            className={styles.input}
                            placeholder={
                                replyingTo
                                    ? `Reply to @${replyingTo.username || 'user'}…`
                                    : 'Add a comment…'
                            }
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            maxLength={500}
                        />
                        <button
                            type="submit"
                            className={styles.sendBtn}
                            disabled={!text.trim() || submitting}
                            aria-label="Post comment"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentsDrawer;
