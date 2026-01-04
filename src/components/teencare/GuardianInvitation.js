/**
 * Guardian Invitation Modal
 * Allows teens to invite guardians or guardians to request supervision
 */

import React, { useState } from 'react';
import { useGuardianship } from '../../hooks/useGuardianship';
import styles from './GuardianInvitation.module.css';

const GuardianInvitation = ({ isOpen, onClose, mode = 'teen' }) => {
    const { sendInvitation } = useGuardianship();
    const [email, setEmail] = useState('');
    const [relationshipType, setRelationshipType] = useState('parent');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await sendInvitation(email, relationshipType);
            setSuccess(true);

            // Auto-close after 2 seconds
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setEmail('');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to send invitation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (success) {
        return (
            <div className="guardian-invitation-overlay">
                <div className="guardian-invitation-modal success-modal">
                    <div className="success-icon">✅</div>
                    <h2>Invitation Sent!</h2>
                    <p>A guardian invitation has been sent to <strong>{email}</strong></p>
                    <p className="success-note">They'll receive an email with instructions to accept.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="guardian-invitation-overlay">
            <div className="guardian-invitation-modal">
                <button className="close-btn" onClick={onClose}>✕</button>

                <div className="modal-header">
                    <div className="header-icon">👨‍👩‍👧</div>
                    <h2>Invite a Guardian</h2>
                    <p>
                        {mode === 'teen'
                            ? 'Invite a parent or guardian to help keep you safe on Focus'
                            : 'Request to supervise a teen\'s account for their safety'
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="invitation-form">
                    <div className="form-group">
                        <label htmlFor="guardian-email">
                            Guardian's Email Address
                            <span className="required">*</span>
                        </label>
                        <input
                            type="email"
                            id="guardian-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="guardian@example.com"
                            required
                            className="email-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="relationship">
                            Relationship
                            <span className="required">*</span>
                        </label>
                        <select
                            id="relationship"
                            value={relationshipType}
                            onChange={(e) => setRelationshipType(e.target.value)}
                            className="relationship-select"
                        >
                            <option value="parent">Parent</option>
                            <option value="guardian">Legal Guardian</option>
                            <option value="trusted_adult">Trusted Adult</option>
                        </select>
                    </div>

                    {mode === 'teen' && (
                        <div className="info-box">
                            <div className="info-icon">ℹ️</div>
                            <div className="info-content">
                                <h4>What can guardians see?</h4>
                                <ul>
                                    <li>✅ Activity summary (posts, follows, time spent)</li>
                                    <li>✅ Safety alerts (cyberbullying, inappropriate content)</li>
                                    <li>✅ Who you follow and who follows you</li>
                                    <li>❌ Your private messages (content)</li>
                                    <li>❌ Your password</li>
                                </ul>
                                <p className="transparency-note">
                                    You'll always know when your guardian is notified about something.
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cancel-btn"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="submit-btn"
                        >
                            {loading ? 'Sending...' : 'Send Invitation'}
                        </button>
                    </div>
                </form>

                <div className="modal-footer">
                    <small>
                        The guardian will receive an email invitation that expires in 7 days.
                    </small>
                </div>
            </div>
        </div>
    );
};

export default GuardianInvitation;
