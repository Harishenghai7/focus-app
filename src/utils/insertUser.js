import { supabase } from '../supabaseClient'

export const insertUserIfNotExists = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return

  // Upsert user into users table
  const { error } = await supabase
    .from('users')
    .upsert([
      {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || 'Anonymous',
        avatar: user.user_metadata?.avatar_url || ''
      }
    ])

  if (error) {
    // Silently handle insert error
  }
}
