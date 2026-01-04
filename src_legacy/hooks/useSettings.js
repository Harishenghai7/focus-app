import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

export const useSettings = (userId) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const originalSettings = useRef(null);
  const subscriptionRef = useRef(null);

  // Fetch user settings
  const fetchSettings = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch from user_settings table
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      // Fetch profile for additional settings
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Default settings
      const defaultSettings = {
        // Account
        email: null,
        phone: null,
        
        // Privacy
        private_account: false,
        show_activity_status: true,
        allow_message_requests: true,
        allow_calls: true,
        allow_tags: true,
        allow_mentions: true,
        discoverable: true,
        
        // Notifications
        push_notifications: true,
        notify_likes: true,
        notify_comments: true,
        notify_messages: true,
        notify_tags: true,
        notify_followers: true,
        notify_call_invites: true,
        notify_stories: true,
        notify_boltz: true,
        notify_flash: true,
        email_notifications: false,
        
        // Theme & Appearance
        theme: 'auto', // light, dark, auto
        font_size: 'medium', // small, medium, large
        high_contrast: false,
        reduce_motion: false,
        
        // Language & Region
        language: 'en',
        region: 'US',
        
        // OAuth connections
        oauth_google: false,
        oauth_github: false,
        oauth_discord: false,
      };

      const mergedSettings = {
        ...defaultSettings,
        ...settingsData,
        private_account: profileData?.private_account ?? defaultSettings.private_account,
      };

      setSettings(mergedSettings);
      originalSettings.current = JSON.parse(JSON.stringify(mergedSettings));
      setIsDirty(false);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update settings
  const updateSettings = useCallback(async (updates) => {
    if (!userId) return false;

    try {
      const newSettings = { ...settings, ...updates };

      // Handle private_account in profiles table
      if ('private_account' in updates) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ private_account: updates.private_account })
          .eq('id', userId);

        if (profileError) throw profileError;
      }

      // Update user_settings table
      const settingsToUpdate = { ...updates };
      delete settingsToUpdate.private_account; // Already updated in profiles

      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...settingsToUpdate,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (settingsError) throw settingsError;

      // Optimistic update
      setSettings(newSettings);
      setIsDirty(JSON.stringify(newSettings) !== JSON.stringify(originalSettings.current));
      
      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err.message);
      return false;
    }
  }, [userId, settings]);

  // Revert to original settings
  const revertSettings = useCallback(() => {
    if (originalSettings.current) {
      setSettings(JSON.parse(JSON.stringify(originalSettings.current)));
      setIsDirty(false);
    }
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!userId) return;

    fetchSettings();

    // Setup realtime subscription
    const channel = supabase
      .channel(`user_settings_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Settings changed:', payload);
          if (payload.new) {
            setSettings(prev => ({
              ...prev,
              ...payload.new
            }));
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [userId, fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    revertSettings,
    isDirty,
    refetch: fetchSettings
  };
};
