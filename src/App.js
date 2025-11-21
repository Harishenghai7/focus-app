import React, { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AppStateProvider } from "./context/AppStateContext";
import { AuthProvider } from "./context/AuthContext";
import { setupAuthMonitoring } from "./utils/apiErrorHandler";
import { handleError } from "./utils/errorHandler";
import subscriptionManager from "./utils/subscriptionManager";
import { startTokenRefresh, stopTokenRefresh, recordSession } from "./utils/sessionManager";
import { lazyWithRetry } from "./utils/lazyLoad";
import { initializePolyfills, checkBrowserSupport } from "./utils/browserCompatibility";
import ResponsiveLayout from "./components/ResponsiveLayout";
import OfflineIndicator from "./components/OfflineIndicator";
import ErrorBoundary from "./components/ErrorBoundary";
import SessionExpiredModal from "./components/SessionExpiredModal";
import RealtimeNotifications from "./components/RealtimeNotifications";
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import IncomingCallListener from "./components/IncomingCallListener";
import ScreenReaderAnnouncer from "./components/ScreenReaderAnnouncer";
import OrientationHandler from "./components/OrientationHandler";
import { useKeyboardShortcuts } from "./hooks/useKeyboardNavigation";
import { initializeFocuslyWithReference } from "./services/focuslyAI";
import "./index.css";

// Lazy load heavy/optional components
const OnboardingFlow = lazyWithRetry(() => import("./components/OnboardingFlow"));
const UpdateNotification = lazyWithRetry(() => import("./components/UpdateNotification"));
const KeyboardShortcutsHelp = lazyWithRetry(() => import("./components/KeyboardShortcutsHelp"));

// Browser Warning Banner Component
const BrowserWarningBanner = ({ message, onDismiss }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ff9800',
    color: '#000',
    padding: '12px 20px',
    textAlign: 'center',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
  }}>
    <div style={{ flex: 1 }}>
      <strong>⚠️ Browser Compatibility:</strong> {message}
    </div>
    <button
      onClick={onDismiss}
      style={{
        background: 'rgba(0,0,0,0.2)',
        border: 'none',
        color: '#000',
        padding: '6px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
      }}
      aria-label="Dismiss browser warning"
    >
      Dismiss
    </button>
  </div>
);

// Make Supabase available for testing (dev only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.supabase = supabase;
}

