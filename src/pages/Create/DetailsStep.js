import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Hash, MapPin, Type } from 'lucide-react';
import Button from '../../components/ui/Button';
import styles from './DetailsStep.module.css';

const parseTags = (value) =>
    value
        .split(',')
        .map((item) => item.trim().replace(/^#/, ''))
        .filter(Boolean)
        .slice(0, 10);

const DetailsStep = ({ details, onUpdateDetails, onBack, onNext }) => {
    const [caption, setCaption] = useState(details?.caption || '');
    const [tagInput, setTagInput] = useState((details?.tags || []).join(', '));
    const [location, setLocation] = useState(details?.location || '');

    const tagsPreview = useMemo(() => parseTags(tagInput), [tagInput]);

    const handleContinue = () => {
        onUpdateDetails({
            ...details,
            caption: caption.trim(),
            tags: tagsPreview,
            location: location.trim() || null,
        });
        onNext?.();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2>Finish Your Storytelling Layer</h2>
                <p>Add caption, hashtags, and location before publishing.</p>
            </header>

            <div className={styles.formCard}>
                <label className={styles.field}>
                    <span><Type size={16} /> Caption</span>
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Write something meaningful..."
                        maxLength={2200}
                        rows={5}
                    />
                    <small>{caption.length}/2200</small>
                </label>

                <label className={styles.field}>
                    <span><Hash size={16} /> Tags</span>
                    <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="focus, productivity, design"
                    />
                    <small>Up to 10 tags, comma separated.</small>
                </label>

                <label className={styles.field}>
                    <span><MapPin size={16} /> Location</span>
                    <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, place, or event"
                    />
                </label>

                {tagsPreview.length > 0 && (
                    <div className={styles.tagsPreview}>
                        {tagsPreview.map((tag) => (
                            <span key={tag}>#{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            <footer className={styles.footer}>
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft size={16} /> Back
                </Button>
                <Button onClick={handleContinue}>
                    Preview <ArrowRight size={16} />
                </Button>
            </footer>
        </div>
    );
};

export default DetailsStep;

