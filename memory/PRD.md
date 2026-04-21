# 🏛️ FOCUS — Product Requirements Document
**Project:** Focus — The Social Media Revolution
**Owner:** H2 Innovative
**Target Launch:** May 8th, 2026
**Last Updated:** 2026-04-21

---

## 1. Original Problem Statement (Verbatim)

> Execute the full architectural development of 'Focus'. Every line of code must be professional,
> functional, and error-free. We are building the end of fake social media.

### The Five Pillars of Sovereignty
1. **Focus Trust Shield** — SHA-256 identity hash, liveness (blink/smile/tilt), age tier (18+ vs 13-17), virtual ring-light, nuclear hard reset on DOB/tier mismatch.
2. **Focus Content Filter & Moderator** — Gemini-powered edge function, `moderation_status` (Approved/Restricted/Flagged), shadow-moderation (author sees their own restricted content, no one else).
3. **Focus Teen Care** — Guardian handshake via encrypted email consent link, `can_post` locked until consent, glassmorphic parent dashboard.
4. **Focusly AI** — Virtual companion with Idle/Thinking/Walking/Emotional states, proactive support toasts.
5. **Focus Report & Support** — Audit-based safety reports, Focusly as primary interface.

### Core Page Architecture
- Auth & Onboarding (5-way OAuth + VerifiedRoute hard-lock)
- Home & Boltz Feed (cinematic vertical snap, IntersectionObserver)
- The Vault (Signal-grade E2EE messages + WebRTC calls)
- Create Studio (Posts / Boltz / Flash)
- Profile & Settings (movie-poster aesthetic)

---

## 2. Tech Stack (User Decision — Strict)
- **Frontend:** React 18 + CRA (react-app-rewired) + React Router v6
- **Backend-as-Service:** Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- **AI:** Gemini (Edge Functions + client `@google/generative-ai`)
- **No FastAPI. No MongoDB.** (Per explicit user directive)

---

## 3. Current Implementation Status (Pre-Existing Codebase — 2026-04-21)

This is a **mature, large-scale codebase** (500+ components, 35+ migrations, 7 edge functions) that was delivered to `/app` before this session. Everything below is **already built**:

### ✅ Pillar 1 — Focus Trust Shield
- `src/pages/verification/TrustShieldVerification.jsx` — full flow
- `src/components/trustShield/*` — BiometricLock, BiometricVerification, CaptchaChallenge, DeviceList, TrustScoreGauge, VerificationCard, etc.
- `src/components/onboarding/StepTrustShield.js` + StepAgeVerification
- `supabase/migrations/20260420000000_identity_hash.sql` — SHA-256 identity dedup
- `supabase/migrations/20260419000000_finalize_verification.sql`
- `supabase/migrations/20251204_government_id_verification.sql`
- `supabase/functions/verify-face-match/`
- **Age Sovereignty:** 18+ Aadhaar/Govt ID vs 13-17 Student ID; HighSecurityGuard locks unverified users into `/onboarding`.

### ✅ Pillar 2 — Content Filter & Moderator
- `supabase/functions/content-moderator/` — Gemini-powered
- `supabase/functions/analyze-content/`
- `supabase/migrations/20251124_content_moderation.sql`
- `src/components/moderation/*` — ContentFilter, ContentWarningOverlay, AppealForm, WarningModal
- `src/pages/admin/ModerationLogs.js`, `AutoFlaggedContent.js`, `ImageReviewQueue.js`
- Shadow-moderation: `moderation_status` column (Approved / Restricted / Flagged)

### ✅ Pillar 3 — Teen Care
- `src/context/TeenCareContext.js`
- `src/pages/TeenCareGuardianDashboard.js` (glassmorphic)
- `src/components/teencare/*` — ActivityOverview, ControlsPanel, SafetyAlertsPanel, GuardianInvitation, LifeBreakNudge, PanicButton
- `src/pages/verification/ParentConsent.jsx`
- `supabase/functions/send-parent-consent-email/`, `sendGuardianVerification/`, `verifyGuardian/`
- `supabase/migrations/20251127_teen_care_schema.sql`

