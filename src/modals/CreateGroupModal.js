import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import './CreateGroupModal.css';

export default function CreateGroupModal({ user, onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Group Info, 2: Add Members

  const MAX_MEMBERS = 50;

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async (query) => {
    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_query: query.trim(),
        page_size: 20
      });

      if (error) throw error;
      
      // Filter out already selected members and current user
      const filtered = (data || []).filter(
        u => u.id !== user.id && !selectedMembers.find(m => m.id === u.id)
      );
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setSelectedAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  };

  const toggleMember = (user) => {
    if (selectedMembers.find(m => m.id === user.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== user.id));
    } else {
      if (selectedMembers.length >= MAX_MEMBERS) {
        setError(`Maximum ${MAX_MEMBERS} members allowed`);
        return;
      }
      setSelectedMembers([...selectedMembers, user]);
      setError('');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Please add at least one member');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let avatarUrl = null;

      // Upload avatar if selected
      if (selectedAvatar) {
        const fileExt = selectedAvatar.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('group-avatars')
          .upload(fileName, selectedAvatar);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('group-avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Create group
      const { data: group, error: groupError } = await supabase
        .from('group_chats')
        .insert({
          name: groupName.trim(),
          description: groupDescription.trim() || null,
          avatar_url: avatarUrl,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      const membersToAdd = [
        { group_id: group.id, user_id: user.id, role: 'admin' },
        ...selectedMembers.map(m => ({
          group_id: group.id,
          user_id: m.id,
          role: 'member'
        }))
      ];

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(membersToAdd);

      if (membersError) throw membersError;

      // Send welcome message
      await supabase
        .from('group_messages')
        .insert({
          group_id: group.id,
          sender_id: user.id,
          content: `${user.username || 'Someone'} created the group`,
          message_type: 'text'
        });

      onGroupCreated(group);
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="create-group-modal"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>{step === 1 ? 'Create Group' : 'Add Members'}</h2>
            <button className="close-btn" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          {step === 1 ? (
            <div className="modal-body">
              <div className="avatar-section">
                <div className="avatar-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Group avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <label className="avatar-upload-btn">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    style={{ display: 'none' }}
                  />
                  Choose Photo
                </label>
              </div>

              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={50}
                  autoFocus
                />
                <span className="char-count">{groupName.length}/50</span>
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  placeholder="What's this group about?"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
                <span className="char-count">{groupDescription.length}/200</span>
              </div>
            </div>
          ) : (
            <div className="modal-body">
              <div className="search-section">
                <div className="search-input">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

              {selectedMembers.length > 0 && (
                <div className="selected-members">
                  <h4>Selected ({selectedMembers.length}/{MAX_MEMBERS})</h4>
                  <div className="members-chips">
                    {selectedMembers.map(member => (
                      <div key={member.id} className="member-chip">
                        <img
                          src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.username}`}
                          alt={member.username}
                        />
                        <span>{member.username}</span>
                        <button onClick={() => toggleMember(member)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="search-results">
                {searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <div
                      key={user.id}
                      className={`user-item ${selectedMembers.find(m => m.id === user.id) ? 'selected' : ''}`}
                      onClick={() => toggleMember(user)}
                    >
                      <img
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}`}
                        alt={user.username}
                      />
                      <div className="user-info">
                        <h4>{user.full_name || user.username}</h4>
                        <p>@{user.username}</p>
                      </div>
                      <div className="checkbox">
                        {selectedMembers.find(m => m.id === user.id) && (
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))
                ) : searchQuery.trim() ? (
                  <div className="empty-state">
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Search for users to add</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="modal-footer">
            {step === 1 ? (
              <>
                <button className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setStep(2)}
                  disabled={!groupName.trim()}
                >
                  Next
                </button>
              </>
            ) : (
              <>
                <button className="btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={handleCreateGroup}
                  disabled={loading || selectedMembers.length === 0}
                >
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
