import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
export const supabaseAnonKey = process.env.REACT_APP_SUPABASE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 8) + '...' : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        flowType: 'implicit',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: window.localStorage,
        debug: true,
    },
    global: {
        headers: {
            'X-Client-Info': 'focus-app',
        },
    },
});
