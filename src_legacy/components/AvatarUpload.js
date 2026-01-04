import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../supabaseClient';
import styles from './AvatarUpload.module.css';

/**
 * AvatarUpload - Upload and preview user avatar.
 * @component
 * @param {Object} user - Current user object
 * @param {string} currentAvatar - Current avatar URL
 * @param {function} onUpload - Handler for avatar upload
 * @param {string} [size] - Size of avatar
 * @returns {React.ReactElement}
 */
const AvatarUpload = React.memo(function AvatarUpload({ user, currentAvatar, onUpload, size = 'medium' }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.id) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      alert('Error uploading avatar');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    if (user?.id) {
      await supabase.from('profiles').update({
        avatar_url: publicUrl
      }).eq('id', user.id);
    }

    onUpload(publicUrl);
    setUploading(false);
  };

  const getDefaultAvatar = () => {
    if (currentAvatar) return currentAvatar;
    
    // Safely get user identifier
    const name = user?.email || user?.user_metadata?.email || user?.username || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=6366f1&color=ffffff`;
  };

  return (
    <div className={`${styles.avatarUpload} ${styles[size]}`}>
      <div className={styles.avatarPreview}>
        <img src={getDefaultAvatar()} alt="Avatar" className={styles.avatarImage} />
        {uploading && <div className={styles.uploadOverlay} role="alert">Uploading...</div>}
      </div>
      <label className={styles.uploadButton}>
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} aria-label="Upload Avatar" />
        {uploading ? 'Uploading...' : 'Change Photo'}
      </label>
    </div>
  );
});

AvatarUpload.displayName = 'AvatarUpload';
AvatarUpload.propTypes = {
  user: PropTypes.object.isRequired,
  currentAvatar: PropTypes.string,
  onUpload: PropTypes.func.isRequired,
  size: PropTypes.string
};

export default AvatarUpload;
