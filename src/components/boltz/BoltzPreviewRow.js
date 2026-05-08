import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchBoltzPreview } from '../../services/boltzService';
import { FaFire, FaPlay } from 'react-icons/fa';
import styles from './BoltzPreviewRow.module.css';

const profileFrom = (row) => {
    const p = row?.profiles;
    return Array.isArray(p) ? p[0] : p;
};

const looksLikeImage = (url) => /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(url || '');

const formatViews = (n) => {
    if (!n) return '';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
};

const BoltzPreviewRow = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadedThumbs, setLoadedThumbs] = useState({});
    const [erroredThumbs, setErroredThumbs] = useState({});
    const [hoveredId, setHoveredId] = useState(null);
    const videoRefs = useRef({});

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await fetchBoltzPreview(12);
                if (!cancelled) setItems(Array.isArray(data) ? data : []);
            } catch {
                if (!cancelled) setItems([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Auto-play on hover
    const handleTileHover = (id) => {
        setHoveredId(id);
        const vid = videoRefs.current[id];
        if (vid) {
            vid.currentTime = 0;
            vid.play().catch(() => {});
        }
    };

    const handleTileLeave = (id) => {
        setHoveredId(null);
        const vid = videoRefs.current[id];
        if (vid) {
            vid.pause();
            vid.currentTime = 0;
        }
    };

    if (loading) {
        return (
            <section className={styles.section} aria-label="Boltz loading">
                <div className={styles.head}>
                    <div className={styles.headLeft}>
                        <FaPlay className={styles.headIcon} />
                        <span className={styles.title}>Boltz</span>
                    </div>
                </div>
                <div className={styles.scroller}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={styles.skeleton} />
                    ))}
                </div>
            </section>
        );
    }

    if (!items.length) {
        return (
            <section className={styles.section} aria-label="Boltz">
                <div className={styles.head}>
                    <div className={styles.headLeft}>
                        <FaPlay className={styles.headIcon} />
                        <span className={styles.title}>Boltz</span>
                    </div>
                    <Link to="/boltz" className={styles.seeAll}>
                        Open Boltz
                    </Link>
                </div>
                <p className={styles.emptyHint}>
                    No previews yet — tap to explore short videos on Boltz.
                </p>
            </section>
        );
    }

    return (
        <section className={styles.section} aria-label="Boltz previews">
            <div className={styles.head}>
                <div className={styles.headLeft}>
                    <FaPlay className={styles.headIcon} />
                    <span className={styles.title}>Boltz</span>
                    <span className={styles.count}>{items.length}</span>
                </div>
                <Link to="/boltz" className={styles.seeAll}>
                    See all
                </Link>
            </div>
            <div className={styles.scroller}>
                {items.map((b) => {
                    const author = profileFrom(b);
                    const handle = author?.username || author?.full_name || 'Boltz';
                    const overlay = handle.startsWith('@') ? handle : `@${handle}`;
                    const thumb =
                        b._previewThumb ||
                        b.thumbnail_url ||
                        b.thumb_url ||
                        b.cover_url ||
                        b.poster_url ||
                        b.preview_url ||
                        null;
                    const imageSrc = !erroredThumbs[b.id] && looksLikeImage(thumb) ? thumb : null;
                    const videoSrc = !imageSrc ? (b._videoFallback || b.video_url || null) : null;
                    const viewCount = b.views_count || b.view_count || 0;
                    const isHovered = hoveredId === b.id;

                    return (
                        <Link
                            key={b.id}
                            to={`/boltz/${b.id}`}
                            className={`${styles.tile} ${isHovered ? styles.tileHovered : ''}`}
                            title={overlay}
                            onMouseEnter={() => handleTileHover(b.id)}
                            onMouseLeave={() => handleTileLeave(b.id)}
                        >
                            {imageSrc ? (
                                <img
                                    src={imageSrc}
                                    alt=""
                                    className={`${styles.thumb} ${loadedThumbs[b.id] ? styles.thumbLoaded : ''}`}
                                    loading="lazy"
                                    onLoad={() => setLoadedThumbs((prev) => ({ ...prev, [b.id]: true }))}
                                    onError={(e) => {
                                        setErroredThumbs((prev) => ({ ...prev, [b.id]: true }));
                                        e.currentTarget.removeAttribute('src');
                                    }}
                                />
                            ) : videoSrc ? (
                                <video
                                    ref={(el) => { videoRefs.current[b.id] = el; }}
                                    src={videoSrc}
                                    className={`${styles.thumb} ${styles.thumbLoaded}`}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    loop
                                />
                            ) : (
                                <div className={styles.placeholder}>
                                    <FaPlay className={styles.placeholderIcon} />
                                </div>
                            )}

                            {/* Creator avatar badge */}
                            {author?.avatar_url && (
                                <div className={styles.creatorBadge}>
                                    <img src={author.avatar_url} alt="" className={styles.creatorAvatar} />
                                </div>
                            )}

                            {/* View count / Trending */}
                            {viewCount > 0 && (
                                <span className={styles.viewBadge}>
                                    {viewCount >= 1000 && <FaFire className={styles.fireIcon} />}
                                    {formatViews(viewCount)}
                                </span>
                            )}

                            {/* Play icon overlay on hover */}
                            <div className={`${styles.playOverlay} ${isHovered ? styles.playVisible : ''}`}>
                                <FaPlay />
                            </div>

                            <span className={styles.overlay}>{overlay}</span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};

export default BoltzPreviewRow;