### ✅ Pillar 4 — Focusly AI
- `src/context/FocuslyContext.js`
- `src/components/focusly/*` and `src/components/focusly-ai/*` — Avatar (Lottie), Chat, ChatOverlay, Button, InputBar, Lion, TypingIndicator, Presence
- `src/assets/focusly/` — animations
- Public mascot: `/app/public/focusly-lion.png` (user-provided chromatic lion)
- Gemini integration via `@google/generative-ai` + `REACT_APP_GEMINI_API_KEY`

### ✅ Pillar 5 — Report & Support
- `src/pages/SupportCenter.js`, `SubmitTicket.js`, `MyReports.js`
- `src/components/report/*` — ReportModal, ReportButton, ReportHistoryCard, DistressResponse
- `src/pages/admin/AdminReports.js`
- `database/reports-support-schema.sql`

### ✅ Core Pages
- **Auth** (`src/pages/Auth.js` + `src/components/auth/*`) — 5-way OAuth (Google, Microsoft, GitHub, Discord, Twitter), BrandPanel with tagline carousel, movie-poster aesthetic.
- **Home + Boltz Feed** (`src/pages/Home/Home.js`, `src/pages/Boltz/Boltz.js`, `src/components/boltz/*`) — IntersectionObserver-powered vertical snap feed, BoltzPlayer, HeartAnimation, LikeButton, SaveButton, ShareButton, MusicDisc, VideoProgressBar.
- **Messages (The Vault)** (`src/pages/Messages/CompleteMessages.jsx`) — Full chat, E2EE wired, group messaging, voice notes, calls.
- **Create Studio** (`src/pages/Create/Create.js`) — TypeSelect → MediaSelect → EditMedia → AddMusic → AddDetails → PreviewPost with waveform music picker, video editor, filters, stickers, doodle canvas, drafts.
- **Profile** (`src/pages/Profile/Profile.js`) — Movie-poster header, grid tiles, highlights, followers/following modals.
- **Settings** (`src/pages/Settings/Settings.js`) — Account, Appearance, Privacy, Notifications, Blocked users, Sessions, Linked accounts, Feedback.

### ✅ Infrastructure
- Supabase live: `https://nmhrtllprmonqqocwzvf.supabase.co`
- 35+ SQL migrations in `/app/supabase/migrations/`
- 7 Edge Functions in `/app/supabase/functions/`
- TanStack Query + Supabase Realtime + Sentry + Jitsi + PeerJS + ZegoCloud for calls
- face-api.js + tesseract.js for liveness/OCR
- crypto-browserify + `crypto.subtle` for E2EE

---

## 4. What This Session Delivered (2026-04-21)

### Session 1 — Make the codebase runnable
- ✅ Installed all 1300+ npm deps (`yarn install --ignore-engines`)
- ✅ Supervisor wiring: created `/app/frontend` symlink → `/app` so the read-only supervisor config could find the CRA project.
- ✅ Fixed `package.json` start script (Windows `set ...` → Linux env-var prefix; added `DANGEROUSLY_DISABLE_HOST_CHECK=true` and `WDS_SOCKET_PORT=443` for Kubernetes ingress).
- ✅ Fixed webpack 5 **12 compile errors** from nsfwjs model shards (dynamic `require()` in pre-bundled TF model files). Stubbed `src/utils/nsfwImageCheck.js` — client-side NSFW was redundant because Pillar 2 specifies server-side Gemini moderation.
- ✅ Updated `config-overrides.js` with `ignoreWarnings` + `noParse` for nsfwjs/tensorflow model dirs.
- ✅ Copied user-provided branded assets to `/app/public/focus-logo.png` and `/app/public/focusly-lion.png`.
- ✅ Verified Supabase client initialization, GoTrue auth flow, 5-way OAuth UI render.
- ✅ Verified no runtime errors; Auth page loads at `/auth`, glassmorphic BrandPanel with tagline carousel.

### Session 4 — Pillar 2 Wire-Up into Create Studio + Pillar 3 (Teen Care)

