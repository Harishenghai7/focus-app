import React, { useState } from 'react';
import styles from './StepFeatureTour.module.css';
import Button from '../shared/Button';
import { FaBolt, FaImages, FaCommentDots, FaGlobe, FaRocket } from 'react-icons/fa';

const FEATURES = [
    {
        icon: <FaImages />,
        title: "Share Posts & Photos",
        description: "Share your moments with high-quality photos and galleries."
    },
    {
        icon: <FaBolt />,
        title: "Create Short Videos",
        description: "Express yourself with Boltz - our short-form video creator."
    },
    {
        icon: <FaCommentDots />,
        title: "Connect via Messages",
        description: "Chat with friends and creators in real-time."
    },
    {
        icon: <FaGlobe />,
        title: "Discover Content",
        description: "Explore trending topics and find new inspiration."
    },
    {
        icon: <FaRocket />,
        title: "Share Your Story",
        description: "Use Flash to share ephemeral updates with your followers."
    }
];

const StepFeatureTour = ({ onNext, onBack }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        if (currentIndex < FEATURES.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onNext();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.carousel}>
                <div
                    className={styles.slides}
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {FEATURES.map((feature, index) => (
                        <div key={index} className={styles.slide}>
                            <div className={styles.iconWrapper}>
                                {feature.icon}
                            </div>
                            <h3 className={styles.title}>{feature.title}</h3>
                            <p className={styles.description}>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.indicators}>
                {FEATURES.map((_, index) => (
                    <span
                        key={index}
                        className={`${styles.indicator} ${index === currentIndex ? styles.active : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    />
                ))}
            </div>

            <div className={styles.actions}>
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <div className={styles.rightActions}>
                    <Button variant="ghost" onClick={onNext}>Skip Tour</Button>
                    <Button variant="primary" onClick={handleNext}>
                        {currentIndex === FEATURES.length - 1 ? 'Finish Tour' : 'Next'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StepFeatureTour;
