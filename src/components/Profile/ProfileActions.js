import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import SettingsMenu from './SettingsMenu';
import EditProfileModal from './EditProfileModal';
import { useFollow } from '../../hooks/useFollow';
import { useAuth } from '../../hooks/useAuth';
import { supabaseUrl, supabaseAnonKey, supabase } from '../../lib/supabase';
import styles from './ProfileActions.module.css';

const ProfileActions = ({
    profile,
    isOwnProfile,
    isFollowing: initialFollowingState,
    onFollowStatusChange,
    onProfileUpdate
}) => {
    const navigate = useNavigate();
    const { user: currentUser, session } = useAuth();
    const { toggleFollow } = useFollow();
    const [showMenu, setShowMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(initialFollowingState);
    const [verifying, setVerifying] = useState(true);

    // Helper for direct API calls
    const apiCall = async (endpoint, options = {}) => {
        const url = `${supabaseUrl}/rest/v1/${endpoint}`;
        const headers = {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        return response.json();
    };

    useEffect(() => {
        const verifyFollowStatus = async () => {
            if (!currentUser || !profile || isOwnProfile) {
                setVerifying(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('follows')
                    .select('*')
                    .eq('follower_id', currentUser.id)
                    .eq('following_id', profile.id)
                    .single();

                if (!error && data) {
                    setIsFollowing(true);
                    if (!initialFollowingState) {
                        onFollowStatusChange?.(true);
                    }
                } else {
                    setIsFollowing(false);
                    if (initialFollowingState) {
                        onFollowStatusChange?.(false);
                    }
                }
            } catch (err) {
                console.error('Error verifying follow status:', err);
                setIsFollowing(initialFollowingState);
            } finally {
                setVerifying(false);
            }
        };

        verifyFollowStatus();
    }, [currentUser, profile, isOwnProfile, initialFollowingState, onFollowStatusChange]);

    const handleFollowClick = async () => {
        if (isFollowing) {
            const confirmed = window.confirm(`Unfollow @${profile.username}?`);
            if (!confirmed) return;
        }

        setLoading(true);
        const newState = !isFollowing;

        setIsFollowing(newState);
        onFollowStatusChange?.(newState);

        await toggleFollow(profile.id, isFollowing, (userId, updates) => {
            setIsFollowing(updates.is_following);
            onFollowStatusChange?.(updates.is_following);
        });

        setLoading(false);
    };

    const handleMessageClick = async () => {
        if (!currentUser || !profile) return;
        if (!session?.access_token) {
            alert("Please log in again to send messages.");
            return;
        }

        try {


            // Step 1: Get my participations
            const myParticipations = await apiCall(`conversation_participants?select=conversation_id&user_id=eq.${currentUser.id}`);
            const myConvIds = myParticipations.map(p => p.conversation_id);

            if (myConvIds.length > 0) {
                // Step 2: Check if they are in any of my conversations
                const idsParam = `(${myConvIds.join(',')})`;
                const theirParticipations = await apiCall(`conversation_participants?select=conversation_id&user_id=eq.${profile.id}&conversation_id=in.${idsParam}`);

                if (theirParticipations.length > 0) {
                    // Step 3: Check for 1-on-1 conversation
                    const sharedIds = theirParticipations.map(p => p.conversation_id);
                    const sharedIdsParam = `(${sharedIds.join(',')})`;

                    const existingConvs = await apiCall(`conversations?select=id,is_group&id=in.${sharedIdsParam}&is_group=eq.false&limit=1`);

                    if (existingConvs.length > 0) {

                        navigate(`/messages/${existingConvs[0].id}`);
                        return;
                    }
                }
            }

            // Step 4: Create new conversation

            const newConvs = await apiCall('conversations', {
                method: 'POST',
                body: JSON.stringify({
                    is_group: false,
                    created_by: currentUser.id
                })
            });

            const newConv = newConvs[0];


            // Step 5: Add participants

            await apiCall('conversation_participants', {
                method: 'POST',
                body: JSON.stringify([
                    { conversation_id: newConv.id, user_id: currentUser.id },
                    { conversation_id: newConv.id, user_id: profile.id }
                ])
            });


            navigate(`/messages/${newConv.id}`);

        } catch (error) {
            console.error('❌ Error in handleMessageClick:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleEditProfile = () => {
        setShowEditModal(true);
    };

    const handleProfileUpdate = (updates) => {
        onProfileUpdate?.(updates);
    };

    if (isOwnProfile) {
        return (
            <>
                <div className={styles.actions}>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditProfile}
                    >
                        Edit Profile
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<Icon name="Settings" size={20} />}
                        onClick={() => setShowMenu(!showMenu)}
                        aria-label="Profile settings"
                    />
                    {showMenu && (
                        <SettingsMenu
                            isOwnProfile={true}
                            onClose={() => setShowMenu(false)}
                        />
                    )}
                </div>
                <EditProfileModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    profile={profile}
                    onUpdate={handleProfileUpdate}
                />
            </>
        );
    }

    return (
        <div className={styles.actions}>
            <Button
                variant={isFollowing ? "outline" : "primary"}
                size="sm"
                onClick={handleFollowClick}
                loading={loading || verifying}
                disabled={verifying}
            >
                {verifying ? 'Loading...' : (isFollowing ? 'Following' : 'Follow')}
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleMessageClick}
            >
                Message
            </Button>
            <Button
                variant="ghost"
                size="sm"
                icon={<Icon name="MoreHorizontal" size={20} />}
                onClick={() => setShowMenu(!showMenu)}
                aria-label="More options"
            />
            {showMenu && (
                <SettingsMenu
                    isOwnProfile={false}
                    profile={profile}
                    onClose={() => setShowMenu(false)}
                />
            )}
        </div>
    );
};

export default ProfileActions;