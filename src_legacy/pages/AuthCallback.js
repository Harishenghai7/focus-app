import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { components, hooks, utils } from '@/importMap';
import { supabase } from '../supabaseClient';
import './Auth.css';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing sign in...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔵 Auth callback started...');
        console.log('📍 Current URL:', window.location.href);

        // Get URL parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // Check for errors
        const errorParam = searchParams.get('error') || hashParams.get('error');
        const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

        if (errorParam) {
          console.error('❌ OAuth error:', errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setMessage('Sign in failed');
          setTimeout(() => navigate('/auth', { replace: true }), 3000);
          return;
        }

        // ✅ CRITICAL: Get auth code from URL
        const code = searchParams.get('code');
        
        if (!code) {
          console.error('❌ No auth code found in URL');
          console.log('📍 Search params:', window.location.search);
          console.log('📍 Hash params:', window.location.hash);
          setError('No authentication code received');
          setMessage('Authentication failed');
          setTimeout(() => navigate('/auth', { replace: true }), 2000);
          return;
        }

        console.log('✅ Auth code found:', code.substring(0, 20) + '...');
        setMessage('Authenticating...');

        // ✅ CRITICAL: Manually exchange code for session
        console.log('🔄 Exchanging code for session...');
        
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('❌ Exchange error:', exchangeError);
          throw exchangeError;
        }

        if (!data?.session?.user) {
          console.error('❌ No session after exchange');
          throw new Error('Failed to create session');
        }

        console.log('✅ Session created!');
        console.log('👤 User ID:', data.session.user.id);
        console.log('📧 Email:', data.session.user.email);
        console.log('🔑 Provider:', data.session.user.app_metadata?.provider);

        setMessage('Sign in successful! Setting up your profile...');

        // Wait for session to fully establish
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, onboarding_completed')
          .eq('id', data.session.user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('⚠️ Profile error:', profileError);
        }

        console.log('📊 Profile:', profile);

        if (!profile) {
          // New user - create profile
          console.log('🆕 Creating new profile...');
          
          const username = data.session.user.email?.split('@')[0]?.toLowerCase() || 
                          `user_${data.session.user.id.slice(0, 8)}`;
          const fullName = data.session.user.user_metadata?.full_name || 
                          data.session.user.user_metadata?.name || 
                          username;
          const avatarUrl = data.session.user.user_metadata?.avatar_url || 
                           data.session.user.user_metadata?.picture || null;

          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: data.session.user.id,
              email: data.session.user.email,
              username: username,
              full_name: fullName,
              avatar_url: avatarUrl,
              onboarding_completed: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (createError) {
            console.error('⚠️ Profile creation error:', createError);
            
            // If duplicate, profile might exist from trigger
            if (createError.code === '23505') {
              console.log('✅ Profile exists (created by trigger)');
              const { data: existing } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', data.session.user.id)
                .single();
              
              if (existing?.onboarding_completed) {
                setMessage('Welcome back!');
                setTimeout(() => navigate('/home', { replace: true }), 1000);
                return;
              }
            } else {
              // Continue to onboarding even if profile creation fails
              console.log('⚠️ Continuing to onboarding despite error');
            }
          } else {
            console.log('✅ Profile created');
          }

          setMessage('Welcome! Let\'s set up your profile...');
          setTimeout(() => {
            console.log('🎯 Navigating to onboarding...');
            navigate('/onboarding', { replace: true });
          }, 1500);
          return;
        }

        // Existing user - check onboarding
        if (!profile.onboarding_completed) {
          console.log('📝 Onboarding incomplete');
          setMessage('Completing your setup...');
          setTimeout(() => navigate('/onboarding', { replace: true }), 1000);
          return;
        }

        // All set - go to home
        console.log('✅ User ready, going to home');
        setMessage('Welcome back!');
        setTimeout(() => navigate('/home', { replace: true }), 1000);

      } catch (error) {
        console.error('❌ Auth callback error:', error);
        setError(error.message || 'Authentication failed');
        setMessage('Something went wrong');
        setTimeout(() => navigate('/auth', { replace: true }), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="page-auth">
      <div className="auth-container">
        <div className="auth-header">
          <div className="focus-logo">
            <div className="logo-icon">F</div>
          </div>
          <h1 className="auth-title">Focus</h1>
        </div>
        
        <div className={`auth-message ${error ? 'error' : 'success'}`}>
          {error || message}
        </div>
        
        {!error ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <span className="loading-spinner-btn">⏳</span>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '20px', color: '#9ca3af', fontSize: '14px' }}>
            Redirecting back to sign in...
          </div>
        )}
      </div>
    </div>
  );
}
