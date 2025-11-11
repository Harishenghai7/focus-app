import React, { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AppStateProvider } from "./context/AppStateContext";
import TestButton from "./components/TestButton";
import { setupAuthMonitoring } from "./utils/apiErrorHandler";
import { handleError } from "./utils/errorHandler";
import subscriptionManager from "./utils/subscriptionManager";
import { startTokenRefresh, stopTokenRefresh, recordSession } from "./utils/sessionManager";
import { lazyWithRetry } from "./utils/lazyLoad";
import { initializePolyfills, checkBrowserSupport } from "./utils/browserCompatibility";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import OnboardingFlow from "./components/OnboardingFlow";
import OfflineIndicator from "./components/OfflineIndicator";
import ErrorBoundary from "./components/ErrorBoundary";
import SessionExpiredModal from "./components/SessionExpiredModal";
import RealtimeNotifications from "./components/RealtimeNotifications";
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import IncomingCallListener from "./components/IncomingCallListener";
import KeyboardShortcutsHelp from "./components/KeyboardShortcutsHelp";
import ScreenReaderAnnouncer from "./components/ScreenReaderAnnouncer";
import OrientationHandler from "./components/OrientationHandler";
import UpdateNotification from "./components/UpdateNotification";
import { useKeyboardShortcuts } from "./hooks/useKeyboardNavigation";
import "./styles/focus-theme.css";
import "./styles/accessibility.css";
import "./App.css";

// Make Supabase available for testing
if (typeof window !== 'undefined') {
  window.supabase = supabase;
}

