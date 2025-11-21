import React, { createContext, useContext } from 'react';
import { useAppState } from './AppStateContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { state } = useAppState();
  
  const value = {
    user: state.user,
    userProfile: state.userProfile,
    isAuthenticated: !!state.user,
    isLoading: false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