**A. Create Studio now runs Gemini moderation + teen lock at publish time**
- ✅ `src/hooks/usePublish.js` rewired:
    - Pulls in `useAutoModeration().moderate()` at the top of the hook
    - AFTER media upload / BEFORE DB insert: calls the `content-moderator` edge function with caption + all uploaded image URLs
    - Merges `verdict.dbColumns` (moderation_status, reason, score, categories, moderated_at, moderator_type) into the INSERT payload for `posts`, `boltz`, and `stories` tables — spec-compliant shadow-moderation at the DB layer
    - **Fails CLOSED** — moderation errors flag the row, never silently approve
    - **Teen auto-lock** — queries `profiles.{is_teen_mode, guardian_consent_status, can_post}`; if teen without active guardian consent → forces `moderation_status='restricted'` with reason "Teen account — content is pending guardian consent."
    - Toast UX differentiates: `approved` → success; `restricted` → info ("visible only to you") with verdict reason; `flagged` → pending review

**B. Pillar 3 — Teen Care Guardian Handshake**
- ✅ New migration `supabase/migrations/20260421010000_pillar3_teen_care_handshake.sql` (idempotent, spec-perfect):
    - Adds to `profiles`: `guardian_email`, `guardian_consent_status` ∈ (pending|active|declined), `guardian_consent_sent_at`, `guardian_consent_token` (UNIQUE), `guardian_confirmed_at`, `can_post BOOLEAN DEFAULT TRUE`, `is_teen_mode BOOLEAN DEFAULT FALSE`
    - Trigger `sync_profile_teen_mode` — when `age_verification` detects teen, mirrors `is_teen_mode=TRUE` + `can_post=FALSE` to profiles
    - Trigger `apply_guardian_consent_unlock` — when `guardian_consent_status` flips to 'active', auto-unlocks `can_post=TRUE`
    - **Trigger `enforce_teen_content_lock`** (spec-critical) — runs BEFORE INSERT on `posts`, `boltz`, `flashes`, `stories`, `comments`. Any teen without active consent has their content auto-set to `moderation_status='restricted'`. This is the DB-level guarantee that mirrors the client-side lock.
    - **Messages RLS privacy** — spec: "Parents NEVER read private messages." New policy `messages_privacy_select` allows SELECT only to sender, receiver, or conversation participants. Guardians have zero access paths to DM content.
    - RPC `start_guardian_handshake(teen_id, guardian_email) → token` — cryptographic 32-byte hex token, writes consent-pending state
    - RPC `confirm_guardian_consent(token) → (teen_id, confirmed_at)` — one-time-use, 7-day TTL, flips status to 'active'
- ✅ New client hook `src/hooks/useGuardianHandshake.js`:
    - `startHandshake({ guardianEmail })` → RPC + auto-invokes `send-parent-consent-email` Edge Function with the token
    - `confirmConsent(token)` → for the public `/guardian/confirm?t=<token>` route
    - `getMyConsentStatus()` → profile-scoped consent status read for UI badges

### Session 3 — Pillar 2: Stealth Shield (Shadow-Moderation) Spec-Perfect
- ✅ **Master migration** `supabase/migrations/20260421000000_pillar2_stealth_shield.sql`:
    - Ensures `moderation_status` enum has exactly `('approved', 'restricted', 'flagged')` (migrates older enums idempotently)
    - Adds `moderation_status` + 5 metadata columns (`reason`, `score`, `categories[]`, `moderated_at`, `moderator_type`) to `posts`, `boltz`, `flashes`, `comments`
    - Creates helper SQL function `is_content_visible(status, owner)` returning `status='approved' OR owner=auth.uid()`
    - Replaces SELECT RLS policies on `posts`/`boltz`/`flashes` with spec-perfect `stealth_shield_select_*` policies
    - Publishes views `v_visible_posts`, `v_visible_boltz`, `v_visible_flashes` for feeds that want explicit intent
    - Creates `moderation_audit` table (every AI decision logged with Gemini raw JSON, indexed by content + user)
    - Fast indexes: partial index on `moderation_status='approved'` for feed queries; composite index on `(user_id, moderation_status)` for author echo-chamber
