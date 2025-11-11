# Component-Specific Error Fixes

## Home Feed
- **Empty feed:** Check RLS policies allow SELECT for authenticated users
- **Slow loading:** Add indexes on `created_at`, `user_id`
- **Double fetch:** Use loading state to prevent duplicate calls
- **Images flicker:** Implement proper image caching/lazy loading

## Explore Page
- **Search returns nothing:** Check ilike query and text indexes
- **Grid broken:** Use consistent `numColumns` and `keyExtractor`
- **Duplicate content:** Dedupe by ID after fetch

## Create/Upload
- **Form submits empty:** Add client validation and disable button
- **Upload stuck at 0%:** Use progress callbacks, check bucket permissions
- **Wrong bucket:** Verify bucket name and file path
- **UI doesn't reset:** Clear form state after successful upload

## Boltz (Videos)
- **Multiple videos play:** Pause non-visible items in FlatList
- **Upload fails:** Check file size limits and video format
- **Buffering:** Compress videos client-side before upload

## Flash (Stories)
- **Story bubble does nothing:** Debug navigation params and story URL
- **Stories disappear:** Check expiry logic and cache invalidation
- **Progress bar laggy:** Use requestAnimationFrame for smooth animation

## Messages/DM
- **Deleted chats appear:** Filter by `deleted=false` in query
- **Typing stuck:** Cleanup presence channel on unmount
- **Wrong thread:** Always filter by `chat_id`

## Calls
- **Never connects:** Init WebRTC after auth, show connecting UI
- **Can call blocked users:** Check blocked status before initiating

## Notifications
- **Always empty:** Verify RLS policies and `user_id` filter
- **Badge stuck:** Update both UI and backend on mark-as-read

## Profile
- **Edits don't persist:** Check UPDATE policy and await save
- **Counts lag:** Subscribe to follower changes, invalidate cache

## Settings
- **Logout incomplete:** Clear all localStorage/AsyncStorage
- **Toggles out of sync:** Fetch from DB, disable during save

## Cross-Component
- **Auth issues:** Pass user context correctly, check session validity
- **ID mismatches:** Use consistent UUID format client/server
- **Theme broken:** Implement proper theme provider and persistence
