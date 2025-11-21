# Group Settings Implementation - Task 13.3

## Overview
This implementation adds comprehensive group settings functionality to the Focus app, allowing group admins to:
- Update group name and avatar
- Add/edit group description
- Enable/disable admin-only messaging

## Files Created/Modified

### New Files
1. **migrations/028_group_settings.sql** - Database migration to add admin_only_messaging field
2. **src/components/GroupSettings.js** - Group settings modal component
3. **src/components/GroupSettings.css** - Styling for group settings modal

### Modified Files
1. **src/pages/GroupChat.js** - Integrated settings modal and admin-only messaging restrictions
2. **src/pages/GroupChat.css** - Added styles for admin-only notice

## Database Migration

To apply the migration, run the SQL in `migrations/028_group_settings.sql` in your Supabase SQL Editor:

```sql
-- Add admin_only_messaging field
ALTER TABLE group_chats 
ADD COLUMN IF NOT EXISTS admin_only_messaging BOOLEAN DEFAULT false;

-- Update RLS policy for group messages to respect admin_only_messaging
DROP POLICY IF EXISTS "Members can send messages" ON group_messages;

CREATE POLICY "Members can send messages"
  ON group_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()) AND
    (
      -- Either admin_only_messaging is false
      NOT EXISTS (SELECT 1 FROM group_chats WHERE id = group_id AND admin_only_messaging = true)
      OR
      -- Or user is an admin
      EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid() AND role = 'admin')
    )
  );
```

## Features Implemented

### 1. Group Name Update
- Admins can update the group name
- Character limit: 100 characters
- Real-time character counter
- Required field validation

### 2. Group Avatar Update
- Click-to-upload interface with preview
- Supports image files only
- Maximum file size: 5MB
- Uploads to 'group-avatars' storage bucket
- Shows hover overlay with camera icon

### 3. Group Description
- Optional text field for group description
- Character limit: 500 characters
- Real-time character counter
- Multiline textarea with 4 rows

### 4. Admin-Only Messaging
- Toggle switch to enable/disable
- When enabled, only admins can send messages
- Non-admin members see a notice: "Only admins can send messages in this group"
- RLS policy enforces this at the database level
- Message input is replaced with a disabled notice for non-admins

## User Interface

### Settings Button
- Added gear icon button in the group chat header
- Opens the group settings modal
- Only admins can modify settings (non-admins see a permission message)

### Settings Modal
- Clean, modern design with sections for each setting
- Avatar upload with preview and hover effect
- Form validation with error messages
- Save/Cancel buttons
- Loading state during save operation

### Admin-Only Messaging Notice
- Replaces message input when enabled for non-admins
- Shows lock icon with explanatory text
- Styled to match the app's design system

## Security

### Row Level Security (RLS)
- Updated RLS policy ensures only admins can send messages when admin_only_messaging is enabled
- Policy checks both group membership and admin status
- Enforced at the database level for security

### Permissions
- Only group admins can access and modify settings
- Non-admins see a "no permission" message in the settings modal
- Avatar uploads are restricted to authenticated users
- Users can only delete their own uploaded avatars

## Testing

### Manual Testing Steps

1. **Create a test group** (if you don't have one):
   - Go to Messages page
   - Create a new group with at least 2 members
   - Make sure you're an admin

2. **Test Group Settings Access**:
   - Open the group chat
   - Click the gear icon in the header
   - Verify the settings modal opens

3. **Test Group Name Update**:
   - Change the group name
   - Click "Save Changes"
   - Verify the name updates in the header
   - Verify character counter works (max 100)

4. **Test Group Avatar Update**:
   - Click on the avatar preview
   - Select an image file
   - Verify preview shows immediately
   - Click "Save Changes"
   - Verify avatar updates in header and members modal

5. **Test Group Description**:
   - Add or edit the description
   - Click "Save Changes"
   - Open the members modal
   - Verify description appears at the top

6. **Test Admin-Only Messaging**:
   - Enable the "Admin Only Messaging" toggle
   - Click "Save Changes"
   - Log in as a non-admin member
   - Open the group chat
   - Verify message input is replaced with notice
   - Try to send a message (should be blocked)
   - Log back in as admin
   - Verify you can still send messages

7. **Test Non-Admin Access**:
   - Log in as a non-admin member
   - Open group settings
   - Verify "Only group admins can change settings" message appears

8. **Test Validation**:
   - Try to save with empty group name (should show error)
   - Try to upload a non-image file (should show error)
   - Try to upload a file > 5MB (should show error)

## Requirements Satisfied

✅ Allow updating group name and avatar
✅ Add group description field
✅ Implement admin-only messaging option
✅ Requirement 13.3 fully implemented

## Notes

- The group description field was already present in the database schema but wasn't exposed in the UI
- The admin_only_messaging field is a new addition to the group_chats table
- All changes are persisted to the database and reflected in real-time
- The implementation follows the existing design patterns in the codebase
- Responsive design works on mobile and desktop
- Dark mode support included via CSS variables
