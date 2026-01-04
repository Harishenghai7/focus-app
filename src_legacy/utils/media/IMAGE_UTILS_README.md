# Image Utilities Documentation

## Overview
This module provides canvas-based image compression and resizing utilities for browser environments. Both utilities maintain high quality while reducing file sizes and dimensions.

---

## compressImage.js

### Purpose
Compresses image files to meet size requirements while maintaining acceptable quality.

### Specifications
- **Input**: File object (image)
- **Output**: Compressed File/Blob
- **Max file size**: 1MB (configurable)
- **Quality**: 0.8 (configurable, range: 0-1)
- **Dependencies**: Canvas API

### Function Signature
```javascript
async function compressImage(file, options = {})
```

### Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file` | File/Blob | required | Image file to compress |
| `options.maxSizeMB` | number | 1 | Maximum file size in MB |
| `options.quality` | number | 0.8 | Compression quality (0-1) |
| `options.mimeType` | string | 'image/jpeg' | Output MIME type |

### Returns
- **Promise<File|Blob>**: Compressed image file/blob

### Usage Examples

#### Basic Usage
```javascript
import compressImage from '@/utils/media/compressImage';

// Compress with default settings (1MB, quality 0.8)
const compressedFile = await compressImage(originalFile);
```

#### Custom Quality
```javascript
// Higher quality (larger file)
const highQuality = await compressImage(file, {
  quality: 0.9,
  maxSizeMB: 2
});

// Lower quality (smaller file)
const lowQuality = await compressImage(file, {
  quality: 0.6,
  maxSizeMB: 0.5
});
```

#### Different Format
```javascript
// Convert to WebP
const webpFile = await compressImage(file, {
  mimeType: 'image/webp',
  quality: 0.85
});

// Convert to PNG
const pngFile = await compressImage(file, {
  mimeType: 'image/png',
  quality: 0.9
});
```

#### Error Handling
```javascript
try {
  const compressed = await compressImage(file);
  console.log('Compressed successfully!');
} catch (error) {
  console.error('Compression failed:', error.message);
}
```

### Features
- ✅ Automatic quality adjustment to meet size requirements
- ✅ Preserves original filename
- ✅ Multiple format support (JPEG, PNG, WebP)
- ✅ Canvas-based rendering
- ✅ Error handling for invalid inputs
- ✅ Iterative compression for optimal results

### Algorithm
1. Validates input file is an image
2. Loads image using FileReader
3. Creates canvas matching image dimensions
4. Draws image on canvas
5. Attempts compression with specified quality
6. If size exceeds limit, reduces quality by 10% and retries
7. Returns compressed file when size requirement is met

---

## resizeImage.js

### Purpose
Resizes images to specific dimensions while maintaining aspect ratio using canvas-based rendering.

### Specifications
- **Input**: File object, maxWidth, maxHeight
- **Output**: Resized File/Blob
- **Aspect ratio**: Maintained by default
- **Canvas-based**: Yes
- **Dependencies**: Canvas API

### Function Signature
```javascript
async function resizeImage(file, maxWidth, maxHeight, options = {})
```

### Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file` | File/Blob | required | Image file to resize |
| `maxWidth` | number | required | Maximum width in pixels |
| `maxHeight` | number | required | Maximum height in pixels |
| `options.maintainAspectRatio` | boolean | true | Keep original aspect ratio |
| `options.quality` | number | 0.9 | Output quality (0-1) |
| `options.mimeType` | string | file.type | Output MIME type |

### Returns
- **Promise<File|Blob>**: Resized image file/blob

### Usage Examples

#### Basic Usage
```javascript
import resizeImage from '@/utils/media/resizeImage';

// Resize to max 800x600 (maintains aspect ratio)
const resizedFile = await resizeImage(originalFile, 800, 600);
```

#### Thumbnail Creation
```javascript
// Create thumbnail
const thumbnail = await resizeImage(file, 150, 150, {
  quality: 0.8
});

// Profile picture
const avatar = await resizeImage(file, 200, 200);
```

#### Full HD Resize
```javascript
// Resize to Full HD
const hdImage = await resizeImage(file, 1920, 1080, {
  quality: 0.95
});
```

#### Without Aspect Ratio
```javascript
// Exact dimensions (may distort)
const exactSize = await resizeImage(file, 800, 600, {
  maintainAspectRatio: false
});
```

#### Different Format
```javascript
// Resize and convert to PNG
const pngResized = await resizeImage(file, 1024, 768, {
  mimeType: 'image/png',
  quality: 0.9
});
```

#### Error Handling
```javascript
try {
  const resized = await resizeImage(file, 800, 600);
  console.log('Resized successfully!');
} catch (error) {
  console.error('Resize failed:', error.message);
}
```

