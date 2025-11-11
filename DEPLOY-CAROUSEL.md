# 🚀 Deploy Multi-Image Carousel Feature

## Quick Deployment Guide

### Step 1: Apply Database Migration (REQUIRED)

Open your Supabase SQL Editor and run:

```sql
-- Add carousel support columns to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS media_types TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_carousel BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_is_carousel ON posts(is_carousel) WHERE is_carousel = true;

-- Add documentation
COMMENT ON COLUMN posts.media_urls IS 'Array of media URLs for carousel posts (up to 10 items)';
COMMENT ON COLUMN posts.media_types IS 'Array of media types corresponding to media_urls (image or video)';
COMMENT ON COLUMN posts.is_carousel IS 'Flag indicating if post is a carousel (multiple media items)';

-- Validation function
CREATE OR REPLACE FUNCTION validate_carousel_arrays()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_carousel = true THEN
    IF NEW.media_urls IS NULL OR NEW.media_types IS NULL THEN
      RAISE EXCEPTION 'Carousel posts must have both media_urls and media_types';
    END IF;
    
    IF array_length(NEW.media_urls, 1) != array_length(NEW.media_types, 1) THEN
      RAISE EXCEPTION 'media_urls and media_types must have the same length';
    END IF;
    
    IF array_length(NEW.media_urls, 1) < 2 THEN
      RAISE EXCEPTION 'Carousel posts must have at least 2 media items';
    END IF;
    
    IF array_length(NEW.media_urls, 1) > 10 THEN
      RAISE EXCEPTION 'Carousel posts cannot have more than 10 media items';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS validate_carousel_trigger ON posts;
CREATE TRIGGER validate_carousel_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_carousel_arrays();
```

### Step 2: Verify Migration

Run this query to verify the columns were added:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('media_urls', 'media_types', 'is_carousel');
```

You should see 3 rows returned.

### Step 3: Deploy Code

Your code is already updated! Just deploy to your hosting:

```bash
# Build the app
npm run build

# Deploy (example for Netlify)
netlify deploy --prod

# Or for Vercel
vercel --prod
```

### Step 4: Test the Feature

1. **Create a carousel post:**
   - Navigate to `/create`
   - Select "Post"
   - Drag & drop 2-10 images
   - Add a caption
   - Click "Share Post"

2. **View the carousel:**
   - Go to home feed
   - Find your carousel post
   - Swipe left/right (mobile) or click arrows (desktop)
   - Verify position counter shows "1/X"

3. **Test in all views:**
   - Home feed ✓
   - Profile page ✓
   - Post detail page ✓
   - Explore page ✓

### Step 5: Monitor

Check for any errors in:
- Browser console
- Supabase logs
- Network tab (for upload issues)

---

## Rollback (If Needed)

If you need to rollback, run:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS validate_carousel_trigger ON posts;

-- Drop function
DROP FUNCTION IF EXISTS validate_carousel_arrays();

-- Drop index
DROP INDEX IF EXISTS idx_posts_is_carousel;

-- Remove columns
ALTER TABLE posts 
DROP COLUMN IF EXISTS media_urls,
DROP COLUMN IF EXISTS media_types,
DROP COLUMN IF EXISTS is_carousel;
```

---

## Troubleshooting

### Issue: "Column does not exist" error
**Solution:** Make sure you ran the migration SQL in Step 1

### Issue: Uploads failing
**Solution:** Check Supabase storage bucket permissions and size limits

### Issue: Carousel not displaying
**Solution:** Check browser console for errors, verify `is_carousel` flag is set

### Issue: Can't select multiple files
**Solution:** Ensure you're on the "Post" content type (not Boltz or Flash)

---

## Success Checklist

- [ ] Database migration applied successfully
- [ ] Can create carousel posts with 2-10 images
- [ ] Can swipe through carousel in feed
- [ ] Position counter displays correctly
- [ ] Navigation arrows work on desktop
- [ ] Keyboard arrows work
- [ ] Double-tap to like works on any slide
- [ ] Carousel displays in profile grid
- [ ] Carousel displays in post detail
- [ ] No console errors

---

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify the database migration was applied
3. Check Supabase logs for backend errors
4. Review `CAROUSEL-FEATURE-COMPLETE.md` for details

---

**Deployment Time:** ~5 minutes

**Zero Downtime:** ✅ Yes (backward compatible)

**Data Migration Required:** ❌ No

**Breaking Changes:** ❌ None
