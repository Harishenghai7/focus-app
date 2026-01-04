import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import { QueryProvider } from './context/QueryProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth Pages
import Auth from './pages/Auth';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import VerifyEmail from './pages/Auth/VerifyEmail';
import Onboarding from './pages/Onboarding';
import AdminRoute from './components/auth/AdminRoute';

// Focusly AI - Production Ready (Temporarily Disabled)
import { FocuslyProvider } from './context/FocuslyContext';
// import FocuslyWidget from './components/focusly/FocuslyWidget';

// Main Pages
import Home from './pages/Home/Home';
import Explore from './pages/Explore/Explore';
import Create from './pages/Create/Create';
import Boltz from './pages/Boltz/Boltz';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';
import Notifications from './pages/Notifications/Notifications';
import Messages from './pages/Messages/Messages.jsx';
import InstagramMessages from './pages/Messages/InstagramMessages'; // Instagram-inspired layout
import CompleteMessages from './pages/Messages/CompleteMessages'; // 🚀 COMPLETE: Main Sidebar + Messages + Chat
import Calls from './pages/Calls/Calls';

// Trust Shield Pages
import SecurityCenter from './pages/SecurityCenter';
import VerificationCenter from './pages/VerificationCenter';
import BadgeCenter from './pages/BadgeCenter';
import AdminTrustShield from './pages/admin/AdminTrustShield';
import BadgeAdminDashboard from './components/admin/BadgeAdminDashboard';

// Government ID Verification
import GovernmentIDVerification from './pages/verification/GovernmentIDVerification';
import DigiLockerCallback from './pages/Auth/DigiLockerCallback';
import ParentConsent from './pages/verification/ParentConsent';

// Report & Support Pages
import MyReports from './pages/MyReports';
import SupportCenter from './pages/SupportCenter';
import SubmitTicket from './pages/SubmitTicket';
import AdminReports from './pages/admin/AdminReports';
import AutoFlaggedContent from './pages/admin/AutoFlaggedContent';
import ImageReviewQueue from './pages/admin/ImageReviewQueue';
import ModerationLogs from './pages/admin/ModerationLogs';
import ContentWarningPage from './pages/ContentWarningPage';

// Components
import BiometricLock from './components/trustShield/BiometricLock';

// Hooks
import { useBehaviorTracking } from './hooks/useBehaviorTracking';
import { useOnboardingRedirect } from './hooks/useOnboardingRedirect';
import { useGlobalCallListener } from './hooks/useGlobalCallListener';
import useOnlineStatus from './hooks/useOnlineStatus';

// Calling Components
import CallNotification from './components/messages/CallNotification';
import IncomingCallModal from './components/calls/IncomingCallModal';

// Teen Care System
import TeenCareGuardianDashboard from './pages/TeenCareGuardianDashboard';
import AgeVerificationModal from './components/teencare/AgeVerificationModal';
import GuardianInvitation from './components/teencare/GuardianInvitation';

