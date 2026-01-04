import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import MemberCard from '../components/MemberCard';
import ImageCropper from '../components/ImageCropper';
import { formatDate } from '../utils/dateFormatter';
import './GroupSettings.css';

export default function GroupSettings({ user, userProfile }) {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    muted: false,
    muteUntil: null
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user || !groupId) return;
    fetchGroupData();
  }, [user, groupId]);

  const fetchGroupData = async () => {
    try {
      // Fetch group info
      const { data: groupData, error: groupError } = await supabase
        .from('group_chats')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);
      setNewGroupName(groupData.name);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          profile:user_id(id, username, full_name, avatar_url, is_verified)
        `)
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Check notification settings
      const currentMember = membersData?.find(m => m.user_id === user.id);
      if (currentMember) {
        const mutedUntil = currentMember.muted_until;
        setNotificationSettings({
          muted: mutedUntil && new Date(mutedUntil) > new Date(),
          muteUntil: mutedUntil ? new Date(mutedUntil) : null
        });
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    const currentMember = members.find(m => m.user_id === user.id);
    return currentMember?.role === 'admin';
  };

  const isCreator = () => {
    return group?.created_by === user.id;
  };

  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim() || !isAdmin()) return;

    try {
      const { error } = await supabase
        .from('group_chats')
        .update({ name: newGroupName.trim() })
        .eq('id', groupId);

      if (error) throw error;

      setGroup(prev => ({ ...prev, name: newGroupName.trim() }));
      setEditingName(false);
      alert('Group name updated successfully');
    } catch (error) {
      console.error('Error updating group name:', error);
      alert('Failed to update group name');
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
        setShowImageCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageCrop = async (croppedImage) => {
    if (!isAdmin()) return;

    try {
      // Upload to Supabase Storage
      const fileName = `group-avatars/${groupId}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedImage);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update group
      const { error: updateError } = await supabase
        .from('group_chats')
        .update({ avatar_url: publicUrl })
        .eq('id', groupId);

      if (updateError) throw updateError;

      setGroup(prev => ({ ...prev, avatar_url: publicUrl }));
      setShowImageCropper(false);
      setSelectedImage(null);
      alert('Group avatar updated successfully');
    } catch (error) {
      console.error('Error updating group avatar:', error);
      alert('Failed to update group avatar');
    }
  };

  const handleSearchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_verified')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      // Filter out existing members
      const memberIds = members.map(m => m.user_id);
      setSearchResults((data || []).filter(u => !memberIds.includes(u.id)));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString()
        });

      if (error) throw error;

      // Refresh members
      await fetchGroupData();
      setShowAddMember(false);
      setSearchQuery('');
      setSearchResults([]);
      alert('Member added successfully');
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    }
  };

  const handleRemoveMember = async (member) => {
    if (!confirm(`Remove ${member.profile?.full_name || member.profile?.username} from this group?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', member.user_id);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.user_id !== member.user_id));
      alert('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  const handleMakeAdmin = async (member) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_id', groupId)
        .eq('user_id', member.user_id);

      if (error) throw error;

      setMembers(prev => prev.map(m => 
        m.user_id === member.user_id ? { ...m, role: 'admin' } : m
      ));
      alert('Member promoted to admin');
    } catch (error) {
      console.error('Error making admin:', error);
      alert('Failed to update member role');
    }
  };

  const handleToggleMute = async (hours = null) => {
    try {
      await supabase.rpc('toggle_group_mute', {
        p_group_id: groupId,
        p_user_id: user.id,
        p_duration_hours: hours
      });

      if (hours) {
        setNotificationSettings({
          muted: true,
          muteUntil: new Date(Date.now() + hours * 60 * 60 * 1000)
        });
      } else {
        setNotificationSettings({
          muted: false,
          muteUntil: null
        });
      }
      
      alert(hours ? 'Group muted' : 'Group unmuted');
    } catch (error) {
      console.error('Error toggling mute:', error);
      alert('Failed to update notification settings');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      alert('You have left the group');
      navigate('/messages');
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
    if (deleteConfirmText !== group.name) {
      alert('Please type the group name correctly to confirm deletion');
      return;
    }

    try {
      const { error } = await supabase
        .from('group_chats')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      alert('Group deleted successfully');
      navigate('/messages');
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="settings-loading">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </Layout>
    );
  }

  if (!group) {
    return (
      <Layout>
        <div className="settings-error">
          <h2>Group not found</h2>
          <button onClick={() => navigate('/messages')}>Back to Messages</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="group-settings-page">
        {/* Header */}
        <div className="settings-header">
          <button className="back-btn" onClick={() => navigate(`/group/${groupId}`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1>Group Settings</h1>
        </div>

        <div className="settings-content">
          {/* Group Info Section */}
          <section className="settings-section">
            <h2>Group Information</h2>
            
            {/* Group Avatar */}
            <div className="avatar-section">
              <img
                src={group.avatar_url || `https://ui-avatars.com/api/?name=${group.name}`}
                alt={group.name}
                className="group-avatar-large"
              />
              {isAdmin() && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    className="change-avatar-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Change Photo
                  </button>
                </>
              )}
            </div>

            {/* Group Name */}
            <div className="name-section">
              <label>Group Name</label>
              {editingName && isAdmin() ? (
                <div className="name-edit">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    maxLength={50}
                  />
                  <button onClick={handleUpdateGroupName} className="save-btn">Save</button>
                  <button onClick={() => {
                    setEditingName(false);
                    setNewGroupName(group.name);
                  }} className="cancel-btn">Cancel</button>
                </div>
              ) : (
                <div className="name-display">
                  <span>{group.name}</span>
                  {isAdmin() && (
                    <button onClick={() => setEditingName(true)} className="edit-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="group-stats">
              <div className="stat">
                <span className="stat-label">Created</span>
                <span className="stat-value">{formatDate(group.created_at)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Members</span>
                <span className="stat-value">{members.length}</span>
              </div>
            </div>
          </section>

          {/* Members Section */}
          <section className="settings-section">
            <div className="section-header">
              <h2>Members ({members.length})</h2>
              {isAdmin() && (
                <button className="add-member-btn" onClick={() => setShowAddMember(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add Member
                </button>
              )}
            </div>

            <div className="members-list">
              {members.map(member => (
                <MemberCard
                  key={member.user_id}
                  member={member}
                  isAdmin={member.role === 'admin'}
                  canRemove={isAdmin() && member.user_id !== user.id}
                  onRemove={handleRemoveMember}
                  onMakeAdmin={isCreator() && member.role !== 'admin' ? handleMakeAdmin : null}
                />
              ))}
            </div>
          </section>

          {/* Notifications Section */}
          <section className="settings-section">
            <h2>Notifications</h2>
            
            <div className="notification-settings">
              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">Mute Notifications</span>
                  <span className="setting-description">
                    {notificationSettings.muted 
                      ? `Muted until ${notificationSettings.muteUntil?.toLocaleString()}`
                      : 'Receive notifications for new messages'
                    }
                  </span>
                </div>
                {notificationSettings.muted ? (
                  <button className="unmute-btn" onClick={() => handleToggleMute(null)}>
                    Unmute
                  </button>
                ) : (
                  <select 
                    className="mute-select"
                    onChange={(e) => handleToggleMute(parseInt(e.target.value))}
                    value=""
                  >
                    <option value="" disabled>Mute for...</option>
                    <option value="1">1 hour</option>
                    <option value="8">8 hours</option>
                    <option value="24">1 day</option>
                    <option value="168">1 week</option>
                    <option value="720">1 month</option>
                  </select>
                )}
              </div>
            </div>
          </section>

          {/* Actions Section */}
          <section className="settings-section danger-section">
            <h2>Actions</h2>
            
            <button className="leave-group-btn" onClick={handleLeaveGroup}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Leave Group
            </button>

            {isCreator() && (
              <button 
                className="delete-group-btn"
                onClick={() => setConfirmDelete(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Group
              </button>
            )}
          </section>
        </div>

        {/* Image Cropper Modal */}
        <AnimatePresence>
          {showImageCropper && selectedImage && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowImageCropper(false);
                setSelectedImage(null);
              }}
            >
              <motion.div
                className="modal-content"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <ImageCropper
                  src={selectedImage}
                  aspectRatios={['1:1']}
                  onCrop={handleImageCrop}
                />
                <button
                  className="close-modal-btn"
                  onClick={() => {
                    setShowImageCropper(false);
                    setSelectedImage(null);
                  }}
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Member Modal */}
        <AnimatePresence>
          {showAddMember && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMember(false)}
            >
              <motion.div
                className="modal-content add-member-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3>Add Member</h3>
                
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearchUsers(e.target.value);
                    }}
                  />
                  {searching && <div className="searching-indicator">Searching...</div>}
                </div>

                <div className="search-results">
                  {searchResults.length === 0 && searchQuery && !searching && (
                    <p className="no-results">No users found</p>
                  )}
                  {searchResults.map(user => (
                    <div key={user.id} className="search-result-item">
                      <img
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}`}
                        alt={user.username}
                      />
                      <div className="result-info">
                        <span className="result-name">{user.full_name || user.username}</span>
                        <span className="result-username">@{user.username}</span>
                      </div>
                      <button onClick={() => handleAddMember(user.id)}>Add</button>
                    </div>
                  ))}
                </div>

                <button
                  className="close-modal-btn"
                  onClick={() => setShowAddMember(false)}
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(false)}
            >
              <motion.div
                className="modal-content delete-confirm-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3>Delete Group</h3>
                <p className="warning-text">
                  This action cannot be undone. All messages and data will be permanently deleted.
                </p>
                <p>Type "<strong>{group.name}</strong>" to confirm:</p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type group name"
                />
                <div className="modal-actions">
                  <button
                    className="confirm-delete-btn"
                    onClick={handleDeleteGroup}
                    disabled={deleteConfirmText !== group.name}
                  >
                    Delete Forever
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setConfirmDelete(false);
                      setDeleteConfirmText('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}