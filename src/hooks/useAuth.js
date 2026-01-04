import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { syncOAuthAvatar } from '../utils/avatarManager';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        if (!userId) {
            setProfile(null);
            return;
        }

        try {
            console.log('📝 Fetching profile for user:', userId);

            // 1. ALWAYS load from cache first for INSTANT display
            const cachedProfile = localStorage.getItem(`profile_${userId}`);
            if (cachedProfile) {
                try {
                    const parsed = JSON.parse(cachedProfile);
                    console.log('📦 Using cached profile for instant load');
                    setProfile(parsed);
                } catch (e) {
                    console.error('Failed to parse cached profile:', e);
                }
            }

            // 2. Fetch from database in background (NO TIMEOUT - let it complete)
            supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
                .then(({ data, error }) => {
                    if (!error && data) {
                        console.log('✅ Profile loaded from DB:', data);
                        setProfile(data);
                        localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
                    } else {
                        console.warn('⚠️ DB fetch failed:', error?.message);
                    }
                })
                .catch(err => {
                    console.warn('⚠️ DB fetch error:', err.message);
                });

            // 3. If no cache, create minimal profile from user metadata
            if (!cachedProfile && user) {
                const fallbackProfile = {
                    id: userId,
                    username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
                    bio: '',
                    avatar_url: user.user_metadata?.avatar_url || null,
                    onboarding_completed: false
                };

                console.log('🔄 Using fallback profile from user metadata');
                setProfile(fallbackProfile);
                localStorage.setItem(`profile_${userId}`, JSON.stringify(fallbackProfile));
            }

        } catch (err) {
            console.error('Profile fetch error:', err.message);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');

                if (accessToken) {
                    console.log('🔑 Found access token in URL, setting session manually...');

                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || '',
                    });

                    if (error) {
                        console.error('❌ Error setting session:', error);
                    } else {
                        console.log('✅ Session set successfully!', data.user?.email);
                        if (mounted) {
                            setSession(data.session);
                            setUser(data.user);
                            fetchProfile(data.user.id);
                            setLoading(false);

                            await syncOAuthAvatar(data.user.id);
                            window.history.replaceState({}, document.title, '/home');
                        }
                        return;
                    }
                }

                const { data: { session }, error } = await supabase.auth.getSession();

                console.log('Initial session check:', session ? `Session found for ${session.user.email}` : 'No session');

                if (error) {
                    console.error('Session error:', error);
                }

                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        fetchProfile(session.user.id);
                    }

                    setLoading(false);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Auth event:', event, 'User:', session?.user?.email || 'none');

            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    fetchProfile(session.user.id).catch(console.error);
                } else {
                    setProfile(null);
                }

                setLoading(false);

                if (event === 'SIGNED_IN' && session?.user) {
                    await syncOAuthAvatar(session.user.id);
                }
            }
        });

        const handleProfileUpdate = (event) => {
            console.log('🔄 Profile updated event received:', event.detail);
            if (event.detail) {
                console.log('✅ Updating profile state with:', event.detail);
                setProfile(event.detail);
            }
        };

        window.addEventListener('profile-updated', handleProfileUpdate);

        return () => {
            mounted = false;
            subscription.unsubscribe();
            window.removeEventListener('profile-updated', handleProfileUpdate);
        };
    }, []);

    const value = {
        user,
        session,
        profile,
        loading,
        isAuthenticated: !!user,
        signOut: async () => {
            const userId = user?.id;

            // Clear local state immediately
            setUser(null);
            setSession(null);
            setProfile(null);
            if (userId) {
                localStorage.removeItem(`profile_${userId}`);
            }

            // Call Supabase signOut in background (don't await to avoid hanging)
            supabase.auth.signOut().catch(err => {
                console.error('Background signOut error (non-blocking):', err);
            });
        },
        refreshProfile: async () => {
            if (user) await fetchProfile(user.id);
        },
        refreshSession: async () => {
            try {
                console.log('🔄 Refreshing session...');
                const { data, error } = await supabase.auth.refreshSession();

                if (error) {
                    console.error('❌ Session refresh failed:', error);
                    return null;
                }

                console.log('✅ Session refreshed successfully');
                setSession(data.session);
                setUser(data.session?.user ?? null);
                return data.session;
            } catch (err) {
                console.error('❌ Session refresh error:', err);
                return null;
            }
        },
        updateProfileState: (newProfileData) => {
            const updatedProfile = { ...profile, ...newProfileData };
            setProfile(updatedProfile);
            if (user) {
                localStorage.setItem(`profile_${user.id}`, JSON.stringify(updatedProfile));
            }
        }
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
