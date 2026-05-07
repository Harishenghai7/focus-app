// ═══════════════════════════════════════════════════════════════════════
// NEW MESSAGE MODAL - Instagram-inspired (Focus Lavender Theme)
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import styles from './NewMessageModal.module.css';

const NewMessageModal = ({ onClose, currentUserId }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch suggested users on mount
    useEffect(() => {
        fetchSuggestedUsers();
    }, []);

    // Search users when query changes
    useEffect(() => {
        if (searchQuery.trim()) {
            searchUsers(searchQuery);
        } else {
            setUsers([]);
        }
    }, [searchQuery]);

    const fetchSuggestedUsers = async () => {
        try {



            // Set timeout to stop loading after 3 seconds
            const timeoutId = setTimeout(() => {

                setLoading(false);
            }, 3000);

            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .neq('id', currentUserId)
                .limit(20);

            clearTimeout(timeoutId);



            if (error) {
                console.error('❌ Error fetching suggested users:', error);
                setSuggestedUsers([]);
            } else {

                setSuggestedUsers(data || []);
            }
        } catch (err) {
            console.error('❌ Error fetching suggested users:', err);
            setSuggestedUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const searchUsers = async (query) => {
        try {



            const searchPattern = `%${query}%`;
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .neq('id', currentUserId)
                .or(`username.ilike.${searchPattern},full_name.ilike.${searchPattern}`)
                .limit(20);



            if (error) {
                console.error('❌ Search error:', error);
                throw error;
            }


            setUsers(data || []);
        } catch (err) {
            console.error('❌ Error searching users:', err);
            setUsers([]); // Clear users on error
        }
    };

    const toggleUserSelection = (user) => {
        setSelectedUsers(prev => {
            const isSelected = prev.find(u => u.id === user.id);
            if (isSelected) {
                return prev.filter(u => u.id !== user.id);
            } else {
                return [...prev, user];
            }
        });
    };

    const handleChat = async () => {
        if (selectedUsers.length === 0) return;

        try {


            // For single user, get or create conversation
            if (selectedUsers.length === 1) {
                const otherUserId = selectedUsers[0].id;
                const otherUsername = selectedUsers[0].username;




                // Call RPC function to get or create conversation
                const { data: conversationId, error: convError } = await supabase
                    .rpc('get_or_create_conversation', {
                        user1_id: currentUserId,
                        user2_id: otherUserId
                    });



                if (convError) {
                    console.error('❌ Error from RPC:', convError);
                    throw convError;
                }

                if (!conversationId) {
                    throw new Error('No conversation ID returned from RPC');
                }




                // Close modal first
                onClose();

                // Navigate to conversation
                navigate(`/messages/${conversationId}`);

            } else {
                // For multiple users, create group chat (implement later)

                alert('Group chats coming soon!');
            }
        } catch (err) {
            console.error('❌ Error in handleChat:', err);
            console.error('❌ Error details:', {
                message: err.message,
                code: err.code,
                details: err.details,
                hint: err.hint
            });
            alert(`Failed to start chat: ${err.message || 'Unknown error'}`);
        }
    };

    const displayUsers = searchQuery.trim() ? users : suggestedUsers;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>New message</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Search Input */}
                <div className={styles.searchContainer}>
                    <label className={styles.searchLabel}>To:</label>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                        autoFocus
                    />
                </div>

                {/* Selected Users Pills */}
                {selectedUsers.length > 0 && (
                    <div className={styles.selectedUsers}>
                        {selectedUsers.map(user => (
                            <div key={user.id} className={styles.userPill}>
                                <span>{user.username}</span>
                                <button onClick={() => toggleUserSelection(user)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Suggested Label */}
                {!searchQuery && (
                    <div className={styles.sectionLabel}>Suggested</div>
                )}

                {/* Users List */}
                <div className={styles.usersList}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                        </div>
                    ) : displayUsers.length === 0 ? (
                        <div className={styles.noResults}>
                            <p>No users found</p>
                        </div>
                    ) : (
                        displayUsers.map(user => {
                            const isSelected = selectedUsers.find(u => u.id === user.id);
                            return (
                                <div
                                    key={user.id}
                                    className={styles.userItem}
                                    onClick={() => toggleUserSelection(user)}
                                >
                                    <img
                                        src={user.avatar_url || '/default-avatar.png'}
                                        alt={user.username}
                                        className={styles.avatar}
                                    />
                                    <div className={styles.userInfo}>
                                        <div className={styles.username}>{user.username}</div>
                                        {user.full_name && (
                                            <div className={styles.fullName}>{user.full_name}</div>
                                        )}
                                    </div>
                                    <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                                        {isSelected && (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Chat Button */}
                <div className={styles.footer}>
                    <button
                        className={styles.chatBtn}
                        onClick={handleChat}
                        disabled={selectedUsers.length === 0}
                    >
                        Chat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewMessageModal;
