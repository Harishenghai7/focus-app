import React, { useState } from 'react';
import styles from './StickerPicker.module.css';

// Import all sticker images dynamically
const importAll = (r) => {
    let images = {};
    r.keys().forEach((item) => { images[item.replace('./', '')] = r(item); });
    return images;
};

const stickerImages = importAll(require.context('../../assets/focusly/stickers', false, /\.(png|jpe?g|svg)$/));

const STICKER_CATEGORIES = {
    emotions: {
        name: 'Emotions',
        stickers: [
            { id: 1, name: 'Happy', file: '01_focusly_happy.png' },
            { id: 2, name: 'Laughing', file: '02_focusly_laughing.png' },
            { id: 3, name: 'Sad', file: '03_focusly_sad.png' },
            { id: 4, name: 'Crying', file: '04_focusly_crying.png' },
            { id: 5, name: 'Love', file: '05_focusly_love.png' },
            { id: 6, name: 'Cool', file: '06_focusly_cool.png' },
            { id: 7, name: 'Thinking', file: '07_focusly_thinking.png' },
            { id: 8, name: 'Sleepy', file: '08_focusly_sleepy.png' },
            { id: 9, name: 'Shocked', file: '09_focusly_shocked.png' },
            { id: 10, name: 'Angry', file: '10_focusly_angry.png' },
            { id: 13, name: 'Blushing', file: '13_focusly_blushing.png' },
            { id: 15, name: 'Confused', file: '15_focusly_confused.png' },
            { id: 36, name: 'Rolling Eyes', file: '36_focusly_rollingeyes.png' },
            { id: 43, name: 'Starstruck', file: '43_focusly_starstruck.png' },
            { id: 44, name: 'Drooling', file: '44_focusly_drooling.png' },
            { id: 45, name: 'Embarrassed', file: '45_focusly_embarrased.png' }
        ]
    },
    actions: {
        name: 'Actions',
        stickers: [
            { id: 11, name: 'Excited', file: '11_focusly_excited.png' },
            { id: 12, name: 'Scared', file: '12_focusly_scared.png' },
            { id: 14, name: 'Mind Blown', file: '14_focusly_mind_blown.png' },
            { id: 16, name: 'Waving', file: '16_focusly_waving.png' },
            { id: 17, name: 'Thumbs Up', file: '17_focusly_thumbs_up.png' },
            { id: 18, name: 'Clapping', file: '18_focusly_clapping.png' },
            { id: 19, name: 'Praying', file: '19_focusly_praying.png' },
            { id: 20, name: 'Peace Sign', file: '20_focusly_peacesign.png' },
            { id: 21, name: 'Facepalm', file: '21_focusly_facepalm.png' },
            { id: 22, name: 'Hugging', file: '22_focusly_hugging.png' },
            { id: 23, name: 'Dancing', file: '23_focusly_dancing.png' },
            { id: 24, name: 'Working', file: '24_focusly_working.png' },
            { id: 25, name: 'Running', file: '25_focusly_running.png' },
            { id: 26, name: 'Selfie', file: '26_focusly_selfie.png' },
            { id: 27, name: 'Eating', file: '27_focusly_eating.png' },
            { id: 28, name: 'Flexing', file: '28_focusly_flexing.png' },
            { id: 29, name: 'Meditating', file: '29_focusly_meditating.png' },
            { id: 30, name: 'Sleeping', file: '30_focusly_sleeping.png' },
            { id: 31, name: 'Sending Love', file: '31_focusly_sendinglove.png' },
            { id: 37, name: 'Yay Jump', file: '37_focusly_yay_jump.png' },
            { id: 38, name: 'Shhh', file: '38_focusly_shhh.png' },
            { id: 39, name: 'No', file: '39_focusly_no.png' },
            { id: 40, name: 'Yes', file: '40_focusly_yes.png' }
        ]
    },
    celebrations: {
        name: 'Celebrations',
        stickers: [
            { id: 32, name: 'Perfect 100', file: '32_focusly_perfect_100.png' },
            { id: 33, name: 'Fire', file: '33_focusly_fire.png' },
            { id: 34, name: 'Sparkle', file: '34_focusly_sparkle.png' },
            { id: 35, name: 'Celebrate', file: '35_focusly_celebrate.png' },
            { id: 41, name: 'Birthday', file: '41_focusly_birthday.png' },
            { id: 42, name: 'Graduation', file: '42_focusly_graduation.png' }
        ]
    },
    special: {
        name: 'Special',
        stickers: [
            { id: 46, name: 'With Logo', file: '46_focusly_withlogo.png' },
            { id: 47, name: 'Namaste', file: '47_focusly_namaste.png' },
            { id: 48, name: 'Diwali', file: '48_focusly_diwali.png' },
            { id: 49, name: 'Gamer', file: '49_focusly_gamer.png' },
            { id: 50, name: 'Superhero', file: '50_focusly_superhero.png' }
        ]
    }
};

