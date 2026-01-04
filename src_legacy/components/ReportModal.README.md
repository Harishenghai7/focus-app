# ReportModal Component Documentation

## Overview
The `ReportModal` is a comprehensive modal component for reporting inappropriate content, users, or other violations within the Focus app. It features radio button selection for report reasons, an optional details textarea, and a thank you message after submission.

## Features ✨

### Core Features
- ✅ **Radio Button Selection** - Clear, accessible reason selection
- ✅ **10 Report Reasons** - Comprehensive list of violation types
- ✅ **Additional Details** - Optional textarea for context (1000 char limit)
- ✅ **Submit Button** - Validates selection before submission
- ✅ **Thank You Message** - Confirmation screen after successful report
- ✅ **Auto-Close** - Modal closes automatically after 2.5 seconds
- ✅ **Loading States** - Visual feedback during submission
- ✅ **Error Handling** - User-friendly error messages

### UI/UX Features
- 🎨 **Modern Design** - Clean, professional interface
- 📱 **Fully Responsive** - Mobile-first design
- ♿ **Accessible** - ARIA labels, keyboard navigation, focus states
- 🌙 **Dark Mode** - Automatic theme support
- ✨ **Smooth Animations** - Framer Motion transitions
- 🎯 **Visual Feedback** - Hover states, active states, disabled states

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `contentType` | `string` | ✅ | Type of content being reported (e.g., 'post', 'comment', 'user') |
| `contentId` | `string` | ✅ | Unique identifier of the content being reported |
| `onClose` | `function` | ✅ | Callback function to close the modal |

## Report Reasons

The modal includes 10 predefined report reasons:

1. **Spam** - Repetitive or irrelevant content
2. **Harassment** - Bullying or targeting individuals
3. **False Information** - Misleading or fake content
4. **Hate Speech** - Discriminatory or offensive language
5. **Violence** - Threatening or dangerous content
6. **Inappropriate Content** - Adult or explicit material
7. **Copyright Violation** - Unauthorized use of content
8. **Self-Harm** - Content promoting harm to oneself
9. **Scam or Fraud** - Deceptive or fraudulent activity
10. **Other** - Something else

## Usage Examples

### Basic Usage
```jsx
import ReportModal from './components/ReportModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>Report</button>
      
      {showModal && (
        <ReportModal
          contentType="post"
          contentId="post-123"
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
```

### With Framer Motion
```jsx
import { AnimatePresence } from 'framer-motion';
import ReportModal from './components/ReportModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>Report</button>
      
      <AnimatePresence>
        {showModal && (
          <ReportModal
            contentType="comment"
            contentId="comment-456"
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
```

### In a Dropdown Menu
```jsx
function PostMenu({ postId }) {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <>
      <div className="menu">
        <button onClick={() => setShowReportModal(true)}>
          🚩 Report Post
        </button>
      </div>

      {showReportModal && (
        <ReportModal
          contentType="post"
          contentId={postId}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}
```

## Component States

### 1. Default State
- Modal displays with all report reasons
- Submit button is disabled until a reason is selected
- Textarea is optional and has character counter

### 2. Submitting State
- Submit button shows spinner and "Submitting..." text
- All form inputs are disabled
- Close button is disabled

### 3. Success State
- Thank you message with success icon
- Confirmation text
- Auto-closes after 2.5 seconds

### 4. Error State
- Alert message displays error
- Form remains open for retry
- Submit button re-enables

## Database Integration

The component submits reports to the `reports` table with the following structure:

```sql
{
  reporter_id: string,      -- Current user's ID
  reported_type: string,    -- contentType prop
  reported_id: string,      -- contentId prop
  reason: string,           -- Selected reason ID
  description: string|null, -- Optional details
  status: 'pending',        -- Default status
  created_at: timestamp     -- Submission time
}
```

## Styling

The component uses CSS modules (`ReportModal.module.css`) with the following features:

- **CSS Variables** - Theming support via tokens
- **Flexbox Layout** - Modern, flexible layouts
- **Smooth Transitions** - 0.2s transitions on interactive elements
- **Custom Radio Buttons** - Styled radio indicators
- **Responsive Breakpoints** - Mobile optimization at 640px
- **Dark Mode Support** - `prefers-color-scheme: dark` media query
- **Reduced Motion** - Respects `prefers-reduced-motion`

