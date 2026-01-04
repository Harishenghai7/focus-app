import React, { useState, useEffect } from 'react';
import { useMessageForward } from '../../hooks/useMessageForward';
import { useAuth } from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import styles from './ForwardMessageModal.module.css';

const ForwardMessageModal = ({ message, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [chats, setChats] = useState([]);
    const [filteredChats, setFilteredChats] = useState([]);
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [loading, setLoading] = useState(true);

    const { forwarding, forwardToMultiple, getForwardableChats } = useMessageForward();
    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        loadChats();
    }, []);

    useEffect(() => {
        if (debouncedSearch) {
            const filtered = chats.filter(chat =>
                chat.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                chat.username?.toLowerCase().includes(debouncedSearch.toLowerCase())
            );
            setFilteredChats(filtered);
        } else {
            setFilteredChats(chats);
        }
    }, [debouncedSearch, chats]);

    const loadChats = async () => {
        setLoading(true);
        try {
            const forwardableChats = await getForwardableChats(user?.id);
            setChats(forwardableChats);
            setFilteredChats(forwardableChats);
        } catch (error) {
            console.error('Error loading chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRecipient = (chat) => {
        setSelectedRecipients(prev => {
            const exists = prev.find(r => r.id === chat.id && r.type === chat.type);
            if (exists) {
                return prev.filter(r => !(r.id === chat.id && r.type === chat.type));
            } else {
                return [...prev, chat];
            }
        });
    };

    const handleForward = async () => {
        const success = await forwardToMultiple(message, selectedRecipients, user?.id);
        if (success) {
            onSuccess?.();
            onClose();
        }
    };

    const renderMessagePreview = () => {
        if (message.is_deleted) {
            return (
                <div className={styles.preview}>
                    <p className={styles.deletedText}>This message was deleted</p>
                </div>
            );
        }

        if (message.message_type === 'image' && message.attachments?.[0]) {
            return (
                <div className={styles.preview}>
                    <img src={message.attachments[0].url} alt="Preview" className={styles.previewImage} />
                    {message.content && <p className={styles.previewText}>{message.content}</p>}
                </div>
            );
        }

        if (message.message_type === 'video' && message.attachments?.[0]) {
            return (
                <div className={styles.preview}>
                    <video src={message.attachments[0].url} className={styles.previewVideo} />
                    {message.content && <p className={styles.previewText}>{message.content}</p>}
                </div>
            );
        }

        return (
            <div className={styles.preview}>
                <p className={styles.previewText}>{message.content || 'No content'}</p>
            </div>
        );
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Forward Message</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Message Preview */}
                {renderMessagePreview()}

                {/* Search Bar */}
                <div className={styles.searchSection}>
                    <div className={styles.searchBar}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search chats and groups..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Selected Recipients Chips */}
                    {selectedRecipients.length > 0 && (
                        <div className={styles.selectedChips}>
                            {selectedRecipients.map(recipient => (
                                <div key={`${recipient.type}-${recipient.id}`} className={styles.chip}>
                                    <span>{recipient.name}</span>
                                    <button onClick={() => toggleRecipient(recipient)}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chats List */}
                <div className={styles.chatsList}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <span>Loading chats...</span>
                        </div>
                    ) : filteredChats.length > 0 ? (
                        filteredChats.map(chat => {
                            const isSelected = selectedRecipients.find(
                                r => r.id === chat.id && r.type === chat.type
                            );

                            return (
                                <div
                                    key={`${chat.type}-${chat.id}`}
                                    className={`${styles.chatItem} ${isSelected ? styles.selected : ''}`}
                                    onClick={() => toggleRecipient(chat)}
                                >
                                    <Avatar
                                        src={chat.avatar}
                                        alt={chat.name}
                                        size="md"
                                        fallback={chat.name?.[0]?.toUpperCase()}
                                    />
                                    <div className={styles.chatInfo}>
                                        <span className={styles.chatName}>{chat.name}</span>
                                        {chat.type === 'group' && (
                                            <span className={styles.chatType}>
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                    <path d="M9 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM11 11a4 4 0 0 0-8 0M11 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM13 11a3.5 3.5 0 0 0-3.5-3.5"
                                                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                </svg>
                                                Group
                                            </span>
                                        )}
                                        {chat.username && chat.type === 'user' && (
                                            <span className={styles.username}>@{chat.username}</span>
                                        )}
                                    </div>
                                    <div className={styles.checkbox}>
                                        {isSelected && (
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <circle cx="10" cy="10" r="9" fill="#8b5cf6" />
                                                <path d="M6 10l2.5 2.5L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className={styles.empty}>
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                                <path d="M24 16v8M24 28h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <p>No chats found</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <Button variant="secondary" onClick={onClose} fullWidth>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleForward}
                        disabled={selectedRecipients.length === 0 || forwarding}
                        loading={forwarding}
                        fullWidth
                    >
                        {forwarding
                            ? 'Forwarding...'
                            : `Forward${selectedRecipients.length > 0 ? ` to ${selectedRecipients.length}` : ''}`
                        }
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ForwardMessageModal;
