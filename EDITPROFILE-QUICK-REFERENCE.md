# 🚀 EditProfile.js - Quick Reference Guide

## 📦 Import Structure

```javascript
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ImageCropper from "../components/ImageCropper";
import ProgressBar from "../components/ProgressBar";
import useImageUpload from "../hooks/useImageUpload";
import { validateUsername, validateUrl, validateEmail } from "../utils/validation";
import compressImage from "../utils/media/compressImage";
import "./EditProfile.css";
```

---

## 🎯 Key Features Summary

| Feature | Status | Description |
|---------|--------|-------------|
| **Avatar Upload** | ✅ | With cropping (1:1), compression, progress |
| **Cover Photo** | ✅ | With cropping (16:9/3:1/2:1), compression, progress |
| **Bio** | ✅ | 150 char limit, counter, warning |
| **Username** | ✅ | Validation, uniqueness check, feedback |
| **Email** | ✅ | Read-only display |
| **Website** | ✅ | URL validation, error display |
| **Location** | ✅ | Text input |
| **Phone** | ✅ | Tel input |
| **Save** | ✅ | Validation, upload, update, redirect |
| **Cancel** | ✅ | Navigation back |

---

## 🔄 State Variables

```javascript
// Profile data
const [profile, setProfile] = useState(null);
const [editUsername, setEditUsername] = useState("");
const [editFullName, setEditFullName] = useState("");
const [editBio, setEditBio] = useState("");
const [editEmail, setEditEmail] = useState("");
const [editWebsite, setEditWebsite] = useState("");
const [editLocation, setEditLocation] = useState("");
const [editPhone, setEditPhone] = useState("");

// Image uploads
const [avatarFile, setAvatarFile] = useState(null);
const [avatarPreview, setAvatarPreview] = useState(null);
const [coverFile, setCoverFile] = useState(null);
const [coverPreview, setCoverPreview] = useState(null);

// UI states
const [uploading, setUploading] = useState(false);
const [saving, setSaving] = useState(false);
const [message, setMessage] = useState("");

// Validation states
const [usernameError, setUsernameError] = useState("");
const [websiteError, setWebsiteError] = useState("");
const [checkingUsername, setCheckingUsername] = useState(false);

// Cropper states
const [showAvatarCropper, setShowAvatarCropper] = useState(false);
const [showCoverCropper, setShowCoverCropper] = useState(false);
const [imageToCrop, setImageToCrop] = useState(null);
```

---

## 🎨 Component Structure

```
EditProfile
├── Cover Photo Section
│   ├── Cover Preview/Placeholder
│   ├── Upload Progress (if uploading)
│   └── Change/Remove Buttons
├── Avatar Section
│   ├── Avatar Preview
│   ├── Upload Progress (if uploading)
│   └── Change/Remove Buttons
├── Form Fields
│   ├── Username (with validation)
│   ├── Full Name
│   ├── Bio (with char counter)
│   ├── Email (disabled)
│   ├── Website (with validation)
│   ├── Location
│   └── Phone
├── Action Buttons
│   ├── Cancel
│   └── Save
├── Upload Progress Bar
├── Success/Error Message
└── Image Cropper Modals
    ├── Avatar Cropper (1:1)
    └── Cover Cropper (16:9, 3:1, 2:1)
```

---

## 🔧 Key Functions

### Image Handling
- `handleAvatarChange(e)` - Process avatar selection, compress, show cropper
- `handleCoverChange(e)` - Process cover selection, compress, show cropper
- `handleAvatarCrop(url)` - Accept cropped avatar
- `handleCoverCrop(url)` - Accept cropped cover
- `removeAvatar()` - Clear avatar selection
- `removeCover()` - Clear cover selection
- `uploadAvatar()` - Upload avatar to Supabase Storage
- `uploadCover()` - Upload cover to Supabase Storage

### Validation
- `checkUsername(username)` - Validate and check uniqueness
- `handleWebsiteChange(website)` - Validate URL format

### Data Operations
- `fetchProfile()` - Load current profile data
- `handleSave(e)` - Save all changes to database

---

## 💾 Database Schema Required

```sql
-- profiles table should have:
- id (uuid, PK)
- username (text, unique)
- full_name (text)
- bio (text)
- website (text)
- location (text)
- phone (text)
- avatar_url (text)
- cover_photo_url (text)  -- NEW FIELD
- updated_at (timestamp)
```

---

## 🎨 CSS Classes Reference

