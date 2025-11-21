# 🚀 CREATE.JS - QUICK REFERENCE CARD

## 📋 File Locations
```
src/pages/Create.js              ← Main component (593 lines)
src/pages/Create.css             ← Complete styling (1254 lines)
src/components/create/*.js       ← All subcomponents ✅
src/utils/mediaUtils.js          ← Upload & compression ✅
src/hooks/useDebounce.js         ← Autosave hook ✅
```

## 🎯 Component Props Quick Reference

### MediaSelector
```javascript
<MediaSelector
  type="post|boltz|flash"        // Required
  onFilesSelected={(files) => {}} // Required
  maxFiles={1|10}                 // Default: 10
  acceptVideo={true}              // Default: true
/>
```

### PhotoEditor
```javascript
<PhotoEditor
  file={File}                     // Required
  onEdit={(blob) => {}}           // Required
/>
```

### VideoEditor
```javascript
<VideoEditor
  file={File}                     // Required
  onEdit={(blob) => {}}           // Required
/>
```

### MusicLibrary
```javascript
<MusicLibrary
  selected={musicObject}          // Current selection
  onSelect={(music) => {}}        // Callback
/>
```

### CaptionEditor
```javascript
<CaptionEditor
  value={string}                  // Required
  onChange={(text) => {}}         // Required
  maxLength={150|2200}            // Based on type
/>
```

### LocationPicker
```javascript
<LocationPicker
  value={locationObject}          // Current location
  onChange={(loc) => {}}          // Callback
/>
```

### PeopleTagger
```javascript
<PeopleTagger
  tagged={[userId...]}            // Array of user IDs
  onChange={(users) => {}}        // Callback
  userId={currentUserId}          // Required
/>
```

### AudienceSelector
```javascript
<AudienceSelector
  value="everyone|followers|close_friends"  // Required
  onChange={(audience) => {}}               // Callback
/>
```

### SchedulePicker
```javascript
<SchedulePicker
  value={dateTime}                // ISO string or null
  onChange={(date) => {}}         // Callback
/>
```

### LoadingSpinner
```javascript
<LoadingSpinner
  size="small|medium|large"       // Default: medium
  color="primary|secondary|white" // Default: primary
/>
```

### ErrorMessage
```javascript
<ErrorMessage
  message={string}                // Required
  onClose={() => {}}              // Required
  duration={5000}                 // Default: 5000ms
/>
```

## 📊 State Management

### Main State Variables
```javascript
const [type, setType] = useState(null);              // 'post'|'boltz'|'flash'
const [step, setStep] = useState(0);                 // 0-4
const [files, setFiles] = useState([]);              // File[]
const [editedFiles, setEditedFiles] = useState([]);  // {original, edited}[]
const [selectedMusic, setSelectedMusic] = useState(null);
const [caption, setCaption] = useState('');
const [location, setLocation] = useState(null);
const [taggedUsers, setTaggedUsers] = useState([]);
const [audience, setAudience] = useState('everyone');
const [schedule, setSchedule] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [uploadProgress, setUploadProgress] = useState(0);
const [hasDraft, setHasDraft] = useState(false);
const [currentEditingIndex, setCurrentEditingIndex] = useState(0);
```

## 🔄 Key Functions

### File Handling
```javascript
validateFiles(files, type)           // Validates file size/type
handleFilesSelected(files)           // Processes uploaded files
handlePhotoEdit(blob, index)         // Updates edited photo
handleVideoEdit(blob, index)         // Updates edited video
```

### Navigation
```javascript
handleTypeSelect(type)               // Step 0 → 1
handleNextStep()                     // Advance step
handlePrevStep()                     // Go back
handleSkipMusic()                    // Skip music (step 3 → 4)
```

### Draft Management
```javascript
saveDraft()                          // Save to localStorage
resumeDraft()                        // Load from localStorage
clearDraft()                         // Remove draft
```

### Publishing
```javascript
isFormValid()                        // Check if ready to publish
handlePublish()                      // Upload & create post
```

## 🎨 CSS Classes Reference

### Layout
```css
.create-page                 /* Full-screen overlay */
.create-container            /* Main content box */
.create-header               /* Top header bar */
.create-content              /* Scrollable content */
```

### Steps
```css
.create-step                 /* Step wrapper */
.type-selection-step         /* Step 0 */
.media-selection-step        /* Step 1 */
.editing-step                /* Step 2 */
.music-selection-step        /* Step 3 */
.add-details-step            /* Step 4 */
```