const getStickerEmoji = (stickerName) => {
    const emojiMap = {
        'Happy': '😊', 'Laughing': '😂', 'Sad': '😢', 'Crying': '😭',
        'Love': '😍', 'Cool': '😎', 'Thinking': '🤔', 'Sleepy': '😴',
        'Shocked': '😱', 'Angry': '😠', 'Blushing': '😊', 'Confused': '😕',
        'Rolling Eyes': '🙄', 'Starstruck': '🤩', 'Drooling': '🤤', 'Embarrassed': '😳',
        'Excited': '🤗', 'Scared': '😨', 'Mind Blown': '🤯', 'Waving': '👋',
        'Thumbs Up': '👍', 'Clapping': '👏', 'Praying': '🙏', 'Peace Sign': '✌️',
        'Facepalm': '🤦', 'Hugging': '🤗', 'Dancing': '💃', 'Working': '💼',
        'Running': '🏃', 'Selfie': '🤳', 'Eating': '🍽️', 'Flexing': '💪',
        'Meditating': '🧘', 'Sleeping': '😴', 'Sending Love': '💕', 'Yay Jump': '🎉',
        'Shhh': '🤫', 'No': '🙅', 'Yes': '🙆', 'Perfect 100': '💯',
        'Fire': '🔥', 'Sparkle': '✨', 'Celebrate': '🎊', 'Birthday': '🎂',
        'Graduation': '🎓', 'With Logo': '🎯', 'Namaste': '🙏', 'Diwali': '🪔',
        'Gamer': '🎮', 'Superhero': '🦸'
    };
    return emojiMap[stickerName] || '😊';
};

const StickerPicker = ({ onSelect, onClose }) => {
    const [activeCategory, setActiveCategory] = useState('emotions');
    const [searchQuery, setSearchQuery] = useState('');
    const [recentStickers, setRecentStickers] = useState([]);

    const handleStickerClick = (sticker) => {
        const stickerUrl = stickerImages[sticker.file];

        // Add to recent stickers
        const updatedRecent = [sticker, ...recentStickers.filter(s => s.id !== sticker.id)].slice(0, 8);
        setRecentStickers(updatedRecent);
        localStorage.setItem('recentStickers', JSON.stringify(updatedRecent));

        // Send sticker
        onSelect(stickerUrl, sticker.name);
        onClose();
    };

    // Load recent stickers from localStorage
    React.useEffect(() => {
        const saved = localStorage.getItem('recentStickers');
        if (saved) {
            try {
                setRecentStickers(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load recent stickers:', e);
            }
        }
    }, []);

    // Filter stickers based on search
    const getFilteredStickers = () => {
        if (!searchQuery) return STICKER_CATEGORIES[activeCategory].stickers;

        return STICKER_CATEGORIES[activeCategory].stickers.filter(sticker =>
            sticker.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const filteredStickers = getFilteredStickers();

    return (
        <div className={styles.stickerPicker}>
            <div className={styles.header}>
                <h3 className={styles.title}>Stickers</h3>
                <button className={styles.closeBtn} onClick={onClose}>×</button>
            </div>

            <div className={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Search stickers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {recentStickers.length > 0 && !searchQuery && (
                <div className={styles.recentSection}>
                    <h4 className={styles.sectionTitle}>Recent</h4>
                    <div className={styles.stickerGrid}>
                        {recentStickers.map(sticker => (
                            <div
                                key={`recent-${sticker.id}`}
                                className={styles.stickerItem}
                                onClick={() => handleStickerClick(sticker)}
                                title={sticker.name}
                            >
                                <img
                                    src={stickerImages[sticker.file]}
                                    alt={sticker.name}
                                    className={styles.stickerImage}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div className={styles.stickerFallback} style={{ display: 'none' }}>
                                    {getStickerEmoji(sticker.name)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.categories}>
                {Object.entries(STICKER_CATEGORIES).map(([key, category]) => (
                    <button
                        key={key}
                        className={`${styles.categoryBtn} ${activeCategory === key ? styles.active : ''}`}
                        onClick={() => setActiveCategory(key)}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            <div className={styles.stickersContainer}>
                {filteredStickers.length > 0 ? (
                    <div className={styles.stickerGrid}>
                        {filteredStickers.map(sticker => (
                            <div
                                key={sticker.id}
                                className={styles.stickerItem}
                                onClick={() => handleStickerClick(sticker)}
                                title={sticker.name}
                            >
                                <img
                                    src={stickerImages[sticker.file]}
                                    alt={sticker.name}
                                    className={styles.stickerImage}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div className={styles.stickerFallback} style={{ display: 'none' }}>
                                    {getStickerEmoji(sticker.name)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>No stickers found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StickerPicker;
