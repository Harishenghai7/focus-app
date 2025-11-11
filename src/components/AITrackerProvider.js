import React, { createContext, useContext, useEffect } from 'react';
import { aiTracker } from '../utils/aiTracker';

const AITrackerContext = createContext();

export const AITrackerProvider = ({ children }) => {
  useEffect(() => {
    // Initialize tracking when provider mounts
    aiTracker.startTracking();
    
    return () => {
      // Send final batch when unmounting
      aiTracker.sendEventsToServer();
    };
  }, []);

  const trackFeatureUsage = (featureName, data = {}) => {
    aiTracker.trackCustomEvent(`feature_${featureName}`, {
      ...data,
      timestamp: Date.now(),
      url: window.location.pathname
    });
  };

  const trackUserAction = (action, context = {}) => {
    aiTracker.trackCustomEvent(`user_action_${action}`, {
      ...context,
      timestamp: Date.now(),
      url: window.location.pathname
    });
  };

  const trackEngagement = (type, duration, data = {}) => {
    aiTracker.trackCustomEvent(`engagement_${type}`, {
      duration,
      ...data,
      timestamp: Date.now(),
      url: window.location.pathname
    });
  };

  const setUser = (userId, userProfile = {}) => {
    aiTracker.setUserId(userId);
    aiTracker.trackCustomEvent('user_identified', {
      userId,
      profile: userProfile,
      timestamp: Date.now()
    });
  };

  const value = {
    trackFeatureUsage,
    trackUserAction,
    trackEngagement,
    setUser,
    getInsights: () => aiTracker.getInsights(),
    getHeatmapData: () => aiTracker.getHeatmapData(),
    getSessionSummary: () => aiTracker.getSessionSummary()
  };

  return (
    <AITrackerContext.Provider value={value}>
      {children}
    </AITrackerContext.Provider>
  );
};

export const useAITracker = () => {
  const context = useContext(AITrackerContext);
  if (!context) {
    throw new Error('useAITracker must be used within AITrackerProvider');
  }
  return context;
};