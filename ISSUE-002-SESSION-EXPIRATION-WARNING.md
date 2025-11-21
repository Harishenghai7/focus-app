# Issue #10: Session Expiration Warning

## Status: ✅ IMPLEMENTING

## Current State
- Session expires without warning
- SessionExpiredModal exists but only shows after expiration
- No countdown timer
- No warning before expiration

## Issues Found
1. ❌ No warning modal before expiration
2. ❌ No countdown timer
3. ❌ No "extend session" option
4. ❌ No notification of impending expiration

## Solution

### Step 1: Update sessionManager.js
```javascript
// Add to src/utils/sessionManager.js

let expirationWarningCallback = null;
let expirationCheckInterval = null;

export const setupExpirationWarning = (onWarning, onExpired) => {
  const checkExpiration = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (onExpired) onExpired();
        return;
      }
      
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const timeLeftMs = expiresAt - now;
      const timeLeftSeconds = Math.floor(timeLeftMs / 1000);
      
      // Warn 5 minutes before expiration
      if (timeLeftSeconds > 0 && timeLeftSeconds <= 5 * 60) {
        if (onWarning) {
          onWarning({
            timeLeftSeconds,
            timeLeftMinutes: Math.ceil(timeLeftSeconds / 60),
            expiresAt
          });
        }
      }
      
      // Session expired
      if (timeLeftSeconds <= 0) {
        if (onExpired) onExpired();
      }
    } catch (error) {
      console.error('Error checking session expiration:', error);
    }
  };
  
  // Check every 30 seconds
  expirationCheckInterval = setInterval(checkExpiration, 30000);
  
  // Initial check
  checkExpiration();
  
  return () => {
    if (expirationCheckInterval) {
      clearInterval(expirationCheckInterval);
    }
  };
};

export const stopExpirationWarning = () => {
  if (expirationCheckInterval) {
    clearInterval(expirationCheckInterval);
    expirationCheckInterval = null;
  }
};

export const extendSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) throw error;
    
    return {
      success: true,
      newExpiresAt: new Date(data.session.expires_at * 1000)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
```

### Step 2: Create SessionExpirationWarning Component
```javascript
// src/components/SessionExpirationWarning.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { extendSession } from '../utils/sessionManager';
import './SessionExpirationWarning.css';

export default function SessionExpirationWarning({ show, timeLeft, onExtend, onLogout }) {
  const [countdown, setCountdown] = useState(timeLeft?.timeLeftSeconds || 0);
  
  useEffect(() => {
    if (!show) return;
    
    setCountdown(timeLeft?.timeLeftSeconds || 0);
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [show, timeLeft]);
  
  const handleExtend = async () => {
    const result = await extendSession();
    if (result.success) {
      onExtend?.();
    } else {
      alert('Failed to extend session: ' + result.error);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="session-expiration-warning"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="warning-content">
            <div className="warning-icon">⏰</div>
            <div className="warning-text">
              <h3>Session Expiring Soon</h3>
              <p>Your session will expire in <strong>{formatTime(countdown)}</strong></p>
            </div>
            <div className="warning-actions">
              <button className="btn-primary" onClick={handleExtend}>
                Stay Logged In
              </button>
              <button className="btn-secondary" onClick={onLogout}>
                Logout
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Step 3: Update App.js
```javascript
// Add to App.js
import SessionExpirationWarning from './components/SessionExpirationWarning';
import { setupExpirationWarning, stopExpirationWarning } from './utils/sessionManager';

function AppContent() {
  const [showExpirationWarning, setShowExpirationWarning] = useState(false);
  const [expirationTimeLeft, setExpirationTimeLeft] = useState(null);
  
  useEffect(() => {
    if (!user) return;
    
    const cleanup = setupExpirationWarning(
      (timeLeft) => {
        setExpirationTimeLeft(timeLeft);
        setShowExpirationWarning(true);
      },
      () => {
        // Session expired
        setShowSessionExpired(true);
      }
    );
    
    return () => {
      cleanup();
      stopExpirationWarning();
    };
  }, [user]);
  
  const handleExtendSession = () => {
    setShowExpirationWarning(false);
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowExpirationWarning(false);
    window.location.href = '/auth';
  };
  
  return (
    <>
      <SessionExpirationWarning
        show={showExpirationWarning}
        timeLeft={expirationTimeLeft}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
      />
      {/* ... rest of app ... */}
    </>
  );
}
```

### Step 4: Add CSS
```css
/* src/components/SessionExpirationWarning.css */
.session-expiration-warning {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  max-width: 400px;
}

.warning-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.warning-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.warning-text {
  flex: 1;
}

.warning-text h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.warning-text p {
  margin: 0;
  font-size: 14px;
  opacity: 0.95;
}

.warning-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.warning-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: white;
  color: #ff6b6b;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 600px) {
  .session-expiration-warning {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .warning-content {
    flex-direction: column;
    text-align: center;
  }
  
  .warning-actions {
    width: 100%;
  }
  
  .warning-actions button {
    flex: 1;
  }
}
```

## Files to Modify
1. `src/utils/sessionManager.js` - Add expiration warning logic
2. `src/components/SessionExpirationWarning.js` - Create new component
3. `src/App.js` - Integrate warning
4. `src/components/SessionExpirationWarning.css` - Add styles

## Tests to Add
```javascript
// cypress/e2e/session-expiration-warning.cy.js
describe('Session Expiration Warning', () => {
  it('should show warning 5 minutes before expiration', () => {
    cy.login();
    cy.clock();
    // Advance time to 5 minutes before expiration
    cy.tick(55 * 60 * 1000); // 55 minutes
    cy.contains(/session expiring soon/i).should('exist');
  });
  
  it('should show countdown timer', () => {
    cy.login();
    cy.contains(/session expiring soon/i).should('exist');
    cy.contains(/5:00/).should('exist');
  });
  
  it('should extend session on button click', () => {
    cy.login();
    cy.contains(/session expiring soon/i).should('exist');
    cy.contains(/stay logged in/i).click();
    cy.contains(/session expiring soon/i).should('not.exist');
  });
  
  it('should logout on logout button click', () => {
    cy.login();
    cy.contains(/session expiring soon/i).should('exist');
    cy.contains(/logout/i).click();
    cy.url().should('include', '/auth');
  });
});
```

## Verification Checklist
- [ ] Warning appears 5 minutes before expiration
- [ ] Countdown timer works correctly
- [ ] "Stay Logged In" extends session
- [ ] "Logout" logs out user
- [ ] Warning disappears after extending
- [ ] Mobile responsive
- [ ] Tests passing
- [ ] No console errors

## Related Issues
- #11: Session refresh (already implemented)
- #9: Account lockout (separate issue)

## Effort Estimate
- Implementation: 3 hours
- Testing: 1.5 hours
- Total: 4.5 hours
