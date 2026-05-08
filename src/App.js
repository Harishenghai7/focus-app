import React, { Suspense, lazy, useEffect } from 'react';
import { Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1. Context Providers
import { AuthProvider } from './context/AuthContext';
import { FocusIdentityProvider } from './context/FocusIdentityContext';
import { FocusUserProvider, useFocusUser } from './context/FocusUserContext';
import { AudioProvider } from './context/AudioProvider';
import { ThemeProvider } from './context/ThemeContext';
import { QueryProvider } from './context/QueryProvider';
import { FocuslyProvider } from './context/FocuslyContext';
import FocuslyToastLayer from './components/focusly/FocuslyToastLayer';
import FocuslyCompanion from './components/focusly/FocuslyCompanion';
import { useFocuslySentiment } from './hooks/useFocuslySentiment';

import { supabase } from './lib/supabase';
import { useBehaviorTracking } from './hooks/useBehaviorTracking';
import { useOnboardingRedirect } from './hooks/useOnboardingRedirect';
import { useGlobalCallListener } from './hooks/useGlobalCallListener';
import useOnlineStatus from './hooks/useOnlineStatus';
import { useFeatureFlag } from './hooks/useFeatureFlag';
import { useAuth } from './hooks/useAuth';
import { getTrustShieldState } from './utils/trustShieldPolicy';

// 3. Core Components
import BiometricLock from './components/trustShield/BiometricLock';
import AdminRoute from './components/auth/AdminRoute';
import ProtectedTrustRoute from './components/auth/ProtectedTrustRoute';
import IncomingCallModal from './components/calls/IncomingCallModal';
import { InAppNotificationProvider, useInAppNotifications } from './components/notifications/InAppNotificationBanner';
import AnimatedRoutes from './components/ui/AnimatedRoutes';
import SovereignErrorBoundary from './components/ui/SovereignErrorBoundary';

// 4. Page Imports (Critical Pages - Load Instantly)
import Auth from './pages/Auth';
import AuthCallback from './pages/Auth/AuthCallback';
import Home from './pages/Home/Home';
import CompleteMessages from './pages/Messages/CompleteMessages';
import SovereignMessages from './pages/Messages/SovereignMessages';
import Profile from './pages/Profile/Profile';

import GuardianHub from './pages/GuardianHub/GuardianHub';
import FocuslyAIPage from './pages/FocuslyAIPage';

// 5. Lazy Load Heavy Pages (Performance Optimization ⚡)
// This prevents "WebGL" errors and speeds up initial load
const TrustShieldVerification = lazy(() => import('./pages/verification/TrustShieldVerification'));
const ParentConsent = lazy(() => import('./pages/verification/ParentConsent'));
const FocusIDVerification = lazy(() => import('./pages/verification/FocusIDVerification'));
const VerifyMobile = lazy(() => import('./pages/verification/VerifyMobile'));
const Explore = lazy(() => import('./pages/Explore/Explore'));
const ExploreEnhanced = lazy(() => import('./pages/Explore/ExploreEnhanced'));
const FuturisticExplore = lazy(() => import('./pages/Explore/FuturisticExplore'));
const Create = lazy(() => import('./pages/Create/Create'));
const Boltz = lazy(() => import('./pages/Boltz/Boltz'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const Notifications = lazy(() => import('./pages/Notifications/Notifications'));
const Calls = lazy(() => import('./pages/Calls/Calls'));
const SecurityCenter = lazy(() => import('./pages/SecurityCenter'));
const VerificationCenter = lazy(() => import('./pages/VerificationCenter'));
const BadgeCenter = lazy(() => import('./pages/BadgeCenter'));
const AdminTrustShield = lazy(() => import('./pages/admin/AdminTrustShield'));
const BadgeAdminDashboard = lazy(() => import('./components/admin/BadgeAdminDashboard'));
const TeenCareGuardianDashboard = lazy(() => import('./pages/TeenCareGuardianDashboard'));
const MyReports = lazy(() => import('./pages/MyReports'));
const SupportCenter = lazy(() => import('./pages/SupportCenter'));
const SubmitTicket = lazy(() => import('./pages/SubmitTicket'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const ModerationLogs = lazy(() => import('./pages/admin/ModerationLogs'));
const TrustShieldDashboard = lazy(() => import('./pages/TrustShield/TrustShieldDashboard'));
const ContentModerationHub = lazy(() => import('./pages/Moderation/ContentModerationHub'));

// Auth Extras
const Onboarding = lazy(() => import('./pages/Onboarding'));
// DigiLocker removed in favor of Trust Shield

const LoadingScreen = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div style={{ textAlign: 'center' }}>
            <h2 style={{ background: 'var(--gradient-royal)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Loading Focus...</h2>
        </div>
    </div>
);

/**
 * HighSecurityGuard
 * ─────────────────────────
 * If the user is authenticated but their verification_status is NOT 'VERIFIED',
 * they are locked into /onboarding.
 */
const HighSecurityGuard = ({ children }) => {
    const { user, profile, loading } = useFocusUser();
    const location = useLocation();

    if (loading) return <LoadingScreen />;

    // Not logged in at all — let the route handle redirect
    if (!user) return children;

    const EXEMPT_PATHS = [
        '/onboarding',
        '/auth',
        '/verification',
        '/verify-mobile',
        '/support',
        '/security',
    ];

    const isExempt = EXEMPT_PATHS.some((p) => location.pathname.startsWith(p));
    if (isExempt) return children;

    const verificationStatus = (
        profile?.verification_status ||
        profile?.trust_shield_status ||
        profile?.focus_trust_status ||
        ''
    ).toUpperCase().trim();

    const onboardingDone = profile?.onboarding_completed === true;

    // 🛡️ CRITICAL: Trust Shield verification is MANDATORY
    // Onboarding completion alone is NOT sufficient - must be VERIFIED
    const isVerified = verificationStatus === 'VERIFIED' || verificationStatus === 'VERIFIED_MINOR';
    
    // Allow access ONLY if VERIFIED (onboarding completion without verification = locked)
    if (isVerified) {
        return children;
    }
    
    // If onboarding shows as completed but no verification, force reset
    if (onboardingDone && !isVerified) {
        console.warn('[HighSecurityGuard] Onboarding marked complete but no Trust Shield - forcing back to onboarding');
        // Reset onboarding flag in background
        supabase.from('profiles').update({ 
            onboarding_completed: false,
            verification_status: 'PENDING'
        }).eq('id', user.id).then(() => {

        }).catch(err => {
            console.error('[HighSecurityGuard] Failed to reset profile:', err);
        });
    }

    // Lock the user into verification — they cannot access /home or any protected route
    return <Navigate to="/verification/trust-shield" replace />;
};

const AppContent = () => {
    const { user, profile: focusProfile, loading } = useFocusUser();
    const { profile: authProfile } = useAuth();
    const location = useLocation();
    const isExploreV2 = useFeatureFlag('focus_v2_explore');
    const isMessagesV2 = useFeatureFlag('focus_v2_messages');
    const { incomingCall, acceptCall, declineCall } = useGlobalCallListener();
    const trustShield = getTrustShieldState(authProfile);
    // 🦁 Pillar 4 — activate Focusly proactive sentiment monitoring
    useFocuslySentiment();
    const isSupportPath = location.pathname.startsWith('/support');
    const isVerificationPath =
        location.pathname.startsWith('/verification') ||
        location.pathname.startsWith('/verification-center') ||
        location.pathname.startsWith('/security') ||
        location.pathname.startsWith('/onboarding');

    const canUseProtectedFeatures = !user || !trustShield.isBlocked || isSupportPath || isVerificationPath;
    const withTrustGate = (element) => <ProtectedTrustRoute>{element}</ProtectedTrustRoute>;

    // Initialize tracking
    useBehaviorTracking(true);
    useOnlineStatus();

    // Global realtime notification → in-app banner bridge
    const { addBanner } = useInAppNotifications();
    useEffect(() => {
        if (!user?.id) return;
        const channel = supabase
            .channel(`global-notif-banners:${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`,
            }, async (payload) => {
                try {
                    const { data } = await supabase
                        .from('notifications')
                        .select('*, actor:profiles!actor_id(id,username,full_name,avatar_url)')
                        .eq('id', payload.new.id)
                        .single();
                    if (data) addBanner(data);
                } catch (_) {}
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [user?.id, addBanner]);

    // Debug Logs (Keep only what's necessary)
    useEffect(() => {
        if (incomingCall) {

        }
    }, [incomingCall]);

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <BiometricLock>
            <SovereignErrorBoundary>
            {/* Suspense handles the loading state for Lazy Loaded pages */}
            <Suspense fallback={<div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}>
                <AnimatedRoutes>
                    {/* --- Public Routes --- */}
                    <Route path="/" element={user ? <Navigate to="/home" replace /> : <Navigate to="/auth" replace />} />
                    <Route path="/auth" element={user ? <Navigate to="/home" replace /> : <Auth />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Auth />} />
                    <Route path="/signup" element={user ? <Navigate to="/home" replace /> : <Auth />} />

                    <Route path="/forgot-password" element={<Auth />} />
                    <Route path="/reset-password" element={<Auth />} />
                    <Route path="/verify-email" element={<Auth />} />
                    {/* DigiLocker Callback Removed */}

                    {/* --- Protected Routes (all gated by VerifiedRoute) --- */}
                    {/*
                      THE WALL: If a verified user navigates back to /onboarding via the URL bar,
                      they are immediately redirected to /home. Unverified users stay in /onboarding.
                    */}
                    <Route path="/onboarding" element={
                      user
                        ? (
                            // ✅ If already fully verified, send to home
                            focusProfile?.verification_status === 'VERIFIED' ||
                            focusProfile?.trust_shield_status === 'VERIFIED' ||
                            focusProfile?.verification_status === 'VERIFIED_MINOR'
                              ? <Navigate to="/home" replace />
                              : (
                                // 🌟 Render the full 8-step onboarding flow
                                <Onboarding />
                              )
                          )
                        : <Navigate to="/auth" replace />
                    } />
                    <Route path="/home" element={
                        user
                            ? withTrustGate(<Home />)
                            : <Navigate to="/auth" replace />
                    } />

                    <Route path="/explore" element={user ? withTrustGate(<FuturisticExplore />) : <Navigate to="/auth" replace />} />
                    <Route path="/explore/futuristic" element={user ? withTrustGate(<FuturisticExplore />) : <Navigate to="/auth" replace />} />
                    <Route path="/create" element={user ? withTrustGate(<Create />) : <Navigate to="/auth" replace />} />

                    <Route path="/boltz" element={user ? withTrustGate(<Boltz />) : <Navigate to="/auth" replace />} />
                    <Route path="/boltz/:id" element={user ? withTrustGate(<Boltz />) : <Navigate to="/auth" replace />} />

                    <Route path="/profile" element={user ? withTrustGate(<Profile />) : <Navigate to="/auth" replace />} />
                    <Route path="/profile/:username" element={user ? withTrustGate(<Profile />) : <Navigate to="/auth" replace />} />

                    <Route path="/settings" element={user ? withTrustGate(<Settings />) : <Navigate to="/auth" replace />} />
                    <Route path="/notifications" element={user ? withTrustGate(<Notifications />) : <Navigate to="/auth" replace />} />

                    {/* Messaging & Calls - Sovereign Whisper E2EE v2.0 */}
                    <Route path="/messages" element={user ? withTrustGate(<SovereignMessages key="sov-msgs-v2" />) : <Navigate to="/auth" replace />} />
                    <Route path="/messages/new/:userId" element={user ? withTrustGate(<SovereignMessages key="sov-new-v2" />) : <Navigate to="/auth" replace />} />
                    <Route path="/messages/:conversationId" element={user ? withTrustGate(<SovereignMessages key="sov-conv-v2" />) : <Navigate to="/auth" replace />} />
                    <Route path="/post/:id" element={user ? withTrustGate(isExploreV2 ? <ExploreEnhanced /> : <Explore />) : <Navigate to="/auth" replace />} />
                    <Route path="/p/:id" element={user ? withTrustGate(isExploreV2 ? <ExploreEnhanced /> : <Explore />) : <Navigate to="/auth" replace />} />
                    <Route path="/calls" element={user ? withTrustGate(<Calls />) : <Navigate to="/auth" replace />} />

                    {/* Teen Care */}
                    <Route path="/guardian/dashboard" element={user ? withTrustGate(<TeenCareGuardianDashboard />) : <Navigate to="/auth" replace />} />
                    <Route path="/guardian/dashboard/:teenId" element={user ? withTrustGate(<TeenCareGuardianDashboard />) : <Navigate to="/auth" replace />} />
                    <Route path="/guardian-hub" element={user ? withTrustGate(<GuardianHub />) : <Navigate to="/auth" replace />} />

                    {/* Trust Shield & Verification */}
                    <Route path="/security" element={user ? <SecurityCenter /> : <Navigate to="/auth" replace />} />
                    <Route path="/verification-center" element={user ? <VerificationCenter /> : <Navigate to="/auth" replace />} />
                    <Route path="/badge-center" element={user ? withTrustGate(<BadgeCenter />) : <Navigate to="/auth" replace />} />
                    <Route path="/verification/trust-shield" element={user ? <TrustShieldVerification /> : <Navigate to="/auth" replace />} />
                    <Route path="/verification/parent-consent" element={user ? <ParentConsent /> : <Navigate to="/auth" replace />} />
                    <Route path="/verification/focus-id" element={user ? <FocusIDVerification /> : <Navigate to="/auth" replace />} />
                    <Route path="/verify-mobile" element={<VerifyMobile />} />

                    {/* --- Admin Routes --- */}
                    <Route path="/admin/trust-shield" element={<AdminRoute><AdminTrustShield /></AdminRoute>} />
                    <Route path="/admin/badges" element={<AdminRoute><BadgeAdminDashboard /></AdminRoute>} />
                    <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
                    <Route path="/admin/moderation/logs" element={<AdminRoute><ModerationLogs /></AdminRoute>} />

                    {/* Trust Shield & Moderation Hubs */}
                    <Route path="/trust-shield" element={user ? withTrustGate(<TrustShieldDashboard />) : <Navigate to="/auth" replace />} />
                    <Route path="/moderation" element={user ? withTrustGate(<ContentModerationHub />) : <Navigate to="/auth" replace />} />

                    {/* Support */}
                    <Route path="/my-reports" element={user ? withTrustGate(<MyReports />) : <Navigate to="/auth" replace />} />
                    <Route path="/support" element={user ? <SupportCenter /> : <Navigate to="/auth" replace />} />
                    <Route path="/support/new" element={user ? <SubmitTicket /> : <Navigate to="/auth" replace />} />
                    
                    {/* Teen Care */}
                    <Route path="/teen-care" element={user ? withTrustGate(<TeenCareGuardianDashboard />) : <Navigate to="/auth" replace />} />
                    <Route path="/teen-care/:teenId" element={user ? withTrustGate(<TeenCareGuardianDashboard />) : <Navigate to="/auth" replace />} />

                    {/* Focusly AI */}
                    <Route path="/focusly-ai" element={user ? <FocuslyAIPage /> : <Navigate to="/auth" replace />} />

                    {/* Catch All — THE WALL */}
                    {/*
                      If a user types /home or any other protected path directly into the URL bar,
                      VerifiedRoute will catch them and redirect to /onboarding if unverified.
                    */}
                    <Route path="*" element={
                      user
                        ? <ProtectedTrustRoute><Navigate to="/home" replace /></ProtectedTrustRoute>
                        : <Navigate to="/auth" replace />
                    } />
                </AnimatedRoutes>
            </Suspense>
            </SovereignErrorBoundary>

            {/* Global Modal */}
            {user && incomingCall && (
                <IncomingCallModal
                    caller={incomingCall.caller}
                    callType={incomingCall.call_type}
                    onAccept={acceptCall}
                    onReject={declineCall}
                />
            )}
        </BiometricLock>
    );
};

function App() {
    return (
        <QueryProvider>
            <AuthProvider>
                <FocusUserProvider>
                    <FocusIdentityProvider>
                        <InAppNotificationProvider>
                            <ThemeProvider>
                                <FocuslyProvider>
                                    <AudioProvider>
                                        <AppContent />
                                        <FocuslyToastLayer />
                                        <ToastContainer position="bottom-right" theme="dark" limit={3} />
                                    </AudioProvider>
                                </FocuslyProvider>
                            </ThemeProvider>
                        </InAppNotificationProvider>
                    </FocusIdentityProvider>
                </FocusUserProvider>
            </AuthProvider>
        </QueryProvider>
    );
}

export default App;
