import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCompass, FaUsers, FaBookOpen, FaLightbulb } from 'react-icons/fa';
import styles from './ContentDiversityCard.module.css';

const CARD_VARIANTS = {
    discover: {
        icon: <FaCompass />, color: '#8b5cf6',
        title: 'Discover something new',
        description: 'Expand your world — explore topics outside your usual interests.',
        cta: 'Explore now', route: '/explore',
    },
    community: {
        icon: <FaUsers />, color: '#ec4899',
        title: 'Join a community',
        description: 'Find your people. Communities on Focus are built on trust and shared passion.',
        cta: 'Find communities', route: '/explore',
    },
    learn: {
        icon: <FaBookOpen />, color: '#10b981',
        title: 'Learn something today',
        description: 'Educational content from verified creators — knowledge that matters.',
        cta: 'Start learning', route: '/explore',
    },
    inspire: {
        icon: <FaLightbulb />, color: '#f59e0b',
        title: 'Get inspired',
        description: 'See what trusted creators are making. Creativity is contagious.',
        cta: 'See creators', route: '/explore',
    },
};

const ContentDiversityCard = ({ variant = 'discover', suggestedUsers = [] }) => {
    const navigate = useNavigate();
    const card = CARD_VARIANTS[variant] || CARD_VARIANTS.discover;

    return (
        <article className={styles.card} style={{ '--card-color': card.color }}>
            <div className={styles.iconWrap}>
                {card.icon}
            </div>

            <div className={styles.body}>
                <h3 className={styles.title}>{card.title}</h3>
                <p className={styles.desc}>{card.description}</p>
            </div>

            {suggestedUsers.length > 0 && (
                <div className={styles.avatarStack}>
                    {suggestedUsers.slice(0, 3).map((u, i) => (
                        <div
                            key={u.id || i}
                            className={styles.stackAvatar}
                            style={{ zIndex: 3 - i }}
                        >
                            {u.avatar_url ? (
                                <img src={u.avatar_url} alt="" className={styles.stackImg} />
                            ) : (
                                <span className={styles.stackFallback}>
                                    {(u.username || '?')[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>
                    ))}
                    {suggestedUsers.length > 3 && (
                        <span className={styles.moreCount}>+{suggestedUsers.length - 3}</span>
                    )}
                </div>
            )}

            <button className={styles.cta} onClick={() => navigate(card.route)}>
                {card.cta}
            </button>
        </article>
    );
};

export default ContentDiversityCard;
