# Pages Overview

This document lists all pages in the `src/pages/` directory, with their features, working, and the components/utils/hooks used. Only relevant and accurate information is included.

---

## 1. VerificationCenter
- **Features/Working:**
  - Central hub for user verification (email, profile, OAuth, biometric)
  - Shows verification steps and progress
  - Handles email, profile, OAuth, and biometric verification
  - Redirects unauthenticated users to `/auth`
- **Components Used:**
  - `VerificationStep` (../components/trustShield/VerificationStep)
- **Hooks Used:**
  - `useVerifications`, `useAuth`
- **Utils:**
  - `react-toastify` for notifications
- **Other:**
  - Uses `react-icons` for step icons

---

## 2. TeenSafetySettings
- **Features/Working:**
  - Displays teen safety settings if teen mode is enabled
  - Shows message if not in teen mode
- **Components Used:**
  - `TeenSafetySettingsMain` (../components/teen/TeenSafetySettingsMain)
- **Hooks/Context:**
  - `useTeenCare` (../context/TeenCareContext)

---

## 3. TeenCareGuardianDashboard
- **Features/Working:**
  - Guardian dashboard for monitoring linked teens
  - Shows activity overview, safety alerts, and controls for selected teen
  - Fetches activity summary for last 7 days
- **Components Used:**
  - `ActivityOverview`, `SafetyAlertsPanel`, `ControlsPanel` (../components/teencare/)
- **Hooks Used:**
  - `useGuardianship`, `useSafetyAlerts`
- **Utils:**
  - `getActivitySummary` (../utils/activityLogger)

---

## 4. SupportCenter
- **Features/Working:**
  - Help center with FAQ and search
  - Displays FAQ categories and search results
- **Components Used:**
  - Uses CSS module `SupportCenter.module.css`
- **Utils:**
  - `FAQ_DATA`, `searchFAQs` (../utils/supportCategories)

---

## 5. SubmitTicket
- **Features/Working:**
  - Support ticket creation form
  - Lets user select category, subject, description, and attachments
  - On submit, creates ticket and redirects to `/my-tickets`
- **Components Used:**
  - Uses CSS module `SubmitTicket.module.css`
- **Hooks Used:**
  - `useSupport`
- **Utils:**
  - `SUPPORT_CATEGORIES` (../utils/supportCategories)

---

## 6. SecurityDashboard
- **Features/Working:**
  - Displays user's trust score, badges, recent activity, and device list
  - Uses a mock user object (replace with real auth in production)
- **Components Used:**
  - `TrustScoreCard`, `TrustScoreBreakdown`, `TrustScoreProgress`, `DeviceList`, `TrustBadgeList` (../components/trustShield/)
- **Hooks Used:**
  - `useTrustScore`, `useDeviceFingerprint`

---

## 7. SecurityCenter
- **Features/Working:**
  - Security management page: trust score, badges, device list, event log
  - Redirects unauthenticated users to `/auth`
- **Components Used:**
  - `TrustScoreGauge`, `TrustScoreBreakdown`, `TrustProgress`, `DeviceList`, `SecurityEventLog`, `TrustBadgeList` (../components/trustShield/)
- **Hooks Used:**
  - `useAuth`, `useTrustScore`, `useDeviceFingerprint`

---

## 8. ResetPassword
- **Features/Working:**
  - Password reset form with strength meter
  - Validates password and updates via Supabase
  - Shows success/error toasts
- **Components Used:**
  - `AuthLayout`, `Input`, `Button`, `Toast`, `PasswordStrength` (../components/auth/, ../components/shared/)
- **Hooks Used:**
  - `usePasswordStrength`
- **Utils:**
  - `validatePassword` (../utils/validatePassword), `updateUserPassword` (../utils/supabaseAuth)

---

## 9. Onboarding
- **Features/Working:**
  - Displays onboarding stepper
- **Components Used:**
  - `OnboardingStepper` (../components/onboarding/OnboardingStepper)

---

## 10. MyReports
- **Features/Working:**
  - Shows user's report history with filter by status
- **Components Used:**
  - `ReportHistoryCard` (../components/report/ReportHistoryCard)
  - Uses CSS module `MyReports.module.css`
- **Hooks Used:**
  - `useReportHistory`

---

## 11. Messages
- **Features/Working:**
  - Messaging interface with inbox, chat, favorites, and new message modal
  - Responsive for mobile/desktop
- **Components Used:**
  - `MainLayout`, `InboxPane`, `ChatPane`, `FavoritesPanel`, `NewMessageModal` (../components/messages/)
- **Hooks Used:**
  - `useInboxThreads`, `useAuth`, `useMediaQuery`
- **Utils:**
  - Uses CSS module `Messages.module.css`

---

## 12. GuardianDashboard
- **Features/Working:**
  - Guardian dashboard for managing linked teens
  - Shows message if not a guardian
- **Components Used:**
  - `GuardianDashboardMain` (../components/guardian/GuardianDashboardMain)
- **Hooks/Context:**
  - `useTeenCare` (../context/TeenCareContext)

---

## 13. ForgotPassword
- **Features/Working:**
  - Password reset request form
  - Validates email and sends reset link
  - Shows success/error toasts
- **Components Used:**
  - `AuthLayout`, `Input`, `Button`, `Toast` (../components/auth/, ../components/shared/)
- **Utils:**
  - `validateEmail` (../utils/validateEmail), `resetPasswordForEmail` (../utils/supabaseAuth)

---

## 14. EmergencyPanicButton
- **Features/Working:**
  - Emergency panic button for teens
  - Shows message if not a teen
- **Components Used:**
  - `EmergencyPanicButtonMain` (../components/teen/EmergencyPanicButtonMain)
- **Hooks/Context:**
  - `useTeenCare` (../context/TeenCareContext)

---

## 15. EducationalResources
- **Features/Working:**
  - Displays educational resources
- **Components Used:**
  - `EducationalResourcesMain` (../components/resources/EducationalResourcesMain)

---

## 16. ContentWarningPage
- **Features/Working:**
  - Shows content blocked warning with links to home and support
- **Components Used:**
  - None (uses inline JSX)

---

## 17. BadgeCenter
- **Features/Working:**
  - Main badge center: shows all badges, progress, application options
  - Allows viewing, applying, and tracking badge progress
- **Components Used:**
  - `MainLayout` (../components/layout/MainLayout)
  - `BadgeDisplay`, `BadgeProgress`, `BadgeApplication` (../components/badge/)
  - `BadgeCount` (../components/shared/BadgeCount)
- **Hooks Used:**
  - `useUserBadges`, `useBadgeCriteria`, `useBadgeProgress`, `useAuth`
- **Utils:**
  - `BADGE_DEFINITIONS`, `getAllBadgeDefinitions` (../utils/badgeRules)
  - `formatDateAwarded`, `groupBadgesByCategory` (../utils/badgeFormatter)
- **Other:**
  - Uses CSS module `BadgeCenter.module.css`

---

## 18. Auth
- **Features/Working:**
  - Authentication page with login/signup toggle
  - Supports OAuth and email/password
- **Components Used:**
  - `AuthLayout`, `LoginForm`, `SignupForm`, `OAuthButtons`, `FormDivider` (../components/auth/)
- **Other:**
  - Uses CSS module `Auth.module.css`

---

*This list is based on the current state of the `src/pages/` directory and the code within each file. Only directly used components, hooks, and utils are listed for each page.*