// Lazy load pages
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const AuthCallback = lazyWithRetry(() => import("./pages/AuthCallback")); // ✅ NEW
const Home = lazyWithRetry(() => import("./pages/Home"));
const Explore = lazyWithRetry(() => import("./pages/Explore"));
const Search = lazyWithRetry(() => import("./pages/Search"));
const Trending = lazyWithRetry(() => import("./pages/Trending"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Messages = lazyWithRetry(() => import("./pages/Messages"));
const Notifications = lazyWithRetry(() => import("./pages/Notifications"));

// Feature pages
const Create = lazyWithRetry(() => import("./pages/Create"));
const GroupChat = lazyWithRetry(() => import("./pages/GroupChat"));
const Highlights = lazyWithRetry(() => import("./pages/Highlights"));
const HighlightViewer = lazyWithRetry(() => import("./pages/HighlightViewer"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));
const CloseFriends = lazyWithRetry(() => import("./pages/CloseFriends"));
const Boltz = lazyWithRetry(() => import("./pages/Boltz"));
const BoltzDetail = lazyWithRetry(() => import("./pages/BoltzDetail"));
const Flash = lazyWithRetry(() => import("./pages/Flash"));
const PostDetail = lazyWithRetry(() => import("./pages/PostDetail"));
const EditProfile = lazyWithRetry(() => import("./pages/EditProfile"));
const Archive = lazyWithRetry(() => import("./pages/Archive"));
const ChatThread = lazyWithRetry(() => import("./pages/ChatThread"));
const Calls = lazyWithRetry(() => import("./pages/Calls"));
const Saved = lazyWithRetry(() => import("./pages/Saved"));
const FollowRequests = lazyWithRetry(() => import("./pages/FollowRequests"));
const BlockedUsers = lazyWithRetry(() => import("./pages/BlockedUsers"));
const HashtagPage = lazyWithRetry(() => import("./pages/HashtagPage"));
const FollowersList = lazyWithRetry(() => import("./pages/FollowersList"));
const FollowingList = lazyWithRetry(() => import("./pages/FollowingList"));
const Call = lazyWithRetry(() => import("./pages/Call"));
const Analytics = lazyWithRetry(() => import("./pages/Analytics"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
// const TestWebRTC = lazyWithRetry(() => import("./pages/TestWebRTC")); // Commented out - file doesn't exist
const LiveStream = lazyWithRetry(() => import("./pages/LiveStream"));
const People = lazyWithRetry(() => import("./pages/People"));
const Invite = lazyWithRetry(() => import("./pages/Invite"));
const TrustDashboard = lazyWithRetry(() => import("./pages/TrustDashboard"));

// Additional feature pages
const Likes = lazyWithRetry(() => import("./pages/Likes"));
const GuardianPending = lazyWithRetry(() => import("./pages/GuardianPending"));
const VerifyGuardian = lazyWithRetry(() => import("./pages/VerifyGuardian"));
const UserSearch = lazyWithRetry(() => import("./pages/UserSearch"));
const Focusly = lazyWithRetry(() => import("./pages/Focusly"));

// Loading fallback
const PageLoader = () => (
  <div className="page-loader" role="status" aria-live="polite">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

// Protected Route
function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [browserWarning, setBrowserWarning] = useState(null);
  const { darkMode } = useTheme();

  // Initialize browser compatibility
  useEffect(() => {
    initializePolyfills();
    
    const support = checkBrowserSupport();
    if (!support.isSupported) {
      setBrowserWarning(support.message);
    }
  }, []);

  // Initialize Focusly with visual reference
  useEffect(() => {
    const initializeFocusly = async () => {
      try {
        console.log('🦁 Initializing Focusly AI with visual reference...');
        await initializeFocuslyWithReference();
        console.log('✅ Focusly ready with visual reference!');
      } catch (error) {
        console.warn('⚠️ Focusly initialization ongoing or skipped:', error.message);
      }
    };

    // Initialize Focusly in background (non-blocking)
    initializeFocusly();
  }, []);

  // Setup session monitoring
  useEffect(() => {
    const subscription = setupAuthMonitoring(() => {
      setShowSessionExpired(true);
    });
    
    if (subscription) {
      subscriptionManager.add('auth_monitoring', subscription, {
        component: 'App',
        type: 'auth'
      });
    }

    if (user) {
      startTokenRefresh(() => {
        setShowSessionExpired(true);
      });

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          recordSession(user.id, session);
        }
      });
    }
    
    return () => {
      subscriptionManager.remove('auth_monitoring');
      stopTokenRefresh();
    };
  }, [user]);

  // Activity tracking
  useEffect(() => {
    if (!user?.id) return;

    const userId = user.id;

    const checkActivityStatus = () => {
      const settings = localStorage.getItem(`focus_settings_${userId}`);
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.show_activity_status !== false;
      }
      return true;
    };

    const updateActivity = async () => {
      if (checkActivityStatus()) {
        try {
          await supabase
            .from('profiles')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', userId);
        } catch (error) {
          // Silent fail
        }
      }
    };

    updateActivity();

    const activityInterval = setInterval(updateActivity, 5 * 60 * 1000);

    const handleActivity = () => {
      updateActivity();
    };

    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      clearInterval(activityInterval);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [user?.id]);

  // Fetch user profile
  const fetchUserProfile = async (currentUser) => {
    if (!currentUser) {
      setShowOnboarding(false);
      setLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      console.warn('Profile fetch timeout - showing app anyway');
      setShowOnboarding(false);
      setLoading(false);
    }, 5000);

    try {
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 4000)
      );
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      clearTimeout(timeoutId);
      
      if (error) {
        if (error.message === 'Timeout') {
          console.warn('Profile fetch timeout');
          setUserProfile(null);
          setShowOnboarding(false);
        } else {
          console.error('Profile fetch error:', error);
          handleError(error, { context: 'fetchUserProfile' });
          setUserProfile(null);
          setShowOnboarding(false);
        }
        setLoading(false);
        return;
      }
      
      if (data) {
        const cachedComplete = localStorage.getItem(`onboarding_complete_${currentUser.id}`) === 'true';
        const hasRequiredFields = data.username && data.full_name;
        const isOnboardingComplete = data.onboarding_completed || hasRequiredFields || cachedComplete;
        
        const completeProfile = { ...data, onboarding_completed: isOnboardingComplete };
        setUserProfile(completeProfile);
        
        if (!isOnboardingComplete) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
          
          try {
            localStorage.setItem(`onboarding_complete_${currentUser.id}`, 'true');
          } catch (e) {
            // Silent fail
          }
          
          if (!data.onboarding_completed && hasRequiredFields) {
            supabase
              .from('profiles')
              .update({ onboarding_completed: true })
              .eq('id', currentUser.id)
              .then(() => {
                console.log('Onboarding status updated');
              })
              .catch((error) => {
                console.error('Failed to update onboarding:', error);
              });
          }
        }
        setLoading(false);
        return;
      }
      
      setUserProfile(null);
      setShowOnboarding(true);
      setLoading(false);
      
    } catch (error) {
      clearTimeout(timeoutId);
      handleError(error, { context: 'fetchUserProfile', userId: currentUser?.id });
      setUserProfile(null);
      setShowOnboarding(false);
      setLoading(false);
    }
  };

  // Initialize app
  useEffect(() => {
    let isMounted = true;
    let authSubscription;

    const initializeApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession().catch(() => {
          return { data: { session: null } };
        });
        const currentUser = session?.user ?? null;
        
        if (isMounted) {
          setUser(currentUser);
          
          if (currentUser) {
            try {
              await fetchUserProfile(currentUser);
            } finally {
              if (isMounted) setLoading(false);
            }
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Init error:", error);
        handleError(error, { context: 'initializeApp' });
        if (isMounted) setLoading(false);
      }
    };

    initializeApp();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        console.log('🔵 Auth state change:', event);

        if (event === 'TOKEN_REFRESHED' && userProfile?.onboarding_completed) {
          return;
        }

        if (event === 'INITIAL_SESSION' && userProfile?.onboarding_completed) {
          return;
        }

        const newUser = session?.user ?? null;
        setUser(newUser);

        if (newUser) {
          const shouldFetchProfile = !userProfile || 
                                     event === 'SIGNED_IN' || 
                                     event === 'USER_UPDATED' ||
                                     !userProfile.onboarding_completed;
          
          if (shouldFetchProfile) {
            try {
              await fetchUserProfile(newUser);
            } finally {
              if (isMounted) setLoading(false);
            }
          } else {
            if (isMounted) setLoading(false);
          }
        } else {
          setUserProfile(null);
          setShowOnboarding(false);
          setLoading(false);
        }
      });

      authSubscription = subscription;
    } catch (error) {
      console.error('Auth listener error:', error);
      if (isMounted) setLoading(false);
    }

    return () => {
      isMounted = false;
      subscriptionManager.remove('auth_state_change');
      if (authSubscription) {
        try {
          authSubscription.unsubscribe();
        } catch (error) {
          // Silent fail
        }
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Loading with retry
  const [showRetry, setShowRetry] = useState(false);
  
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowRetry(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowRetry(false);
    }
  }, [loading]);
  
  const handleRetry = () => {
    setLoading(false);
    window.location.reload();
  };
  
  const handleOnboardingComplete = (profileData) => {
    setUserProfile({ ...profileData, onboarding_completed: true });
    setShowOnboarding(false);
    localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
  };
  
  if (loading) {
    return (
      <div className="loading-screen" role="status" aria-live="polite">
        <div className="loading-spinner"></div>
        <p>Loading Focus...</p>
        {showRetry && (
          <button 
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Taking too long? Tap to retry
          </button>
        )}
      </div>
    );
  }

  // Not authenticated
  if (!loading && !user) {
    return (
      <div className={`focus-app ${darkMode ? "dark" : ""}`}>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} /> {/* ✅ NEW */}
            <Route path="/trust" element={<TrustDashboard />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </Router>
        
        <footer className="footer">
          <div className="footer-content">
            <p>&copy; 2025 Focus. All rights reserved.</p>
            <nav aria-label="Footer">
              <a href="/trust" className="footer-link">Trust & Safety</a>
            </nav>
          </div>
        </footer>
      </div>
    );
  }

  // Show onboarding if needed
  if (!loading && user && showOnboarding) {
    return (
      <div className={`focus-app ${darkMode ? "dark" : ""}`}>
        <Suspense fallback={<PageLoader />}>
          <OnboardingFlow 
            user={user} 
            onComplete={handleOnboardingComplete}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className={`focus-app ${darkMode ? "dark" : ""}`}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {browserWarning && (
        <BrowserWarningBanner 
          message={browserWarning} 
          onDismiss={() => setBrowserWarning(null)} 
        />
      )}
      <SessionExpiredModal
        show={showSessionExpired}
        onReauth={async () => {
          setShowSessionExpired(false);
          await supabase.auth.signOut();
          window.location.href = '/auth';
        }}
        onLogout={async () => {
          await supabase.auth.signOut();
          setShowSessionExpired(false);
          window.location.href = '/auth';
        }}
      />
      <OfflineIndicator />
      <Suspense fallback={null}>
        <UpdateNotification />
      </Suspense>
      {user && <RealtimeNotifications user={user} />}
      {user && <PushNotificationPrompt user={user} />}
      {user && (
        <Suspense fallback={null}>
          <KeyboardShortcutsHelp />
        </Suspense>
      )}
      <ScreenReaderAnnouncer />
      <ErrorBoundary>
        <Router>
          <RouterContent user={user} userProfile={userProfile} />
        </Router>
      </ErrorBoundary>
    </div>
  );
}

