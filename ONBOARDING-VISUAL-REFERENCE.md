# Onboarding Component - Quick Visual Reference

## 🎨 Component Preview

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 Focus                                          [Skip]     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│              ①  ②  ③  ④  ⑤                                   │
│         ████████████░░░░░░░░░░                                │
│              Step 1 of 5                                      │
│                                                               │
│                    👋                                         │
│                                                               │
│              Welcome to Focus                                 │
│        Your social network for productivity                   │
│                                                               │
│   Focus helps you connect with like-minded individuals,       │
│   share your progress, and stay motivated on your journey.    │
│                                                               │
│                                                               │
│  [← Previous]                              [Next →]           │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Screen Layouts

### Step 1: Welcome 👋
```
┌─────────────────────────┐
│      Logo    [Skip]     │
├─────────────────────────┤
│    Progress Bar         │
├─────────────────────────┤
│                         │
│          👋             │
│                         │
│   Welcome to Focus      │
│   Your social network   │
│                         │
│   Description text...   │
│                         │
├─────────────────────────┤
│              [Next →]   │
└─────────────────────────┘
```

### Step 2: Profile Setup 👤
```
┌─────────────────────────┐
│      Logo    [Skip]     │
├─────────────────────────┤
│    Progress Bar         │
├─────────────────────────┤
│          👤             │
│                         │
│  Complete Your Profile  │
│                         │
│  ┌────────────────────┐ │
│  │ ✅ Profile Picture │ │
│  │ ✅ Full Name       │ │
│  │ ⭕ Bio             │ │
│  └────────────────────┘ │
│                         │
│  [Complete Profile]     │
│                         │
├─────────────────────────┤
│ [← Previous] [Next →]   │
└─────────────────────────┘
```

### Step 3: Follow Users 🔍
```
┌─────────────────────────┐
│      Logo    [Skip]     │
├─────────────────────────┤
│    Progress Bar         │
├─────────────────────────┤
│          🔍             │
│                         │
│  Follow Your Interests  │
│                         │
│  ┌────────────────────┐ │
│  │ 👤 John Doe        │ │
│  │    @johndoe        │ │
│  │         [Follow]   │ │
│  ├────────────────────┤ │
│  │ 👤 Jane Smith      │ │
│  │    @janesmith      │ │
│  │         [Follow]   │ │
│  └────────────────────┘ │
│                         │
│  ✅ Following 2 users   │
│                         │
├─────────────────────────┤
│ [← Previous] [Next →]   │
└─────────────────────────┘
```

### Step 4: Features Preview ✍️
```
┌─────────────────────────┐
│      Logo    [Skip]     │
├─────────────────────────┤
│    Progress Bar         │
├─────────────────────────┤
│          ✍️             │
│                         │
│  Share Your Journey     │
│                         │
│  ┌────────────────────┐ │
│  │ 📝 Create Posts    │ │
│  │   Share updates    │ │
│  ├────────────────────┤ │
│  │ 💬 Engage          │ │
│  │   Comment & react  │ │
│  ├────────────────────┤ │
│  │ 🔔 Stay Updated    │ │
│  │   Get notified     │ │
│  └────────────────────┘ │
│                         │
├─────────────────────────┤
│ [← Previous] [Next →]   │
└─────────────────────────┘
```

### Step 5: Completion 🎉
```
┌─────────────────────────┐
│      Logo               │
├─────────────────────────┤
│    Progress Bar ████    │
├─────────────────────────┤
│          🎉             │
│                         │
│   You're All Set!       │
│   Start your journey    │
│                         │
│  ┌──────────────────┐   │
│  │ 👤 Profile       │   │
│  │    Complete ✅   │   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │ 👥 Following     │   │
│  │    2 users       │   │
│  └──────────────────┘   │
│                         │
├─────────────────────────┤
│  [← Previous]           │
│         [Get Started →] │
└─────────────────────────┘
```

## 🎨 Color Palette

### Primary Colors
```css
Background Gradient:  #667eea → #764ba2 (Purple)
Text:                 #FFFFFF (White)
Accent:               rgba(255, 255, 255, 0.1-0.3)
```

### Status Colors
```css
Success:  rgba(76, 175, 80, 0.3)    /* Green */
Warning:  rgba(255, 193, 7, 0.3)    /* Yellow */
Info:     rgba(33, 150, 243, 0.3)   /* Blue */
```

### Glass Effects
```css
Glass Background:  rgba(255, 255, 255, 0.15)
Border:            rgba(255, 255, 255, 0.2)
Backdrop:          blur(10px)
```

## 📐 Layout Measurements

### Desktop
```
Container:        max-width: 700px
Icon:             5rem (80px)
Title:            2.5rem (40px)
Subtitle:         1.3rem (20.8px)
Description:      1.1rem (17.6px)
```

### Mobile
```
Container:        100% width
Icon:             3rem (48px)
Title:            1.5rem (24px)
Subtitle:         1rem (16px)
Description:      0.95rem (15.2px)
```

### Spacing
```
Header Padding:       1.5rem (24px)
Content Padding:      2rem (32px)
Footer Padding:       2rem (32px)
Step Gap:             2rem (32px)
Element Gap:          1rem (16px)
```

## 🎭 Interactive States

### Progress Dots
```
Default:    ⭕ rgba(255, 255, 255, 0.2)
Active:     ① white, scaled 1.1x, shadow
Completed:  ✓ white with checkmark
```

