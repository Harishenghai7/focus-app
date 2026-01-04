/* ═══════════════════════════════════════════════════════════════════════
   SHARED MEDIA GALLERY - View all photos/videos in conversation
   Phase 4: Advanced Features
   ═══════════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import styles from './SharedMediaGallery.module.css';

const SharedMediaGallery = ({ onClose, conversationId }) => {
    const [media, setMedia] = useState([]);
    const [filter, setFilter] = useState('all'); // all, images, videos
    const [loading, setLoading] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState(null);

    useEffect(() => {
        fetchMedia();
    }, [conversationId, filter]);

    const fetchMedia = async () => {
        try {
            let query = supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .eq('deleted', false)
                .not('media_urls', 'is', null)
                .order('created_at', { ascending: false });

            if (filter === 'images') {
                query = query.eq('type', 'image');
            } else if (filter === 'videos') {
                query = query.eq('type', 'video');
            } else {
                query = query.in('type', ['image', 'video']);
            }

            const { data } = await query;
            setMedia(data || []);
        } catch (error) {
            console.error('Error fetching media:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Shared Media</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                </div>

                <div className={styles.filters}>
                    <button
                        className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`${styles.filterButton} ${filter === 'images' ? styles.active : ''}`}
                        onClick={() => setFilter('images')}
                    >
                        Photos
                    </button>
                    <button
                        className={`${styles.filterButton} ${filter === 'videos' ? styles.active : ''}`}
                        onClick={() => setFilter('videos')}
                    >
                        Videos
                    </button>
                </div>

                <div className={styles.gallery}>
                    {loading ? (
                        <div className={styles.loading}>Loading media...</div>
                    ) : media.length === 0 ? (
                        <div className={styles.empty}>No media shared yet</div>
                    ) : (
                        <div className={styles.grid}>
                            {media.map(message => {
                                const urls = JSON.parse(message.media_urls || '[]');
                                return urls.map((url, index) => (
                                    <div
                                        key={`${message.id}-${index}`}
                                        className={styles.mediaCard}
                                        onClick={() => setSelectedMedia({ url, type: message.type })}
                                    >
                                        <img src={url} alt="Media" className={styles.thumbnail} />
                                        {message.type === 'video' && (
                                            <div className={styles.playIcon}>
                                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                                    <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.6)" />
                                                    <path d="M10 8l6 4-6 4V8z" fill="white" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ));
                            })}
                        </div>
                    )}
                </div>

                {selectedMedia && (
                    <div className={styles.lightbox} onClick={() => setSelectedMedia(null)}>
                        <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                            {selectedMedia.type === 'image' ? (
                                <img src={selectedMedia.url} alt="Full size" className={styles.fullImage} />
                            ) : (
                                <video src={selectedMedia.url} controls className={styles.fullVideo} />
                            )}
                            <button onClick={() => setSelectedMedia(null)} className={styles.lightboxClose}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharedMediaGallery;
