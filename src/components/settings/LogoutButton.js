import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import ConfirmationModal from './ConfirmationModal';
import { useLanguage } from '../../hooks/useLanguage';

const LogoutButton = ({ onSuccess }) => {
  const { t } = useLanguage();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Clean up peer instance if exists
      if (window.peerInstance) {
        try {
          window.peerInstance.destroy();
          window.peerInstance = null;
        } catch (err) {
          console.warn('Error destroying peer instance:', err);
        }
      }

      // Close all active peer connections
      if (window.activeConnections) {
        window.activeConnections.forEach(conn => {
          try {
            conn.close();
          } catch (err) {
            console.warn('Error closing connection:', err);
          }
        });
        window.activeConnections.clear();
      }

      // Clear localStorage
      const keysToKeep = ['focus-theme', 'focus-language'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      // Clear session storage
      sessionStorage.clear();

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error during logout:', error);
      alert('Failed to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button 
        className="logout-button danger-zone"
        onClick={() => setShowConfirm(true)}
        disabled={isLoggingOut}
        aria-label={t('logout.button')}
      >
        <span className="logout-icon">🚪</span>
        <span className="logout-text">{t('logout.button')}</span>
      </button>

      <ConfirmationModal
        isOpen={showConfirm}
        title={t('logout.button')}
        message={t('logout.confirm')}
        confirmText={t('logout.button')}
        cancelText={t('common.cancel')}
        onConfirm={handleLogout}
        onCancel={() => setShowConfirm(false)}
        danger={true}
      />
    </>
  );
};

export default LogoutButton;
