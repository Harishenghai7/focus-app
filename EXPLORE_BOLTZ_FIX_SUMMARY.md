# 🔧 Explore & Boltz Fix Summary

## Issues Fixed

### 1. Posts Not Being Fetched in Explore
**Root Cause**: The code was using foreign key joins (`profiles:user_id`) that fail when RLS is restrictive, and the posts table was missing count columns (likes_count, comments_count, views_count).

**Solution**:
- Created unified RPC `get_public_feed()` that returns posts with user data flattened
- RPC handles missing columns gracefully with COALESCE
- Frontend now tries RPC first, falls back to simple query

**Files Modified**:
- `src/pages/Explore/ExploreEnhanced.js` - Updated loadExploreContent to use RPC
- `src/services/postService.js` - Updated fetchHomePosts with RPC + fallback
- `database/migrations/FIX_POSTS_SCHEMA_COUNTS.sql` - New migration

### 2. Boltz Thumbnails Not Displaying
**Root Cause**: 
- Multiple conflicting boltz schemas (enhanced vs trust shield)
- BoltzPlayer was missing `poster` attribute on video element
- Thumbnail columns had different names (thumbnail_url, thumbnail_path, poster_url, preview_image, cover_url)

**Solution**:
- Created unified RPC `get_public_boltz_feed()` with all thumbnail column fallbacks
- Added `poster={posterSrc}` to video element in BoltzPlayer
- Updated all services to use unified thumbnail fallback chain

**Files Modified**:
- `src/components/boltz/BoltzPlayer.js` - Added poster attribute + cover_url fallback
- `src/hooks/useBoltzFeed.js` - Updated to use unified RPCs
- `src/services/boltzService.js` - Updated with RPC + fallback
- `database/migrations/FIX_BOLTZ_SCHEMA_UNIFIED.sql` - New migration

## SQL Migrations to Apply

### 1. FIX_BOLTZ_SCHEMA_UNIFIED.sql
```sql
-- Run this in Supabase SQL Editor
-- Adds missing columns and creates unified RPC functions
\i database/migrations/FIX_BOLTZ_SCHEMA_UNIFIED.sql
```

**What it does**:
- Adds all missing columns to boltz table (video_url, poster_url, preview_image, cover_url, description, likes_count, comments_count, views_count, saves_count, shares_count, etc.)
- Creates `get_boltz_feed_secure()` - for authenticated users
- Creates `get_public_boltz_feed()` - for public/anonymous access
- Creates `get_following_boltz_feed()` - for following tab
- Adds triggers for auto-updating counts
- Updates RLS policies for visibility

### 2. FIX_POSTS_SCHEMA_COUNTS.sql
```sql
-- Run this in Supabase SQL Editor
-- Adds count columns and creates unified RPC
\i database/migrations/FIX_POSTS_SCHEMA_COUNTS.sql
```

**What it does**:
- Adds count columns to posts (likes_count, comments_count, views_count, saves_count, shares_count)
- Adds content and media_urls columns
- Creates `get_home_feed_secure()` - for authenticated users
- Creates `get_public_feed()` - for public/anonymous access
- Adds triggers for auto-updating counts

## Testing Steps

1. **Apply SQL Migrations**:
   ```sql
   -- Run both files in Supabase SQL Editor
   -- Check for any errors
   ```

2. **Test Explore Page**:
   - Navigate to /explore
   - Check console for "[Explore] Posts fetched: X" logs
   - Verify posts appear in grid
   - Test switching between tabs (All, Posts, Boltz)

3. **Test Boltz Page**:
   - Navigate to /boltz
   - Verify thumbnails show before video loads
   - Check video playback works
   - Test scrolling to load more

4. **Verify Thumbnails**:
   - In Explore grid, Boltz items should show thumbnail with play icon
   - In Boltz feed, poster image should show while video buffers

## Key Changes Summary

| Component | Before | After |
|-----------|--------|-------|
| BoltzPlayer | No poster attribute | Has poster={posterSrc} |
| useBoltzFeed | Direct table query | Uses unified RPC |
| ExploreEnhanced | FK joins failing | Uses unified RPC |
| postService | Stealth shield filters | Unified RPC + fallback |
| boltzService | Multiple thumbnail cols | Unified fallback chain |

## Rollback Plan

If issues occur, the original queries are preserved as fallbacks in all services. The RPCs are additive and don't break existing functionality.

## Next Steps

1. Apply the SQL migrations
2. Test thoroughly
3. If working, clean up commented-out code
4. Consider adding proper moderation_status column later for stealth shield
