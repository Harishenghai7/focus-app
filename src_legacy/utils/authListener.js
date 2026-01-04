import { supabase } from '../supabaseClient'

export const initAuthListener = (callback) => {
  // Listen for auth state changes
  const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
    await callback(session?.user);
  })

  // Return an object with unsubscribe method for compatibility
  return {
    unsubscribe: () => {
      listener?.subscription?.unsubscribe?.();
    }
  };
}
