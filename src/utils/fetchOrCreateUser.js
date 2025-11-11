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

// Profile fetch with timeout protection
export const fetchUserProfile = async (userId) => {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
    );
    
    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    return null;
  }
};

// Check if user needs onboarding
export const needsOnboarding = (profile) => {
  if (!profile) return true;
  const hasRequiredFields = profile.username && profile.full_name;
  const isComplete = profile.onboarding_completed;
  return !hasRequiredFields && !isComplete;
};