### Buttons
```
Primary:
  Normal:   White background, purple text
  Hover:    Elevated (-2px), stronger shadow
  Disabled: 60% opacity

Secondary:
  Normal:   Translucent white
  Hover:    More opaque, elevated
  Disabled: 30% opacity
```

### Cards
```
Glass Card:
  Background:  rgba(255, 255, 255, 0.15)
  Border:      rgba(255, 255, 255, 0.2)
  Blur:        10px
  Hover:       Slight elevation/translation
```

## 🎬 Animation Timeline

### Page Load (0.5s)
```
0.0s: Start fadeInUp animation
0.5s: Complete opacity and position
```

### Step Change (0.5s)
```
0.0s: Fade out old content
0.2s: Update step number
0.3s: Fade in new content
0.5s: Complete animation
```

### Icon Entry (0.6s)
```
0.0s: Scale 0.3, opacity 0
0.3s: Scale 1.05, opacity 1
0.4s: Scale 0.9
0.6s: Scale 1 (rest position)
```

### Progress Bar (0.4s)
```
Width animates from X% to Y%
Smooth ease transition
```

## 🔢 Component Hierarchy

```
Onboarding
├── Layout (layoutType="fullscreen")
│   └── .onboarding
│       ├── .onboarding-header
│       │   ├── .onboarding-logo
│       │   └── .btn-skip
│       │
│       ├── StepIndicator
│       │   ├── .step-dots
│       │   │   └── .step-dot (x5)
│       │   ├── .step-progress
│       │   │   └── .step-progress-bar
│       │   └── .step-counter
│       │
│       ├── .onboarding-content
│       │   └── .step-container
│       │       ├── .step-icon
│       │       ├── .step-title
│       │       ├── .step-subtitle
│       │       ├── .step-description
│       │       └── .step-action-content
│       │           ├── [Step 2] .profile-completion
│       │           │   ├── .completion-status
│       │           │   ├── .profile-checklist
│       │           │   │   └── ChecklistItem (x3)
│       │           │   └── button.btn-action
│       │           │
│       │           ├── [Step 3] .follow-users-section
│       │           │   ├── SuggestedUsers
│       │           │   └── .follow-success
│       │           │
│       │           ├── [Step 4] .feature-preview
│       │           │   └── .feature-list
│       │           │       └── FeatureItem (x3)
│       │           │
│       │           └── [Step 5] .completion-summary
│       │               └── .summary-stats
│       │                   └── SummaryStat (x2)
│       │
│       └── .onboarding-footer
│           ├── button.btn-secondary (Previous)
│           └── button.btn-primary (Next/Complete)
```

## 📊 Data Flow

```
User Props → Component State → UI Display
     ↓              ↓              ↓
 user.id      currentStep      Step Content
 profile      profileComplete  Checklist
              followedUsers    Follow Count
              isCompleting     Button State
                   ↓
            Database Updates
                   ↓
         Navigation to Home
```

## 🔄 State Transitions

```
currentStep Flow:
1 → 2 → 3 → 4 → 5 → Complete → Home

Skip:
Any Step → Home

Back:
2 ← 3 ← 4 ← 5
(Cannot go back from Step 1)

Profile Edit:
Step 2 → Edit Profile → Step 2

Already Complete:
Entry → Auto-redirect → Home
```

## 🎯 Key Interaction Points

### User Actions
1. **Click Next** → Advance step
2. **Click Previous** → Go back
3. **Click Skip** → Exit to home
4. **Click Complete Profile** → Navigate to edit
5. **Click Follow** → Follow user
6. **Click View Profile** → View user profile
7. **Click Get Started** → Complete onboarding

### System Responses
1. **Update progress bar**
2. **Change step content**
3. **Update database**
4. **Show feedback**
5. **Navigate routes**
6. **Update counts**
7. **Save state**

## 📱 Responsive Behavior

```
Desktop (>768px):
  Layout:      Two-column capable
  Font:        Large (2.5rem title)
  Spacing:     Generous (2rem)
  Buttons:     Side by side

Tablet (≤768px):
  Layout:      Single column
  Font:        Medium (1.8rem title)
  Spacing:     Moderate (1.5rem)
  Buttons:     Side by side

Mobile (≤480px):
  Layout:      Compact single column
  Font:        Small (1.5rem title)
  Spacing:     Tight (1rem)
  Buttons:     Full width stacked
```

## 🎨 CSS Custom Properties (Potential Enhancement)

```css
:root {
  --onboarding-gradient-start: #667eea;
  --onboarding-gradient-end: #764ba2;
  --onboarding-text: #ffffff;
  --onboarding-glass: rgba(255, 255, 255, 0.15);
  --onboarding-border: rgba(255, 255, 255, 0.2);
  --onboarding-blur: blur(10px);
  --onboarding-success: rgba(76, 175, 80, 0.3);
  --onboarding-warning: rgba(255, 193, 7, 0.3);
  --onboarding-info: rgba(33, 150, 243, 0.3);
}
```

---

## 🎉 Visual Summary

**The Onboarding component provides a stunning, full-screen wizard experience with:**

✨ Beautiful purple gradient background
🎨 Modern glass-morphism effects
📊 Clear progress visualization
🔄 Smooth animations throughout
📱 Fully responsive design
♿ Accessible and keyboard-friendly
🎯 Engaging and intuitive UI

**Perfect for welcoming new users to Focus!** 🚀

---

**Created**: November 2025
**Purpose**: Visual reference for developers and designers
**Status**: ✅ Complete
