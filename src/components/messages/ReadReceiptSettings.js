import React, { useState, useEffect } from 'react';
import { useReadReceiptSettings } from '../../hooks/useReadReceiptSettings';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import styles from './ReadReceiptSettings.module.css';

const ReadReceiptSettings = ({ conversationId, onClose }) => {
    const { user } = useAuth();
    const {
        globalSetting,
        conversationSettings,
        loading,
        toggleGlobalReadReceipts,
        setConversationReadReceipt,
        areReadReceiptsEnabled
    } = useReadReceiptSettings(user?.id);

    const [localGlobal, setLocalGlobal] = useState(globalSetting);
    const [localConversation, setLocalConversation] = useState(
        conversationId ? areReadReceiptsEnabled(conversationId) : null
    );

    useEffect(() => {
        setLocalGlobal(globalSetting);
        if (conversationId) {
            setLocalConversation(areReadReceiptsEnabled(conversationId));
        }
    }, [globalSetting, conversationId, areReadReceiptsEnabled]);

    const handleGlobalToggle = async () => {
        await toggleGlobalReadReceipts();
    };

    const handleConversationToggle = async () => {
        if (conversationId) {
            await setConversationReadReceipt(conversationId, !localConversation);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <circle cx="24" cy="24" r="20" fill="rgba(139, 92, 246, 0.2)" />
                        <path d="M16 24l4 4 8-8" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M28 24l4 4" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h2>Read Receipts</h2>
                    <p>Control who can see when you've read their messages</p>
                </div>

                <div className={styles.content}>
                    {/* Global Setting */}
                    <div className={styles.setting}>
                        <div className={styles.settingInfo}>
                            <div className={styles.settingTitle}>Read Receipts</div>
                            <div className={styles.settingDescription}>
                                Let others know when you've read their messages
                            </div>
                        </div>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                checked={localGlobal}
                                onChange={handleGlobalToggle}
                                disabled={loading}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    {/* Conversation-Specific Setting */}
                    {conversationId && (
                        <>
                            <div className={styles.divider}></div>
                            <div className={styles.setting}>
                                <div className={styles.settingInfo}>
                                    <div className={styles.settingTitle}>This Conversation</div>
                                    <div className={styles.settingDescription}>
                                        Override global setting for this chat
                                    </div>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={localConversation}
                                        onChange={handleConversationToggle}
                                        disabled={loading}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>
                        </>
                    )}

                    <div className={styles.note}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M8 4v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <span>
                            When disabled, others won't see read receipts from you, but you also won't see theirs
                        </span>
                    </div>
                </div>

                <div className={styles.footer}>
                    <Button variant="primary" onClick={onClose} fullWidth>
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ReadReceiptSettings;