### Sections
- `.page-edit-profile` - Main container
- `.edit-profile-container` - Form wrapper
- `.cover-section` - Cover photo section
- `.avatar-section` - Avatar section
- `.form-section` - Form fields container

### Components
- `.cover-upload-container` - Cover upload wrapper
- `.cover-preview-wrapper` - Cover preview area (200px height)
- `.cover-placeholder` - Empty cover placeholder
- `.avatar-upload-container` - Avatar upload wrapper
- `.current-avatar` - Avatar display
- `.avatar-preview` - Avatar image (120px)

### Buttons
- `.btn-change-cover` - Change cover button
- `.btn-remove-cover` - Remove cover button
- `.btn-change-photo` - Change avatar button
- `.btn-remove-photo` - Remove avatar button
- `.btn-cancel` - Cancel button
- `.btn-save` - Save button

### Form Elements
- `.form-group` - Form field wrapper
- `.form-label` - Field label
- `.form-input` - Text input
- `.form-textarea` - Textarea
- `.form-input.error` - Error state
- `.form-input.success` - Success state
- `.form-input:disabled` - Disabled state

### Feedback
- `.error-text` - Error message
- `.help-text` - Help text
- `.char-count` - Character counter
- `.message-banner` - Success/error banner
- `.upload-progress-section` - Progress display

### Modals
- `.cropper-modal-overlay` - Modal backdrop
- `.cropper-modal` - Modal content
- `.cropper-header` - Modal header
- `.close-btn` - Close button

---

## 📱 Responsive Breakpoints

```css
/* Desktop: Default styles */

/* Tablet: < 768px */
@media (max-width: 768px) {
  - Reduced padding
  - Stacked avatar layout
  - 150px cover height
  - Full-width buttons
  - Full-screen cropper
}

/* Mobile: < 480px */
@media (max-width: 480px) {
  - 100px avatar
  - 120px cover height
  - Vertical button layout
  - Minimal padding
}
```

---

## 🔐 Validation Rules

### Username
- Minimum: 3 characters
- Maximum: 30 characters
- Pattern: Alphanumeric + underscores
- Uniqueness: Checked against database
- Real-time: Validates on input

### Website
- Format: Valid URL
- Real-time: Validates on input
- Optional field

### Bio
- Maximum: 150 characters
- Warning: At 140+ characters

### Avatar
- Max Size: 5MB
- Type: image/*
- Compression: Applied automatically

### Cover Photo
- Max Size: 10MB
- Type: image/*
- Compression: Applied automatically

---

## 🎬 Animation Timings

```javascript
// Section animations
delay: 0.05  // Cover section
delay: 0.1   // Avatar section
delay: 0.2   // Form section
delay: 0.3   // Action buttons

// Modal animations
duration: 0.2  // Fast interactions
duration: 0.3  // Standard transitions

// Button animations
whileHover: { scale: 1.05 }
whileTap: { scale: 0.95 }
```

---

## 🚨 Error Handling

### Upload Errors
```javascript
if (file.size > 5MB) alert("File too large")
if (!file.type.startsWith("image/")) alert("Not an image")
```

### Validation Errors
- Username: Displayed inline below field
- Website: Displayed inline below field
- Database: Shown in banner message

### Network Errors
- Caught in try-catch blocks
- Displayed in error banner
- Buttons re-enabled

---

## 🧪 Testing Scenarios

1. **Happy Path**
   - Upload avatar → Crop → Save → Verify in profile
   - Upload cover → Crop → Save → Verify in profile
   - Edit bio → Save → Verify changes
   - Change username → Check availability → Save

2. **Validation**
   - Try invalid username (too short, special chars)
   - Try duplicate username
   - Try invalid website URL
   - Try bio over 150 chars

3. **Edge Cases**
   - Cancel during upload
   - Close cropper without saving
   - Remove and re-add images
   - Save without changes
   - Network failure during save

4. **Responsive**
   - Test on mobile (< 480px)
   - Test on tablet (< 768px)
   - Test landscape/portrait
   - Test cropper on mobile

---

## 📊 Performance Considerations

- ✅ Images compressed before upload
- ✅ Progress tracking for better UX
- ✅ Lazy loading of cropper
- ✅ Debounced username checking
- ✅ Optimized re-renders
- ✅ Proper cleanup of blob URLs

---

## ♿ Accessibility

- ✅ ARIA labels on buttons
- ✅ Semantic HTML
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Screen reader text
- ✅ Error announcements
- ✅ Disabled states

---

**Quick Start**: Import the component, pass `user` and `userProfile` props, and you're ready!

```javascript
<EditProfile user={user} userProfile={userProfile} />
```