const AppContent = () => {
    const { user, loading } = useAuth();
    const { incomingCall, acceptCall, declineCall } = useGlobalCallListener();

    // Debug logging for incoming call state
    React.useEffect(() => {
        console.log('📱 APP: incomingCall state changed:', incomingCall);
        console.log('📱 APP: user:', user?.id);
        console.log('📱 APP: Should show modal?', !!(user && incomingCall));
    }, [incomingCall, user]);

    // Initialize global behavior tracking
    useBehaviorTracking(true);
    useOnboardingRedirect();
    useOnlineStatus(); // Track user online status

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000', color: '#fff' }}>
                Loading Focus...
            </div>
        );
    }

    return (
        <BiometricLock>
            <Routes>
                {/* Public Routes - Redirect to Home if logged in */}
                <Route path="/" element={user ? <Navigate to="/home" replace /> : <Navigate to="/auth" replace />} />
                <Route path="/auth" element={user ? <Navigate to="/home" replace /> : <Auth />} />
                <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Navigate to="/auth" replace />} />
                <Route path="/signup" element={user ? <Navigate to="/home" replace /> : <Navigate to="/auth" replace />} />

                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />

                {/* Protected Routes - Redirect to Auth if not logged in */}
                <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/auth" replace />} />
                <Route path="/home" element={user ? <Home /> : <Navigate to="/auth" replace />} />
                <Route path="/explore" element={user ? <Explore /> : <Navigate to="/auth" replace />} />
                <Route path="/create" element={user ? <Create /> : <Navigate to="/auth" replace />} />
                <Route path="/boltz" element={user ? <Boltz /> : <Navigate to="/auth" replace />} />
                <Route path="/boltz/:id" element={user ? <Boltz /> : <Navigate to="/auth" replace />} />
                <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" replace />} />
                <Route path="/profile/:username" element={user ? <Profile /> : <Navigate to="/auth" replace />} />
                <Route path="/settings" element={user ? <Settings /> : <Navigate to="/auth" replace />} />
                <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/auth" replace />} />
                {/* 🚀 COMPLETE: Main Sidebar + Messages Sidebar + Chat Window */}
                <Route path="/messages" element={user ? <CompleteMessages /> : <Navigate to="/auth" replace />} />
                <Route path="/messages/new/:userId" element={user ? <CompleteMessages /> : <Navigate to="/auth" replace />} />
                <Route path="/messages/:conversationId" element={user ? <CompleteMessages /> : <Navigate to="/auth" replace />} />
                <Route path="/calls" element={user ? <Calls /> : <Navigate to="/auth" replace />} />

                {/* Teen Care Routes */}
                <Route path="/guardian/dashboard" element={user ? <TeenCareGuardianDashboard /> : <Navigate to="/auth" replace />} />
                <Route path="/guardian/dashboard/:teenId" element={user ? <TeenCareGuardianDashboard /> : <Navigate to="/auth" replace />} />

                {/* Trust Shield Routes */}
                <Route path="/security" element={user ? <SecurityCenter /> : <Navigate to="/auth" replace />} />
                <Route path="/verification-center" element={user ? <VerificationCenter /> : <Navigate to="/auth" replace />} />
                <Route path="/badge-center" element={user ? <BadgeCenter /> : <Navigate to="/auth" replace />} />

                {/* Government ID Verification Routes */}
                <Route path="/verification/government-id" element={user ? <GovernmentIDVerification /> : <Navigate to="/auth" replace />} />
                <Route path="/verification/parent-consent" element={user ? <ParentConsent /> : <Navigate to="/auth" replace />} />
                <Route path="/auth/digilocker/callback" element={<DigiLockerCallback />} />

                {/* Admin Routes */}
                <Route path="/admin/trust-shield" element={
                    <AdminRoute>
                        <AdminTrustShield />
                    </AdminRoute>
                } />
                <Route path="/admin/badges" element={
                    <AdminRoute>
                        <BadgeAdminDashboard />
                    </AdminRoute>
                } />

                {/* Report & Support Routes */}
                <Route path="/my-reports" element={user ? <MyReports /> : <Navigate to="/auth" replace />} />
                <Route path="/support" element={user ? <SupportCenter /> : <Navigate to="/auth" replace />} />
                <Route path="/support/new" element={user ? <SubmitTicket /> : <Navigate to="/auth" replace />} />

                {/* Moderation Routes */}
                <Route path="/content-warning" element={<ContentWarningPage />} />
                <Route path="/admin/moderation/auto-flagged" element={
                    <AdminRoute>
                        <AutoFlaggedContent />
                    </AdminRoute>
                } />
                <Route path="/admin/moderation/image-queue" element={
                    <AdminRoute>
                        <ImageReviewQueue />
                    </AdminRoute>
                } />
                <Route path="/admin/moderation/logs" element={
                    <AdminRoute>
                        <ModerationLogs />
                    </AdminRoute>
                } />

                <Route path="/admin/reports" element={
                    <AdminRoute>
                        <AdminReports />
                    </AdminRoute>
                } />

                {/* Catch all - Redirect to Home or Auth */}
                <Route path="*" element={<Navigate to={user ? "/home" : "/auth"} replace />} />
            </Routes>

            {/* Global Incoming Call Modal */}
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
                <ThemeProvider>
                    <FocuslyProvider>
                        <AppContent />
                        {/* <FocuslyWidget /> */}
                        <ToastContainer position="bottom-right" theme="dark" />
                    </FocuslyProvider>
                </ThemeProvider>
            </AuthProvider>
        </QueryProvider>
    );
}

export default App;
