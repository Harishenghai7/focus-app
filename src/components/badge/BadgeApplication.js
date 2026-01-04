import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Button from '../ui/Button';
import { BADGE_APPLICATION_FIELDS } from '../../utils/badgeRules';
import { useBadgeApplication } from '../../hooks/useBadgeApplication';
import styles from './BadgeApplication.module.css';

/**
 * BadgeApplication Component
 * Application modal with dynamic form fields based on badge type
 */
const BadgeApplication = ({ isOpen, onClose, badgeName, badgeDefinition }) => {
    const { submitApplication, submitting, uploading } = useBadgeApplication();
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});

    const fields = BADGE_APPLICATION_FIELDS[badgeName] || [];

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleFileChange = (name, file) => {
        setFormData(prev => ({ ...prev, [name]: file }));
    };

    const validate = () => {
        const newErrors = {};
        fields.forEach(field => {
            if (field.required && !formData[field.name]) {
                newErrors[field.name] = `${field.label} is required`;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        const result = await submitApplication(badgeName, formData);

        if (result.success) {
            setFormData({});
            onClose();
        } else {
            setErrors({ submit: result.error });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Apply for ${badgeDefinition?.name} Badge`}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.description}>
                    {badgeDefinition?.description}
                </div>

                {fields.map(field => (
                    <div key={field.name} className={styles.field}>
                        <label className={styles.label}>
                            {field.label}
                            {field.required && <span className={styles.required}>*</span>}
                        </label>

                        {field.type === 'text' && (
                            <Input
                                type="text"
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                placeholder={field.placeholder}
                            />
                        )}

                        {field.type === 'url' && (
                            <Input
                                type="url"
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                placeholder={field.placeholder}
                            />
                        )}

                        {field.type === 'textarea' && (
                            <textarea
                                className={styles.textarea}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                placeholder={field.placeholder}
                                rows={4}
                            />
                        )}

                        {field.type === 'select' && (
                            <select
                                className={styles.select}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                            >
                                <option value="">Select...</option>
                                {field.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        )}

                        {field.type === 'file' && (
                            <div>
                                <input
                                    type="file"
                                    accept={field.accept}
                                    onChange={(e) => handleFileChange(field.name, e.target.files[0])}
                                    className={styles.fileInput}
                                />
                                {field.description && (
                                    <div className={styles.fieldDescription}>{field.description}</div>
                                )}
                            </div>
                        )}

                        {errors[field.name] && (
                            <div className={styles.error}>{errors[field.name]}</div>
                        )}
                    </div>
                ))}

                {errors.submit && (
                    <div className={styles.submitError}>{errors.submit}</div>
                )}

                <div className={styles.actions}>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={submitting || uploading}>
                        {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

BadgeApplication.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    badgeName: PropTypes.string.isRequired,
    badgeDefinition: PropTypes.object
};

export default BadgeApplication;
