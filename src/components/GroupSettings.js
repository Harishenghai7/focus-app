import { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import './GroupSettings.css';

export default function GroupSettings({ groupInfo, isAdmin, onClose, onUpdate }) {
  const [name, setName] = useState(groupInfo.name);
  const [description, setDescription] = useState(groupInfo.description || '');
  const [adminOnlyMessaging, setAdminOnlyMessaging] = useState(groupInfo.admin_only_messaging || false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(groupInfo.avatar_url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return groupInfo.avatar_url;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${groupInfo.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('group-avatars')
      .upload(filePath, avatarFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('group-avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    if (name.length > 100) {
      setError('Group name must be less than 100 characters');
      return;
    }

    if (description.length > 500) {
      setError('Description must be less than 500 characters');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let avatarUrl = groupInfo.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      // Update group settings
      const { data, error: updateError } = await supabase
        .from('group_chats')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          avatar_url: avatarUrl,
          admin_only_messaging: adminOnlyMessaging,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupInfo.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Call onUpdate callback with updated data
      if (onUpdate) {
        onUpdate(data);
      }

      onClose();
    } catch (error) {
      console.error('Error updating group settings:', error);
      setError('Failed to update group settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <motion.div
        className="group-settings-modal"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Group Settings</h2>
          <button onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="no-permission">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p>Only group admins can change settings</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="group-settings-modal"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <h2>Group Settings</h2>
        <button onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSave}>
        <div className="modal-body">
          {error && (
            <div className="error-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Avatar Upload */}
          <div className="settings-section">
            <label>Group Avatar</label>
            <div className="avatar-upload">
              <div className="avatar-preview" onClick={() => fileInputRef.current?.click()}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Group avatar" />
                ) : (
                  <div className="avatar-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                )}
                <div className="avatar-overlay">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Change Photo</span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Group Name */}
          <div className="settings-section">
            <label htmlFor="group-name">
              Group Name <span className="required">*</span>
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              maxLength={100}
              required
            />
            <div className="char-count">{name.length}/100</div>
          </div>

          {/* Group Description */}
          <div className="settings-section">
            <label htmlFor="group-description">Description</label>
            <textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for your group (optional)"
              maxLength={500}
              rows={4}
            />
            <div className="char-count">{description.length}/500</div>
          </div>

          {/* Admin Only Messaging */}
          <div className="settings-section">
            <div className="toggle-setting">
              <div className="toggle-info">
                <label>Admin Only Messaging</label>
                <p>When enabled, only admins can send messages in this group</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={adminOnlyMessaging}
                  onChange={(e) => setAdminOnlyMessaging(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? (
              <>
                <div className="button-spinner"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
