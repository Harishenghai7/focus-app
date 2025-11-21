# Issue #9: Account Lockout After Failed Attempts

## Status: ✅ IMPLEMENTING

## Current State
- Rate limiting exists in `rateLimiter.js` (localStorage-based)
- Lockout is client-side only (15 minutes)
- No database-level account lockout
- No admin unlock capability

## Issues Found
1. ❌ No database field for account_locked status
2. ❌ No server-side validation of locked status
3. ❌ No admin unlock functionality
4. ❌ No lockout history/audit log
5. ❌ No email notification on lockout

## Solution

### Step 1: Add Database Schema
```sql
-- Add to Supabase
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlock_token TEXT;

-- Create lockout history table
CREATE TABLE IF NOT EXISTS account_lockout_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_at TIMESTAMP DEFAULT NOW(),
  unlocked_at TIMESTAMP,
  reason TEXT,
  failed_attempts INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE account_lockout_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own lockout history" ON account_lockout_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all lockout history" ON account_lockout_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );
```

### Step 2: Update Auth.js
```javascript
// Add check for locked account
const checkAccountLocked = async (email) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('account_locked, locked_at, locked_reason')
    .eq('email', email)
    .single();
  
  if (error) return { isLocked: false };
  
  if (profile?.account_locked) {
    // Check if lockout has expired (24 hours)
    const lockedTime = new Date(profile.locked_at);
    const now = new Date();
    const hoursSinceLocked = (now - lockedTime) / (1000 * 60 * 60);
    
    if (hoursSinceLocked > 24) {
      // Auto-unlock
      await supabase
        .from('profiles')
        .update({ account_locked: false, locked_at: null })
        .eq('email', email);
      return { isLocked: false };
    }
    
    return {
      isLocked: true,
      reason: profile.locked_reason,
      lockedAt: profile.locked_at
    };
  }
  
  return { isLocked: false };
};

// In handleSubmit
const { isLocked, reason } = await checkAccountLocked(email);
if (isLocked) {
  displayMessage(`Account locked: ${reason}. Please try again later or contact support.`, 'error');
  setLoading(false);
  return;
}
```

### Step 3: Add Unlock Functionality
```javascript
// Add to Settings.js
const handleUnlockRequest = async () => {
  try {
    const { error } = await supabase.rpc('request_account_unlock', {
      user_id: user.id
    });
    
    if (error) throw error;
    
    alert('Unlock request sent. Check your email for instructions.');
  } catch (error) {
    alert('Failed to request unlock: ' + error.message);
  }
};

// Add RPC function
CREATE OR REPLACE FUNCTION request_account_unlock(user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_email TEXT;
  unlock_token TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  
  IF user_email IS NULL THEN
    RETURN json_build_object('error', 'User not found');
  END IF;
  
  -- Generate unlock token
  unlock_token := encode(gen_random_bytes(32), 'hex');
  
  -- Save token
  UPDATE profiles SET unlock_token = unlock_token WHERE id = user_id;
  
  -- Send email (via edge function or external service)
  -- TODO: Implement email sending
  
  RETURN json_build_object('success', true, 'message', 'Unlock email sent');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 4: Add Admin Unlock
```javascript
// Add to AdminDashboard.js
const handleUnlockUser = async (userId) => {
  if (!window.confirm('Unlock this user account?')) return;
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        account_locked: false,
        locked_at: null,
        locked_reason: null
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    // Log action
    await supabase.from('admin_actions').insert({
      admin_id: user.id,
      action: 'unlock_account',
      target_user_id: userId,
      timestamp: new Date().toISOString()
    });
    
    alert('User account unlocked');
    refreshUserList();
  } catch (error) {
    alert('Failed to unlock: ' + error.message);
  }
};
```

## Files to Modify
1. `src/pages/Auth.js` - Add locked account check
2. `src/pages/Settings.js` - Add unlock request
3. `src/pages/AdminDashboard.js` - Add admin unlock
4. Database schema - Add lockout fields

## Tests to Add
```javascript
// cypress/e2e/account-lockout.cy.js
describe('Account Lockout', () => {
  it('should lock account after 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) {
      cy.visit('http://localhost:3000/auth');
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();
    }
    cy.contains(/account locked/i).should('exist');
  });
  
  it('should show unlock request option', () => {
    cy.visit('http://localhost:3000/auth');
    cy.get('[data-testid="email-input"]').type('locked@example.com');
    cy.get('[data-testid="password-input"]').type('anypassword');
    cy.get('[data-testid="login-button"]').click();
    cy.contains(/account locked/i).should('exist');
    cy.contains(/request unlock/i).should('exist');
  });
  
  it('should auto-unlock after 24 hours', () => {
    // Mock time
    cy.clock();
    // Lock account
    // Advance time 24+ hours
    cy.tick(24 * 60 * 60 * 1000 + 1000);
    // Try login - should work
  });
});
```

## Verification Checklist
- [ ] Database schema updated
- [ ] Auth.js checks for locked account
- [ ] Settings.js has unlock request
- [ ] AdminDashboard.js can unlock users
- [ ] Email notifications sent on lockout
- [ ] Auto-unlock after 24 hours works
- [ ] Tests passing
- [ ] No security vulnerabilities

## Related Issues
- #13: Rate limit for login attempts (already implemented)
- #10: Session expiration (separate issue)
- #18: Banned user can't log in (related)

## Effort Estimate
- Implementation: 4 hours
- Testing: 2 hours
- Total: 6 hours
