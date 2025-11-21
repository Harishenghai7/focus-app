# 📤 Media Upload Hooks Guide

Complete guide for `useImageUpload` and `useVideoUpload` hooks.

## 📋 Table of Contents

- [Overview](#overview)
- [useImageUpload Hook](#useimageupload-hook)
- [useVideoUpload Hook](#usevideoupload-hook)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Error Handling](#error-handling)
- [Advanced Features](#advanced-features)

---

## 🎯 Overview

These hooks provide complete media upload functionality with:

- ✅ File validation
- ✅ Image compression and resizing
- ✅ Progress tracking
- ✅ Thumbnail generation
- ✅ Supabase Storage integration
- ✅ Upload cancellation
- ✅ Error handling
- ✅ Multiple file uploads
- ✅ Upload speed tracking

---

## 🖼️ useImageUpload Hook

### Purpose
Handle image uploads with automatic compression, resizing, and thumbnail generation.

### Features
- ✅ Validate image files (JPEG, PNG, WebP, GIF)
- ✅ Compress images before upload (reduce file size)
- ✅ Resize images to maximum dimensions
- ✅ Generate thumbnails automatically
- ✅ Track upload progress (0-100%)
- ✅ Upload to Supabase Storage
- ✅ Support multiple image uploads
- ✅ Cancel ongoing uploads

### Basic Usage

```javascript
import useImageUpload from '../hooks/useImageUpload';

function MyComponent() {
  const {
    uploadImage,
    uploadProgress,
    uploadedUrl,
    thumbnailUrl,
    error,
    isUploading
  } = useImageUpload({
    bucket: 'posts',
    compressionOptions: {
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920
    },
    generateThumb: true,
    thumbnailSize: 150
  });

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const result = await uploadImage(file);
        console.log('Upload complete:', result);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileSelect} />
      {isUploading && <p>Progress: {uploadProgress}%</p>}
      {uploadedUrl && <img src={uploadedUrl} alt="Uploaded" />}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### Configuration Options

```javascript
{
  // Storage bucket name
  bucket: 'posts' | 'avatars' | 'stories' | 'messages',
  
  // Compression options
  compressionOptions: {
    quality: 0.8,        // 0.0 - 1.0 (0.8 = 80% quality)
    maxWidth: 1920,      // Maximum width in pixels
    maxHeight: 1920,     // Maximum height in pixels
    mimeType: 'image/jpeg' // Output format
  },
  
  // Thumbnail generation
  generateThumb: true,   // Generate thumbnail
  thumbnailSize: 150     // Thumbnail size (150x150)
}
```

### Return Values

```javascript
{
  // Main upload function
  uploadImage: (file) => Promise<{
    url: string,              // Public URL of uploaded image
    thumbnailUrl: string,     // Public URL of thumbnail
    filename: string,         // Generated filename
    size: number,            // Compressed file size
    originalSize: number,    // Original file size
    compressionRatio: string // Compression percentage
  }>,
  
  // Multiple upload function
  uploadMultipleImages: (files) => Promise<Array>,
  
  // State
  uploadProgress: number,    // 0-100
  uploadedUrl: string | null,
  thumbnailUrl: string | null,
  error: string | null,
  isUploading: boolean,
  
  // Control functions
  cancelUpload: () => void,
  reset: () => void
}
```

### Supported Formats

- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ WebP (.webp)
- ✅ GIF (.gif)

### File Size Limits

- Maximum: 10MB
- Recommended: Under 5MB for optimal compression

---

## 🎥 useVideoUpload Hook

### Purpose
Handle video uploads with progress tracking and automatic thumbnail generation.

### Features
- ✅ Validate video files (MP4, MOV, WebM, AVI, MKV)
- ✅ Upload to Supabase Storage
- ✅ Track upload progress with speed calculation
- ✅ Generate video thumbnails
- ✅ Estimate remaining time
- ✅ Cancel ongoing uploads
- ✅ Handle large files efficiently

### Basic Usage

```javascript
import useVideoUpload from '../hooks/useVideoUpload';

function VideoUploadComponent() {
  const {
    uploadVideo,
    uploadProgress,
    uploadedUrl,
    thumbnailUrl,
    error,
    isUploading,
    uploadSpeed,
    formatSpeed,
    formatTimeRemaining
  } = useVideoUpload({
    bucket: 'posts',
    generateThumb: true,
    thumbnailTime: 1
  });

  const handleVideoSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const result = await uploadVideo(file);
        console.log('Video uploaded:', result);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
  };

  return (
    <div>
      <input type="file" accept="video/*" onChange={handleVideoSelect} />
      
      {isUploading && (
        <div>
          <p>Progress: {uploadProgress}%</p>
          <p>Speed: {formatSpeed()}</p>
          <p>Time remaining: {formatTimeRemaining()}</p>
        </div>
      )}
      
      {uploadedUrl && (
        <video src={uploadedUrl} controls>
          {thumbnailUrl && <img src={thumbnailUrl} alt="Thumbnail" />}
        </video>
      )}
      
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### Configuration Options

```javascript
{
  // Storage bucket name
  bucket: 'posts' | 'stories' | 'messages',
  
  // Thumbnail generation
  generateThumb: true,      // Generate thumbnail from video
  thumbnailTime: 1,         // Time in seconds for thumbnail capture
  
  // Progress callback
  onProgress: (percent) => {
    console.log('Upload progress:', percent);
  }
}
```

### Return Values

```javascript
{
  // Main upload function
  uploadVideo: (file) => Promise<{
    url: string,         // Public URL of uploaded video
    thumbnailUrl: string, // Public URL of thumbnail
    filename: string,    // Generated filename
    size: number,       // File size in bytes
    type: string        // MIME type
  }>,
  
  // State
  uploadProgress: number,      // 0-100
  uploadedUrl: string | null,
  thumbnailUrl: string | null,
  error: string | null,
  isUploading: boolean,
  
  // Upload statistics
  uploadSpeed: number,          // Bytes per second
  estimatedTimeRemaining: number, // Seconds
  formatSpeed: () => string,    // "2.5 MB/s"
  formatTimeRemaining: () => string, // "30s"
  
  // Control functions
  cancelUpload: () => void,
  reset: () => void
}
```

### Supported Formats

- ✅ MP4 (.mp4)
- ✅ QuickTime (.mov)
- ✅ WebM (.webm)
- ✅ AVI (.avi)
- ✅ Matroska (.mkv)

### File Size Limits

- Maximum: 100MB
- Recommended: Under 50MB for better user experience

---

## 💡 Usage Examples

### Example 1: Post Creation with Image

```javascript
function CreatePost() {
  const {
    uploadImage,
    uploadProgress,
    uploadedUrl,
    thumbnailUrl,
    isUploading,
    error
  } = useImageUpload({
    bucket: 'posts',
    compressionOptions: { quality: 0.85, maxWidth: 1920 }
  });

  const [caption, setCaption] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const fileInput = document.querySelector('input[type="file"]');
    const file = fileInput.files[0];
    
    if (!file) {
      alert('Please select an image');
      return;
    }

    try {
      // Upload image
      const result = await uploadImage(file);
      
      // Create post with uploaded image
      await createPost({
        caption,
        imageUrl: result.url,
        thumbnailUrl: result.thumbnailUrl
      });
      
      alert('Post created successfully!');
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" accept="image/*" disabled={isUploading} />
      <textarea 
        value={caption} 
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Write a caption..."
      />
      
      {isUploading && (
        <div className="progress-bar">
          <div style={{ width: `${uploadProgress}%` }} />
        </div>
      )}
      
      {error && <p className="error">{error}</p>}
      {uploadedUrl && <img src={uploadedUrl} alt="Preview" />}
      
      <button type="submit" disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Create Post'}
      </button>
    </form>
  );
}
```

### Example 2: Multiple Images Upload

```javascript
function PhotoGallery() {
  const {
    uploadMultipleImages,
    uploadProgress,
    isUploading,
    error
  } = useImageUpload({ bucket: 'posts' });

  const [uploadedImages, setUploadedImages] = useState([]);

  const handleMultipleUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    try {
      const results = await uploadMultipleImages(files);
      
      const successful = results.filter(r => r.success);
      setUploadedImages(prev => [...prev, ...successful]);
      
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        console.error('Some uploads failed:', failed);
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        multiple 
        onChange={handleMultipleUpload}
        disabled={isUploading}
      />
      
      {isUploading && <p>Uploading: {uploadProgress}%</p>}
      
      <div className="gallery">
        {uploadedImages.map((img, index) => (
          <img key={index} src={img.url} alt={`Photo ${index + 1}`} />
        ))}
      </div>
    </div>
  );
}
```

### Example 3: Video Upload with Preview

```javascript
function VideoPost() {
  const {
    uploadVideo,
    uploadProgress,
    uploadedUrl,
    thumbnailUrl,
    isUploading,
    uploadSpeed,
    formatSpeed,
    formatTimeRemaining,
    cancelUpload,
    error
  } = useVideoUpload({
    bucket: 'posts',
    generateThumb: true
  });

  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setVideoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!videoFile) return;
    
    try {
      const result = await uploadVideo(videoFile);
      console.log('Video uploaded:', result);
      // Clear preview
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div>
      <input type="file" accept="video/*" onChange={handleFileSelect} />
      
      {previewUrl && (
        <video src={previewUrl} controls width="400" />
      )}
      
      {isUploading ? (
        <div className="upload-status">
          <p>Uploading: {uploadProgress}%</p>
          <p>Speed: {formatSpeed()}</p>
          <p>Time remaining: {formatTimeRemaining()}</p>
          <button onClick={cancelUpload}>Cancel</button>
        </div>
      ) : (
        <button onClick={handleUpload} disabled={!videoFile}>
          Upload Video
        </button>
      )}
      
      {error && <p className="error">{error}</p>}
      
      {uploadedUrl && (
        <div>
          <h3>Upload Complete!</h3>
          <video src={uploadedUrl} controls width="400" />
          {thumbnailUrl && <img src={thumbnailUrl} alt="Thumbnail" />}
        </div>
      )}
    </div>
  );
}
```

### Example 4: Profile Picture Upload

```javascript
function ProfilePictureUpload() {
  const {
    uploadImage,
    uploadProgress,
    uploadedUrl,
    isUploading,
    reset
  } = useImageUpload({
    bucket: 'avatars',
    compressionOptions: {
      quality: 0.9,
      maxWidth: 500,
      maxHeight: 500
    },
    thumbnailSize: 150
  });

  const [currentAvatar, setCurrentAvatar] = useState(null);

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await uploadImage(file);
      
      // Update user profile
      await updateUserProfile({ avatarUrl: result.url });
      
      setCurrentAvatar(result.url);
      alert('Profile picture updated!');
    } catch (err) {
      console.error('Failed to update avatar:', err);
      alert('Failed to update profile picture');
    }
  };

  return (
    <div className="avatar-upload">
      <div className="avatar-preview">
        {currentAvatar ? (
          <img src={currentAvatar} alt="Avatar" />
        ) : (
          <div className="placeholder">No avatar</div>
        )}
      </div>
      
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleAvatarChange}
        disabled={isUploading}
        id="avatar-input"
        style={{ display: 'none' }}
      />
      
      <label htmlFor="avatar-input" className="upload-btn">
        {isUploading ? `Uploading ${uploadProgress}%` : 'Change Picture'}
      </label>
    </div>
  );
}
```

---

## 🎯 Best Practices

### 1. Validate Before Upload

```javascript
const handleUpload = async (file) => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }
  
  // Check file size
  if (file.size > 10 * 1024 * 1024) {
    alert('File too large (max 10MB)');
    return;
  }
  
  // Proceed with upload
  await uploadImage(file);
};
```

### 2. Show Progress Feedback

```javascript
{isUploading && (
  <div className="upload-progress">
    <div className="progress-bar">
      <div 
        className="progress-fill"
        style={{ width: `${uploadProgress}%` }}
      />
    </div>
    <p>{uploadProgress}% uploaded</p>
  </div>
)}
```

### 3. Handle Errors Gracefully

```javascript
try {
  await uploadImage(file);
} catch (err) {
  if (err.message.includes('size')) {
    setError('File is too large. Please choose a smaller file.');
  } else if (err.message.includes('type')) {
    setError('Invalid file type. Please upload an image.');
  } else {
    setError('Upload failed. Please try again.');
  }
}
```

### 4. Clean Up Resources

```javascript
useEffect(() => {
  return () => {
    // Revoke object URLs to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };
}, [previewUrl]);
```

### 5. Provide Cancel Option for Large Uploads

```javascript
{isUploading && (
  <div>
    <p>Uploading... {uploadProgress}%</p>
    <button onClick={cancelUpload}>Cancel Upload</button>
  </div>
)}
```

---

## ⚠️ Error Handling

### Common Errors

#### Image Upload Errors

```javascript
// File too large
"File too large. Maximum size: 10MB"

// Invalid file type
"Invalid file type. Supported: image/jpeg, image/png, image/webp, image/gif"

// No file provided
"No file provided"

// Compression failed
"Failed to compress image: ..."

// Upload failed
"Upload failed: ..."
```

#### Video Upload Errors

```javascript
// File too large
"Video too large. Maximum size: 100MB"

// Invalid file type
"Invalid video type. Supported: MP4, MOV, WebM, AVI, MKV"

// Thumbnail generation failed (warning only)
"Thumbnail generation failed: ..."

// Upload failed
"Upload failed: ..."
```

### Error Handling Pattern

```javascript
const handleUpload = async (file) => {
  try {
    const result = await uploadImage(file);
    // Success handling
    onSuccess(result);
  } catch (err) {
    // Error handling
    if (err.message.includes('size')) {
      showNotification('File too large', 'error');
    } else if (err.message.includes('type')) {
      showNotification('Invalid file type', 'error');
    } else {
      showNotification('Upload failed', 'error');
      console.error('Upload error:', err);
    }
  }
};
```

---

## 🚀 Advanced Features

### Custom Compression Options

```javascript
const { uploadImage } = useImageUpload({
  bucket: 'posts',
  compressionOptions: {
    quality: 0.7,           // Lower quality = smaller file
    maxWidth: 1280,         // Resize to 1280px width
    maxHeight: 1280,        // Resize to 1280px height
    mimeType: 'image/webp', // Convert to WebP format
    convertSize: 500000     // Convert to JPEG if > 500KB
  }
});
```

### Multiple Thumbnail Sizes

```javascript
// In imageCompression.js
import { generateMultipleThumbnails } from '../utils/imageCompression';

const thumbs = await generateMultipleThumbnails(file, [150, 640, 1080]);
// Returns: { '150x150': File, '640x640': File, '1080x1080': File }
```

### Custom Progress Handling

```javascript
const { uploadVideo } = useVideoUpload({
  bucket: 'posts',
  onProgress: (percent) => {
    // Custom progress handling
    updateProgressBar(percent);
    logAnalytics('upload_progress', { percent });
  }
});
```

### Upload Queue Management

```javascript
function UploadQueue() {
  const [queue, setQueue] = useState([]);
  const { uploadImage } = useImageUpload();

  const addToQueue = (files) => {
    const newItems = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      status: 'pending',
      progress: 0
    }));
    setQueue(prev => [...prev, ...newItems]);
  };

  const processQueue = async () => {
    for (const item of queue) {
      if (item.status === 'pending') {
        try {
          updateItemStatus(item.id, 'uploading');
          await uploadImage(item.file);
          updateItemStatus(item.id, 'complete');
        } catch (err) {
          updateItemStatus(item.id, 'failed');
        }
      }
    }
  };

  return (
    <div>
      <input type="file" multiple onChange={(e) => addToQueue(e.target.files)} />
      <button onClick={processQueue}>Upload All</button>
      {/* Render queue items */}
    </div>
  );
}
```

---

## 📦 Dependencies

### Required Packages

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x",
    "compressorjs": "^1.x.x",
    "react": "^18.x.x"
  }
}
```

### Import Paths

```javascript
// Hooks
import useImageUpload from '../hooks/useImageUpload';
import useVideoUpload from '../hooks/useVideoUpload';

// Utilities
import { compressImage, generateThumbnail } from '../utils/imageCompression';
import { generateVideoThumbnail } from '../utils/mediaValidator';

// Supabase
import { supabase, STORAGE_BUCKETS } from '../supabaseClient';
```

---

## 🔒 Security Considerations

### 1. File Validation

Always validate files before upload:
- Check file type
- Check file size
- Verify file content matches extension

### 2. Storage Bucket Policies

Configure Supabase bucket policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posts');

-- Users can only delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (auth.uid() = owner);
```

### 3. Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
const [uploadCount, setUploadCount] = useState(0);
const [lastUploadTime, setLastUploadTime] = useState(null);

const checkRateLimit = () => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  if (lastUploadTime && (now - lastUploadTime) < oneHour) {
    if (uploadCount >= 10) {
      throw new Error('Upload limit reached. Please try again later.');
    }
  } else {
    setUploadCount(0);
    setLastUploadTime(now);
  }
  
  setUploadCount(prev => prev + 1);
};
```

---

## 📊 Performance Tips

### 1. Compress Before Upload

Always compress images to reduce upload time and storage costs:

```javascript
const { uploadImage } = useImageUpload({
  compressionOptions: {
    quality: 0.8,      // Good balance of quality/size
    maxWidth: 1920,    // Reduce for smaller displays
    maxHeight: 1920
  }
});
```

### 2. Lazy Load Images

Use thumbnails for galleries:

```javascript
<img 
  src={thumbnailUrl} 
  data-full-src={uploadedUrl}
  loading="lazy"
  onClick={() => loadFullImage()}
/>
```

### 3. Batch Uploads

Upload multiple files in parallel (with limit):

```javascript
const uploadBatch = async (files, batchSize = 3) => {
  const results = [];
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(file => uploadImage(file))
    );
    results.push(...batchResults);
  }
  return results;
};
```

---

## ✅ Testing

### Unit Tests Example

```javascript
describe('useImageUpload', () => {
  it('should upload image successfully', async () => {
    const { result } = renderHook(() => useImageUpload());
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    
    const uploadResult = await result.current.uploadImage(mockFile);
    
    expect(uploadResult.url).toBeDefined();
    expect(result.current.uploadProgress).toBe(100);
  });

  it('should reject invalid file types', async () => {
    const { result } = renderHook(() => useImageUpload());
    const mockFile = new File([''], 'test.txt', { type: 'text/plain' });
    
    await expect(
      result.current.uploadImage(mockFile)
    ).rejects.toThrow('Invalid file type');
  });
});
```

---

## 🎉 Summary

The `useImageUpload` and `useVideoUpload` hooks provide:

✅ **Complete upload solution** - From file selection to Supabase Storage  
✅ **Automatic compression** - Reduce file sizes intelligently  
✅ **Progress tracking** - Real-time upload progress  
✅ **Thumbnail generation** - Automatic thumbnails for all media  
✅ **Error handling** - Comprehensive error management  
✅ **Cancellation support** - Cancel uploads in progress  
✅ **Type safety** - Full TypeScript support (if needed)  
✅ **Production ready** - Battle-tested and optimized  

---

## 📚 Related Documentation

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [CompressorJS Docs](https://github.com/fengyuanchen/compressorjs)
- [Media Validation Guide](./MEDIA-VALIDATION-GUIDE.md)
- [Supabase Setup Guide](./SUPABASE_SETUP_GUIDE.md)

---

**Last Updated:** November 16, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
