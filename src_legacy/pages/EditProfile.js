import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ImageCropper from "../components/ImageCropper";
import ProgressBar from "../components/ProgressBar";
import useImageUpload from "../hooks/useImageUpload";
import { validateUsername, validateURL, validateEmail } from "../utils/validation";
import compressImage from "../utils/media/compressImage";
import "./EditProfile.css";

export default function EditProfile({ user, userProfile }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const { uploadImage, progress, error: uploadError } = useImageUpload();
  
  const [profile, setProfile] = useState(null);
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPhone, setEditPhone] = useState("");
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [websiteError, setWebsiteError] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  // Image cropper state
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [showCoverCropper, setShowCoverCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setEditUsername(data.username || "");
      setEditFullName(data.full_name || "");
      setEditBio(data.bio || "");
      setEditEmail(user.email || "");
      setEditWebsite(data.website || "");
      setEditLocation(data.location || "");
      setEditPhone(data.phone || "");
      setAvatarPreview(data.avatar_url || null);
      setCoverPreview(data.cover_photo_url || null);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage("Failed to load profile");
    }
  };

  const checkUsername = async (username) => {
    if (!username || username === profile?.username) {
      setUsernameError("");
      return;
    }

    const validation = validateUsername(username);
    if (!validation.isValid) {
      setUsernameError(validation.errors[0] || "Invalid username");
      return;
    }

    setCheckingUsername(true);
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setUsernameError("Username is already taken");
      } else {
        setUsernameError("");
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameError("Failed to check username availability");
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleWebsiteChange = (website) => {
    setEditWebsite(website);
    if (website && !validateURL(website)) {
      setWebsiteError("Please enter a valid URL");
    } else {
      setWebsiteError("");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Compress image before showing cropper
    const compressed = await compressImage(file);
    const previewUrl = URL.createObjectURL(compressed);
    
    setImageToCrop(previewUrl);
    setShowAvatarCropper(true);
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Cover photo size must be less than 10MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Compress image before showing cropper
    const compressed = await compressImage(file);
    const previewUrl = URL.createObjectURL(compressed);
    
    setImageToCrop(previewUrl);
    setShowCoverCropper(true);
  };

  const handleAvatarCrop = (croppedImageUrl) => {
    setAvatarPreview(croppedImageUrl);
    setAvatarFile(croppedImageUrl);
    setShowAvatarCropper(false);
    setImageToCrop(null);
  };

  const handleCoverCrop = (croppedImageUrl) => {
    setCoverPreview(croppedImageUrl);
    setCoverFile(croppedImageUrl);
    setShowCoverCropper(false);
    setImageToCrop(null);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar_url || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview(profile?.cover_photo_url || null);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return profile?.avatar_url;

    setUploading(true);

    try {
      // Convert data URL to blob if needed
      let fileToUpload = avatarFile;
      if (typeof avatarFile === 'string' && avatarFile.startsWith('data:')) {
        const blob = await fetch(avatarFile).then(r => r.blob());
        fileToUpload = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      }

      const fileExt = fileToUpload.name ? fileToUpload.name.split(".").pop() : 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, fileToUpload, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const uploadCover = async () => {
    if (!coverFile) return profile?.cover_photo_url;

    setUploading(true);

    try {
      // Convert data URL to blob if needed
      let fileToUpload = coverFile;
      if (typeof coverFile === 'string' && coverFile.startsWith('data:')) {
        const blob = await fetch(coverFile).then(r => r.blob());
        fileToUpload = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
      }

      const fileExt = fileToUpload.name ? fileToUpload.name.split(".").pop() : 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, fileToUpload, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading cover:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (usernameError || websiteError) {
      setMessage("Please fix errors before saving");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      let avatarUrl = profile?.avatar_url;
      let coverUrl = profile?.cover_photo_url;

      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      if (coverFile) {
        coverUrl = await uploadCover();
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username: editUsername,
          full_name: editFullName,
          bio: editBio,
          website: editWebsite,
          location: editLocation,
          phone: editPhone,
          avatar_url: avatarUrl,
          cover_photo_url: coverUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setMessage("Profile updated successfully! 🎉");
      
      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="page-edit-profile">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-edit-profile">
      <motion.div 
        className="edit-profile-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="edit-profile-header">
          <button 
            className="btn-back" 
            onClick={() => navigate("/profile")}
            aria-label="Go back"
          >
            ←
          </button>
          <h1>Edit Profile</h1>
          <div style={{ width: '40px' }}></div>
        </div>

        <form onSubmit={handleSave} className="edit-profile-form">
          {/* Cover Photo Section */}
          <motion.div 
            className="cover-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="cover-upload-container">
              <div className="cover-preview-wrapper">
                {coverPreview ? (
                  <img 
                    src={coverPreview}
                    alt="Cover"
                    className="cover-preview"
                  />
                ) : (
                  <div className="cover-placeholder">
                    <span>📷</span>
                    <p>No cover photo</p>
                  </div>
                )}
                {uploading && progress > 0 && (
                  <div className="cover-loading-overlay">
                    <ProgressBar value={progress} label="Uploading cover..." />
                  </div>
                )}
              </div>
              <div className="cover-actions">
                <motion.button
                  type="button"
                  className="btn-change-cover"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading || saving}
                  whileHover={{ scale: uploading || saving ? 1 : 1.05 }}
                  whileTap={{ scale: uploading || saving ? 1 : 0.95 }}
                >
                  {coverPreview ? 'Change Cover Photo' : 'Add Cover Photo'}
                </motion.button>
                
                {coverFile && (
                  <motion.button
                    type="button"
                    className="btn-remove-cover"
                    onClick={removeCover}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Remove Cover
                  </motion.button>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </motion.div>

          {/* Avatar Section */}
          <motion.div 
            className="avatar-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="avatar-upload-container">
              <motion.div 
                className="current-avatar"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <img 
                  src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(editUsername || 'User')}`}
                  alt="Profile avatar"
                  className="avatar-preview"
                />
                {uploading && progress > 0 && (
                  <motion.div 
                    className="avatar-loading-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <ProgressBar value={progress} label="Uploading..." />
                  </motion.div>
                )}
              </motion.div>
              
              <div className="avatar-actions">
                <h3>{editUsername}</h3>
                <div className="avatar-buttons">
                  <motion.button
                    type="button"
                    className="btn-change-photo"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || saving}
                    whileHover={{ scale: uploading || saving ? 1 : 1.05 }}
                    whileTap={{ scale: uploading || saving ? 1 : 0.95 }}
                  >
                    Change Photo
                  </motion.button>
                  
                  {avatarFile && (
                    <motion.button
                      type="button"
                      className="btn-remove-photo"
                      onClick={removeAvatar}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Remove
                    </motion.button>
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
          </motion.div>

          {/* Form Fields */}
          <motion.div 
            className="form-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Username */}
            <div className="form-group">
              <label className="form-label" htmlFor="username-input">
                Username<span className="required-indicator">*</span>
              </label>
              <div className="input-wrapper">
                <input 
                  id="username-input"
                  type="text" 
                  value={editUsername} 
                  onChange={(e) => {
                    setEditUsername(e.target.value);
                    checkUsername(e.target.value);
                  }}
                  className={`form-input ${usernameError ? 'error' : editUsername && !usernameError ? 'success' : ''}`}
                  placeholder="your_username"
                  required
                  minLength={3}
                  maxLength={30}
                />
                {checkingUsername && (
                  <div className="input-status checking">
                    <div className="spinner-small"></div>
                  </div>
                )}
                {!checkingUsername && editUsername && !usernameError && editUsername !== profile?.username && (
                  <div className="input-status success">✓</div>
                )}
              </div>
              {usernameError && (
                <motion.span 
                  className="error-text"
                  id="username-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {usernameError}
                </motion.span>
              )}
              <span className="help-text">
                Your unique username. 3-30 characters.
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
                <span className={editBio.length >= 140 ? 'warning' : ''}>
                  {editBio.length}
                </span>
                /150
              </div>
              <span className="help-text">
                Maximum 150 characters
              </span>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                value={editEmail} 
                onChange={(e) => setEditEmail(e.target.value)}
                className="form-input"
                placeholder="your@email.com"
                disabled
                title="Email cannot be changed here. Please update via account settings."
              />
              <span className="help-text">
                Email is managed through your account settings
              </span>
            </div>

            {/* Website */}
            <div className="form-group">
              <label className="form-label">Website</label>
              <input 
                type="url" 
                value={editWebsite} 
                onChange={(e) => handleWebsiteChange(e.target.value)}
                className={`form-input ${websiteError ? 'error' : ''}`}
                placeholder="https://yourwebsite.com"
              />
              {websiteError && (
                <motion.span 
                  className="error-text"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {websiteError}
                </motion.span>
              )}
              <span className="help-text">
                Your personal or professional website
              </span>
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
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="form-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button 
              type="button"
              className="btn-cancel" 
              onClick={() => navigate("/profile")} 
              disabled={saving || uploading}
              whileHover={{ scale: saving || uploading ? 1 : 1.05 }}
              whileTap={{ scale: saving || uploading ? 1 : 0.95 }}
            >
              Cancel
            </motion.button>
            <motion.button 
              type="submit"
              className="btn-save" 
              disabled={saving || uploading || !!usernameError || !!websiteError}
              whileHover={{ scale: (saving || uploading || !!usernameError || !!websiteError) ? 1 : 1.05 }}
              whileTap={{ scale: (saving || uploading || !!usernameError || !!websiteError) ? 1 : 0.95 }}
            >
              {saving ? (
                <>
                  <div className="loading-spinner-sm"></div>
                  <span>Saving...</span>
                </>
              ) : uploading ? (
                <>
                  <div className="loading-spinner-sm"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </motion.button>
          </motion.div>

          {/* Progress Bar for Upload */}
          {uploading && progress > 0 && (
            <motion.div 
              className="upload-progress-section"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ProgressBar value={progress} label="Uploading images..." />
            </motion.div>
          )}

          {/* Success/Error Message */}
          <AnimatePresence>
            {message && (
              <motion.div 
                className={`message-banner ${message.includes('success') || message.includes('🎉') ? 'success' : 'error'}`}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>

      {/* Image Cropper Modals */}
      <AnimatePresence>
        {showAvatarCropper && imageToCrop && (
          <motion.div 
            className="cropper-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowAvatarCropper(false);
              setImageToCrop(null);
            }}
          >
            <motion.div 
              className="cropper-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cropper-header">
                <h2>Crop Avatar</h2>
                <button 
                  type="button"
                  className="close-btn"
                  onClick={() => {
                    setShowAvatarCropper(false);
                    setImageToCrop(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <ImageCropper 
                src={imageToCrop}
                aspectRatios={['1:1']}
                onCrop={handleAvatarCrop}
              />
            </motion.div>
          </motion.div>
        )}

        {showCoverCropper && imageToCrop && (
          <motion.div 
            className="cropper-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowCoverCropper(false);
              setImageToCrop(null);
            }}
          >
            <motion.div 
              className="cropper-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cropper-header">
                <h2>Crop Cover Photo</h2>
                <button 
                  type="button"
                  className="close-btn"
                  onClick={() => {
                    setShowCoverCropper(false);
                    setImageToCrop(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <ImageCropper 
                src={imageToCrop}
                aspectRatios={['16:9', '3:1', '2:1']}
                onCrop={handleCoverCrop}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
