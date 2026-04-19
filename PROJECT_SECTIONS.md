# 🗺️ Focus App — All Major Sections

> **Total: 39 sections** across 11 categories  
> Stack: React (CRA) + Supabase + Royal Lavender Design System

---

## 🔐 Auth & Onboarding

| Section | Route | Description |
|---------|-------|-------------|
| **Auth** | `/auth` | OAuth login — Google, GitHub, Microsoft (no email/password) |
| **Onboarding** | `/onboarding` | New user setup wizard (username, avatar, interests) |
| **Auth callback** | `/auth/callback` | OAuth return handler (Supabase session exchange) |

---

## 📱 Core Social Feed

| Section | Route | Description |
|---------|-------|-------------|
| **Home** | `/home` | Main feed — posts from followed users, stories bar |
| **Explore** | `/explore` | Discovery, trending hashtags, search users/posts |
| **Create** | `/create` | Post creation — photo, video, carousel, text |
| **Profile** | `/profile/:username` | User profile — posts grid, bio, stats, highlights |

---

## 🎬 Content Formats

| Section | Route | Description |
|---------|-------|-------------|
| **Boltz** | `/boltz`, `/boltz/:id` | Short-form vertical videos (TikTok/Reels-style) |
| **Flash** | *(embedded in Home)* | 24-hr disappearing stories (Instagram Stories-style) |

---

## 💬 Communication

| Section | Route | Description |
|---------|-------|-------------|
| **Messages** | `/messages`, `/messages/new/:userId`, `/messages/:conversationId` | WhatsApp-grade DMs, group chats, media sharing |
| **Calls** | `/calls` | Audio & video calls via WebRTC |
| **Notifications** | `/notifications` | Likes, comments, follows, mentions, system alerts |

---

## ⚙️ Settings & Account

| Section | Route | Sub-sections |
|---------|-------|-------------|
| **Settings** | `/settings` | Account, Profile, Appearance, Privacy, Notifications, Sessions & Sign Out, Support, About |
| **Security Center** | `/security` | Account security, trust shield overview |
| **Verification Center** | `/verification-center` | Identity verification hub |
| **Badge Center** | `/badge-center` | Earn & display achievement badges |

---

## ✅ Verification

| Section | Route | Description |
|---------|-------|-------------|
| **Trust Shield verification** | `/verification/trust-shield` | Trust Shield identity / safety flow |
| **Focus ID** | `/verification/focus-id` | Focus ID verification step |
| **Parent Consent** | `/verification/parent-consent` | Teen account parental approval flow |

---

## 👶 TeenCare (Safety for Minors)

| Section | Route | Description |
|---------|-------|-------------|
| **Guardian Dashboard** | `/guardian/dashboard/:teenId` | Parent monitors teen's activity, screen time, contacts |
| **Teen Safety Settings** | *(inside Settings)* | Content filters, screen time limits |
| **Emergency Panic Button** | *(floating global component)* | One-tap SOS alert to guardian |

---

## 🛡️ Trust Shield (Platform Safety System)

| Section | Route / Location | Description |
|---------|-----------------|-------------|
| **Biometric Lock** | *(global gate)* | App-level PIN / biometric lock |
| **Content Moderation** | *(background service)* | AI-powered NSFW & toxicity detection on upload |
| **Report System** | *(contextual — any post/user)* | Report content, users, messages |
| **My Reports** | `/my-reports` | User's own filed reports and their status |
| **Suspicious Activity** | *(background service)* | Device fingerprint-based fraud & bot detection |

---

## 🤖 Focusly AI

| Section | Description |
|---------|-------------|
| **Focusly AI Chat** | Built-in AI assistant (Gemini-powered), accessible from sidebar |
| **AI Voice** | Voice interaction with Focusly AI |
| **AI Memory** | Persistent cross-session context memory |
| **AI Emotions** | Emotion-aware responses based on user sentiment |

---

## 🛠️ Admin Panel *(Admin-only routes)*

| Section | Route | Description |
|---------|-------|-------------|
| **Trust Shield Admin** | `/admin/trust-shield` | Review flagged content & suspended users |
| **Badge Admin** | `/admin/badges` | Create & manage achievement badge criteria |
| **Admin Reports** | `/admin/reports` | Handle and resolve user-submitted reports |
| **Moderation Logs** | `/admin/moderation/logs` | Full audit trail of all moderation actions |

---

## 🆘 Support

| Section | Route | Description |
|---------|-------|-------------|
| **Support Center** | `/support` | Help articles, FAQs, contact options |
| **Submit Ticket** | `/support/new` | Contact support form with category & priority |
| **Educational Resources** | *(standalone page)* | Digital wellbeing & safety guides |

---

## 📊 Summary

| Category | Sections |
|----------|----------|
| Auth & Onboarding | 3 |
| Core Social Feed | 4 |
| Content Formats | 2 |
| Communication | 3 |
| Settings & Account | 4 |
| Verification | 3 |
| TeenCare | 3 |
| Trust Shield | 5 |
| Focusly AI | 4 |
| Admin Panel | 4 |
| Support | 3 |
| **Total** | **39** |

---

## 🧭 Navigation Map

```
/auth                           ← Entry point (OAuth only)
  └── /onboarding               ← First-time setup

/home                           ← Feed + Flash (Stories) bar
/explore                        ← Search + Trending + Discovery
/create                         ← Post/Boltz/Flash creator
/boltz                          ← Short-form video feed
/profile/:username              ← User profiles

/messages                       ← DMs + Group chats
/messages/new/:userId          ← Start DM with user
/messages/:conversationId       ← Specific thread
/post/:id and /p/:id            ← Deep link to post (opens in Home shell)
/calls                          ← Audio/Video calls

/notifications                  ← All notification types

/settings                       ← Full settings hub
/security                       ← Security center
/verification-center            ← Verification hub
/badge-center                   ← Badge collection

/verification/trust-shield      ← Trust Shield verification
/verification/focus-id          ← Focus ID verification
/verification/parent-consent    ← Teen consent

/guardian/dashboard/:teenId     ← Parent dashboard

/my-reports                     ← User's own reports
/support                        ← Help center
/support/new                    ← Submit ticket

/admin/trust-shield             ← Admin: content review  [🔒 Admin]
/admin/badges                   ← Admin: badge manager   [🔒 Admin]
/admin/reports                  ← Admin: report queue    [🔒 Admin]
/admin/moderation/logs          ← Admin: audit trail     [🔒 Admin]
```

---

*Last updated: April 2026 | Focus v2.0*
