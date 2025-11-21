# 🛡️ Trust Shield Admin Dashboard - Quick Reference

**Component:** `src/pages/TrustShieldAdminDashboard.js`  
**Route:** `/admin/trust-shield`  
**Access:** Admin users only

---

## 🚀 Quick Start

### 1. Add Route
```javascript
import TrustShieldAdminDashboard from './pages/TrustShieldAdminDashboard';

<Route 
  path="/admin/trust-shield" 
  element={<TrustShieldAdminDashboard />} 
/>
```

### 2. Access Dashboard
```
URL: /admin/trust-shield
Required: User with role='admin' OR is_admin=true
```

### 3. Install Dependencies
```bash
npm install chart.js react-chartjs-2
```

---

## 📊 Dashboard Sections

### **Overview Tab**
- Trust Score Distribution (Bar Chart)
- Verification Level Distribution (Pie Chart)
- Verification Level Breakdown Table

### **Suspicious Activity Tab**
- Last 24 hours flagged users (bot_probability >= 0.5)
- Actions: View, Flag, Block
- Export to CSV

### **Recent Events Tab**
- Real-time event stream
- All verification events
- Export to CSV

### **IP Blocklist Tab**
- View blocked IPs
- Add/remove IPs
- Track block reasons

### **User Search Tab**
- Search by username/email
- View detailed user profiles
- Access admin actions

---

## 🎯 Admin Actions

### **Verify User**
```javascript
// Sets: verification_level = 'verified', trust_score = 70
// Removes: manual_review flag
// Logs: 'manual_verification' event
```

### **Flag User**
```javascript
// Adds: admin_flag with reason
// Sets: requires_manual_review = true
// Logs: 'manual_flag' event
```

### **Block User**
```javascript
// Sets: verification_level = 'blocked', trust_score = 0
// Adds: blocked flag with reason
// Logs: 'manual_block' event
// Confirmation required
```

### **Unblock User**
```javascript
// Sets: verification_level = 'basic', trust_score = 30
// Removes: block flags
// Logs: 'manual_unblock' event
```

### **Block IP**
```javascript
// Adds IP to blocklist
// Requires: IP address + reason
// Tracks: Admin ID + timestamp
```

### **Unblock IP**
```javascript
// Removes from blocklist
// Confirmation required
```

---

## 📈 Statistics Cards

| Card | Description |
|------|-------------|
| **Total Users** | Count of all users in system |
| **Avg Trust Score** | Average trust score (0-100) |
| **Bot Detection Rate** | % of users with bot_probability > 0.7 |
| **Pending Reviews** | Users requiring manual review |

---

## 🔍 User Detail View

### **Information Displayed**
1. Profile Info (username, email, join date)
2. Trust Status (score, level, bot probability)
3. Flags (all active flags)
4. 7-Layer Verification:
   - Device Fingerprint ✅/❌
   - IP Intelligence ✅/❌
   - Email Verified ✅/❌
   - Phone Verified ✅/❌
   - CAPTCHA Passed ✅/❌
5. Event History (last 50 events)

### **Available Actions**
- ✅ Verify User
- 🚩 Flag User
- 🚫 Block User
- ✅ Unblock User

---

## 🎨 Verification Level Colors

```css
new          → Gray
unverified   → Red
basic        → Yellow
verified     → Green
trusted      → Blue
highly_trusted → Purple
blocked      → Dark Red
```

---

## 📊 Export Functionality

### **Suspicious Activity CSV**
```javascript
// Exports: username, email, trust_score, bot_probability,
//          verification_level, flags
// Filename: suspicious_activity_[timestamp].csv
```

### **Verification Events CSV**
```javascript
// Exports: event_id, user_id, event_type, event_data,
//          created_at, username
// Filename: verification_events_[timestamp].csv
```

---

## ⚡ Real-time Updates

### **Events Subscription**
```javascript
// Channel: 'admin-events'
// Table: 'verification_events'
// Event: INSERT
// Updates: Events feed
```

### **Activity Subscription**
```javascript
// Channel: 'admin-suspicious'
// Table: 'trust_verification_status'
// Filter: bot_probability >= 0.5
// Updates: Suspicious activity list
```

---

## 🔐 Security

### **Access Control**
```javascript
// Check in component:
- User must be logged in
- Profile query for role/is_admin
- Non-admins redirected

// Database RLS:
- Policies enforce admin-only access
- All queries filtered by auth.uid()
```

---

## 💡 Tips & Best Practices

### **For Monitoring**
1. Check statistics cards daily
2. Review suspicious activity regularly
3. Monitor event feed for unusual patterns
4. Keep IP blocklist updated

### **For User Management**
1. Always review user details before blocking
2. Provide clear reasons for flags/blocks
3. Document decisions in event logs
4. Use verify action for false positives