### Components
```css
.create-types-grid           /* Type cards grid */
.create-type-card            /* Individual type card */
.media-selector              /* File upload area */
.photo-editor                /* Photo editing UI */
.video-editor                /* Video editing UI */
.music-library               /* Music selection */
.caption-editor              /* Caption textarea */
.details-grid                /* Details controls */
```

### UI Elements
```css
.progress-stepper            /* Step dots */
.progress-dot                /* Individual dot */
.step-actions                /* Button container */
.btn-primary                 /* Primary button */
.btn-secondary               /* Secondary button */
.save-draft-btn              /* Save draft */
.publish-btn                 /* Publish button */
```

### Overlays
```css
.upload-overlay              /* Upload background */
.upload-modal                /* Upload progress */
.upload-progress-bar         /* Progress bar */
.error-message               /* Error display */
.loading-spinner             /* Spinner */
```

## 📐 Validation Rules Quick Check

```javascript
// File validation
maxFiles: { post: 10, flash: 1, boltz: 1 }
maxSize: 100 * 1024 * 1024  // 100MB
allowedImages: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
allowedVideos: ['video/mp4', 'video/quicktime', 'video/webm']

// Caption
maxLength: { post: 2200, flash: 2200, boltz: 150 }

// Schedule
minDate: new Date()
maxDate: new Date() + 6 months

// Music
required: type === 'boltz'
optional: type === 'post' && hasVideo
```

## ⚡ Keyboard Shortcuts

```
Esc           → Go back / Cancel
Enter         → Next step
Ctrl+Enter    → Publish (final step)
Tab           → Navigate controls
Ctrl+S        → Save draft
```

## 🔧 Utils Functions

```javascript
// mediaUtils.js
uploadMedia(file, userId)              // → Promise<url>
compressImage(file)                    // → Promise<compressedFile>
compressVideo(file)                    // → Promise<compressedFile>
generateThumbnail(videoFile)           // → Promise<thumbnailUrl>

// useDebounce.js
useDebounce(callback, delay)           // → debouncedCallback
```

## 🎯 Database Schema

### Posts Table
```javascript
{
  id: uuid,
  user_id: uuid,
  caption: text,
  location: text,
  audience: text,
  scheduled_for: timestamp,
  created_at: timestamp
}
```

### Post Media Table
```javascript
{
  id: uuid,
  post_id: uuid,
  url: text,
  type: text,
  thumbnail_url: text,
  order_index: int
}
```

### Boltz Table
```javascript
{
  id: uuid,
  user_id: uuid,
  video_url: text,
  thumbnail_url: text,
  caption: text,
  music_id: uuid,
  audience: text,
  created_at: timestamp
}
```

### Flash Stories Table
```javascript
{
  id: uuid,
  user_id: uuid,
  media_url: text,
  media_type: text,
  thumbnail_url: text,
  caption: text,
  expires_at: timestamp,
  created_at: timestamp
}
```

### Post Tags Table
```javascript
{
  id: uuid,
  post_id: uuid,
  user_id: uuid
}
```

## 🚨 Error Handling Patterns

```javascript
try {
  // Operation
} catch (err) {
  console.error('Error:', err);
  setError(err.message || 'Operation failed');
  setLoading(false);
}
```

## 💡 Best Practices

### State Updates
```javascript
// ✅ Good - functional update
setFiles(prev => [...prev, newFile]);

// ❌ Bad - direct mutation
files.push(newFile);
```

### Cleanup
```javascript
useEffect(() => {
  // Setup
  return () => {
    // Cleanup
    URL.revokeObjectURL(objectUrl);
  };
}, [dependency]);
```

### Async Operations
```javascript
const operation = async () => {
  setLoading(true);
  try {
    await doSomething();
  } finally {
    setLoading(false);
  }
};
```

## 📱 Responsive Classes

```css
/* Desktop (default) */
.create-container { max-width: 650px; }

/* Tablet (≤768px) */
@media (max-width: 768px) {
  .create-container { max-width: 100%; }
}

/* Mobile (≤480px) */
@media (max-width: 480px) {
  .step-title { font-size: 20px; }
}
```

## 🎨 Animation Timing

```css
Fast:    200ms
Normal:  300-400ms
Slow:    600ms+
Infinite: 1-2s per cycle
```

## ✅ Testing Checklist

- [ ] All steps navigate correctly
- [ ] File validation works
- [ ] Draft save/resume works
- [ ] All editors functional
- [ ] Upload completes successfully
- [ ] Errors display properly
- [ ] Keyboard shortcuts work
- [ ] Mobile responsive
- [ ] Accessibility (screen reader)
- [ ] Performance (no memory leaks)

---

**Last Updated:** November 21, 2025
**Status:** ✅ Production Ready
