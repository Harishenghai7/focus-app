import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useDebounce from '../../hooks/useDebounce';
import { focusToast } from '../../utils/focusToast';
import styles from './NewMessageModal.module.css';

const NewMessageModal = ({ currentUserId, onClose, onSelectUser }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [recentChats, setRecentChats] = useState([]);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('recent'); // recent, search, suggested

    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        fetchRecentChats();
        fetchSuggestedUsers();
    }, [currentUserId]);

    useEffect(() => {
        if (debouncedSearch) {
            searchUsers();
            setActiveTab('search');
        } else {
            setUsers([]);
            setActiveTab('recent');
        }
    }, [debouncedSearch]);

    const fetchRecentChats = async () => {
        try {
            // Get recent conversations
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('sender_id, receiver_id, created_at')
                .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
                .order('created_at', { ascending: false })
                .limit(50);

            if (messagesError) throw messagesError;

            // Extract unique user IDs
            const userIds = new Set();
            messagesData?.forEach(msg => {
                const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
                if (otherUserId !== currentUserId) {
                    userIds.add(otherUserId);
                }
            });

            // Fetch user profiles
            if (userIds.size > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', Array.from(userIds))
                    .limit(10);

                if (profilesError) throw profilesError;
                setRecentChats(profilesData || []);
            }
        } catch (error) {
            console.error('Error fetching recent chats:', error);
        }
    };

    const fetchSuggestedUsers = async () => {
        try {
            // Get users that current user follows
            const { data: followingData, error: followingError } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', currentUserId);

            if (followingError) throw followingError;

            const followingIds = followingData?.map(f => f.following_id) || [];

            if (followingIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', followingIds)
                    .limit(10);

                if (profilesError) throw profilesError;
                setSuggestedUsers(profilesData || []);
            }
        } catch (error) {
            console.error('Error fetching suggested users:', error);
        }
    };

    const searchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .neq('id', currentUserId)
                .or(`username.ilike.%${debouncedSearch}%,full_name.ilike.%${debouncedSearch}%`)
                .limit(20);

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error searching users:', error);
            focusToast.error('Failed to search users');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectUser = (user) => {
        onSelectUser(user);
        onClose();
    };

    const renderUserItem = (user) => (
        <div
            key={user.id}
            className={styles.userItem}
            onClick={() => handleSelectUser(user)}
        >
            <div className={styles.avatar}>
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} />
                ) : (
                    <div className={styles.avatarPlaceholder}>
                        {user.username?.[0]?.toUpperCase()}
                    </div>
                )}
            </div>
            <div className={styles.userInfo}>
                <span className={styles.username}>{user.username}</span>
                {user.full_name && <span className={styles.fullName}>{user.full_name}</span>}
                {user.bio && <span className={styles.bio}>{user.bio}</span>}
            </div>
            <div className={styles.arrow}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <h2>New Message</h2>
                        <button
                            className={styles.createGroupButton}
                            onClick={() => focusToast.info('Group chats coming soon!')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Create Group
                        </button>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.searchSection}>
                    <div className={styles.searchBar}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className={styles.content}>
                    {activeTab === 'search' && (
                        <div className={styles.section}>
                            <h3>Search Results</h3>
                            {loading ? (
                                <div className={styles.loading}>
                                    <div className={styles.spinner}></div>
                                    <p>Searching...</p>
                                </div>
                            ) : users.length > 0 ? (
                                <div className={styles.usersList}>
                                    {users.map(renderUserItem)}
                                </div>
                            ) : (
                                <div className={styles.empty}>
                                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <p>No users found</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'recent' && (
                        <>
                            {recentChats.length > 0 && (
                                <div className={styles.section}>
                                    <h3>Recent Chats</h3>
                                    <div className={styles.usersList}>
                                        {recentChats.map(renderUserItem)}
                                    </div>
                                </div>
                            )}

                            {suggestedUsers.length > 0 && (
                                <div className={styles.section}>
                                    <h3>People You Follow</h3>
                                    <div className={styles.usersList}>
                                        {suggestedUsers.map(renderUserItem)}
                                    </div>
                                </div>
                            )}

                            {recentChats.length === 0 && suggestedUsers.length === 0 && (
                                <div className={styles.empty}>
                                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                        <path d="M15 99.68V25A10 10 0 0 1 25 15h70a10 10 0 0 1 10 10v50a10 10 0 0 1-10 10H40.42a10 10 0 0 0-7.81 3.75l-11.67 14.57A3 3 0 0 1 15 99.68z" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    <p>No recent conversations</p>
                                    <span>Search for users to start a new chat</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewMessageModal;
