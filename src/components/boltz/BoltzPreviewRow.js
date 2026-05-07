import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBoltzPreview } from '../../services/boltzService';
import styles from './BoltzPreviewRow.module.css';

const profileFrom = (row) => {
    const p = row?.profiles;
    return Array.isArray(p) ? p[0] : p;
};

const looksLikeImage = (url) => /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(url || '');

const BoltzPreviewRow = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadedThumbs, setLoadedThumbs] = useState({});
    const [erroredThumbs, setErroredThumbs] = useState({});

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
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <section className={styles.section} aria-label="Boltz loading">
                <div className={styles.head}>
                    <span className={styles.title}>Boltz</span>
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
                    <span className={styles.title}>Boltz</span>
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
                <span className={styles.title}>Boltz</span>
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

                    return (
                        <Link
                            key={b.id}
                            to={`/boltz/${b.id}`}
                            className={styles.tile}
                            title={overlay}
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
                                    src={videoSrc}
                                    className={`${styles.thumb} ${styles.thumbLoaded}`}
                                    muted
                                    playsInline
                                    preload="metadata"
                                />
                            ) : (
                                <div className={styles.placeholder}>Focusly</div>
                            )}
                            <span className={styles.overlay}>{overlay}</span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};

export default BoltzPreviewRow;
