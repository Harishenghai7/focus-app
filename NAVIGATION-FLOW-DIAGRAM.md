# 🗺️ Focus App - Navigation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FOCUS APP NAVIGATION                               │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────┐
                              │   AUTH   │
                              │ /auth    │
                              └─────┬────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────────────┐
        │                    MAIN NAVIGATION                         │
        │  (Header & Bottom Nav - Always Visible)                   │
        └───────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────────┐
        │                           │                               │
        ▼                           ▼                               ▼
   ┌─────────┐                ┌─────────┐                    ┌──────────┐
   │  HOME   │                │ EXPLORE │                    │  CREATE  │
   │ /home   │                │/explore │                    │ /create  │
   └────┬────┘                └────┬────┘                    └─────┬────┘
        │                          │                               │
        ├──────────────┐           ├──────────┐                   │
        │              │           │          │                   ▼
        ▼              ▼           ▼          ▼          ┌──────────────────┐
  ┌──────────┐   ┌─────────┐  ┌────────┐ ┌─────────┐  │ CreateMultiType  │
  │PostDetail│   │ Profile │  │PostDet │ │Hashtag  │  │   (Advanced)     │
  │/post/:id │   │/profile/│  │/post/  │ │/hashtag/│  └──────────────────┘
  └────┬─────┘   │:user    │  │:id     │ │:tag     │
       │         └────┬────┘  └────────┘ └─────────┘
       ▼              │
  ┌──────────┐       ├────────────┬─────────────┬──────────┐
  │ Comments │       │            │             │          │
  │ (Modal)  │       ▼            ▼             ▼          ▼
  └──────────┘  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌────────┐
                │Followers│ │Following │ │  Edit   │ │ Saved  │
                │/profile/│ │/profile/ │ │Profile  │ │/saved  │
                │:user/   │ │:user/    │ │/edit-   │ └────────┘
                │followers│ │following │ │profile  │
                └─────────┘ └──────────┘ └─────────┘


        │                           │                               │
        ▼                           ▼                               ▼
   ┌─────────┐              ┌──────────────┐              ┌─────────────┐
   │MESSAGES │              │NOTIFICATIONS │              │  PROFILE    │
   │/messages│              │/notifications│              │/profile/    │
   └────┬────┘              └──────┬───────┘              │:username    │
        │                          │                      └──────┬──────┘
        ├──────────┐               ▼                             │
        │          │        ┌──────────────┐                     │
        ▼          ▼        │FollowRequests│          ┌──────────┼─────────┬────────┐
  ┌──────────┐ ┌──────┐    │/follow-      │          │          │         │        │
  │ChatThread│ │Group │    │requests      │          ▼          ▼         ▼        ▼
  │/messages/│ │Chat  │    └──────────────┘    ┌─────────┐┌─────────┐┌─────┐┌────────┐
  │:chatId   │ │/group│                        │Followers││Following││Edit ││Archive │
  └──────────┘ │/:id  │                        └─────────┘└─────────┘│Pro  ││/archive│
               └───┬──┘                                              │file │└────────┘
                   │                                                 └─────┘
                   ▼
            ┌──────────────┐
            │GroupSettings │
            │ (Modal/Page) │
            └──────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          FEATURE PAGES                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────┐     ┌──────────┐     ┌────────┐     ┌───────────┐     ┌──────┐
│  BOLTZ  │────▶│BoltzDetail│    │ FLASH  │    │ HIGHLIGHTS│────▶│View  │
│ /boltz  │     │/boltz/:id│     │/flash  │     │/highlights│     │/high │
└─────────┘     └──────────┘     └────────┘     └───────────┘     │light/│
                                                                   │:id   │
                                                                   └──────┘

┌─────────┐     ┌──────────┐     ┌─────────┐    ┌──────────┐
│  CALLS  │────▶│   CALL   │     │ANALYTICS│    │  PEOPLE  │
│ /calls  │     │/call/:id │     │/analytics│    │ /people  │
└─────────┘     └──────────┘     └─────────┘    └──────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          SETTINGS & ADMIN                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐
│ SETTINGS │
│/settings │
└────┬─────┘
     │
     ├────────────────┬────────────────┬──────────────┐
     │                │                │              │
     ▼                ▼                ▼              ▼
┌──────────┐   ┌─────────────┐  ┌─────────┐   ┌──────────┐
│ Blocked  │   │CloseFriends │  │  Edit   │   │ Account  │
│  Users   │   │/close-      │  │ Profile │   │ Settings │
│/blocked- │   │friends      │  └─────────┘   │ (Section)│
│users     │   └─────────────┘                 └──────────┘
└──────────┘

┌──────────────┐
│    ADMIN     │
│   /admin     │
│ (Admin Only) │
└──────────────┘


