import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import styles from './CreateGroupModal.module.css';

/**
 * CreateGroupModal - Modal for creating a new group chat.
 * @component
 * @param {Object} user - Current user object
 * @param {function} onClose - Handler to close modal
 * @param {function} onCreated - Handler for successful group creation
 * @returns {React.ReactElement}
 */
const CreateGroupModal = React.memo(function CreateGroupModal({ user, onClose, onCreated }) {
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
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.createGroupModal}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modalHeader}>
            <h2>Create Group Chat</h2>
            <button onClick={onClose} aria-label="Close modal">×</button>
          </div>

          {step === 1 ? (
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label htmlFor="groupName">Group Name *</label>
                <input
                  id="groupName"
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  maxLength={50}
                  autoFocus
                  aria-required="true"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="groupDescription">Description (Optional)</label>
                <textarea
                  id="groupDescription"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="What's this group about?"
                  maxLength={200}
                  rows={3}
                  aria-required="false"
                />
              </div>

              <button
                className={styles.btnPrimary}
                onClick={() => setStep(2)}
                disabled={!groupName.trim()}
                aria-disabled={!groupName.trim()}
              >
                Next: Add Members
              </button>
            </div>
          ) : (
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Add Members ({selectedUsers.length} selected)</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  aria-label="Search users"
                />
              </div>

              <div className={styles.usersList}>
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    className={`${styles.userItem} ${selectedUsers.includes(user.id) ? styles.selected : ''}`}
                    onClick={() => toggleUser(user.id)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedUsers.includes(user.id)}
                    aria-label={`Select ${user.username}`}
                  >
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}`}
                      alt={user.username}
                    />
                    <div className={styles.userInfo}>
                      <span className={styles.username}>{user.username}</span>
                      {user.full_name && <span className={styles.fullname}>{user.full_name}</span>}
                    </div>
                    {selectedUsers.includes(user.id) && <span className={styles.checkmark}>✓</span>}
                  </div>
                ))}
              </div>

              <div className={styles.modalActions}>
                <button className={styles.btnSecondary} onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  className={styles.btnPrimary}
                  onClick={createGroup}
                  disabled={loading || selectedUsers.length === 0}
                  aria-busy={loading}
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
});

CreateGroupModal.displayName = 'CreateGroupModal';
CreateGroupModal.propTypes = {
  user: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func
};

export default CreateGroupModal;
