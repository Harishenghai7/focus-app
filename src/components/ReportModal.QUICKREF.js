/**
 * 🚀 REPORTMODAL - QUICK REFERENCE
 * ================================
 * 
 * A modern, accessible modal for reporting content violations.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 IMPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import ReportModal from './components/ReportModal';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 BASIC USAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<ReportModal
  contentType="post"      // Type of content: 'post', 'comment', 'user'
  contentId="post-123"    // Unique ID of the content
  onClose={() => {}}      // Close handler function
/>

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 PROPS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

contentType: string     ✅ REQUIRED - 'post', 'comment', 'user', etc.
contentId: string       ✅ REQUIRED - Unique identifier
onClose: function       ✅ REQUIRED - Close handler

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 FEATURES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Radio button selection (10 reasons)
✅ Optional details textarea (1000 chars)
✅ Submit validation
✅ Loading states
✅ Thank you message
✅ Auto-close after success (2.5s)
✅ Error handling
✅ Smooth animations
✅ Fully responsive
✅ Dark mode support
✅ Fully accessible

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚫 REPORT REASONS (10)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

spam              → Repetitive or irrelevant content
harassment        → Bullying or targeting individuals
false-info        → Misleading or fake content
hate-speech       → Discriminatory or offensive language
violence          → Threatening or dangerous content
inappropriate     → Adult or explicit material
copyright         → Unauthorized use of content
self-harm         → Content promoting harm to oneself
scam              → Deceptive or fraudulent activity
other             → Something else

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💡 COMMON PATTERNS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Pattern 1: Simple Toggle
const [show, setShow] = useState(false);
{show && <ReportModal contentType="post" contentId={id} onClose={() => setShow(false)} />}

// Pattern 2: With AnimatePresence
<AnimatePresence>
  {show && <ReportModal contentType="post" contentId={id} onClose={() => setShow(false)} />}
</AnimatePresence>

// Pattern 3: Dropdown Menu
<button onClick={() => setShowReport(true)}>🚩 Report</button>
{showReport && <ReportModal contentType="post" contentId={id} onClose={() => setShowReport(false)} />}

// Pattern 4: Conditional Render
{canReport && (
  <ReportModal contentType="comment" contentId={commentId} onClose={handleClose} />
)}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗄️ DATABASE STRUCTURE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Table: reports
{
  reporter_id: UUID         // Current user ID (auto)
  reported_type: string     // From contentType prop
  reported_id: UUID         // From contentId prop
  reason: string            // Selected reason ID
  description: text|null    // Optional details
  status: string            // 'pending' (default)
  created_at: timestamp     // Auto-generated
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ COMPONENT BEHAVIOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. User clicks "Report" button
2. Modal opens with radio button options
3. User selects a reason (required)
4. User optionally adds details (max 1000 chars)
5. User clicks "Submit Report"
6. Loading state shows (spinner + disabled inputs)
7. Report saved to database
8. Thank you message displays (green checkmark)
9. Modal auto-closes after 2.5 seconds
10. onClose callback fires

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 STYLING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CSS Module: ReportModal.module.css
- Fully responsive (mobile-first)
- Dark mode supported
- CSS variables for theming
- Smooth animations (0.2s transitions)
- Custom radio button styling
- Accessible focus states

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ♿ ACCESSIBILITY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ ARIA labels on all interactive elements
✅ role="dialog" and aria-modal="true"
✅ Keyboard navigation (Tab, Enter, Escape)
✅ Focus management
✅ Screen reader support
✅ High contrast support
✅ Reduced motion support

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 PERFORMANCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ React.memo optimization
✅ Minimal re-renders
✅ Efficient event handling
✅ Hardware-accelerated animations
✅ Lazy rendering (only when shown)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔒 SECURITY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ User authentication check
✅ Input sanitization (trim whitespace)
✅ Max length validation (1000 chars)
✅ XSS protection (React escaping)
✅ SQL injection protection (Supabase)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 RESPONSIVE BREAKPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Desktop  → Max width 540px, centered
Tablet   → Full width with padding
Mobile   → Full width, bottom sheet style
         → Stacked buttons
         → Smaller icons and text

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🐛 ERROR HANDLING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Not logged in       → Alert: "You must be logged in"
✅ Network error       → Alert: "Failed to submit report"
✅ Database error      → Alert: Error message
✅ No reason selected  → Submit button disabled

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 DOCUMENTATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ReportModal.README.md    → Full documentation
ReportModal.example.jsx  → Usage examples
ReportModal.COMPLETE.md  → Implementation summary

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ TESTING CHECKLIST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Can select each reason
□ Can submit with reason only
□ Can submit with reason + details
□ Cannot submit without reason
□ Character counter works
□ Thank you message displays
□ Auto-closes after 2.5s
□ Cancel button works
□ Close button works
□ Overlay click closes
□ Keyboard navigation works
□ Mobile responsive
□ Dark mode works
□ Loading state displays
□ Error handling works

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ COMPLETE AND PRODUCTION READY

Last Updated: November 16, 2025
Version: 2.0.0
