import React from 'react';
import styles from './StepWelcome.module.css';
import ProfilePictureUpload from './ProfilePictureUpload';
import Input from '../shared/Input';
import Button from '../shared/Button';

const StepWelcome = ({ formData, updateFormData, onNext }) => {
    const isFormValid = formData.username.length >= 3 && formData.full_name.length >= 2;

    const handleSkip = () => {
        // Skip to step 4 (notifications)
        for (let i = 0; i < 3; i++) {
            onNext();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Welcome to Focus! 🎉</h2>
                <p className={styles.subtitle}>Let's set up your profile</p>
            </div>

            <ProfilePictureUpload
                onFileSelect={(file) => updateFormData('avatarFile', file)}
            />

            <div className={styles.form}>
                <Input
                    name="full_name"
                    placeholder="Full Name"
                    value={formData.full_name}
                    onChange={(e) => updateFormData('full_name', e.target.value)}
                />

                <div className={styles.bioWrapper}>
                    <textarea
                        name="bio"
                        placeholder="Write something about yourself..."
                        value={formData.bio}
                        onChange={(e) => updateFormData('bio', e.target.value.slice(0, 150))}
                        maxLength={150}
                        rows={3}
                        className={styles.bioTextarea}
                    />
                    <span className={styles.charCount}>{formData.bio.length}/150</span>
                </div>

                <Input
                    name="website"
                    placeholder="Website (Optional)"
                    value={formData.website}
                    onChange={(e) => updateFormData('website', e.target.value)}
                    type="url"
                />
            </div>

            <div className={styles.actions}>
                <Button
                    variant="ghost"
                    onClick={handleSkip}
                >
                    Skip
                </Button>
                <Button
                    variant="primary"
                    onClick={onNext}
                    disabled={!isFormValid}
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};

export default StepWelcome;
