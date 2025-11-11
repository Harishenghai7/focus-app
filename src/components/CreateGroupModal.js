import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import './CreateGroupModal.css';

export default function CreateGroupModal({ user, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 0) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(10);
      
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const toggleUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    
    setLoading(true);
    try {
      // Create group
      const { data: group, error: groupError } = await supabase
        .from('group_chats')
        .insert({
          name: groupName.trim(),
          description: groupDescription.trim() || null,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin'
      });

      // Add selected members
      const memberInserts = selectedUsers.map(userId => ({
        group_id: group.id,
        user_id: userId,
        role: 'member'
      }));

      await supabase.from('group_members').insert(memberInserts);

      onCreated(group);
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
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
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Create Group Chat</h2>
            <button onClick={onClose}>×</button>
          </div>

          {step === 1 ? (
            <div className="modal-content">
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  maxLength={50}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="What's this group about?"
                  maxLength={200}
                  rows={3}
                />
              </div>

              <button
                className="btn-primary"
                onClick={() => setStep(2)}
                disabled={!groupName.trim()}
              >
                Next: Add Members
              </button>
            </div>
          ) : (
            <div className="modal-content">
              <div className="form-group">
                <label>Add Members ({selectedUsers.length} selected)</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                />
              </div>

              <div className="users-list">
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    className={`user-item ${selectedUsers.includes(user.id) ? 'selected' : ''}`}
                    onClick={() => toggleUser(user.id)}
                  >
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}`}
                      alt={user.username}
                    />
                    <div className="user-info">
                      <span className="username">{user.username}</span>
                      {user.full_name && <span className="fullname">{user.full_name}</span>}
                    </div>
                    {selectedUsers.includes(user.id) && <span className="checkmark">✓</span>}
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={createGroup}
                  disabled={loading || selectedUsers.length === 0}
                >
                  {loading ? 'Creating...' : `Create Group (${selectedUsers.length} members)`}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
