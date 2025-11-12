import React, { useEffect, useState, lazy, Suspense, useRef, useCallback } from "react";
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

// ✅ SECURITY FIX: Only expose in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.supabase = supabase;
}

// Lazy load pages with retry logic
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const Home = lazyWithRetry(() => import("./pages/Home"));
const Explore = lazyWithRetry(() => import("./pages/Explore"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Messages = lazyWithRetry(() => import("./pages/Messages"));
const Notifications = lazyWithRetry(() => import("./pages/Notifications"));
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
const Call = lazyWithRetry(() => import("./pages/Call"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const PageLoader = () => (
  <div className="page-loader">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

// ✅ FIX: Throttle function to limit activity updates
function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [browserWarning, setBrowserWarning] = useState(null);
  const { darkMode } = useTheme();
  
  // ✅ FIX: Use ref to track mounted state
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    initializePolyfills();
    const support = checkBrowserSupport();
    if (!support.isSupported) {
      setBrowserWarning(support.message);
    }
  }, []);

  useEffect(() => {
    const subscription = setupAuthMonitoring(() => {
      if (isMountedRef.current) {
        setShowSessionExpired(true);
      }
    });
    
    if (subscription) {
      subscriptionManager.add('auth_monitoring', subscription, {
        component: 'App',
        type: 'auth'
      });
    }

    if (user) {
      startTokenRefresh(() => {
        if (isMountedRef.current) {
          setShowSessionExpired(true);
        }
      });

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && isMountedRef.current) {
          recordSession(user.id, session);
        }
      });
    }
    
    return () => {
      subscriptionManager.remove('auth_monitoring');
      stopTokenRefresh();
    };
  }, [user]);

  // ✅ FIX: Throttled activity tracking (once per minute)
  useEffect(() => {
    if (!user?.id) return;

    const checkActivityStatus = () => {
      const settings = localStorage.getItem(`focus_settings_${user.id}`);
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.show_activity_status !== false;
      }
      return true;
    };

    const updateActivity = async () => {
      if (!isMountedRef.current) return;
      if (checkActivityStatus()) {
        try {
          await supabase
            .from('profiles')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', user.id);
        } catch (error) {
          // Silently handle
        }
      }
    };

    updateActivity();
    const activityInterval = setInterval(updateActivity, 5 * 60 * 1000);

    // ✅ FIX: Throttle to once per minute
    const throttledUpdate = throttle(updateActivity, 60 * 1000);

    window.addEventListener('click', throttledUpdate);
    window.addEventListener('keypress', throttledUpdate);
    window.addEventListener('scroll', throttledUpdate);

    return () => {
      clearInterval(activityInterval);
      window.removeEventListener('click', throttledUpdate);
      window.removeEventListener('keypress', throttledUpdate);
      window.removeEventListener('scroll', throttledUpdate);
    };
  }, [user?.id]);

  // ✅ FIX: Profile fetch with AbortController
  const fetchUserProfile = useCallback(async (currentUser) => {
    if (!currentUser) {
      if (isMountedRef.current) {
        setShowOnboarding(false);
        setLoading(false);
      }
      return;
    }

    // ✅ FIX: Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => abortControllerRef.current.abort(), 5000);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .abortSignal(abortControllerRef.current.signal)
        .maybeSingle();
      
      clearTimeout(timeoutId);
      
      if (!isMountedRef.current) return;
      
      if (error) {
        console.error('Profile fetch error:', error);
        setUserProfile(null);
        setShowOnboarding(false);
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
            // Silently handle
          }
          
          if (!data.onboarding_completed && hasRequiredFields) {
            supabase
              .from('profiles')
              .update({ onboarding_completed: true })
              .eq('id', currentUser.id)
              .then(() => {});
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
      if (error.name === 'AbortError') {
        console.log('Profile fetch aborted');
        return;
      }
      handleError(error, { context: 'fetchUserProfile', userId: currentUser?.id });
      if (isMountedRef.current) {
        setUserProfile(null);
        setShowOnboarding(false);
        setLoading(false);
      }
    }
  }, []);

  // ✅ FIX: Auth listener with proper cleanup
  useEffect(() => {
    let authSubscription;

    const initializeApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession().catch(() => {
          return { data: { session: null } };
        });
        const currentUser = session?.user ?? null;
        
        if (isMountedRef.current) {
          setUser(currentUser);
          
          if (currentUser) {
            try {
              await fetchUserProfile(currentUser);
            } finally {
              if (isMountedRef.current) setLoading(false);
            }
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Init error:", error);
        handleError(error, { context: 'initializeApp' });
        if (isMountedRef.current) setLoading(false);
      }
    };

    initializeApp();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMountedRef.current) return;

        const newUser = session?.user ?? null;
        setUser(newUser);

        if (newUser) {
          const shouldFetchProfile = !userProfile || 
                                     event === 'SIGNED_IN' || 
                                     !userProfile.onboarding_completed;
          
          if (shouldFetchProfile) {
            try {
              await fetchUserProfile(newUser);
            } finally {
              if (isMountedRef.current) setLoading(false);
            }
          }
        } else {
          setUserProfile(null);
          setShowOnboarding(false);
          setLoading(false);
        }
      });

      authSubscription = subscription;
      
      // ✅ FIX: Add to subscription manager
      if (authSubscription) {
        subscriptionManager.add('auth_state_change', authSubscription, {
          component: 'App',
          type: 'auth'
        });
      }
    } catch (error) {
      if (isMountedRef.current) setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      subscriptionManager.remove('auth_state_change');
      if (authSubscription) {
        try {
          authSubscription.unsubscribe();
        } catch (error) {
          // Silently handle
        }
      }
    };
  }, [fetchUserProfile]); // ✅ FIX: Added dependency

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

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
    const completeProfile = {
      ...profileData,
      onboarding_completed: true
    };
    setUserProfile(completeProfile);
    setShowOnboarding(false);
    setLoading(false);
    
    try {
      localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
    } catch (e) {
      // Silently handle
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

  if (!loading && user && showOnboarding && !userProfile?.onboarding_completed) {
    if (!user.id || !user.email) {
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
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/auth';
              }}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Reset & Sign In
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

function RouterContent({ user, userProfile }) {
  useKeyboardShortcuts(!!user);
  
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
      
      <main id="main-content" className="app-main" role="main">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route 
              path="/auth" 
              element={!user ? <Auth /> : <Navigate to="/home" replace />} 
            />
            <Route path="/" element={<Navigate to={user ? "/home" : "/auth"} replace />} />
            <Route path="/home" element={<ProtectedRoute user={user}><Home user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute user={user}><Explore user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute user={user}><Create user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute user={user}><Profile user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute user={user}><Messages user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/messages/:chatId" element={<ProtectedRoute user={user}><Messages user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/group/:groupId" element={<ProtectedRoute user={user}><GroupChat user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/highlights" element={<ProtectedRoute user={user}><Highlights user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/highlight/:highlightId" element={<ProtectedRoute user={user}><HighlightViewer user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute user={user}><Settings user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/follow-requests" element={<ProtectedRoute user={user}><FollowRequests user={user} userProfile={userProfile} /></ProtectedRoute>} />
            {/* ✅ FIX: Removed duplicate /follow-requests route */}
            <Route path="/blocked-users" element={<ProtectedRoute user={user}><BlockedUsers user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/close-friends" element={<ProtectedRoute user={user}><CloseFriends user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/boltz" element={<ProtectedRoute user={user}><Boltz user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/flash" element={<ProtectedRoute user={user}><Flash user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/flash/:userId" element={<ProtectedRoute user={user}><Flash user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/post/:postId" element={<ProtectedRoute user={user}><PostDetail user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute user={user}><Notifications user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/edit-profile" element={<ProtectedRoute user={user}><EditProfile user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/archive" element={<ProtectedRoute user={user}><Archive user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/profile/:username" element={<ProtectedRoute user={user}><Profile user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/chat/:userId" element={<ProtectedRoute user={user}><ChatThread user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/calls" element={<ProtectedRoute user={user}><Calls user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute user={user}><Saved user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute user={user}><Analytics user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute user={user}><AdminDashboard user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/hashtag/:hashtag" element={<ProtectedRoute user={user}><HashtagPage user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/profile/:username/followers" element={<ProtectedRoute user={user}><FollowersList user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/profile/:username/following" element={<ProtectedRoute user={user}><FollowingList user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/call/:userId" element={<ProtectedRoute user={user}><Call user={user} userProfile={userProfile} /></ProtectedRoute>} />
            <Route path="/call" element={<ProtectedRoute user={user}><Calls user={user} userProfile={userProfile} /></ProtectedRoute>} />
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