### Features
- ✅ Maintains aspect ratio by default
- ✅ High-quality image smoothing
- ✅ Configurable quality settings
- ✅ Multiple format support
- ✅ Smart dimension calculation
- ✅ Preserves original filename
- ✅ Error handling for invalid inputs

### Algorithm
1. Validates input file is an image
2. Validates dimensions are positive numbers
3. Loads image using FileReader
4. Calculates target dimensions:
   - If aspect ratio maintained: fits within max dimensions
   - If not maintained: uses max dimensions directly
5. Creates canvas with target dimensions
6. Enables high-quality image smoothing
7. Draws scaled image on canvas
8. Returns resized file

---

## Combined Usage

### Resize then Compress
```javascript
import compressImage from '@/utils/media/compressImage';
import resizeImage from '@/utils/media/resizeImage';

async function processImage(file) {
  // First resize to reasonable dimensions
  const resized = await resizeImage(file, 1920, 1080);
  
  // Then compress to meet size requirements
  const compressed = await compressImage(resized, {
    maxSizeMB: 1,
    quality: 0.8
  });
  
  return compressed;
}
```

### Upload Pipeline
```javascript
async function handleImageUpload(file) {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }
    
    // Check original size
    const originalSizeMB = file.size / 1024 / 1024;
    console.log(`Original size: ${originalSizeMB.toFixed(2)} MB`);
    
    // Process image
    let processedFile = file;
    
    // Resize if too large
    if (file.size > 5 * 1024 * 1024) { // > 5MB
      processedFile = await resizeImage(processedFile, 1920, 1080);
    }
    
    // Compress if still too large
    if (processedFile.size > 1024 * 1024) { // > 1MB
      processedFile = await compressImage(processedFile, {
        maxSizeMB: 1,
        quality: 0.8
      });
    }
    
    const finalSizeMB = processedFile.size / 1024 / 1024;
    console.log(`Final size: ${finalSizeMB.toFixed(2)} MB`);
    
    // Upload processed file
    await uploadFile(processedFile);
    
  } catch (error) {
    console.error('Image processing failed:', error);
    throw error;
  }
}
```

### React Component Example
```javascript
import { useState } from 'react';
import compressImage from '@/utils/media/compressImage';
import resizeImage from '@/utils/media/resizeImage';

function ImageUploader() {
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProcessing(true);

    try {
      // Resize for thumbnail
      const thumbnail = await resizeImage(file, 300, 300);
      setPreview(URL.createObjectURL(thumbnail));

      // Process for upload
      const resized = await resizeImage(file, 1920, 1080);
      const compressed = await compressImage(resized, {
        maxSizeMB: 1,
        quality: 0.8
      });

      // Upload
      await uploadImage(compressed);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to process image');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={processing}
      />
      {processing && <p>Processing image...</p>}
      {preview && <img src={preview} alt="Preview" />}
    </div>
  );
}
```

---

## Browser Compatibility

Both utilities use the Canvas API, which is supported in all modern browsers:

- ✅ Chrome/Edge: All versions
- ✅ Firefox: All versions
- ✅ Safari: All versions
- ✅ Opera: All versions
- ✅ Mobile browsers: iOS Safari, Chrome Mobile

---

## Performance Considerations

1. **Large Images**: Processing very large images (> 10MB) may take a few seconds
2. **Multiple Images**: Process images sequentially to avoid memory issues
3. **Memory Usage**: Canvas operations are memory-intensive; ensure adequate heap space
4. **Mobile Devices**: Consider lower quality settings for mobile uploads

---

## Error Handling

Both utilities provide comprehensive error handling:

```javascript
// Invalid file
compressImage(null) // throws: "Invalid file input"

// Non-image file
compressImage(textFile) // throws: "File must be an image"

// Invalid dimensions
resizeImage(file, 0, 100) // throws: "Invalid dimensions"

// File read error
// throws: "Failed to read file"

// Image load error
// throws: "Failed to load image"
```

---

## Testing

See `__tests__/imageUtils.test.js` for comprehensive test suite including:

- ✅ Basic compression
- ✅ Basic resizing
- ✅ Custom options
- ✅ Error handling
- ✅ Integration tests
- ✅ Format conversion

---

## Related Utilities

- **imageCompression.js**: Alternative compression using compressorjs library
- **imageUtils.js**: General image utilities
- **validateFile.js**: File validation utilities

---

## Notes

1. **Quality vs Size**: Lower quality = smaller file size
2. **Iterative Compression**: compressImage automatically adjusts quality to meet size limits
3. **Aspect Ratio**: resizeImage maintains aspect ratio by default to prevent distortion
4. **Format Support**: JPEG, PNG, WebP supported (browser-dependent)
5. **Canvas Limitations**: Maximum canvas size varies by browser (typically 4096x4096 or larger)