### **For System Health**
1. Monitor pending reviews count
2. Track bot detection rate trends
3. Review blocked IPs periodically
4. Export data for analysis

---

## 🐛 Troubleshooting

### **Issue: Access Denied**
```
Solution: Check user profile has role='admin' or is_admin=true
```

### **Issue: No Data Loading**
```
Solution: Verify database tables exist and RLS policies allow admin access
```

### **Issue: Real-time Not Working**
```
Solution: Check Supabase connection and channel subscriptions
```

### **Issue: Charts Not Displaying**
```
Solution: Ensure chart.js and react-chartjs-2 are installed
```

### **Issue: Export Not Working**
```
Solution: Check browser allows file downloads
```

---

## 📋 Database Tables

### **Required Tables**
```sql
- profiles (id, username, email, role, is_admin)
- trust_verification_status (user_id, trust_score, verification_level, etc.)
- verification_events (id, user_id, event_type, event_data, created_at)
- user_identity_verification (user_id, device_fingerprint, etc.)
- blocked_ips (id, ip_address, reason, blocked_by, created_at)
```

---

## 🎯 Common Workflows

### **Workflow 1: Investigate Suspicious User**
```
1. Click "Suspicious Activity" tab
2. Find user in table
3. Click 👁️ (View Details)
4. Review all verification data
5. Check event history
6. Take appropriate action (Flag/Block)
```

### **Workflow 2: Verify Legitimate User**
```
1. Click "User Search" tab
2. Search by email/username
3. Click "View Details"
4. Confirm user is legitimate
5. Click "✅ Verify User"
6. User unlocked for full access
```

### **Workflow 3: Block Malicious IP**
```
1. Click "IP Blocklist" tab
2. Enter IP address
3. Enter reason
4. Click "Block IP"
5. Future signups prevented
```

### **Workflow 4: Export Activity Report**
```
1. Navigate to desired tab
2. Click "Export CSV" button
3. File downloads automatically
4. Open in spreadsheet app
5. Analyze data
```

---

## 📱 Responsive Design

### **Desktop (> 768px)**
- Full grid layout
- Multiple columns
- Side-by-side charts

### **Tablet (768px)**
- Adjusted columns
- Stacked sections
- Scrollable tables

### **Mobile (< 768px)**
- Single column
- Stacked cards
- Full-width buttons
- Scrollable tabs

---

## 🎨 UI Components

### **Buttons**
```css
.btn-primary   → Blue (Main actions)
.btn-secondary → Gray (Secondary actions)
.btn-refresh   → Blue (Refresh all)
.btn-action    → Contextual (View/Flag/Block)
```

### **Badges**
```css
.level-badge   → Colored by verification level
.admin-badge   → Yellow (Admin indicator)
```

### **Cards**
```css
.stat-card     → White background, shadow
.stat-card.alert → Red left border
```

---

## 📊 Chart Configuration

### **Bar Chart**
```javascript
// Trust Score Distribution
// X-axis: Score ranges (0-20, 21-40, etc.)
// Y-axis: User count
// Colors: Red to Green gradient
```

### **Pie Chart**
```javascript
// Verification Levels
// Segments: Each verification level
// Legend: Right side
// Colors: Level-based colors
```

---

## 🔧 Customization

### **To Modify Statistics**
```javascript
// Edit loadStatistics() function
// Add/remove metrics as needed
```

### **To Add New Tab**
```javascript
// 1. Add tab button in dashboard-tabs
// 2. Add content in conditional rendering
// 3. Add state for data
// 4. Add load function
```

### **To Change Chart Types**
```javascript
// Import different Chart.js components
// Update render in JSX
// Adjust data format
```

---

## 🎉 Success Indicators

### **System is Working When:**
✅ Statistics cards show real numbers  
✅ Charts display data  
✅ Suspicious activity updates  
✅ Events feed shows new events  
✅ User search returns results  
✅ Admin actions work  
✅ Export downloads files  
✅ Real-time updates occur  

---

## 📖 Related Docs

- **Component:** `src/pages/TrustShieldAdminDashboard.js`
- **Styles:** `src/pages/TrustShieldAdminDashboard.css`
- **Completion:** `🎉-TRUST-SHIELD-ADMIN-DASHBOARD-COMPLETE.md`
- **System:** `TRUST-SHIELD-MASTER-INDEX.md`

---

**Last Updated:** ${new Date().toISOString()}  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

---

## 🚀 Quick Commands

```bash
# Install dependencies
npm install chart.js react-chartjs-2

# Access dashboard
Navigate to: /admin/trust-shield

# Refresh all data
Click: 🔄 Refresh All button
```

**Ready to monitor your Trust Shield system!** 🛡️
