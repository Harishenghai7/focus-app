import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Redirects new users to onboarding, and others to home if needed.
 * Handles missing profile rows as needing onboarding.
 */
export function useOnboardingRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (loading || !user || checking) return;
    setChecking(true);

    async function checkOnboarding() {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is not a fatal error
        console.error('Error checking onboarding status:', error);
        setChecking(false);
        return;
      }

      // If no profile row or onboarding not completed, redirect to onboarding
      if ((!data || !data.onboarding_completed) && location.pathname !== '/onboarding') {
        hasRedirected.current = true;
        navigate('/onboarding', { replace: true });
      }
      // If onboarding completed and on onboarding page, redirect to home
      else if (data?.onboarding_completed && location.pathname === '/onboarding') {
        hasRedirected.current = true;
        navigate('/home', { replace: true });
      }
      setChecking(false);
    }

    checkOnboarding();
    // eslint-disable-next-line
  }, [user, loading, navigate, location]);
}
