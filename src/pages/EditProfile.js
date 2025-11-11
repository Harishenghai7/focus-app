import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./EditProfile.css";

export default function EditProfile({ user, userProfile }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState(null);
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPhone, setEditPhone] = useState("");
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setEditUsername(data?.username || "");
      setEditFullName(data?.full_name || "");
      setEditBio(data?.bio || "");
      setEditWebsite(data?.website || "");
      setEditLocation(data?.location || "");
      setEditPhone(data?.phone || "");
      setAvatarPreview(data?.avatar_url);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // 🔥 NEW: Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size should be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage("Please select an image file");
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // 🔥 NEW: Remove avatar preview
  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar_url);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 🔥 NEW: Check username availability
  const checkUsername = async (username) => {
    if (username === profile?.username) {
      setUsernameError("");
      return true;
    }

    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      return false;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (data) {
        setUsernameError("Username already taken");
        return false;
      }

      setUsernameError("");
      return true;
    } catch (error) {
      // Username available (no match found)
      setUsernameError("");
      return true;
    }
  };

  // 🔥 NEW: Upload avatar to storage
  const uploadAvatar = async () => {
    if (!avatarFile) return profile?.avatar_url;

    setUploading(true);
    
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { 
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setMessage("Failed to upload avatar");
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // 🔥 UPDATED: Save profile with all fields
  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate username
    const isUsernameValid = await checkUsername(editUsername);
    if (!isUsernameValid) {
      setMessage("Please fix the errors before saving");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      // Upload avatar if changed
      let avatarUrl = profile?.avatar_url;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          username: editUsername.trim(),
          full_name: editFullName.trim() || null,
          bio: editBio.trim() || null,
          website: editWebsite.trim() || null,
          location: editLocation.trim() || null,
          phone: editPhone.trim() || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      setMessage("Profile updated successfully! 🎉");
      
      // Navigate back after 1.5 seconds
      setTimeout(() => {
        navigate("/profile");
      }, 1500);

    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="page page-edit-profile">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="page page-edit-profile"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-inner">
        <div className="edit-profile-container">
          <div className="edit-profile-header">
            <button 
              className="back-btn"
              onClick={() => navigate("/profile")}
              disabled={saving}
            >
              ← Back
            </button>
            <h1>Edit Profile</h1>
            <div></div>
          </div>

          <form onSubmit={handleSave} className="edit-profile-form">
            {/* 🔥 NEW: Avatar Upload Section */}
            <div className="avatar-section">
              <div className="avatar-upload-container">
                <div className="current-avatar">
                  <img 
                    src={avatarPreview || `https://ui-avatars.com/api/?name=${editUsername}`}
                    alt="Avatar"
                    className="avatar-preview"
                  />
                  {uploading && (
                    <div className="avatar-loading-overlay">
                      <div className="loading-spinner-sm"></div>
                    </div>
                  )}
                </div>
                
                <div className="avatar-actions">
                  <h3>{editUsername}</h3>
                  <div className="avatar-buttons">
                    <button
                      type="button"
                      className="btn-change-photo"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || saving}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      Change Photo
                    </button>
                    
                    {avatarFile && (
                      <button
                        type="button"
                        className="btn-remove-photo"
                        onClick={removeAvatar}
                      >
                        Remove
                      </button>
                    )}
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
            </div>

            {/* Form Fields */}
            <div className="form-section">
              {/* Username */}
              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  value={editUsername} 
                  onChange={(e) => {
                    setEditUsername(e.target.value);
                    checkUsername(e.target.value);
                  }}
                  className={`form-input ${usernameError ? 'error' : ''}`}
                  placeholder="your_username"
                  required
                  minLength={3}
                  maxLength={30}
                />
                {usernameError && (
                  <span className="error-text">{usernameError}</span>
                )}
                <span className="help-text">
                  Your unique username. Can only contain letters, numbers, and underscores.
                </span>
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  value={editFullName} 
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="form-input"
                  placeholder="Your Name"
                  maxLength={50}
                />
              </div>

              {/* Bio */}
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea 
                  value={editBio} 
                  onChange={(e) => setEditBio(e.target.value)}
                  className="form-textarea"
                  rows={4}
                  maxLength={150}
                  placeholder="Tell us about yourself..."
                />
                <div className="char-count">
                  {editBio.length}/150
                </div>
              </div>

              {/* Website */}
              <div className="form-group">
                <label className="form-label">Website</label>
                <input 
                  type="url" 
                  value={editWebsite} 
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="form-input"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              {/* Location */}
              <div className="form-group">
                <label className="form-label">Location</label>
                <input 
                  type="text" 
                  value={editLocation} 
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="form-input"
                  placeholder="City, Country"
                  maxLength={50}
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input 
                  type="tel" 
                  value={editPhone} 
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="form-input"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button 
                type="button"
                className="btn-cancel" 
                onClick={() => navigate("/profile")} 
                disabled={saving || uploading}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-save" 
                disabled={saving || uploading || !!usernameError}
              >
                {saving ? (
                  <>
                    <div className="loading-spinner-sm"></div>
                    Saving...
                  </>
                ) : uploading ? (
                  <>
                    <div className="loading-spinner-sm"></div>
                    Uploading...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>

            {/* Success/Error Message */}
            {message && (
              <motion.div 
                className={`message-banner ${message.includes('success') ? 'success' : 'error'}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {message}
              </motion.div>
            )}
          </form>
        </div>
      </div>
    </motion.div>
  );
}
