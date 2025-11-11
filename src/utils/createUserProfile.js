import { supabase } from '../supabaseClient';

// Safe profile fetch that handles missing profiles gracefully
export const fetchUserProfileSafe = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchUserProfileSafe:', error);
    return null;
  }
};

export const createUserProfile = async (user) => {
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      console.log('Profile already exists, returning existing profile');
      return existingProfile;
    }

    // Generate username
    const username = user.user_metadata?.username || 
                    `user_${user.id.replace(/-/g, '').substring(0, 8)}`;

    // Create profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: username,
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        bio: ''
      })
      .select()
      .single();

    if (error) {
      // If duplicate key error, try to fetch the existing profile
      if (error.code === '23505') {
        console.log('Duplicate key detected, fetching existing profile');
        const { data: fetchedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (fetchedProfile) {
          return fetchedProfile;
        }
      }
      console.error('Error creating profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return null;
  }
};