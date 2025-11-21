# Onboarding Component

## Overview
The **Onboarding** component provides a comprehensive welcome experience for new users with a beautiful 5-step wizard that guides them through profile setup and initial actions.

## Features

### ✨ Core Features
- **Welcome Screen** - Attractive landing screen with app introduction
- **5-Step Wizard** - Progressive onboarding flow
- **Progress Indicator** - Visual progress tracking with dots and progress bar
- **Skip Option** - Allow users to skip onboarding
- **Profile Completion** - Interactive checklist for profile setup
- **Find Friends** - Suggested users to follow
- **Responsive Design** - Full-screen wizard layout optimized for all devices
- **Beautiful Animations** - Smooth transitions and engaging animations

## Component Structure

### Main Component
```javascript
Onboarding({ user, userProfile })
```

### Sub-Components
1. **StepIndicator** - Progress visualization with dots and bar
2. **ChecklistItem** - Profile completion checklist items
3. **FeatureItem** - Feature preview cards
4. **SummaryStat** - Summary statistics display

### Imported Components
- **Layout** - Full-screen layout wrapper
- **SuggestedUsers** - User recommendation widget

## The 5 Steps

### Step 1: Welcome 👋
- Introduction to Focus app
- Overview of platform benefits
- Engaging welcome message

### Step 2: Complete Profile 👤
- Interactive profile completion checklist
  - ✅ Add profile picture
  - ✅ Add full name
  - ✅ Write bio
- Direct link to edit profile page
- Completion status indicator

### Step 3: Follow Interests 🔍
- Integrated SuggestedUsers component
- Follow recommended users
- Real-time follow count tracking
- Success feedback

### Step 4: Share Journey ✍️
- Feature preview cards:
  - Create posts
  - Engage with comments
  - Stay updated with notifications
- Educates users about platform features

### Step 5: You're All Set! 🎉
- Completion summary with stats
- Profile completion status
- Following count
- Get Started button

## Usage

### Basic Implementation
```javascript
import Onboarding from './pages/Onboarding';

function App() {
  return (
    <Onboarding 
      user={currentUser} 
      userProfile={userProfile} 
    />
  );
}
```

### With Routing
```javascript
<Route 
  path="/onboarding" 
  element={
    <Onboarding 
      user={user} 
      userProfile={userProfile} 
    />
  } 
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `user` | Object | Yes | Current authenticated user object with `id` |
| `userProfile` | Object | Yes | User profile data including avatar, bio, full_name |

### UserProfile Expected Fields
```javascript
{
  id: string,
  username: string,
  full_name: string,
  avatar_url: string,
  bio: string,
  onboarding_completed: boolean,
  onboarding_completed_at: timestamp
}
```

## State Management

### Local State
```javascript
const [currentStep, setCurrentStep] = useState(1);
const [profileComplete, setProfileComplete] = useState(false);
const [followedUsers, setFollowedUsers] = useState([]);
const [isCompleting, setIsCompleting] = useState(false);
```

## Database Integration

### Tables Used
1. **profiles** - User profile data and onboarding status
2. **follows** - User follow relationships

### Database Operations

#### Mark Onboarding Complete
```javascript
await supabase
  .from('profiles')
  .update({ 
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString()
  })
  .eq('id', user.id);
```

#### Follow User
```javascript
await supabase
  .from('follows')
  .insert({
    follower_id: user.id,
    following_id: userId,
    created_at: new Date().toISOString()
  });
