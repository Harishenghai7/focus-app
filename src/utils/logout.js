import { supabase } from '../supabaseClient';

export const logout = async () => {

  try {
    // Clear peer instance first
    if (window.peerInstance) {

      try {
        window.peerInstance.destroy();
        window.peerInstance = null;
      } catch (e) {

      }
    }

    // Sign out from Supabase with timeout

    try {
      // Add timeout to prevent hanging
      const signoutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Signout timeout')), 5000)
      );

      const { error } = await Promise.race([signoutPromise, timeoutPromise]);

      if (error) {

      } else {

      }
    } catch (signoutError) {

    }

    // Clear all storage immediately after signout

    localStorage.clear();
    sessionStorage.clear();

    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 100));

    // Force complete page reload to clear all React state

    window.location.replace(window.location.origin + '/auth');

  } catch (error) {

    // Force reload even on error
    window.location.replace(window.location.origin + '/auth');
  }
};