═══════════════════════════════════════════════════════════════════════════════

NAVIGATION PATTERNS:
═══════════════════════════════════════════════════════════════════════════════

1. CLICK USERNAME/AVATAR ────▶ Profile Page (/profile/:username)

2. CLICK POST ────▶ Post Detail (/post/:id) ────▶ Comments/Likes

3. CLICK HASHTAG ────▶ Hashtag Page (/hashtag/:tag)

4. CLICK FOLLOWERS COUNT ────▶ Followers List (/profile/:user/followers)

5. CLICK FOLLOWING COUNT ────▶ Following List (/profile/:user/following)

6. CLICK CONVERSATION ────▶ Chat Thread (/messages/:chatId)

7. CLICK NOTIFICATION ────▶ Relevant Page (Profile/Post/Messages)

8. CLICK EDIT PROFILE ────▶ Edit Profile Page (/edit-profile)

9. CLICK BACK BUTTON ────▶ Previous Page (navigate(-1))


═══════════════════════════════════════════════════════════════════════════════

ROUTE GROUPS:
═══════════════════════════════════════════════════════════════════════════════

📱 MAIN PAGES (6)
   /home, /explore, /create, /messages, /notifications, /profile

👤 PROFILE SUB-PAGES (6)
   /edit-profile, /profile/:user/edit, /profile/:user/followers,
   /profile/:user/following, /saved, /archive

💬 MESSAGES SUB-PAGES (3)
   /messages/:chatId, /chat/:userId, /group/:groupId

🔍 EXPLORE SUB-PAGES (4)
   /post/:postId, /hashtag/:hashtag, /search, /trending

🔔 NOTIFICATIONS SUB-PAGES (1)
   /follow-requests

⚙️  SETTINGS SUB-PAGES (3)
   /settings, /blocked-users, /close-friends

⚡ FEATURE PAGES (10)
   /boltz, /boltz/:id, /flash, /highlights, /highlight/:id,
   /calls, /call/:id, /analytics, /people, /invite


═══════════════════════════════════════════════════════════════════════════════

NAVIGATION FLOW EXAMPLES:
═══════════════════════════════════════════════════════════════════════════════

Example 1: View Someone's Followers
────────────────────────────────────
Home → Click Username → Profile → Click "123 followers" → Followers List
/home     (username)   /profile/   (count click)        /profile/:user/
                       :user                             followers


Example 2: Comment on Post
───────────────────────────
Home → Click Post → Post Detail → Click Comment Icon → Comment Section
/home   (post)     /post/:id     (comment)            (in PostDetail)


Example 3: Start New Chat
──────────────────────────
Messages → Search User → Click Result → Chat Thread
/messages  (search)      (click user)   /messages/:chatId


Example 4: Edit Own Profile
────────────────────────────
Profile → Click "Edit Profile" → Edit Profile Page
/profile                         /edit-profile


Example 5: Browse Hashtag
──────────────────────────
Explore → Click "#trending" → Hashtag Page → Click Post → Post Detail
/explore  (hashtag)          /hashtag/       (post)     /post/:id
                            trending


═══════════════════════════════════════════════════════════════════════════════

SPECIAL NAVIGATION CASES:
═══════════════════════════════════════════════════════════════════════════════

🔐 AUTH FLOW:
   Not Authenticated → /auth → Authenticate → /home

📧 DEEP LINKS:
   Share Link → Direct URL → Page Loads → (Auth check) → Show Page

🔙 BACK NAVIGATION:
   Current Page → Click Back → Previous Page (via browser history)

🚫 404 HANDLING:
   Unknown Route → Catch-all → Redirect to /home (or /auth)

🔒 PROTECTED ROUTES:
   Not Logged In → Any Protected Route → Redirect to /auth


═══════════════════════════════════════════════════════════════════════════════

MOBILE vs DESKTOP NAVIGATION:
═══════════════════════════════════════════════════════════════════════════════

Mobile (Bottom Nav):          Desktop (Header):
────────────────────          ────────────────
🏠 Home                       Logo | Home | Explore | Create | 🔔 | 💬 | 👤
🔍 Explore                    
➕ Create                     
🔔 Notifications              
👤 Profile                    


═══════════════════════════════════════════════════════════════════════════════
```

**Legend:**
- `│ ├ └ ┌ ┐ ┘ ┴ ┬` = Structure lines
- `▶ ▼` = Navigation direction
- `────` = Connection/Flow
- `█` = Active/Current page

**Color Coding (conceptual):**
- Main Pages: Blue
- Sub-pages: Green
- Feature Pages: Orange
- Settings/Admin: Red
- Modals: Purple

**Last Updated:** November 16, 2025