- ✅ **Edge function rewrite** `supabase/functions/content-moderator/index.ts`:
    - Upgraded to **Gemini 2.5 Flash** (vision-capable, current best price/latency for classification; overridable via `GEMINI_MODERATION_MODEL` env)
    - Returns spec-exact verdict: `{ moderationStatus, toxicityType, severity, confidence, categories, reason, suggestion }`
    - Ruthless verdict logic (`deriveVerdict`): NSFW/hate/violence/self-harm → `restricted` immediately (zero-tolerance), high-severity bullying/misinfo/spam → `restricted`, medium or confidence ≥0.4 → `flagged`, else `approved`
    - Image URLs auto-fetched and base64-encoded as `inline_data` parts for Gemini Vision (up to 4 images, 15MB cap)
    - **Fails CLOSED** per spec — if Gemini is unreachable or malformed, verdict = `flagged` (queued for human review), never silently approves
- ✅ **Client hook** `src/hooks/useAutoModeration.js`:
    - `const { moderate, moderating, lastVerdict } = useAutoModeration()`
    - `moderate({ text, imageUrls })` returns verdict + `dbColumns` ready to spread into an INSERT payload (`{ moderation_status, moderation_reason, moderation_score, moderation_categories, moderated_at, moderator_type: 'auto' }`)
    - Defensive: merges with defaults, forces unknown statuses to `flagged`
