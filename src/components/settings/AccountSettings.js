import React, { useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { validateEmail, validatePassword, validateUsername, validatePhone, validatePasswordStrength } from '../../utils/validation';
import { useLanguage } from '../../hooks/useLanguage';
import ConfirmationModal from './ConfirmationModal';

const AccountSettings = ({ user, settings, onUpdate, onSuccess }) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState({});
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({});
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showExportData, setShowExportData] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleEdit = (field, currentValue) => {
    setIsEditing({ ...isEditing, [field]: true });
    setFormData({ ...formData, [field]: currentValue });
    setErrors({ ...errors, [field]: null });
  };

  const handleCancel = (field) => {
    setIsEditing({ ...isEditing, [field]: false });
    setFormData({ ...formData, [field]: undefined });
    setErrors({ ...errors, [field]: null });
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: null });
  };

  const handleSave = async (field) => {
    setLoading({ ...loading, [field]: true });
    
    try {
      let validation;
      let updateData = {};

      switch (field) {
        case 'email':
          validation = validateEmail(formData[field]);
          if (!validation.valid) {
            setErrors({ ...errors, [field]: validation.error });
            return;
          }
          
          const { error: emailError } = await supabase.auth.updateUser({
            email: validation.value
          });
          
          if (emailError) throw emailError;
          
          onSuccess('Email updated! Please check your inbox to confirm.');
          break;

        case 'username':
          validation = validateUsername(formData[field]);
          if (!validation.valid) {
            setErrors({ ...errors, [field]: validation.error });
            return;
          }
          
          // Check if username is taken
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('nickname', validation.value)
            .neq('id', user.id)
            .single();
          
          if (existingUser) {
            setErrors({ ...errors, [field]: 'Username is already taken' });
            return;
          }
          
          updateData = { nickname: validation.value };
          break;

        case 'displayName':
          validation = validateUsername(formData[field]);
          if (!validation.valid) {
            setErrors({ ...errors, [field]: validation.error });
            return;
          }
          updateData = { full_name: formData[field] };
          break;

        case 'phone':
          validation = validatePhone(formData[field]);
          if (!validation.valid) {
            setErrors({ ...errors, [field]: validation.error });
            return;
          }
          updateData = { phone: validation.value };
          break;

        default:
          break;
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);

        if (error) throw error;
      }

      setIsEditing({ ...isEditing, [field]: false });
      onSuccess(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      setErrors({ ...errors, [field]: error.message });
    } finally {
      setLoading({ ...loading, [field]: false });
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setLoading({ ...loading, avatar: true });

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onSuccess('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
      setAvatarPreview(null);
    } finally {
      setLoading({ ...loading, avatar: false });
    }
  };

  const handlePasswordChange = async () => {
    // Validate new password
    const validation = validatePassword(passwordData.newPassword);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Check if passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading({ ...loading, password: true });

    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      });

      if (signInError) {
        alert('Current password is incorrect');
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setShowPasswordChange(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength(null);
      onSuccess('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please try again.');
    } finally {
      setLoading({ ...loading, password: false });
    }
  };

  const handlePasswordInput = (field, value) => {
    setPasswordData({ ...passwordData, [field]: value });
    
    if (field === 'newPassword') {
      setPasswordStrength(validatePasswordStrength(value));
    }
  };

  const handleExportData = async () => {
    setLoading({ ...loading, export: true });
    setExportProgress(0);

    try {
      // Fetch all user data
      setExportProgress(20);
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setExportProgress(40);

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id);

      setExportProgress(60);

      const { data: followersData } = await supabase
        .from('followers')
        .select('*')
        .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

      setExportProgress(80);

      // Compile data
      const exportData = {
        exportDate: new Date().toISOString(),
        profile: profileData,
        posts: postsData,
        followers: followersData,
        settings: settings
      };

      setExportProgress(100);

      // Create downloadable file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focus-data-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setShowExportData(false);
        setExportProgress(0);
      }, 1000);

      onSuccess('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setLoading({ ...loading, export: false });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    setLoading({ ...loading, delete: true });

    try {
      // Delete user data
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.from('posts').delete().eq('user_id', user.id);
      await supabase.from('user_settings').delete().eq('user_id', user.id);

      // Delete auth user
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) throw error;

      // Sign out
      await supabase.auth.signOut();
      
      onSuccess('Account deleted successfully');
      
      // Redirect after a delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please contact support.');
    } finally {
      setLoading({ ...loading, delete: false });
    }
  };

  return (
    <div className="account-settings">
      <h2 className="section-title">{t('account.title')}</h2>

      {/* Avatar */}
      <div className="settings-field">
        <label className="field-label">Profile Picture</label>
        <div className="avatar-upload">
          <div className="avatar-preview">
            <img 
              src={avatarPreview || user?.user_metadata?.avatar_url || '/default-avatar.png'} 
              alt="Profile" 
            />
            {loading.avatar && <div className="avatar-loading">Uploading...</div>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <button 
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading.avatar}
          >
            Change Avatar
          </button>
        </div>
      </div>

      {/* Username */}
      <div className="settings-field">
        <label className="field-label" htmlFor="username">{t('account.username')}</label>
        {isEditing.username ? (
          <div className="field-edit">
            <input
              id="username"
              type="text"
              className={`settings-input ${errors.username ? 'error' : ''}`}
              value={formData.username || ''}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Enter username"
              autoFocus
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
            <div className="field-actions">
              <button 
                className="save-button"
                onClick={() => handleSave('username')}
                disabled={loading.username}
              >
                {loading.username ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="cancel-button"
                onClick={() => handleCancel('username')}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="field-display">
            <span className="field-value">{user?.user_metadata?.username || 'Not set'}</span>
            <button 
              className="edit-button"
              onClick={() => handleEdit('username', user?.user_metadata?.username)}
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Display Name */}
      <div className="settings-field">
        <label className="field-label" htmlFor="displayName">{t('account.displayName')}</label>
        {isEditing.displayName ? (
          <div className="field-edit">
            <input
              id="displayName"
              type="text"
              className={`settings-input ${errors.displayName ? 'error' : ''}`}
              value={formData.displayName || ''}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="Enter display name"
              autoFocus
            />
            {errors.displayName && <span className="error-text">{errors.displayName}</span>}
            <div className="field-actions">
              <button 
                className="save-button"
                onClick={() => handleSave('displayName')}
                disabled={loading.displayName}
              >
                {loading.displayName ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="cancel-button"
                onClick={() => handleCancel('displayName')}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="field-display">
            <span className="field-value">{user?.user_metadata?.full_name || 'Not set'}</span>
            <button 
              className="edit-button"
              onClick={() => handleEdit('displayName', user?.user_metadata?.full_name)}
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Email */}
      <div className="settings-field">
        <label className="field-label" htmlFor="email">{t('account.email')}</label>
        {isEditing.email ? (
          <div className="field-edit">
            <input
              id="email"
              type="email"
              className={`settings-input ${errors.email ? 'error' : ''}`}
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email"
              autoFocus
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
            <div className="field-actions">
              <button 
                className="save-button"
                onClick={() => handleSave('email')}
                disabled={loading.email}
              >
                {loading.email ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="cancel-button"
                onClick={() => handleCancel('email')}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="field-display">
            <span className="field-value">{user?.email || 'Not set'}</span>
            <button 
              className="edit-button"
              onClick={() => handleEdit('email', user?.email)}
            >
              Change Email
            </button>
          </div>
        )}
      </div>

      {/* Phone */}
      <div className="settings-field">
        <label className="field-label" htmlFor="phone">{t('account.phone')}</label>
        {isEditing.phone ? (
          <div className="field-edit">
            <input
              id="phone"
              type="tel"
              className={`settings-input ${errors.phone ? 'error' : ''}`}
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1234567890"
              autoFocus
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
            <div className="field-actions">
              <button 
                className="save-button"
                onClick={() => handleSave('phone')}
                disabled={loading.phone}
              >
                {loading.phone ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="cancel-button"
                onClick={() => handleCancel('phone')}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="field-display">
            <span className="field-value">{settings?.phone || 'Not set'}</span>
            <button 
              className="edit-button"
              onClick={() => handleEdit('phone', settings?.phone)}
            >
              {settings?.phone ? 'Change' : 'Add'} Phone
            </button>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="settings-field">
        <button 
          className="action-button"
          onClick={() => setShowPasswordChange(!showPasswordChange)}
        >
          {t('account.changePassword')}
        </button>
      </div>

      {showPasswordChange && (
        <div className="password-change-form">
          <div className="form-field">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              className="settings-input"
              value={passwordData.currentPassword}
              onChange={(e) => handlePasswordInput('currentPassword', e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="form-field">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              className="settings-input"
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordInput('newPassword', e.target.value)}
              placeholder="Enter new password"
            />
            {passwordStrength && (
              <div className="password-strength">
                <div 
                  className="strength-bar" 
                  style={{ 
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    backgroundColor: passwordStrength.color 
                  }}
                />
                <span className="strength-label" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="settings-input"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordInput('confirmPassword', e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <button 
            className="save-button"
            onClick={handlePasswordChange}
            disabled={loading.password}
          >
            {loading.password ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      )}

      {/* Danger Zone */}
      <div className="danger-zone">
        <h3 className="danger-title">Danger Zone</h3>
        
        <button 
          className="danger-button"
          onClick={() => setShowExportData(true)}
          disabled={loading.export}
        >
          {t('account.exportData')}
        </button>

        <button 
          className="danger-button"
          onClick={() => setShowDeleteAccount(true)}
        >
          {t('account.deleteAccount')}
        </button>
      </div>

      {/* Export Data Modal */}
      <ConfirmationModal
        isOpen={showExportData}
        title="Export Your Data"
        message="This will download all your account data as a JSON file."
        confirmText="Export"
        cancelText="Cancel"
        onConfirm={handleExportData}
        onCancel={() => setShowExportData(false)}
      />

      {exportProgress > 0 && exportProgress < 100 && (
        <div className="export-progress">
          <div className="progress-bar" style={{ width: `${exportProgress}%` }} />
          <span className="progress-text">{exportProgress}%</span>
        </div>
      )}

      {/* Delete Account Modal */}
      <ConfirmationModal
        isOpen={showDeleteAccount}
        title="Delete Account"
        message={
          <>
            <p>This action cannot be undone. All your data will be permanently deleted.</p>
            <p>Type <strong>DELETE</strong> to confirm:</p>
            <input
              type="text"
              className="settings-input"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type DELETE"
              style={{ marginTop: '10px' }}
            />
          </>
        }
        confirmText="Delete Account"
        cancelText="Cancel"
        onConfirm={handleDeleteAccount}
        onCancel={() => {
          setShowDeleteAccount(false);
          setDeleteConfirmation('');
        }}
        danger={true}
      />
    </div>
  );
};

export default AccountSettings;
