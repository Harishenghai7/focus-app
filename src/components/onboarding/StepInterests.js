import React from 'react';
import styles from './StepInterests.module.css';
import InterestCard from './InterestCard';
import Button from '../shared/Button';

const INTERESTS = [
    { id: 'art', name: 'Art', emoji: '🎨' },
    { id: 'photography', name: 'Photography', emoji: '📸' },
    { id: 'music', name: 'Music', emoji: '🎵' },
    { id: 'sports', name: 'Sports', emoji: '⚽' },
    { id: 'food', name: 'Food', emoji: '🍕' },
    { id: 'travel', name: 'Travel', emoji: '✈️' },
    { id: 'tech', name: 'Tech', emoji: '💻' },
    { id: 'gaming', name: 'Gaming', emoji: '🎮' },
    { id: 'books', name: 'Books', emoji: '📚' },
    { id: 'movies', name: 'Movies', emoji: '🎬' },
    { id: 'fitness', name: 'Fitness', emoji: '🏋️' },
    { id: 'nature', name: 'Nature', emoji: '🌱' }
];

const StepInterests = ({ formData, updateFormData, onNext, onBack }) => {
    const selectedInterests = formData.interests || [];

    const toggleInterest = (id) => {
        if (selectedInterests.includes(id)) {
            updateFormData('interests', selectedInterests.filter(i => i !== id));
        } else {
            updateFormData('interests', [...selectedInterests, id]);
        }
    };

    const handleSkip = () => {
        // Skip to step 4 (notifications)
        onNext();
        onNext();
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>What are you interested in?</h2>
                <p className={styles.subtitle}>Choose topics to personalize your experience</p>
            </div>

            <div className={styles.grid}>
                {INTERESTS.map((interest) => (
                    <InterestCard
                        key={interest.id}
                        label={interest.name}
                        emoji={interest.emoji}
                        selected={selectedInterests.includes(interest.id)}
                        onClick={() => toggleInterest(interest.id)}
                    />
                ))}
            </div>

            <div className={styles.selectionCount}>
                Selected: {selectedInterests.length} topics
                {selectedInterests.length < 3 && (
                    <span className={styles.hint}> (Choose at least 3)</span>
                )}
            </div>

            <div className={styles.actions}>
                <Button variant="ghost" onClick={handleSkip}>Skip</Button>
                <Button
                    variant="primary"
                    onClick={onNext}
                    disabled={selectedInterests.length < 3}
                >
                    Continue
                </Button>
            </div>

            <div className={styles.progressInfo}>
                <span>Step 2 of 4</span>
            </div>
        </div>
    );
};

export default StepInterests;
