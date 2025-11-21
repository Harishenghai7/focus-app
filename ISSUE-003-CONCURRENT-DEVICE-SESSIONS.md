# Issue #12: Concurrent Device Sessions

## Status: ✅ IMPLEMENTING

## Current State
- No UI for managing devices
- No device tracking
- No session management interface
- Users can't see active sessions

## Issues Found
1. ❌ No device list UI
2. ❌ No device tracking
3. ❌ No remote logout capability
4. ❌ No device naming
5. ❌ No suspicious login alerts

## Solution

### Step 1: Create Device Management Page
```javascript
// src/pages/DeviceManagement.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import './DeviceManagement.css';

export default function DeviceManagement({ user }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  
  useEffect(() => {
    fetchDevices();
    getCurrentDeviceId();
  }, [user?.id]);
  
  const getCurrentDeviceId = () => {
    const stored = localStorage.getItem('device_id');
    if (stored) {
      setCurrentDeviceId(stored);
    } else {
      const newId = generateDeviceId();
      localStorage.setItem('device_id', newId);
      setCurrentDeviceId(newId);
    }
  };
  
  const generateDeviceId = () => {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };
  
  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active_at', { ascending: false });
      
      if (error) throw error;
      
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const removeDevice = async (sessionId) => {
    if (!window.confirm('Remove this device? You will be logged out on that device.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
      
      setDevices(devices.filter(d => d.id !== sessionId));
      alert('Device removed successfully');
    } catch (error) {
      alert('Failed to remove device: ' + error.message);
    }
  };
  
  const renameDevice = async (sessionId, newName) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ device_name: newName })
        .eq('id', sessionId);
      
      if (error) throw error;
      
      setDevices(devices.map(d => 
        d.id === sessionId ? { ...d, device_name: newName } : d
      ));
    } catch (error) {
      alert('Failed to rename device: ' + error.message);
    }
  };
  
  const getDeviceIcon = (userAgent) => {
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return '📱';
    if (userAgent.includes('Android')) return '🤖';
    if (userAgent.includes('Windows')) return '🪟';
    if (userAgent.includes('Mac')) return '🍎';
    if (userAgent.includes('Linux')) return '🐧';
    return '💻';
  };
  
  const getDeviceType = (userAgent) => {
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Unknown';
  };
  
  const formatLastActive = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };
  
  if (loading) {
    return <div className="device-management loading">Loading devices...</div>;
  }
  
  return (
    <div className="device-management">
      <div className="device-header">
        <h2>Active Devices</h2>
        <p>Manage your active sessions and devices</p>
      </div>
      
      <AnimatePresence>
        {devices.length === 0 ? (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>No active devices</p>
          </motion.div>
        ) : (
          <div className="devices-list">
            {devices.map((device, index) => (
              <motion.div
                key={device.id}
                className={`device-item ${currentDeviceId === device.device_id ? 'current' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="device-icon">
                  {getDeviceIcon(device.user_agent)}
                </div>
                
                <div className="device-info">
                  <div className="device-name">
                    {device.device_name || getDeviceType(device.user_agent)}
                    {currentDeviceId === device.device_id && (
                      <span className="current-badge">Current Device</span>
                    )}
                  </div>
                  <div className="device-details">
                    <span>{getDeviceType(device.user_agent)}</span>
                    <span>•</span>
                    <span>{device.ip_address}</span>
                    <span>•</span>
                    <span>{formatLastActive(device.last_active_at)}</span>
                  </div>
                </div>
                
                {currentDeviceId !== device.device_id && (
                  <button
                    className="btn-remove"
                    onClick={() => removeDevice(device.id)}
                    title="Remove this device"
                  >
                    ✕
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
      
      <div className="device-footer">
        <p className="info-text">
          💡 Tip: Regularly review your active devices and remove any you don't recognize.
        </p>
      </div>
    </div>
  );
}
```

### Step 2: Create Database Schema
```sql
-- Add to Supabase
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(user_id, device_id)
);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_device_id ON user_sessions(device_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

### Step 3: Add Session Tracking
```javascript
// src/utils/sessionTracker.js
import { supabase } from '../supabaseClient';

let sessionTrackingInterval = null;

export const startSessionTracking = async (userId) => {
  if (!userId) return;
  
  const deviceId = localStorage.getItem('device_id') || generateDeviceId();
  localStorage.setItem('device_id', deviceId);
  
  // Initial session record
  await recordSession(userId, deviceId);
  
  // Update activity every 5 minutes
  sessionTrackingInterval = setInterval(() => {
    recordSession(userId, deviceId);
  }, 5 * 60 * 1000);
};

export const stopSessionTracking = () => {
  if (sessionTrackingInterval) {
    clearInterval(sessionTrackingInterval);
    sessionTrackingInterval = null;
  }
};

const recordSession = async (userId, deviceId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const userAgent = navigator.userAgent;
    const ipAddress = await getClientIp();
    
    const { error } = await supabase
      .from('user_sessions')
      .upsert({
        user_id: userId,
        device_id: deviceId,
        user_agent: userAgent,
        ip_address: ipAddress,
        last_active_at: new Date().toISOString(),
        expires_at: new Date(session.expires_at * 1000).toISOString()
      }, {
        onConflict: 'user_id,device_id'
      });
    
    if (error) console.error('Error recording session:', error);
  } catch (error) {
    console.error('Error in recordSession:', error);
  }
};

const getClientIp = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
};

const generateDeviceId = () => {
  return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default {
  startSessionTracking,
  stopSessionTracking
};
```

### Step 4: Add CSS
```css
/* src/pages/DeviceManagement.css */
.device-management {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.device-header {
  margin-bottom: 30px;
}

.device-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.device-header p {
  margin: 0;
  color: var(--text-secondary);
}

.devices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.device-item:hover {
  border-color: var(--primary-color);
  background: var(--bg-tertiary);
}

.device-item.current {
  border-color: var(--primary-color);
  background: rgba(99, 102, 241, 0.05);
}

.device-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.device-info {
  flex: 1;
}

.device-name {
  font-weight: 600;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-badge {
  font-size: 12px;
  background: var(--primary-color);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.device-details {
  font-size: 14px;
  color: var(--text-secondary);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-remove {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #ff4444;
  color: white;
  border-color: #ff4444;
}

.device-footer {
  margin-top: 30px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border-left: 4px solid var(--primary-color);
}

.info-text {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
```

### Step 5: Integrate into Settings
```javascript
// Add to src/pages/Settings.js
import DeviceManagement from './DeviceManagement';

// In Settings component
<div className="settings-section">
  <h3>Active Devices</h3>
  <DeviceManagement user={user} />
</div>
```

## Files to Create/Modify
1. `src/pages/DeviceManagement.js` - New page
2. `src/pages/DeviceManagement.css` - New styles
3. `src/utils/sessionTracker.js` - New utility
4. `src/pages/Settings.js` - Add device management
5. `src/App.js` - Start session tracking
6. Database schema - Create user_sessions table

## Tests to Add
```javascript
// cypress/e2e/device-management.cy.js
describe('Device Management', () => {
  it('should show current device', () => {
    cy.login();
    cy.visit('http://localhost:3000/settings');
    cy.contains(/active devices/i).should('exist');
    cy.contains(/current device/i).should('exist');
  });
  
  it('should remove device', () => {
    cy.login();
    cy.visit('http://localhost:3000/settings');
    cy.get('.btn-remove').first().click();
    cy.contains(/remove this device/i).should('exist');
  });
  
  it('should track session activity', () => {
    cy.login();
    cy.wait(5000);
    cy.visit('http://localhost:3000/settings');
    cy.contains(/just now/i).should('exist');
  });
});
```

## Verification Checklist
- [ ] Device list displays correctly
- [ ] Current device marked
- [ ] Can remove devices
- [ ] Session tracking works
- [ ] IP address captured
- [ ] Device type detected
- [ ] Last active time updates
- [ ] Tests passing

## Related Issues
- #11: Session refresh
- #10: Session expiration warning

## Effort Estimate
- Implementation: 5 hours
- Testing: 2 hours
- Total: 7 hours
