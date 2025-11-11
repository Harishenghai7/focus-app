import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AvatarUpload({ user, currentAvatar, onUpload, size = 'medium' }) {
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
    <div className={`avatar-upload ${size}`}>
      <div className="avatar-preview">
        <img src={getDefaultAvatar()} alt="Avatar" />
        {uploading && <div className="upload-overlay">Uploading...</div>}
      </div>
      <label className="upload-button">
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
        {uploading ? 'Uploading...' : 'Change Photo'}
      </label>
    </div>
  );
}
