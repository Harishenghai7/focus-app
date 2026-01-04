/* ═══════════════════════════════════════════════════════════════════════
   CONVERSATION SETTINGS MODAL - Pin, mute, archive, disappearing messages
   Phase 4: Advanced Features
   ═══════════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import styles from './ConversationSettingsModal.module.css';

const ConversationSettingsModal = ({ onClose, conversationId, currentUserId }) => {
    const [settings, setSettings] = useState({
        pinned: false,
        muted: false,
        disappearing_messages: false,
        read_receipts_enabled: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, [conversationId, currentUserId]);

    const fetchSettings = async () => {
        try {
            const { data } = await supabase
                .from('conversation_settings')
                .select('*')
                .eq('conversation_id', conversationId)
                .eq('user_id', currentUserId)
                .single();

            if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (key, value) => {
        try {
            setSaving(true);

            const { error } = await supabase
                .from('conversation_settings')
                .upsert({
                    conversation_id: conversationId,
                    user_id: currentUserId,
                    [key]: value,
                    [`${key}_at`]: key === 'pinned' && value ? new Date().toISOString() : null
                }, {
                    onConflict: 'conversation_id,user_id'
                });

            if (error) throw error;

            setSettings(prev => ({ ...prev, [key]: value }));
        } catch (error) {
            console.error('Error updating setting:', error);
            alert('Failed to update setting');
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async () => {
        // Archive conversation (hide from list)
        if (confirm('Archive this conversation?')) {
            await updateSetting('archived', true);
            onClose();
        }
    };

    const handleBlock = async () => {
        if (confirm('Block this user? You won\'t receive messages from them.')) {
            // Implement block functionality
            alert('Block feature coming soon!');
        }
    };

    const handleReport = async () => {
        if (confirm('Report this conversation?')) {
            // Implement report functionality
            alert('Report feature coming soon!');
        }
    };

    if (loading) {
        return (
            <div className={styles.overlay} onClick={onClose}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.loading}>Loading settings...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Conversation Settings</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                </div>

                <div className={styles.settingsList}>
                    {/* Pin Conversation */}
                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={styles.settingIcon}>
                                <path d="M16 4v6l3 3v2h-6v5l-1 1-1-1v-5H5v-2l3-3V4h8z" fill="currentColor" />
                            </svg>
                            <div>
                                <h3>Pin Conversation</h3>
                                <p>Keep this chat at the top</p>
                            </div>
                        </div>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                checked={settings.pinned}
                                onChange={(e) => updateSetting('pinned', e.target.checked)}
                                disabled={saving}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    {/* Mute Notifications */}
                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={styles.settingIcon}>
                                <path d="M17.5 12c0 1.77-1.02 3.29-2.5 4.03v2.21c2.89-.86 5-3.54 5-6.74s-2.11-5.88-5-6.74v2.21c1.48.74 2.5 2.26 2.5 4.03zM11 4.07V3c0-.55-.45-1-1-1s-1 .45-1 1v1.07c-2.39.49-4.16 2.58-4.16 5.1 0 2.52 1.77 4.61 4.16 5.1v6.17c0 .55.45 1 1 1s1-.45 1-1v-6.17c2.39-.49 4.16-2.58 4.16-5.1 0-2.52-1.77-4.61-4.16-5.1z" fill="currentColor" />
                            </svg>
                            <div>
                                <h3>Mute Notifications</h3>
                                <p>Stop receiving notifications</p>
                            </div>
                        </div>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                checked={settings.muted}
                                onChange={(e) => updateSetting('muted', e.target.checked)}
                                disabled={saving}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    {/* Disappearing Messages */}
                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={styles.settingIcon}>
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor" />
                            </svg>
                            <div>
                                <h3>Disappearing Messages</h3>
                                <p>Messages auto-delete after 24h</p>
                            </div>
                        </div>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                checked={settings.disappearing_messages}
                                onChange={(e) => updateSetting('disappearing_messages', e.target.checked)}
                                disabled={saving}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    {/* Read Receipts */}
                    <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={styles.settingIcon}>
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor" />
                            </svg>
                            <div>
                                <h3>Read Receipts</h3>
                                <p>Show when you've read messages</p>
                            </div>
                        </div>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                checked={settings.read_receipts_enabled}
                                onChange={(e) => updateSetting('read_receipts_enabled', e.target.checked)}
                                disabled={saving}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    {/* Divider */}
                    <div className={styles.divider}></div>

                    {/* Archive */}
                    <button onClick={handleArchive} className={styles.actionButton}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" fill="currentColor" />
                        </svg>
                        <span>Archive Conversation</span>
                    </button>

                    {/* Block */}
                    <button onClick={handleBlock} className={`${styles.actionButton} ${styles.danger}`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z" fill="currentColor" />
                        </svg>
                        <span>Block User</span>
                    </button>

                    {/* Report */}
                    <button onClick={handleReport} className={`${styles.actionButton} ${styles.danger}`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM12 17.3c-.72 0-1.3-.58-1.3-1.3 0-.72.58-1.3 1.3-1.3.72 0 1.3.58 1.3 1.3 0 .72-.58 1.3-1.3 1.3zm1-4.3h-2V7h2v6z" fill="currentColor" />
                        </svg>
                        <span>Report Conversation</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConversationSettingsModal;