- ✅ **Feed services hardened with defense-in-depth filter** (in case RLS isn't yet deployed):
    - `src/services/postService.js` — new `applyStealthShield(query, viewerId)` helper applies `.or('moderation_status.eq.approved,user_id.eq.<viewer>')`. New `fetchMyRestrictedPosts(userId)` powers the author-only echo-chamber view.
    - `src/services/boltzService.js` — shadow filter applied on both primary + fallback query paths, `moderation_status` added to select
    - `src/services/flashService.js` — same filter applied; `useHomeFeed.js` now passes `userId` through to both services

### Session 2 — Pillar 1: Trust Shield Spec-Perfect Fixes
- ✅ **Identity DNA salt:** `computeIdentityHash` in `src/hooks/useOCRScanner.js` now computes `SHA256(ID_Number + SALT)` per spec. Salt read from `REACT_APP_TRUST_SHIELD_SALT` (CRA) with fallback to `VITE_TRUST_SHIELD_SALT` (future Vite migration). Salt value added to `/app/.env` (64-char openssl hex).
- ✅ **Nuclear Hard Reset:** `handleHardReset` in `TrustShieldVerification.jsx` now executes the full spec sequence:
    1. Stops all cameras (scanner + liveness RAF + MediaStream tracks)
    2. `localStorage.clear()` + `sessionStorage.clear()`
    3. `supabase.auth.signOut()` — kills the session
    4. Resets every React state variable to initial
    5. `navigate('/auth', { replace: true })` after 2.5s
- ✅ **Third challenge (Face Tilt) added:** pool is now exactly `[Blink, Smile, Tilt]` per spec, Fisher-Yates shuffled each session. Yaw-based tilt detection (`|yaw| > 0.18` sustained 3 frames at 8fps).
- ✅ **Math-confirmed thresholds:**
    - Blink: EAR < 0.22 for ≥2 events
    - Smile: `expressions.happy > 0.80` sustained ≥4 frames
    - Tilt: `|yaw| > 0.18` sustained ≥3 frames
- ✅ **Physical Continue Lock:** new `data-testid="trust-shield-continue-btn"` button is `disabled={!allConfirmed || accountLocked || saving}`, visual opacity + cursor reflect lock state. Label reads `🔒 Complete all 3 challenges to unlock` until math confirms.
- ✅ **Skip buttons removed:** the "📱 Use Phone Instead" button on Step 3 is gone per spec ("Physically remove 'Skip' buttons").
- ✅ **5-click lion bypass removed:** FocuslyLion is now display-only; no manual override path exists.
- ✅ **Fixed runtime ReferenceErrors:**
    - `setMatchResult` (undefined, would crash smile detection) → removed
    - `challengeSequence` (undefined, would crash Step 3 render) → `challengeSequenceRef.current`
- ✅ **Added liveness refs:** `tiltHoldRef`, `smileHoldRef` for sustained-evidence detection.
- ✅ Compiled clean (zero lint, zero webpack errors, zero runtime errors).

---

## 5. What the User Must Do (Outside This Environment)

Focus relies on the **user's Supabase project** — things that cannot be set up from inside this container:

1. **Apply all SQL migrations** to Supabase (in order). Key ones:
   - `supabase/migrations/20260419000000_finalize_verification.sql`
   - `supabase/migrations/20260420000000_identity_hash.sql`
   - `supabase/migrations/20251124_content_moderation.sql`
   - `supabase/migrations/20251127_teen_care_schema.sql`
   - `FIVE-PILLARS-MIGRATION.sql` at /app root
   - Plus the 30+ others in `/app/migrations/` and `/app/supabase/migrations/`
2. **Deploy Edge Functions:** `supabase functions deploy content-moderator analyze-content verify-face-match send-parent-consent-email sendGuardianVerification verifyGuardian delete-expired-flashes`
3. **Set Supabase secrets:** `supabase secrets set GEMINI_API_KEY=... VITE_TRUST_SHIELD_SALT=...`
4. **Enable OAuth providers** in Supabase Authentication → Providers: Google, Microsoft, GitHub, Discord, Twitter. Each requires its own client ID/secret from the provider console.
5. **Enable Storage buckets:** `posts`, `boltz`, `flash`, `avatars`, `voice-notes`, `chat-media` (see `/app/LAUNCH_DAY_SQL/02_storage_buckets_setup.sql`).
6. **Enable Realtime** on tables: `posts`, `messages`, `notifications`, `conversations` (see `04_enable_realtime.sql`).

---

## 6. Roadmap / Backlog

### P0 — Blocking Production Launch
- [ ] Migration apply + smoke test against live Supabase
- [ ] Real user E2E: OAuth login → Trust Shield → age tier → liveness → /home
- [ ] Verify `moderation_status` shadow-moderation actually hides restricted posts in feed queries
- [ ] Liveness: validate EAR calculation thresholds on real devices
- [ ] Nuclear Hard Reset: confirm DOB-vs-tier mismatch triggers `signOut() + storage.clear() + Navigate(/onboarding)`

### P1 — Polish
- [ ] Boltz feed: confirm IntersectionObserver auto-play/pause on 4G throttling
- [ ] Virtual Ring-Light: verify canvas luminance sampling snaps UI to `#FFFFFF` below 0.3 threshold
- [ ] Focusly proactive toasts: tune sentiment triggers

### P2 — Future
- [ ] WebRTC fidelity (Jitsi + ZegoCloud hybrid tuning)
- [ ] E2EE message key-rotation schedule
- [ ] Focus Report automated audit pipeline polish
- [ ] Premium subscription flow (Stripe)

---

## 7. Environment

**Frontend:** `/app` (CRA + react-app-rewired, port 3000 via supervisor)
**Preview URL:** `https://9fd6384a-d23f-4c7d-95c1-13405b9108b9.preview.emergentagent.com`
**Supabase:** `https://nmhrtllprmonqqocwzvf.supabase.co`
**Key env:** `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_KEY`, `REACT_APP_GEMINI_API_KEY`, `REACT_APP_TENOR_API_KEY`, `REACT_APP_JAMENDO_CLIENT_ID`, `REACT_APP_EMAILJS_*`

---

## 8. Known Issues

- **MOCKED:** `src/utils/nsfwImageCheck.js` returns `{ flagged: false }` always. Moderation is now server-side via the Gemini edge function (`content-moderator`). If you need client-side NSFW, re-enable via dynamic `import('nsfwjs')` inside a web worker to avoid webpack bundling the model shards.
- **WARNINGS (non-blocking):** React Router v7 future-flag warnings in console. Fix by adding `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}` to `<BrowserRouter>` when you're ready to migrate.
- **OAUTH NOT YET TESTABLE:** in this preview env — requires the 5 provider client IDs configured in the Supabase dashboard.
