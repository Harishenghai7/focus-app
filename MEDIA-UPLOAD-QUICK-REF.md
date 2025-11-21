# 📤 Media Upload Hooks - Quick Reference

## 🖼️ useImageUpload

### Import
```javascript
import useImageUpload from '../hooks/useImageUpload';
```

### Basic Setup
```javascript
const {
  uploadImage,           // Main upload function
  uploadProgress,        // 0-100
  uploadedUrl,          // Public URL
  thumbnailUrl,         // Thumbnail URL
  error,                // Error message
  isUploading,          // Upload state
  cancelUpload,         // Cancel function
  reset                 // Reset state
} = useImageUpload({
  bucket: 'posts',
  compressionOptions: { quality: 0.8, maxWidth: 1920 },
  generateThumb: true,
  thumbnailSize: 150
});
```

### Upload Single Image
```javascript
const handleUpload = async (file) => {
  try {
    const result = await uploadImage(file);
    // result: { url, thumbnailUrl, filename, size, compressionRatio }
  } catch (err) {
    console.error(err);
  }
};
```

### Upload Multiple Images
```javascript
const { uploadMultipleImages } = useImageUpload();
const results = await uploadMultipleImages(files);
```

---

## 🎥 useVideoUpload

### Import
```javascript
import useVideoUpload from '../hooks/useVideoUpload';
```

### Basic Setup
```javascript
const {
  uploadVideo,           // Main upload function
  uploadProgress,        // 0-100
  uploadedUrl,          // Public URL
  thumbnailUrl,         // Video thumbnail
  error,                // Error message
  isUploading,          // Upload state
  uploadSpeed,          // Bytes per second
  formatSpeed,          // "2.5 MB/s"
  formatTimeRemaining,  // "30s"
  cancelUpload,         // Cancel function
  reset                 // Reset state
} = useVideoUpload({
  bucket: 'posts',
  generateThumb: true,
  thumbnailTime: 1
});
```

### Upload Video
```javascript
const handleUpload = async (file) => {
  try {
    const result = await uploadVideo(file);
    // result: { url, thumbnailUrl, filename, size, type }
  } catch (err) {
    console.error(err);
  }
};
```

---

## ⚡ Common Patterns

### Progress Bar
```javascript
{isUploading && (
  <div className="progress-bar">
    <div style={{ width: `${uploadProgress}%` }} />
  </div>
)}
```

### Error Handling
```javascript
{error && <p className="error">{error}</p>}
```

### Cancel Upload
```javascript
<button onClick={cancelUpload}>Cancel</button>
```

### File Input
```javascript
<input 
  type="file" 
  accept="image/*" 
  onChange={(e) => uploadImage(e.target.files[0])}
  disabled={isUploading}
/>
```

---

## 📋 Configuration Options

### Image Upload Options
```javascript
{
  bucket: 'posts' | 'avatars' | 'stories',
  compressionOptions: {
    quality: 0.8,        // 0.0-1.0
    maxWidth: 1920,      // pixels
    maxHeight: 1920,     // pixels
    mimeType: 'image/jpeg'
  },
  generateThumb: true,
  thumbnailSize: 150     // pixels
}
```

### Video Upload Options
```javascript
{
  bucket: 'posts' | 'stories',
  generateThumb: true,
  thumbnailTime: 1,      // seconds
  onProgress: (percent) => {}
}
```

---

## ✅ Validation Rules

### Images
- Types: JPEG, PNG, WebP, GIF
- Max Size: 10MB
- Recommended: Under 5MB

### Videos
- Types: MP4, MOV, WebM, AVI, MKV
- Max Size: 100MB
- Recommended: Under 50MB

---

## 🎯 Best Practices

1. **Always validate before upload**
   ```javascript
   if (!file.type.startsWith('image/')) {
     alert('Invalid file type');
     return;
   }
   ```

2. **Show progress feedback**
   ```javascript
   {isUploading && <p>{uploadProgress}%</p>}
   ```

3. **Handle errors gracefully**
   ```javascript
   try {
     await uploadImage(file);
   } catch (err) {
     showNotification(err.message, 'error');
   }
   ```

4. **Clean up resources**
   ```javascript
   useEffect(() => {
     return () => {
       if (previewUrl) URL.revokeObjectURL(previewUrl);
     };
   }, [previewUrl]);
   ```

5. **Provide cancel option**
   ```javascript
   <button onClick={cancelUpload}>Cancel</button>
   ```

---

## 🔧 Troubleshooting

### "Upload failed"
- Check Supabase credentials
- Verify bucket exists and is public
- Check file size limits

### "Invalid file type"
- Ensure file matches accepted types
- Check MIME type validation

### "File too large"
- Reduce file size before upload
- Increase compression quality setting

### Slow uploads
- Enable compression (images)
- Check network connection
- Consider chunked uploads for large files

---

## 📚 Full Documentation

See [MEDIA-UPLOAD-HOOKS-GUIDE.md](./MEDIA-UPLOAD-HOOKS-GUIDE.md) for complete documentation.

---

**Last Updated:** November 16, 2025