```

#### Update Counts
```javascript
await Promise.all([
  supabase.rpc('increment_following_count', { user_id: user.id }),
  supabase.rpc('increment_followers_count', { user_id: userId })
]);
```

## Navigation Flow

### Entry Points
- New user registration
- Manual onboarding restart

### Exit Points
1. **Skip Button** → Home feed
2. **Complete Button** → Home feed with welcome message
3. **Auto-redirect** → If onboarding already completed

### Navigation During Onboarding
- Step 2 → Edit Profile page (returns to onboarding)
- Step 3 → View user profiles
- Final → Home feed

## Styling

### CSS File
`Onboarding.css` - Comprehensive styling with:
- Gradient background (purple theme)
- Glass-morphism effects
- Smooth animations
- Responsive breakpoints
- Dark mode support
- Safari compatibility

### Key Classes
- `.onboarding` - Main container
- `.onboarding-header` - Top navigation bar
- `.step-indicator` - Progress visualization
- `.onboarding-content` - Main content area
- `.onboarding-footer` - Navigation buttons

### Animations
```css
@keyframes fadeInUp { /* Slide up entrance */ }
@keyframes bounceIn { /* Icon bounce effect */ }
```

## User Interactions

### Navigation Actions
- **Next Button** - Advance to next step
- **Previous Button** - Return to previous step (hidden on step 1)
- **Skip Button** - Skip entire onboarding
- **Get Started** - Complete onboarding (final step)

### Step-Specific Actions
- **Step 2**: Edit Profile button
- **Step 3**: Follow user buttons
- **Step 3**: View profile links

## Accessibility

### Features
- Semantic HTML structure
- ARIA roles (`role="main"`)
- Keyboard navigation support
- Focus management
- Disabled state handling
- Clear visual feedback

### Button States
```javascript
disabled={currentStep === 1}
disabled={isCompleting}
```

## Responsive Design

### Breakpoints
- **Desktop**: Full-size wizard (default)
- **Tablet**: 768px - Adjusted spacing
- **Mobile**: 480px - Compact layout

### Mobile Optimizations
- Smaller icons and text
- Reduced padding
- Single column layouts
- Touch-friendly buttons

## Progress Tracking

### Visual Indicators
1. **Step Dots** - Numbered circles showing all steps
   - Active step: White with scale effect
   - Completed: White with checkmark
   - Upcoming: Translucent

2. **Progress Bar** - Horizontal bar showing completion percentage
3. **Step Counter** - "Step X of 5" text

### Profile Completion
Checks three criteria:
1. Avatar uploaded (`avatar_url`)
2. Full name provided (`full_name`)
3. Bio written (`bio`)

## Performance Considerations

### Optimizations
1. Conditional rendering per step
2. Lazy loading of SuggestedUsers
3. Debounced database operations
4. Efficient state updates

### Loading States
- `isCompleting` - Prevents double-submission
- Database operation feedback
- Disabled states during operations

## Error Handling

### Database Errors
```javascript
try {
  // Database operation
} catch (err) {
  console.error('Error:', err);
  // Continue gracefully
}
```

### Edge Cases
- No user data
- Already completed onboarding
- Network failures
- Invalid user states

## Best Practices

### Implementation
1. ✅ Check onboarding status before showing
2. ✅ Allow skipping for flexibility
3. ✅ Save progress to database
4. ✅ Provide clear visual feedback
5. ✅ Make it engaging but optional

### UX Guidelines
1. Keep steps short and focused
2. Show clear progress indicators
3. Allow easy navigation (back/skip)
4. Celebrate completion
5. Don't block core functionality

## Testing

### Manual Testing Checklist
- [ ] All 5 steps display correctly
- [ ] Progress indicator updates
- [ ] Profile completion detection works
- [ ] Follow users functionality
- [ ] Skip button works
- [ ] Previous/Next navigation
- [ ] Completion marks onboarding done
- [ ] Auto-redirect if already completed
- [ ] Responsive on mobile
- [ ] Animations play smoothly

### Test Scenarios
1. **New User**: Complete full onboarding
2. **Skip**: Skip and verify redirect
3. **Incomplete Profile**: Check profile step
4. **Follow Users**: Follow and verify counts
5. **Return**: Verify already-completed redirect

## Common Issues & Solutions

### Issue: Onboarding shows again after completion
**Solution**: Check `onboarding_completed` flag in database

### Issue: Profile completion not detecting changes
**Solution**: Ensure profile data is fresh and includes all fields

### Issue: Follow not working
**Solution**: Check RPC functions exist in database

### Issue: Animations laggy on mobile
**Solution**: Reduce animation complexity or duration

## Future Enhancements

### Potential Features
- [ ] Save and resume later
- [ ] Personalized step ordering
- [ ] Interactive tutorials
- [ ] Video introductions
- [ ] Gamification badges
- [ ] A/B testing variants
- [ ] Analytics tracking
- [ ] Multi-language support

## Dependencies

### NPM Packages
- `react` - Core React library
- `react-router-dom` - Navigation
- `@supabase/supabase-js` - Database client

### Internal Dependencies
- `Layout` component
- `SuggestedUsers` component
- `supabaseClient` configuration

## File Structure
```
src/
├── pages/
│   ├── Onboarding.js       # Main component
│   └── Onboarding.css      # Styling
└── components/
    ├── Layout/
    │   └── Layout.js       # Layout wrapper
    └── SuggestedUsers.js   # User suggestions
```

## Related Components
- **EditProfile** - Profile editing page
- **Home** - Main feed (post-onboarding)
- **Profile** - User profile pages
- **SuggestedUsers** - Recommendation widget

## Code Examples

### Custom Step Configuration
```javascript
const CUSTOM_STEPS = [
  {
    id: 1,
    title: 'Custom Welcome',
    subtitle: 'Your journey begins',
    description: 'Welcome to our platform',
    icon: '🚀',
    action: 'custom'
  }
];
```

### Profile Completion Logic
```javascript
const isProfileComplete = (profile) => {
  return !!(
    profile.avatar_url &&
    profile.full_name?.trim() &&
    profile.bio?.trim()
  );
};
```

### Follow Handler
```javascript
const handleFollowUser = async (userId) => {
  await supabase.from('follows').insert({
    follower_id: user.id,
    following_id: userId
  });
  setFollowedUsers([...followedUsers, userId]);
};
```

## Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (with -webkit- prefixes)
- Mobile browsers: ✅ Fully responsive

## License
Part of the Focus App project.

---

**Last Updated**: November 2025
**Component Version**: 1.0.0
**Maintained By**: Focus App Team
