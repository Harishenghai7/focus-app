# Design Document - Multi-Image Carousel

## Overview

The multi-image carousel feature allows users to create posts with up to 10 images/videos that viewers can swipe through. This design leverages existing Focus components and adds minimal new code for maximum efficiency.

## Architecture

### Database Schema Changes

**Modify `posts` table:**
```sql
-- Add new columns to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media_urls TEXT[], -- Array of media URLs
ADD COLUMN IF NOT EXISTS media_types TEXT[], -- Array of media types ('image' or 'video')
ADD COLUMN IF NOT EXISTS is_carousel BOOLEAN DEFAULT false;

-- Keep existing image_url and media_url for backward compatibility
-- If is_carousel = true, use media_urls array
-- If is_carousel = false, use existing image_url/media_url
```

### Component Architecture

```
Create.js (Modified)
├── MediaSelector (New Component)
│   ├── Multiple file selection
│   ├── Thumbnail preview grid
│   └── Reorder/remove controls
│
PostCard.js (Modified)
├── CarouselViewer (New Component)
│   ├── Swipeable media container
│   ├── Navigation dots/arrows
│   └── Position indicator
│
PostDetail.js (Modified)
└── Uses same CarouselViewer component
```

## Components and Interfaces

### 1. MediaSelector Component

**Location:** `src/components/MediaSelector.js`

**Props:**
```javascript
{
  selectedMedia: Array<{url: string, type: 'image'|'video', file: File}>,
  onMediaChange: (media) => void,
  maxItems: number (default: 10)
}
```

**Features:**
- Multi-select file input
- Drag-and-drop reordering
- Remove individual items
- Preview thumbnails
- Item counter display

### 2. CarouselViewer Component

**Location:** `src/components/CarouselViewer.js`

**Props:**
```javascript
{
  mediaUrls: string[],
  mediaTypes: string[],
  autoPlay: boolean (default: false),
  showControls: boolean (default: true)
}
```

**Features:**
- Swipe gesture support (using framer-motion)
- Keyboard navigation (arrow keys)
- Touch/mouse drag
- Position indicators (dots + "1/5" text)
- Navigation arrows
- Video playback controls

### 3. Modified Create.js

**Changes:**
- Replace single file input with MediaSelector
- Handle array of media files
- Upload multiple files to Supabase storage
- Store media_urls and media_types arrays
- Set is_carousel flag

### 4. Modified PostCard.js

**Changes:**
- Check `is_carousel` flag
- If true, render CarouselViewer
- If false, render existing single media
- Show carousel indicator icon on grid thumbnails

## Data Models

### Post Object (Extended)

```javascript
{
  id: uuid,
  user_id: uuid,
  caption: string,
  
  // Legacy fields (keep for backward compatibility)
  image_url: string,
  media_url: string,
  media_type: string,
  
  // New carousel fields
  is_carousel: boolean,
  media_urls: string[],      // ['url1', 'url2', 'url3']
  media_types: string[],     // ['image', 'video', 'image']
  
  created_at: timestamp,
  // ... other existing fields
}
```

### Upload Flow

```
1. User selects multiple files
2. Validate: max 10 items, file sizes, types
3. Generate unique filenames for each
4. Upload to Supabase storage in parallel
5. Collect all URLs
6. Insert post with media_urls array
```

## Error Handling

### Upload Errors
- **Scenario:** One or more files fail to upload
- **Handling:** Retry failed uploads up to 3 times, show specific error for failed items
- **User Action:** Allow user to remove failed items and proceed or retry all

### File Validation Errors
- **Scenario:** Invalid file type or size
- **Handling:** Show error immediately on selection, prevent adding to selection
- **Limits:** 
  - Images: max 10MB each
  - Videos: max 100MB each
  - Total: max 10 items

### Playback Errors
- **Scenario:** Video fails to load in carousel
- **Handling:** Show error placeholder with retry button
- **Fallback:** Display thumbnail if available

## Testing Strategy

### Unit Tests
- MediaSelector: file selection, reordering, removal
- CarouselViewer: navigation, swipe detection, position tracking
- Upload utility: parallel uploads, error handling

### Integration Tests
- Create flow: select multiple media → upload → create post
- View flow: fetch carousel post → display → navigate
- Edit flow: modify carousel → update post

### Manual Testing Checklist
- [ ] Select 10 images, verify all upload
- [ ] Mix images and videos in carousel
- [ ] Swipe through carousel on mobile
- [ ] Click arrows on desktop
- [ ] Edit carousel post (add/remove/reorder)
- [ ] Delete carousel post (verify all media deleted)
- [ ] View carousel in feed, profile, detail, explore
- [ ] Test with slow network (loading states)
- [ ] Test with failed uploads (error handling)

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading:** Load only first 2 media items initially, load others on demand
2. **Image Optimization:** Compress images on upload, generate thumbnails
3. **Caching:** Cache loaded media items in memory
4. **Preloading:** Preload next/previous items when user navigates
5. **Pagination:** In feed, only load carousels when in viewport

### Storage Optimization

- Generate and store thumbnail versions (300x300) for grid views
- Use progressive JPEG for images
- Compress videos on upload (optional, can be future enhancement)

## Migration Strategy

### Backward Compatibility

**Existing posts remain unchanged:**
- Posts with `image_url` or `media_url` continue to work
- `is_carousel = false` by default
- No data migration needed

**New posts:**
- Can be single media (is_carousel = false) or carousel (is_carousel = true)
- Single media posts still use `image_url` for simplicity

### Rollout Plan

1. **Phase 1:** Deploy database changes (non-breaking)
2. **Phase 2:** Deploy CarouselViewer component (read-only)
3. **Phase 3:** Deploy MediaSelector and create flow (write)
4. **Phase 4:** Monitor and optimize based on usage

## UI/UX Design Notes

### Visual Design

**Carousel Indicators:**
- Dots at bottom center (white with shadow for visibility)
- Current position text (e.g., "3/8") top right corner
- Navigation arrows on hover (desktop) or always visible (mobile)

**Grid View Indicator:**
- Small carousel icon (📷 with layers) in top right of thumbnail
- Subtle overlay showing "1/5" count

**Transitions:**
- Smooth slide animation (300ms ease-out)
- Fade in/out for videos switching
- Haptic feedback on swipe (mobile)

### Accessibility

- Keyboard navigation (arrow keys, tab)
- Screen reader announcements for position changes
- Alt text for each media item (future enhancement)
- High contrast mode support for indicators
