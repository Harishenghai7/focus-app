# 🔍 EXPLORE SEARCH DEBUGGING

## Check Your Data

Run these SQL queries in Supabase to see what data you have:

```sql
-- Check posts with captions
SELECT id, caption, media_url, type
FROM posts
WHERE type = 'image' AND media_url IS NOT NULL
ORDER BY created_at DESC;

-- Check boltz with descriptions
SELECT id, description, video_url, thumbnail_url
FROM boltz
WHERE video_url IS NOT NULL
ORDER BY created_at DESC;
```

## What to Search For

Based on your data:
1. **For Posts**: Search for text that appears in the `caption` column
2. **For Boltz**: Search for text that appears in the `description` column

## Current Search Implementation

The search:
1. Fetches ALL posts/boltz from database
2. Filters them on the client side by caption/description
3. Shows results

## Debug Steps

1. Open browser console (F12)
2. Type something in the search bar
3. Look for logs starting with `🔍 [SEARCH]`
4. Share the console output with me

The logs will show:
- What you searched for
- How many posts/boltz were fetched
- The caption/description of each item
- Whether it matched your search

## Possible Issues

1. **Caption/Description is NULL** - If your post doesn't have a caption, it won't be found
2. **Different column name** - The column might be named something else
3. **Case sensitivity** - The search is case-insensitive, but make sure you're searching for the right text

Run the SQL above and share what captions/descriptions you see!
