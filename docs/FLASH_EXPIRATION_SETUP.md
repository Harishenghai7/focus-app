# Flash Stories 24-Hour Expiration System

## Overview

Flash stories automatically expire and are deleted 24 hours after creation. This document explains how the expiration system works and how to set it up.

## Components

### 1. Database Trigger
- Automatically sets `expires_at` to 24 hours from creation
- Located in: `migrations/015_flash_expiration_system.sql`

### 2. Edge Function
- Deletes expired flashes and their media files
- Located in: `supabase/functions/delete-expired-flashes/index.ts`

### 3. Cron Job
- Runs the edge function every hour
- Configured in Supabase Dashboard

## Setup Instructions

### Step 1: Apply Database Migration

Run the migration to set up the expiration system:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually in Supabase SQL Editor
# Copy and paste the contents of migrations/015_flash_expiration_system.sql
```

### Step 2: Deploy Edge Function

Deploy the edge function to Supabase:

```bash
# Deploy the function
supabase functions deploy delete-expired-flashes

# Set required environment variables (if not already set)
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Set Up Cron Job

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Extensions**
3. Enable the `pg_cron` extension
4. Go to **SQL Editor** and run:

```sql
-- Schedule the edge function to run every hour
SELECT cron.schedule(
  'delete-expired-flashes',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/delete-expired-flashes',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      )
    ) as request_id;
  $$
);
```

Replace `your-project-ref` with your actual Supabase project reference.

#### Option B: Using External Cron Service

If you prefer using an external service like GitHub Actions, Vercel Cron, or cron-job.org:

1. Set up a cron job to call the edge function URL every hour
2. Include the service role key in the Authorization header

Example GitHub Actions workflow:

```yaml
name: Delete Expired Flashes
on:
  schedule:
    - cron: '0 * * * *' # Every hour
  workflow_dispatch: # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            https://your-project-ref.supabase.co/functions/v1/delete-expired-flashes \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json"
```

### Step 4: Verify Setup

Test the expiration system:

```sql
-- Check for expired flashes
SELECT id, user_id, expires_at, 
       expires_at < NOW() as is_expired
FROM flash
WHERE expires_at < NOW() + INTERVAL '1 hour';

-- Manually trigger cleanup (for testing)
SELECT * FROM cleanup_expired_flashes();
```

## How It Works

### Creation
1. User creates a Flash story
2. Database trigger automatically sets `expires_at` to NOW() + 24 hours
3. Flash is visible to followers

### Expiration
1. Cron job runs every hour
2. Edge function queries for flashes where `expires_at < NOW()`
3. For each expired flash:
   - Media file is deleted from storage bucket
   - Database record is deleted
4. Function returns count of deleted flashes

### Viewing
- Flash.js component filters out expired flashes using `.gt('expires_at', new Date().toISOString())`
- Active flashes view provides pre-filtered results

## Manual Cleanup

You can manually trigger cleanup from the client:

```javascript
const { data, error } = await supabase.rpc('cleanup_expired_flashes');
console.log('Cleanup result:', data);
// { success: true, deleted_count: 5, deleted_ids: [...], timestamp: "..." }
```

## Monitoring

### Check Cron Job Status

```sql
-- View scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details
WHERE jobname = 'delete-expired-flashes'
ORDER BY start_time DESC
LIMIT 10;
```

### Check for Expired Flashes

```sql
-- Count expired flashes
SELECT COUNT(*) as expired_count
FROM flash
WHERE expires_at < NOW() AND is_archived = false;

-- View expired flashes details
SELECT id, user_id, created_at, expires_at,
       NOW() - expires_at as overdue_duration
FROM flash
WHERE expires_at < NOW() AND is_archived = false
ORDER BY expires_at DESC;
```

## Troubleshooting

### Flashes Not Expiring

1. Check if cron job is running:
```sql
SELECT * FROM cron.job WHERE jobname = 'delete-expired-flashes';
```

2. Check for errors in job runs:
```sql
SELECT * FROM cron.job_run_details
WHERE jobname = 'delete-expired-flashes' AND status = 'failed';
```

3. Manually test the edge function:
```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/delete-expired-flashes \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Media Files Not Deleted

- Check storage bucket permissions
- Verify the media_url format matches the expected pattern
- Check edge function logs in Supabase Dashboard

### Performance Issues

If you have many expired flashes:

1. Increase cron frequency temporarily:
```sql
-- Run every 15 minutes
SELECT cron.schedule('delete-expired-flashes', '*/15 * * * *', ...);
```

2. Add batch processing to edge function
3. Monitor database performance during cleanup

## Best Practices

1. **Regular Monitoring**: Check cron job status weekly
2. **Backup Strategy**: Consider archiving instead of deleting (see Task 7.5)
3. **Rate Limiting**: Ensure edge function has appropriate timeout settings
4. **Logging**: Monitor edge function logs for errors
5. **Testing**: Test expiration in staging before production

## Related Features

- **Task 7.2**: Viewer tracking for flashes
- **Task 7.5**: Archive system (alternative to deletion)
- **Flash.js**: Client-side filtering of expired flashes

## Configuration

### Adjust Expiration Time

To change from 24 hours to a different duration:

```sql
-- Update default expiration (e.g., 12 hours)
ALTER TABLE flash 
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '12 hours');

-- Update trigger function
CREATE OR REPLACE FUNCTION set_flash_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '12 hours'; -- Changed from 24
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Adjust Cron Frequency

```sql
-- Run every 30 minutes
SELECT cron.schedule('delete-expired-flashes', '*/30 * * * *', ...);

-- Run every 6 hours
SELECT cron.schedule('delete-expired-flashes', '0 */6 * * *', ...);
```

## Security Considerations

1. **Service Role Key**: Keep the service role key secure
2. **RLS Policies**: Ensure proper RLS policies on flash table
3. **Rate Limiting**: Consider rate limiting the edge function
4. **Audit Logging**: Log all deletions for compliance

## Cost Optimization

- Cron job runs: ~720 times/month (hourly)
- Edge function invocations: ~720/month
- Storage operations: Depends on flash volume
- Estimated cost: < $1/month for typical usage

## Support

For issues or questions:
1. Check Supabase Dashboard logs
2. Review edge function logs
3. Check database trigger logs
4. Consult Supabase documentation
