import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
export const supabaseAnonKey = process.env.REACT_APP_SUPABASE_KEY;

if (process.env.NODE_ENV !== 'production') {
    console.info('[Supabase] Config', {
        url: supabaseUrl,
        anonKeyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 8) : undefined,
    });
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Missing environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        flowType: 'implicit',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: window.localStorage,
        debug: process.env.NODE_ENV !== 'production',
    },
    global: {
        headers: {
            'X-Client-Info': 'focus-app',
        },
    },
});