// Router content
function RouterContent({ user, userProfile }) {
  useKeyboardShortcuts(!!user);
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        document.querySelector('.test-button')?.click();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="focus-app">
      {user && <IncomingCallListener user={user} />}
      
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth routes without Layout wrapper */}
          <Route 
            path="/auth" 
            element={!user ? <Auth /> : <Navigate to="/home" replace />} 
          />
          <Route 
            path="/auth/callback" 
            element={<AuthCallback />} 
          />
          {/* Public trust dashboard (no auth required) */}
          <Route 
            path="/trust" 
            element={<TrustDashboard />} 
          />
          
          {/* All other routes wrapped with ResponsiveLayout */}
          <Route 
            path="/*" 
            element={
              <ResponsiveLayout>
                <Routes>
                  {/* Root redirect */}
                  <Route 
                    path="/" 
                    element={<Navigate to={user ? "/home" : "/auth"} replace />} 
                  />
                  
                  {/* ============ MAIN PAGES ============ */}
                  <Route 
                    path="/home" 
                    element={
                      <ProtectedRoute user={user}>
                        <Home user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/explore" 
                    element={
                      <ProtectedRoute user={user}>
                        <Explore user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/create" 
                    element={
                      <ProtectedRoute user={user}>
                        <Create user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route
                    path="/messages"
                    element={
                      <ProtectedRoute user={user}>
                        <Messages user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute user={user}>
                        <Notifications user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute user={user}>
                        <Profile user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route
                    path="/profile/:username"
                    element={
                      <ProtectedRoute user={user}>
                        <Profile user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* ============ PROFILE SUB-PAGES ============ */}
                  <Route
                    path="/edit-profile"
                    element={
                      <ProtectedRoute user={user}>
                        <EditProfile user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile/:username/edit"
                    element={
                      <ProtectedRoute user={user}>
                        <EditProfile user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile/:username/followers"
                    element={
                      <ProtectedRoute user={user}>
                        <FollowersList user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile/:username/following"
                    element={
                      <ProtectedRoute user={user}>
                        <FollowingList user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/saved"
                    element={
                      <ProtectedRoute user={user}>
                        <Saved user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/archive"
                    element={
                      <ProtectedRoute user={user}>
                        <Archive user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* ============ MESSAGES SUB-PAGES ============ */}
                  <Route
                    path="/messages/:chatId"
                    element={
                      <ProtectedRoute user={user}>
                        <ChatThread user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat/:userId"
                    element={
                      <ProtectedRoute user={user}>
                        <ChatThread user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/group/:groupId"
                    element={
                      <ProtectedRoute user={user}>
                        <GroupChat user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* ============ EXPLORE SUB-PAGES ============ */}
                  <Route
                    path="/post/:postId"
                    element={
                      <ProtectedRoute user={user}>
                        <PostDetail user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hashtag/:hashtag"
                    element={
                      <ProtectedRoute user={user}>
                        <HashtagPage user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route 
                    path="/search" 
                    element={
                      <ProtectedRoute user={user}>
                        <Search user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/trending" 
                    element={
                      <ProtectedRoute user={user}>
                        <Trending user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* ============ NOTIFICATIONS SUB-PAGES ============ */}
                  <Route
                    path="/follow-requests"
                    element={
                      <ProtectedRoute user={user}>
                        <FollowRequests user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* ============ SETTINGS SUB-PAGES ============ */}
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute user={user}>
                        <Settings user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/blocked-users"
                    element={
                      <ProtectedRoute user={user}>
                        <BlockedUsers user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/close-friends"
                    element={
                      <ProtectedRoute user={user}>
                        <CloseFriends user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* ============ FEATURE PAGES ============ */}
                  <Route
                    path="/focusly"
                    element={
                      <ProtectedRoute user={user}>
                        <Focusly user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/boltz"
                    element={
                      <ProtectedRoute user={user}>
                        <Boltz user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/boltz/:boltzId"
                    element={
                      <ProtectedRoute user={user}>
                        <BoltzDetail user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/flash"
                    element={
                      <ProtectedRoute user={user}>
                        <Flash user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/flash/:userId"
                    element={
                      <ProtectedRoute user={user}>
                        <Flash user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/highlights"
                    element={
                      <ProtectedRoute user={user}>
                        <Highlights user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/highlight/:highlightId"
                    element={
                      <ProtectedRoute user={user}>
                        <HighlightViewer user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/calls"
                    element={
                      <ProtectedRoute user={user}>
                        <Calls user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/call/:userId"
                    element={
                      <ProtectedRoute user={user}>
                        <Call user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/call"
                    element={
                      <ProtectedRoute user={user}>
                        <Calls user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute user={user}>
                        <Analytics user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/people"
                    element={
                      <ProtectedRoute user={user}>
                        <People user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/invite"
                    element={
                      <ProtectedRoute user={user}>
                        <Invite user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* ============ LIKES & INTERACTIONS ============ */}
                  <Route
                    path="/post/:postId/likes"
                    element={
                      <ProtectedRoute user={user}>
                        <ErrorBoundary>
                          <Likes user={user} userProfile={userProfile} />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* ============ GUARDIAN VERIFICATION ============ */}
                  <Route
                    path="/guardian/pending"
                    element={
                      <ProtectedRoute user={user}>
                        <ErrorBoundary>
                          <GuardianPending user={user} userProfile={userProfile} />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/guardian/verify/:token"
                    element={
                      <ErrorBoundary>
                        <VerifyGuardian />
                      </ErrorBoundary>
                    }
                  />
                  
                  {/* ============ USER SEARCH ============ */}
                  <Route
                    path="/search/users"
                    element={
                      <ProtectedRoute user={user}>
                        <ErrorBoundary>
                          <UserSearch user={user} userProfile={userProfile} />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* ============ ADMIN ============ */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute user={user}>
                        <AdminDashboard user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* ============ DEV/TEST ============ */}
                  {/* TestWebRTC route commented out - file doesn't exist
                  <Route
                    path="/test-webrtc"
                    element={
                      <ProtectedRoute user={user}>
                        <TestWebRTC user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  */}
                  <Route
                    path="/live/:streamId"
                    element={
                      <ProtectedRoute user={user}>
                        <LiveStream user={user} userProfile={userProfile} />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to={user ? "/home" : "/auth"} replace />} />
                </Routes>
              </ResponsiveLayout>
            }
          />
        </Routes>
      </Suspense>
      
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2025 Focus. All rights reserved.</p>
          <nav aria-label="Footer">
            <a href="/trust" className="footer-link">Trust & Safety</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <AuthProvider>
          <ThemeProvider>
            <OrientationHandler>
              <AppContent />
            </OrientationHandler>
          </ThemeProvider>
        </AuthProvider>
      </AppStateProvider>
    </ErrorBoundary>
  );
}
