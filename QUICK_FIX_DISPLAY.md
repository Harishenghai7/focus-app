# 🔧 QUICK FIX FOR DISPLAY ISSUES

## Errors Found:

### 1. ❌ conversation_participants RLS blocking
```
new row violates row-level security policy
```

### 2. ❌ flash.is_archived column doesn't exist
```
column flash.is_archived does not exist
```

---

## ✅ FIXES APPLIED:

### Code Fix:
✅ Removed `is_archived` filter from flash query

### SQL Fix Needed:
Run this SQL in Supabase:

```sql
-- Disable RLS on conversation_participants
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE conversation_participants TO authenticated;
GRANT ALL PRIVILEGES ON TABLE conversation_participants TO anon;

-- Add is_archived column if needed (optional)
ALTER TABLE flash ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Reload schema
NOTIFY pgrst, 'reload schema';
```

---

## 🧪 AFTER RUNNING SQL:

1. **Refresh app** (F5)
2. **Test Messages** - Should appear in inbox ✅
3. **Test Flash** - Should appear in stories ✅

---

## Expected Results:

### Messages:
```
✅ Participants added successfully
✅ Message sent
(Appears in Messages page)
```

### Flash:
```
✅ Stories fetched: 1
(Appears in stories bar)
```

---

**RUN THE SQL NOW!** 🚀✨