### Key CSS Classes
- `.modalOverlay` - Backdrop with blur effect
- `.reportModal` - Modal container
- `.radioLabel` - Radio button option
- `.radioLabel.selected` - Selected radio state
- `.thankYouContainer` - Success message layout
- `.spinner` - Loading animation

## Accessibility Features

- ✅ **ARIA Labels** - All interactive elements labeled
- ✅ **Role Attributes** - `role="dialog"` and `aria-modal="true"`
- ✅ **Focus Management** - Focus trapped within modal
- ✅ **Keyboard Navigation** - Tab, Enter, Escape support
- ✅ **Screen Reader Support** - Descriptive labels and hints
- ✅ **Focus Visible States** - Clear outline on focus
- ✅ **Disabled States** - Proper disabled attribute usage

## Browser Support

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Includes vendor prefixes for compatibility:
  - `-webkit-backdrop-filter` for Safari
  - `-webkit-sticky` for iOS Safari

## Dependencies

- `react` - Core React library
- `prop-types` - Runtime type checking
- `framer-motion` - Animation library
- `supabase` - Database client

## Performance Considerations

- ✅ **React.memo** - Component memoized to prevent unnecessary re-renders
- ✅ **Event Delegation** - Efficient event handling
- ✅ **Lazy Rendering** - Modal only renders when visible
- ✅ **Auto-cleanup** - Timeout cleared on unmount

## Security Features

- ✅ **User Authentication** - Verifies logged-in user
- ✅ **Input Sanitization** - Trims whitespace from details
- ✅ **Max Length Limits** - 1000 character limit on details
- ✅ **XSS Protection** - React's built-in escaping

## Testing Checklist

### Functional Tests
- [ ] Can select each report reason
- [ ] Can submit report with just a reason
- [ ] Can submit report with reason + details
- [ ] Cannot submit without selecting a reason
- [ ] Character counter updates correctly
- [ ] Thank you message displays after submission
- [ ] Modal closes automatically after success
- [ ] Cancel button closes modal
- [ ] Close (X) button closes modal
- [ ] Clicking overlay closes modal

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader announces all elements
- [ ] Focus trap works correctly
- [ ] Escape key closes modal
- [ ] Focus returns after close

### Visual Tests
- [ ] Displays correctly on mobile
- [ ] Displays correctly on tablet
- [ ] Displays correctly on desktop
- [ ] Dark mode styles apply correctly
- [ ] Animations play smoothly
- [ ] Hover states work on all buttons

### Error Tests
- [ ] Shows error if not logged in
- [ ] Shows error if submission fails
- [ ] Form remains functional after error
- [ ] Error messages are clear

## Customization

### Changing Report Reasons
Edit the `reportReasons` array in the component:

```javascript
const reportReasons = [
  { id: 'custom', label: 'Custom Reason', description: 'Your description' },
  // Add more reasons...
];
```

### Adjusting Auto-Close Time
Change the timeout value in `handleSubmit`:

```javascript
setTimeout(() => {
  onClose();
}, 3000); // 3 seconds instead of 2.5
```

### Styling Customization
Override CSS variables in `tokens.css` or modify `ReportModal.module.css` directly.

## Best Practices

1. **Always use with AnimatePresence** for smooth animations
2. **Provide specific contentType** values for better tracking
3. **Ensure contentId is unique** and valid
4. **Handle onClose properly** to prevent memory leaks
5. **Test across different screen sizes**
6. **Consider user flow** - where does user return after reporting?

## Future Enhancements

Potential improvements for future versions:

- [ ] Add image/screenshot upload capability
- [ ] Include report history for users
- [ ] Add severity levels to reports
- [ ] Implement report tracking/status
- [ ] Add batch reporting for multiple items
- [ ] Include auto-block option after reporting
- [ ] Add report analytics dashboard
- [ ] Implement report appeal system

## Support

For issues or questions about this component, please:
1. Check the usage examples above
2. Review the accessibility checklist
3. Test with different props and content types
4. Refer to the Framer Motion documentation for animation customization

---

**Last Updated:** November 16, 2025  
**Version:** 2.0.0  
**Component Type:** Modal Dialog  
**Status:** Production Ready ✅