// Lazy load pages for code splitting with retry logic
// Core pages - higher priority
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const Home = lazyWithRetry(() => import("./pages/Home"));
const Explore = lazyWithRetry(() => import("./pages/Explore"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Messages = lazyWithRetry(() => import("./pages/Messages"));
const Notifications = lazyWithRetry(() => import("./pages/Notifications"));

// Feature pages - standard lazy loading
const Create = lazy(() => import("./pages/CreateMultiType"));
const GroupChat = lazy(() => import("./pages/GroupChat"));
const Highlights = lazy(() => import("./pages/Highlights"));
const HighlightViewer = lazy(() => import("./pages/HighlightViewer"));
const Settings = lazy(() => import("./pages/Settings"));
const CloseFriends = lazy(() => import("./pages/CloseFriends"));
const Boltz = lazy(() => import("./pages/Boltz"));
const Flash = lazy(() => import("./pages/Flash"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Archive = lazy(() => import("./pages/Archive"));
const ChatThread = lazy(() => import("./pages/ChatThread"));
const Calls = lazy(() => import("./pages/Calls"));
const Saved = lazy(() => import("./pages/Saved"));
const FollowRequests = lazy(() => import("./pages/FollowRequests"));
const BlockedUsers = lazy(() => import("./pages/BlockedUsers"));
const HashtagPage = lazy(() => import("./pages/HashtagPage"));
const FollowersList = lazy(() => import("./pages/FollowersList"));
const FollowingList = lazy(() => import("./pages/FollowingList"));

// Heavy components - lazy load with retry (WebRTC, video processing)
const Call = lazyWithRetry(() => import("./pages/Call"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

// Loading fallback component
const PageLoader = () => (
  <div className="page-loader">
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
  const [showAIInsights, setShowAIInsights] = useState(false);
  const { darkMode } = useTheme();

  // Initialize browser compatibility on mount
  useEffect(() => {
    // Initialize polyfills for older browsers
    initializePolyfills();
    
    // Check browser support
    const support = checkBrowserSupport();
    if (!support.isSupported) {
      setBrowserWarning(support.message);
    }
  }, []);

  // Setup session monitoring and automatic token refresh
  useEffect(() => {
    const subscription = setupAuthMonitoring(() => {
      setShowSessionExpired(true);
    });
    
    // Add to subscription manager
    if (subscription) {
      subscriptionManager.add('auth_monitoring', subscription, {
        component: 'App',
        type: 'auth'
      });
    }

    // Start automatic token refresh when user is logged in
    if (user) {
      startTokenRefresh(() => {
        // Show warning when session is about to expire
        setShowSessionExpired(true);
      });

      // Record session
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

  // Activity status tracking
  useEffect(() => {
    if (!user?.id) return;

    // Check if activity status is enabled
    const checkActivityStatus = () => {
      const settings = localStorage.getItem(`focus_settings_${user.id}`);
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.show_activity_status !== false;
      }
      return true; // Default to enabled
    };

    const updateActivity = async () => {
      if (checkActivityStatus()) {
        try {
          await supabase
            .from('profiles')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', user.id);
        } catch (error) {
          // Silently handle activity status update errors
        }
      }
    };

    // Update activity on mount
    updateActivity();

    // Update activity every 5 minutes
    const activityInterval = setInterval(updateActivity, 5 * 60 * 1000);

    // Update activity on user interaction
    const handleActivity = () => {
      updateActivity();
    };

    // Listen for user interactions
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

  // Profile fetch with timeout and fallback
  const fetchUserProfile = async (currentUser) => {
    if (!currentUser) {
      setShowOnboarding(false);
      setLoading(false);
      return;
    }

    // Set a maximum timeout of 5 seconds
    const timeoutId = setTimeout(() => {
      setShowOnboarding(false); // Don't show onboarding on timeout
      setLoading(false);
    }, 5000);

    try {
      
      // Try to fetch profile with a race against timeout
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
        console.error('Profile fetch error:', error);
        // Database error - try to continue without profile for now
        setUserProfile(null);
        setShowOnboarding(false);
        setLoading(false);
        return;
      }
      
      if (data) {
        
        // Check localStorage cache first for faster response
        const cachedComplete = localStorage.getItem(`onboarding_complete_${currentUser.id}`) === 'true';
        
        // If profile has username and full_name, consider onboarding complete
        // This handles cases where onboarding_completed flag wasn't set
        const hasRequiredFields = data.username && data.full_name;
        const isOnboardingComplete = data.onboarding_completed || hasRequiredFields || cachedComplete;
        
        // Always set the profile first
        const completeProfile = { ...data, onboarding_completed: isOnboardingComplete };
        setUserProfile(completeProfile);
        
        if (!isOnboardingComplete) {
          // Only show onboarding if profile exists but is incomplete
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
          
          // Cache the completion status
          try {
            localStorage.setItem(`onboarding_complete_${currentUser.id}`, 'true');
          } catch (e) {
            // Silently handle cache failure
          }
          
          // Update the database flag if it wasn't set
          if (!data.onboarding_completed && hasRequiredFields) {
            supabase
              .from('profiles')
              .update({ onboarding_completed: true })
              .eq('id', currentUser.id)
              .then(({ error }) => {
                // Silently handle update errors
              });
          }
        }
        setLoading(false);
        return;
      }
      
      // No profile found - this means the trigger didn't work or profile was deleted
      // Show onboarding to create a new profile
      setUserProfile(null);
      setShowOnboarding(true);
      setLoading(false);
      
    } catch (error) {
      clearTimeout(timeoutId);
      handleError(error, { context: 'fetchUserProfile', userId: currentUser?.id });
      // On error, don't show onboarding - let user continue
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
        
        const { data: { session } } = await supabase.auth.getSession().catch(err => {
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

    // Auth listener with error handling
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        
        if (!isMounted) return;

        // Skip profile fetch for token refresh events if we already have a complete profile
        if (event === 'TOKEN_REFRESHED') {
          if (userProfile?.onboarding_completed) {
            return;
          }
        }

        // Skip profile fetch for initial session if we already have a complete profile
        if (event === 'INITIAL_SESSION' && userProfile?.onboarding_completed) {
          return;
        }

        const newUser = session?.user ?? null;
        setUser(newUser);

        if (newUser) {
          // Only fetch profile if:
          // 1. We don't have a profile yet, OR
          // 2. It's a sign-in event, OR
          // 3. The profile is incomplete
          const shouldFetchProfile = !userProfile || 
                                     event === 'SIGNED_IN' || 
                                     !userProfile.onboarding_completed;
          
          if (shouldFetchProfile) {
            try {
              await fetchUserProfile(newUser);
            } finally {
              if (isMounted) setLoading(false);
            }
          }
        } else {
          // User logged out - reset everything
          setUserProfile(null);
          setShowOnboarding(false);
          setLoading(false);
        }
      });

      authSubscription = subscription;
    } catch (error) {
      if (isMounted) setLoading(false);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      subscriptionManager.remove('auth_state_change');
      if (authSubscription) {
        try {
          authSubscription.unsubscribe();
        } catch (error) {
          // Silently handle unsubscribe errors
        }
      }
    };
  }, []);

  // Apply theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Loading screen with timeout
  const [showRetry, setShowRetry] = useState(false);
  
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowRetry(true);
      }, 5000); // Show retry option after 5 seconds
      
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
    // Ensure onboarding_completed is true
    const completeProfile = {
      ...profileData,
      onboarding_completed: true
    };
    setUserProfile(completeProfile);
    setShowOnboarding(false);
    setLoading(false);
    
    // Cache the completion status to prevent re-showing onboarding
    try {
      localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
    } catch (e) {
      // Silently handle cache failure
    }
  };
  
  if (loading) {
    return (
      <div className="loading-screen">
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

  // CRITICAL: Check authentication status first
  if (!loading && !user) {
    return (
      <div className={`focus-app ${darkMode ? "dark" : ""}`}>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </Router>
      </div>
    );
  }

  // Show onboarding ONLY if user is authenticated AND profile is incomplete
  // CRITICAL: Also check that we don't already have a complete profile in state
  if (!loading && user && showOnboarding && !userProfile?.onboarding_completed) {
    // Double-check user has required properties
    if (!user.id || !user.email) {
      
      // Show error with reset option
      return (
        <div className={`focus-app ${darkMode ? "dark" : ""}`}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--bg-primary)'
          }}>
            <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ Session Error</h1>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
              Invalid session detected. Please reset the app.
            </p>
            <button
              onClick={() => window.location.href = '/force-reset.html'}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              🔧 Reset App Now
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/auth';
              }}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Quick Clear & Retry
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`focus-app ${darkMode ? "dark" : ""}`}>
        <OnboardingFlow 
          user={user} 
          onComplete={handleOnboardingComplete}
        />
      </div>
    );
  }

  return (
    <div className={`focus-app ${darkMode ? "dark" : ""}`}>
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
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
      <UpdateNotification />
      {user && <RealtimeNotifications user={user} />}
      {user && <PushNotificationPrompt user={user} />}
      {user && <KeyboardShortcutsHelp />}
      <ScreenReaderAnnouncer />
      <Router>
        <RouterContent user={user} userProfile={userProfile} />
      </Router>
    </div>
  );
}

// Component that uses Router context
function RouterContent({ user, userProfile }) {
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showEnhancedAI, setShowEnhancedAI] = useState(false);
  
  // Enable keyboard shortcuts (must be inside Router)
  useKeyboardShortcuts(!!user);
  
  // Test runner keyboard shortcut
  useEffect(() => {
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
    <>
      {user && <Header user={user} userProfile={userProfile} />}
      {user && <IncomingCallListener user={user} />}
      {user && <TestButton />}
      
      {/* AI dashboards disabled */}
      
      <main id="main-content" className="app-main" role="main">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route 
              path="/auth" 
              element={!user ? <Auth /> : <Navigate to="/home" replace />} 
            />
            
            <Route 
              path="/" 
              element={<Navigate to={user ? "/home" : "/auth"} replace />} 
            />
            
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
              path="/profile" 
              element={
                <ProtectedRoute user={user}>
                  <Profile user={user} userProfile={userProfile} />
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
              path="/messages/:chatId"
              element={
                <ProtectedRoute user={user}>
                  <Messages user={user} userProfile={userProfile} />
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
              path="/settings"
              element={
                <ProtectedRoute user={user}>
                  <Settings user={user} userProfile={userProfile} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/follow-requests"
              element={
                <ProtectedRoute user={user}>
                  <FollowRequests user={user} userProfile={userProfile} />
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

            <Route
              path="/boltz"
              element={
                <ProtectedRoute user={user}>
                  <Boltz user={user} userProfile={userProfile} />
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
              path="/post/:postId"
              element={
                <ProtectedRoute user={user}>
                  <PostDetail user={user} userProfile={userProfile} />
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
              path="/edit-profile"
              element={
                <ProtectedRoute user={user}>
                  <EditProfile user={user} userProfile={userProfile} />
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

            <Route
              path="/profile/:username"
              element={
                <ProtectedRoute user={user}>
                  <Profile user={user} userProfile={userProfile} />
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
              path="/calls"
              element={
                <ProtectedRoute user={user}>
                  <Calls user={user} userProfile={userProfile} />
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
              path="/follow-requests"
              element={
                <ProtectedRoute user={user}>
                  <FollowRequests user={user} userProfile={userProfile} />
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
              path="/admin"
              element={
                <ProtectedRoute user={user}>
                  <AdminDashboard user={user} userProfile={userProfile} />
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

            <Route path="*" element={<Navigate to={user ? "/home" : "/auth"} replace />} />
          </Routes>
        </Suspense>
      </main>
      
      {user && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <ThemeProvider>
          <OrientationHandler>
            <AppContent />
          </OrientationHandler>
        </ThemeProvider>
      </AppStateProvider>
    </ErrorBoundary>
  );
}
