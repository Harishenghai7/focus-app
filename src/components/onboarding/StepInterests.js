import React, { useState } from 'react';
import styles from './StepInterests.module.css';
import InterestCard from './InterestCard';
import Button from '../shared/Button';
import { FaCamera, FaVideo, FaAlignLeft, FaBolt, FaPodcast } from 'react-icons/fa';

const INTEREST_CATEGORIES = {
    creative: {
        label: 'Creative',
        color: '#f59e0b',
        items: [
            { id: 'art', name: 'Art', emoji: '🎨' },
            { id: 'photography', name: 'Photography', emoji: '📸' },
            { id: 'music', name: 'Music', emoji: '🎵' },
            { id: 'design', name: 'Design', emoji: '✏️' },
            { id: 'writing', name: 'Writing', emoji: '✍️' },
            { id: 'film', name: 'Film', emoji: '🎥' },
        ]
    },
    lifestyle: {
        label: 'Lifestyle',
        color: '#10b981',
        items: [
            { id: 'food', name: 'Food', emoji: '🍕' },
            { id: 'travel', name: 'Travel', emoji: '✈️' },
            { id: 'fitness', name: 'Fitness', emoji: '🏋️' },
            { id: 'fashion', name: 'Fashion', emoji: '👗' },
            { id: 'nature', name: 'Nature', emoji: '🌱' },
            { id: 'wellness', name: 'Wellness', emoji: '🧘' },
        ]
    },
    knowledge: {
        label: 'Knowledge',
        color: '#3b82f6',
        items: [
            { id: 'tech', name: 'Tech', emoji: '💻' },
            { id: 'science', name: 'Science', emoji: '🔬' },
            { id: 'books', name: 'Books', emoji: '📚' },
            { id: 'education', name: 'Education', emoji: '🎓' },
            { id: 'philosophy', name: 'Philosophy', emoji: '🤔' },
            { id: 'news', name: 'News', emoji: '📰' },
        ]
    },
    entertainment: {
        label: 'Entertainment',
        color: '#ec4899',
        items: [
            { id: 'gaming', name: 'Gaming', emoji: '🎮' },
            { id: 'movies', name: 'Movies', emoji: '🎬' },
            { id: 'sports', name: 'Sports', emoji: '⚽' },
            { id: 'comedy', name: 'Comedy', emoji: '😂' },
            { id: 'podcasts', name: 'Podcasts', emoji: '🎙️' },
            { id: 'anime', name: 'Anime', emoji: '⛩️' },
        ]
    }
};

const CONTENT_TYPES = [
    { id: 'photos', name: 'Photos', icon: <FaCamera />, desc: 'Image posts & galleries' },
    { id: 'videos', name: 'Short Videos', icon: <FaVideo />, desc: 'Boltz & reels' },
    { id: 'text', name: 'Long-form', icon: <FaAlignLeft />, desc: 'Articles & threads' },
    { id: 'stories', name: 'Stories', icon: <FaBolt />, desc: 'Ephemeral updates' },
    { id: 'live', name: 'Live', icon: <FaPodcast />, desc: 'Live streams' },
];

const categoryKeys = Object.keys(INTEREST_CATEGORIES);

const StepInterests = ({ formData, updateFormData, onNext, onBack }) => {
    const [activeCategory, setActiveCategory] = useState('creative');
    const selectedInterests = formData.interests || [];
    const selectedContent = formData.contentPreferences || [];

    const toggleInterest = (id) => {
        if (selectedInterests.includes(id)) {
            updateFormData('interests', selectedInterests.filter(i => i !== id));
        } else {
            updateFormData('interests', [...selectedInterests, id]);
        }
    };

    const toggleContent = (id) => {
        if (selectedContent.includes(id)) {
            updateFormData('contentPreferences', selectedContent.filter(i => i !== id));
        } else {
            updateFormData('contentPreferences', [...selectedContent, id]);
        }
    };

    const category = INTEREST_CATEGORIES[activeCategory];
    const minRequired = 3;
    const canContinue = selectedInterests.length >= minRequired;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>What lights you up? ✨</h2>
                <p className={styles.subtitle}>Choose at least {minRequired} topics to personalize your feed, recommendations, and discovery.</p>
            </div>

            {/* Category tabs */}
            <div className={styles.categoryTabs}>
                {categoryKeys.map(key => (
                    <button
                        key={key}
                        className={`${styles.categoryTab} ${activeCategory === key ? styles.categoryTabActive : ''}`}
                        onClick={() => setActiveCategory(key)}
                        style={{ '--cat-color': INTEREST_CATEGORIES[key].color }}
                    >
                        {INTEREST_CATEGORIES[key].label}
                    </button>
                ))}
            </div>

            {/* Interest grid */}
            <div className={styles.grid} key={activeCategory}>
                {category.items.map((interest) => (
                    <InterestCard
                        key={interest.id}
                        label={interest.name}
                        emoji={interest.emoji}
                        selected={selectedInterests.includes(interest.id)}
                        onClick={() => toggleInterest(interest.id)}
                        color={category.color}
                    />
                ))}
            </div>

            {/* Selection counter */}
            <div className={styles.selectionCount}>
                <div className={styles.counterRing} style={{ '--fill': `${Math.min((selectedInterests.length / minRequired) * 100, 100)}%` }}>
                    <span className={styles.counterNumber}>{selectedInterests.length}</span>
                </div>
                <div>
                    <span className={styles.counterLabel}>
                        {selectedInterests.length >= minRequired
                            ? `${selectedInterests.length} interests selected — great taste!`
                            : `Choose ${minRequired - selectedInterests.length} more to continue`}
                    </span>
                </div>
            </div>

            {/* Content type preferences */}
            <div className={styles.contentSection}>
                <label className={styles.sectionLabel}>What content do you prefer?</label>
                <div className={styles.contentGrid}>
                    {CONTENT_TYPES.map(type => (
                        <button
                            key={type.id}
                            className={`${styles.contentCard} ${selectedContent.includes(type.id) ? styles.contentActive : ''}`}
                            onClick={() => toggleContent(type.id)}
                        >
                            <span className={styles.contentIcon}>{type.icon}</span>
                            <strong>{type.name}</strong>
                            <span className={styles.contentDesc}>{type.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.actions}>
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <Button variant="primary" onClick={onNext} disabled={!canContinue}>
                    Continue
                </Button>
            </div>
        </div>
    );
};

export default StepInterests;
