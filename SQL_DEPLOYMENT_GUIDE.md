# 🛡️ PILLAR 1 & 2: SQL Deployment Guide for Supabase

## Quick Start (Run These Files in Order)

### Option 1: Master File (Recommended) ⭐
**Single file deploys both pillars:**
```sql
-- Run this ONE file in Supabase SQL Editor:
20260422_master_pillar1_pillar2_complete.sql
```

### Option 2: Separate Files
```sql
-- Step 1: Pillar 1 (Trust Shield)
20260422_pillar1_trust_shield_complete.sql

-- Step 2: Pillar 2 (Immune System)
20260422_pillar2_immune_system_complete.sql
```

---

## 📁 File Locations

```
d:\focus-app\supabase\migrations\
├── 20260422_master_pillar1_pillar2_complete.sql      ⭐ MASTER (Run This!)
├── 20260422_pillar1_trust_shield_complete.sql          Pillar 1 Only
└── 20260422_pillar2_immune_system_complete.sql         Pillar 2 Only
```

---

## 🚀 How to Run in Supabase

### Method 1: SQL Editor (Web UI) - Recommended
1. Go to [app.supabase.io](https://app.supabase.io)
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy & paste contents of `20260422_master_pillar1_pillar2_complete.sql`
6. Click **Run**
7. ✅ Done!

### Method 2: CLI (Local Development)
```bash
# Using Supabase CLI
supabase db reset                    # Reset local DB (optional)
supabase db push                     # Push migrations

# Or run specific file
psql $SUPABASE_DB_URL -f supabase/migrations/20260422_master_pillar1_pillar2_complete.sql
```

### Method 3: Programmatic (Node.js/JS)
```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const sql = fs.readFileSync('./supabase/migrations/20260422_master_pillar1_pillar2_complete.sql', 'utf8');

const { error } = await supabase.rpc('exec_sql', { sql });
if (error) console.error(error);
else console.log('✅ Migration successful!');
```

---

## 📊 What Gets Created

### PILLAR 1: Trust Shield (Identity)

| Component | Description |
|-----------|-------------|
| `trust_shield_status` ENUM | unverified, pending, verified, teen_pending, teen_verified, rejected, locked, banned |
| `document_tier` ENUM | adult (Govt ID), teen (Student ID) |
| `verification_method` ENUM | govt_id, student_id, biometric_only, guardian_override |
| **profiles columns** | identity_hash, trust_shield_status, age_group, date_of_birth, guardian_consent_status, etc. |
| **verification_audit_trail** | Every verification attempt logged |
| **guardian_approvals** | Parent consent for teen accounts |
| **check_identity_hash_unique()** | Prevents duplicate identities (One User, One Account) |
| **validate_age_tier_match()** | Triggers Hard Reset on mismatches |

### PILLAR 2: Immune System (Content Moderation)

| Component | Description |
|-----------|-------------|
| `moderation_status` ENUM | approved, restricted, flagged |
| `toxicity_type` ENUM | safe, nsfw, hate, violence, self_harm, bullying, misinformation, spam, negative_loop |
| **posts/boltz/flashes/comments columns** | moderation_status, toxicity_type, moderation_score, moderation_reason, etc. |
| **is_content_visible()** | Core stealth shield: content visible IFF approved OR owner |
| **RLS Policies** | `stealth_shield_select_*` - automatically filters restricted content |
| **v_visible_posts/boltz/flashes** | Public views that respect stealth shield |
| **moderation_audit** | Every moderation decision logged |
| **v_moderation_queue** | Admin dashboard view for flagged/restricted content |
| **admin_approve_content()** | Function for admins to approve flagged content |
| **admin_restrict_content()** | Function for admins to manually restrict content |
| **appeal_content_moderation()** | User can appeal restricted/flagged content |

---

## ✅ Verification Steps

### After Running SQL, Verify:

```sql
-- 1. Check enums were created
SELECT typname FROM pg_type WHERE typname IN ('trust_shield_status', 'moderation_status', 'toxicity_type');

-- 2. Check profiles columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name LIKE '%trust%' OR column_name LIKE '%identity%';

-- 3. Check moderation columns on posts
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'posts' AND column_name LIKE 'moderation%';

-- 4. Check RLS policies
SELECT tablename, policyname FROM pg_policies WHERE policyname LIKE 'stealth%';

-- 5. Check audit tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('verification_audit_trail', 'moderation_audit', 'guardian_approvals');

-- 6. Check views
SELECT viewname FROM pg_views WHERE viewname LIKE 'v_visible%' OR viewname = 'v_moderation_queue';
```

---

## 🔐 Security Features Enabled

### Row Level Security (RLS) Policies:

| Table | Policy | Effect |
|-------|--------|--------|
| `posts` | `stealth_shield_select_posts` | Only shows approved posts OR user's own posts |
| `boltz` | `stealth_shield_select_boltz` | Only shows approved boltz OR user's own boltz |
| `flashes` | `stealth_shield_select_flashes` | Only shows approved flashes OR user's own flashes |
| `verification_audit_trail` | `verification_audit_user_read` | Users see own audits, admins see all |
| `moderation_audit` | `moderation_audit_read` | Users see own moderation history |
| `guardian_approvals` | `guardian_approvals_teen_read` | Teens see own approvals |

### Triggers:

| Trigger | Table | Purpose |
|---------|-------|---------|
| `enforce_identity_hash_unique` | `profiles` | Prevents duplicate identity registration |
| `validate_age_tier_trigger` | `profiles` | Triggers Hard Reset on age/tier mismatch |

---

## 📋 Post-Deployment Checklist

- [ ] SQL executed without errors
- [ ] Enums created: `trust_shield_status`, `moderation_status`, `toxicity_type`
- [ ] Tables created: `verification_audit_trail`, `moderation_audit`, `guardian_approvals`
- [ ] Views created: `v_visible_posts`, `v_visible_boltz`, `v_visible_flashes`, `v_moderation_queue`
- [ ] RLS policies applied to `posts`, `boltz`, `flashes`
- [ ] Functions created: `is_content_visible()`, `admin_approve_content()`, `admin_restrict_content()`, `appeal_content_moderation()`
- [ ] Triggers created and enabled
- [ ] Existing content migrated to `moderation_status = 'approved'`

---

## 🎯 Usage Examples

### Check User's Trust Shield Status
```sql
SELECT id, username, trust_shield_status, identity_hash, can_post
FROM public.profiles
WHERE id = 'user-uuid-here';
```

### View Moderation Queue (Admin)
```sql
SELECT * FROM public.v_moderation_queue LIMIT 50;
```

### Approve Flagged Content (Admin)
```sql
SELECT public.admin_approve_content('post', 'post-uuid-here', 'admin-uuid-here', 'Manual review: Safe content');
```

### Check Identity Duplicates
```sql
SELECT identity_hash, COUNT(*) as count
FROM public.profiles
WHERE identity_hash IS NOT NULL
GROUP BY identity_hash
HAVING COUNT(*) > 1;
```

---

## 🆘 Troubleshooting

### Error: "Type already exists"
**Solution**: Migration uses `IF NOT EXISTS` — safe to re-run.

### Error: "Column already exists"
**Solution**: Uses `ADD COLUMN IF NOT EXISTS` — safe to re-run.

### Error: "Policy already exists"
**Solution**: Script drops existing policies before creating — safe to re-run.

### Missing Tables
If `posts`, `boltz`, or `flashes` don't exist, the migration skips them gracefully. Create these tables first, then re-run.

---

## 📞 Support

**Files to Reference:**
- Master: `@d:ocus-appackslash supabaseackslash migrationsackslash 20260422_master_pillar1_pillar2_complete.sql`
- Pillar 1: `@d:ocus-appackslash supabaseackslash migrationsackslash 20260422_pillar1_trust_shield_complete.sql`
- Pillar 2: `@d:ocus-appackslash supabaseackslash migrationsackslash 20260422_pillar2_immune_system_complete.sql`

**Status**: ✅ Ready for Production Deployment
