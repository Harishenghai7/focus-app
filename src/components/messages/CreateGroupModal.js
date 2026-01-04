import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { focusToast } from '../../utils/focusToast';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Icon from '../ui/Icon';
import styles from './CreateGroupModal.module.css';

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1); // 1: Group Info, 2: Add Members
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [groupAvatar, setGroupAvatar] = useState(null);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    // Search for users to add
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const searchUsers = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url')
                    .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
                    .neq('id', user?.id) // Exclude current user
                    .limit(10);

                if (error) throw error;
                setSearchResults(data || []);
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, user?.id]);

    const toggleMember = (member) => {
        setSelectedMembers(prev => {
            const exists = prev.find(m => m.id === member.id);
            if (exists) {
                return prev.filter(m => m.id !== member.id);
            } else {
                return [...prev, member];
            }
        });
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `group-avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setGroupAvatar(publicUrl);
            focusToast.success('Group photo uploaded!');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            focusToast.error('Failed to upload photo');
        }
    };

    const createGroup = async () => {
        if (!groupName.trim()) {
            focusToast.error('Please enter a group name');
            return;
        }

        if (selectedMembers.length === 0) {
            focusToast.error('Please add at least one member');
            return;
        }

        setCreating(true);
        try {
            // Create group conversation
            const { data: group, error: groupError } = await supabase
                .from('group_conversations')
                .insert({
                    name: groupName,
                    description: groupDescription,
                    avatar_url: groupAvatar,
                    created_by: user?.id
                })
                .select()
                .single();

            if (groupError) throw groupError;

            // Add creator as admin
            const participants = [
                {
                    group_id: group.id,
                    user_id: user?.id,
                    role: 'admin'
                },
                // Add selected members
                ...selectedMembers.map(member => ({
                    group_id: group.id,
                    user_id: member.id,
                    role: 'member'
                }))
            ];

            const { error: participantsError } = await supabase
                .from('group_participants')
                .insert(participants);

            if (participantsError) throw participantsError;

            focusToast.success('Group created successfully!');
            onGroupCreated?.(group);
            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
            focusToast.error('Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {step === 1 ? 'Create Group' : 'Add Members'}
                    </h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <Icon name="X" size={24} />
                    </button>
                </div>

                {step === 1 ? (
                    // Step 1: Group Info
                    <div className={styles.content}>
                        <div className={styles.avatarSection}>
                            <div className={styles.avatarContainer}>
                                {groupAvatar ? (
                                    <img src={groupAvatar} alt="Group" className={styles.avatar} />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        <Icon name="Users" size={40} />
                                    </div>
                                )}
                                <label className={styles.avatarUpload}>
                                    <Icon name="Camera" size={20} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        hidden
                                    />
                                </label>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Group Name *</label>
                            <Input
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Enter group name"
                                maxLength={50}
                            />
                            <span className={styles.charCount}>{groupName.length}/50</span>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Description (Optional)</label>
                            <textarea
                                className={styles.textarea}
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                placeholder="What's this group about?"
                                maxLength={200}
                                rows={3}
                            />
                            <span className={styles.charCount}>{groupDescription.length}/200</span>
                        </div>

                        <Button
                            variant="primary"
                            onClick={() => setStep(2)}
                            disabled={!groupName.trim()}
                            fullWidth
                        >
                            Next: Add Members
                        </Button>
                    </div>
                ) : (
                    // Step 2: Add Members
                    <div className={styles.content}>
                        <div className={styles.searchSection}>
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search users..."
                                icon={<Icon name="Search" size={20} />}
                            />
                        </div>

                        {selectedMembers.length > 0 && (
                            <div className={styles.selectedMembers}>
                                <div className={styles.selectedLabel}>
                                    Selected ({selectedMembers.length})
                                </div>
                                <div className={styles.selectedList}>
                                    {selectedMembers.map(member => (
                                        <div key={member.id} className={styles.selectedChip}>
                                            <Avatar src={member.avatar_url} size="xs" />
                                            <span>{member.username}</span>
                                            <button
                                                onClick={() => toggleMember(member)}
                                                className={styles.removeChip}
                                            >
                                                <Icon name="X" size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.searchResults}>
                            {loading ? (
                                <div className={styles.loading}>Searching...</div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map(user => {
                                    const isSelected = selectedMembers.find(m => m.id === user.id);
                                    return (
                                        <div
                                            key={user.id}
                                            className={`${styles.userItem} ${isSelected ? styles.selected : ''}`}
                                            onClick={() => toggleMember(user)}
                                        >
                                            <Avatar src={user.avatar_url} size="md" />
                                            <div className={styles.userInfo}>
                                                <div className={styles.username}>{user.username}</div>
                                                {user.full_name && (
                                                    <div className={styles.fullName}>{user.full_name}</div>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <Icon name="Check" size={20} className={styles.checkIcon} />
                                            )}
                                        </div>
                                    );
                                })
                            ) : searchQuery.trim().length >= 2 ? (
                                <div className={styles.noResults}>No users found</div>
                            ) : (
                                <div className={styles.hint}>Search for users to add to the group</div>
                            )}
                        </div>

                        <div className={styles.actions}>
                            <Button
                                variant="secondary"
                                onClick={() => setStep(1)}
                            >
                                Back
                            </Button>
                            <Button
                                variant="primary"
                                onClick={createGroup}
                                disabled={selectedMembers.length === 0 || creating}
                                loading={creating}
                            >
                                Create Group
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateGroupModal;
