# Database Migration Instructions

## Apply the Messaging System Upgrade Migration

To fix the messaging system, you need to apply the database migration that adds the `conversation_participants` table and updates the schema.

### Steps:

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your Focus app project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run the Migration**
   - Open the file: `database/migrations/2025-11-30_messaging_system_upgrade.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" to execute the migration

4. **Verify the Migration**
   After running, verify these tables exist:
   - `conversations` (should have new columns: `is_group`, `name`, `created_by`)
   - `conversation_participants` (new table)
   - `messages` (should have new columns: `receiver_id`, `is_read`, `reply_to_message_id`)

### What the Migration Does:

- ✅ Creates `conversation_participants` table for group messaging support
- ✅ Adds `is_group`, `name`, `created_by` columns to `conversations`
- ✅ Adds `receiver_id`, `is_read`, `reply_to_message_id` to `messages`
- ✅ Migrates existing conversations to the new structure
- ✅ Sets up proper RLS policies
- ✅ Creates indexes for performance
- ✅ Adds trigger to update `last_message_at` automatically

### After Migration:

The messaging system will work correctly:
- ✅ Clicking "Message" on a profile will open the chat
- ✅ Chats will appear in the left sidebar
- ✅ Messages can be sent and received
- ✅ Real-time updates will work

## Troubleshooting

If you encounter errors:

1. **"relation already exists"** - This is OK, it means some tables already exist
2. **"column already exists"** - This is OK, it means some columns already exist
3. **Permission errors** - Make sure you're logged in as the project owner

The migration is designed to be safe and idempotent (can be run multiple times).
