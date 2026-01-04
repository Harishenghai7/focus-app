import React from 'react';
import styles from './AddDetails.module.css';
import Button from '../../components/ui/Button';
import CaptionInput from '../../components/create/CaptionInput';
import { ArrowLeft, ArrowRight, MapPin, Users, Music, Eye, Lock } from 'lucide-react';

const AddDetails = ({ details, onChange, onNext, onBack }) => {

    const handleChange = (key, value) => {
        onChange(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft size={16} /> Back
                </Button>
                <h2>New Post</h2>
                <Button onClick={onNext}>
                    Next <ArrowRight size={16} />
                </Button>
            </div>

            <div className={styles.content}>
                <div className={styles.mainSection}>
                    <CaptionInput
                        value={details.caption}
                        onChange={(val) => handleChange('caption', val)}
                        placeholder="Write a caption..."
                    />
                </div>

                <div className={styles.settingsList}>
                    <div className={styles.settingItem}>
                        <div className={styles.settingLabel}>
                            <MapPin size={20} />
                            <span>Add Location</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Where was this taken?"
                            className={styles.input}
                            value={details.location || ''}
                            onChange={(e) => handleChange('location', e.target.value)}
                        />
                    </div>

                    <div className={styles.settingItem}>
                        <div className={styles.settingLabel}>
                            <Users size={20} />
                            <span>Tag People</span>
                        </div>
                        <span className={styles.chevron}>›</span>
                    </div>

                    <div className={styles.settingItem}>
                        <div className={styles.settingLabel}>
                            <Music size={20} />
                            <span>Add Music</span>
                        </div>
                        <span className={styles.chevron}>›</span>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.settingItem}>
                        <div className={styles.settingLabel}>
                            <Eye size={20} />
                            <span>Audience</span>
                        </div>
                        <select
                            value={details.audience}
                            onChange={(e) => handleChange('audience', e.target.value)}
                            className={styles.select}
                        >
                            <option value="everyone">Everyone</option>
                            <option value="followers">Followers</option>
                            <option value="close_friends">Close Friends</option>
                        </select>
                    </div>

                    <div className={styles.settingItem}>
                        <div className={styles.settingLabel}>
                            <Lock size={20} />
                            <span>Advanced Settings</span>
                        </div>
                        <span className={styles.chevron}>›</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddDetails;
