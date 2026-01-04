/* ═══════════════════════════════════════════════════════════════════════
   SHARED CONTENT PREVIEW - Rich preview for shared posts/boltz/flash
   Phase 3: Social Integration
   ═══════════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import styles from './SharedContentPreview.module.css';

const SharedContentPreview = ({ contentContext, onTap }) => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (contentContext) {
            fetchContent();
        }
    }, [contentContext]);

    const fetchContent = async () => {
        try {
            const { type, id } = contentContext;
            let tableName = type === 'post' ? 'posts' : type === 'boltz' ? 'boltz' : 'stories';

            const { data } = await supabase
                .from(tableName)
                .select('*, profiles(*)')
                .eq('id', id)
                .single();

            setContent(data);
        } catch (error) {
            console.error('Error fetching shared content:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (!content) {
        return <div className={styles.error}>Content unavailable</div>;
    }

    const { type } = contentContext;

    return (
        <div className={styles.preview} onClick={onTap}>
            <div className={styles.previewHeader}>
                <div className={styles.typeIcon}>
                    {type === 'post' ? '📝' : type === 'boltz' ? '⚡' : '✨'}
                </div>
                <div className={styles.typeLabel}>
                    {type === 'post' ? 'Post' : type === 'boltz' ? 'Boltz' : 'Flash'}
                </div>
            </div>

            <div className={styles.previewContent}>
                {/* Author */}
                <div className={styles.author}>
                    <img
                        src={content.profiles?.avatar_url || '/default-avatar.png'}
                        alt={content.profiles?.username}
                        className={styles.authorAvatar}
                    />
                    <span className={styles.authorName}>
                        {content.profiles?.username || 'Unknown'}
                    </span>
                </div>

                {/* Content */}
                <div className={styles.contentText}>
                    {content.content || content.caption || 'No caption'}
                </div>

                {/* Media Preview */}
                {content.media_url && (
                    <div className={styles.mediaPreview}>
                        <img src={content.media_url} alt="Preview" className={styles.previewImage} />
                    </div>
                )}

                {/* Stats */}
                <div className={styles.stats}>
                    <span>❤️ {content.likes_count || 0}</span>
                    {type === 'post' && <span>💬 {content.comments_count || 0}</span>}
                    {type === 'boltz' && <span>⚡ {content.reactions_count || 0}</span>}
                </div>
            </div>

            <div className={styles.tapHint}>Tap to view</div>
        </div>
    );
};

export default SharedContentPreview;
