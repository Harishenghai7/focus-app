import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AppStateContext = createContext();

const initialState = {
  user: null,
  userProfile: null,
  posts: [],
  notifications: [],
  unreadCount: 0,
  followingUsers: new Set(),
  likedPosts: new Set(),
  savedPosts: new Set(),
  blockedUsers: new Set(),
  mutedUsers: new Set(),
  onlineUsers: new Set(),
  deviceId: null,
  connectionStatus: 'online'
};

function appStateReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
    case 'UPDATE_POSTS':
      return { ...state, posts: action.payload };
    case 'ADD_POST':
      return { 
        ...state, 
        posts: [action.payload, ...state.posts].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )
      };
    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post => 
          post.id === action.payload.id ? { ...post, ...action.payload } : post
        )
      };
    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload)
      };
    case 'TOGGLE_LIKE':
      const newLikedPosts = new Set(state.likedPosts);
      if (action.payload.liked) {
        newLikedPosts.add(action.payload.postId);
      } else {
        newLikedPosts.delete(action.payload.postId);
      }
      return { ...state, likedPosts: newLikedPosts };
    case 'TOGGLE_FOLLOW':
      const newFollowingUsers = new Set(state.followingUsers);
      if (action.payload.following) {
        newFollowingUsers.add(action.payload.userId);
      } else {
        newFollowingUsers.delete(action.payload.userId);
      }
      return { ...state, followingUsers: newFollowingUsers };
    case 'TOGGLE_SAVE':
      const newSavedPosts = new Set(state.savedPosts);
      if (action.payload.saved) {
        newSavedPosts.add(action.payload.postId);
      } else {
        newSavedPosts.delete(action.payload.postId);
      }
      return { ...state, savedPosts: newSavedPosts };
    case 'BLOCK_USER':
      const newBlockedUsers = new Set(state.blockedUsers);
      newBlockedUsers.add(action.payload);
      return { 
        ...state, 
        blockedUsers: newBlockedUsers,
        posts: state.posts.filter(post => post.user_id !== action.payload)
      };
    case 'MUTE_USER':
      const newMutedUsers = new Set(state.mutedUsers);
      newMutedUsers.add(action.payload);
      return { 
        ...state, 
        mutedUsers: newMutedUsers,
        posts: state.posts.filter(post => post.user_id !== action.payload)
      };
    case 'SET_NOTIFICATIONS':
      return { 
        ...state, 
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.read).length
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    case 'SET_DEVICE_ID':
      return { ...state, deviceId: action.payload };
    case 'SYNC_MULTI_DEVICE_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);

  // Initialize device ID
  useEffect(() => {
    let deviceId = localStorage.getItem('focus_device_id');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('focus_device_id', deviceId);
    }
    dispatch({ type: 'SET_DEVICE_ID', payload: deviceId });
  }, []);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
    const handleOffline = () => dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Multi-device sync listener for real-time state synchronization
  useEffect(() => {
    if (!state.user?.id) return;

    const channel = supabase
      .channel(`user-sync-${state.user.id}`)
      .on('broadcast', { event: 'state_sync' }, (payload) => {
        if (payload.deviceId !== state.deviceId) {
          // Apply multi-device sync state changes
          dispatch({ type: 'SYNC_MULTI_DEVICE_STATE', payload: payload.data });
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [state.user?.id, state.deviceId]);

  const value = {
    state,
    dispatch,
    // Helper functions
    updateUser: (userData) => dispatch({ type: 'SET_USER', payload: userData }),
    updateUserProfile: (profileData) => dispatch({ type: 'SET_USER_PROFILE', payload: profileData }),
    addPost: (post) => dispatch({ type: 'ADD_POST', payload: post }),
    updatePost: (post) => dispatch({ type: 'UPDATE_POST', payload: post }),
    deletePost: (postId) => dispatch({ type: 'DELETE_POST', payload: postId }),
    toggleLike: (postId, liked) => dispatch({ type: 'TOGGLE_LIKE', payload: { postId, liked } }),
    toggleFollow: (userId, following) => dispatch({ type: 'TOGGLE_FOLLOW', payload: { userId, following } }),
    toggleSave: (postId, saved) => dispatch({ type: 'TOGGLE_SAVE', payload: { postId, saved } }),
    blockUser: (userId) => dispatch({ type: 'BLOCK_USER', payload: userId }),
    muteUser: (userId) => dispatch({ type: 'MUTE_USER', payload: userId }),
    addNotification: (notification) => dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    markNotificationRead: (notificationId) => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId }),
    
    // Multi-device sync - broadcasts state changes to other devices
    broadcastStateChange: (data) => {
      if (state.user?.id) {
        supabase
          .channel(`user-sync-${state.user.id}`)
          .send({
            type: 'broadcast',
            event: 'state_sync',
            payload: { deviceId: state.deviceId, data }
          });
      }
    }
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

export default AppStateContext;