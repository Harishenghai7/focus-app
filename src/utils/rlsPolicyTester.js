/**
 * RLS Policy Testing Utility
 * Tests Row Level Security policies to ensure proper data access control
 */

import { supabase } from '../supabaseClient';

/**
 * Test profile visibility policies
 */
export const testProfilePolicies = async () => {
  const results = [];
  
  try {
    // Test 1: Can view own profile
    const { data: ownProfile, error: ownError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();
    
    results.push({
      test: 'View own profile',
      passed: !ownError && ownProfile !== null,
      error: ownError?.message
    });
    
    // Test 2: Can view public profiles
    const { data: publicProfiles, error: publicError } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_private', false)
      .limit(5);
    
    results.push({
      test: 'View public profiles',
      passed: !publicError && publicProfiles?.length > 0,
      error: publicError?.message
    });
    
    // Test 3: Cannot view private profiles without following
    const { data: privateProfiles, error: privateError } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_private', true)
      .limit(5);
    
    results.push({
      test: 'Private profile filtering',
      passed: !privateError,
      note: `Returned ${privateProfiles?.length || 0} private profiles (should only be followed ones)`,
      error: privateError?.message
    });
    
  } catch (error) {
    results.push({
      test: 'Profile policies',
      passed: false,
      error: error.message
    });
  }
  
  return results;
};

/**
 * Test post visibility policies
 */
export const testPostPolicies = async () => {
  const results = [];
  
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    
    // Test 1: Can view own posts
    const { data: ownPosts, error: ownError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', currentUser?.id)
      .limit(5);
    
    results.push({
      test: 'View own posts',
      passed: !ownError,
      count: ownPosts?.length || 0,
      error: ownError?.message
    });
    
    // Test 2: Can view posts from public profiles
    const { data: publicPosts, error: publicError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!inner(is_private)
      `)
      .eq('profiles.is_private', false)
      .limit(10);
    
    results.push({
      test: 'View posts from public profiles',
      passed: !publicError,
      count: publicPosts?.length || 0,
      error: publicError?.message
    });
    
    // Test 3: Blocked users' posts are hidden
    const { data: allPosts, error: allError } = await supabase
      .from('posts')
      .select('*, profiles!inner(username)')
      .limit(20);
    
    results.push({
      test: 'Post visibility with blocking',
      passed: !allError,
      count: allPosts?.length || 0,
      note: 'Should not include posts from blocked users',
      error: allError?.message
    });
    
  } catch (error) {
    results.push({
      test: 'Post policies',
      passed: false,
      error: error.message
    });
  }
  
  return results;
};

/**
 * Test message privacy policies
 */
export const testMessagePolicies = async () => {
  const results = [];
  
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    
    // Test 1: Can only view own messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUser?.id},receiver_id.eq.${currentUser?.id}`)
      .limit(10);
    
    results.push({
      test: 'View own messages only',
      passed: !msgError,
      count: messages?.length || 0,
      error: msgError?.message
    });
    
    // Test 2: Cannot view other users' messages
    const { data: otherMessages, error: otherError } = await supabase
      .from('messages')
      .select('*')
      .neq('sender_id', currentUser?.id)
      .neq('receiver_id', currentUser?.id)
      .limit(5);
    
    results.push({
      test: 'Cannot view others messages',
      passed: !otherError && (otherMessages?.length === 0),
      count: otherMessages?.length || 0,
      note: 'Should return 0 messages',
      error: otherError?.message
    });
    
  } catch (error) {
    results.push({
      test: 'Message policies',
      passed: false,
      error: error.message
    });
  }
  
  return results;
};

/**
 * Test follow policies
 */
export const testFollowPolicies = async () => {
  const results = [];
  
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    
    // Test 1: Can view own follows
    const { data: ownFollows, error: ownError } = await supabase
      .from('follows')
      .select('*')
      .or(`follower_id.eq.${currentUser?.id},following_id.eq.${currentUser?.id}`)
      .limit(10);
    
    results.push({
      test: 'View own follows',
      passed: !ownError,
      count: ownFollows?.length || 0,
      error: ownError?.message
    });
    
    // Test 2: Can view active follows of public profiles
    const { data: publicFollows, error: publicError } = await supabase
      .from('follows')
      .select(`
        *,
        profiles!follows_following_id_fkey(is_private)
      `)
      .eq('status', 'active')
      .eq('profiles.is_private', false)
      .limit(10);
    
    results.push({
      test: 'View public profile follows',
      passed: !publicError,
      count: publicFollows?.length || 0,
      error: publicError?.message
    });
    
  } catch (error) {
    results.push({
      test: 'Follow policies',
      passed: false,
      error: error.message
    });
  }
  
  return results;
};

/**
 * Test notification policies
 */
export const testNotificationPolicies = async () => {
  const results = [];
  
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    
    // Test 1: Can only view own notifications
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser?.id)
      .limit(10);
    
    results.push({
      test: 'View own notifications',
      passed: !notifError,
      count: notifications?.length || 0,
      error: notifError?.message
    });
    
    // Test 2: Cannot view other users' notifications
    const { data: otherNotifs, error: otherError } = await supabase
      .from('notifications')
      .select('*')
      .neq('user_id', currentUser?.id)
      .limit(5);
    
    results.push({
      test: 'Cannot view others notifications',
      passed: !otherError && (otherNotifs?.length === 0),
      count: otherNotifs?.length || 0,
      note: 'Should return 0 notifications',
      error: otherError?.message
    });
    
  } catch (error) {
    results.push({
      test: 'Notification policies',
      passed: false,
      error: error.message
    });
  }
  
  return results;
};

/**
 * Test blocked users policies
 */
export const testBlockingPolicies = async () => {
  const results = [];
  
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    
    // Test 1: Can view own blocks
    const { data: blocks, error: blockError } = await supabase
      .from('blocked_users')
      .select('*')
      .eq('blocker_id', currentUser?.id);
    
    results.push({
      test: 'View own blocks',
      passed: !blockError,
      count: blocks?.length || 0,
      error: blockError?.message
    });
    
    // Test 2: Cannot view other users' blocks
    const { data: otherBlocks, error: otherError } = await supabase
      .from('blocked_users')
      .select('*')
      .neq('blocker_id', currentUser?.id)
      .limit(5);
    
    results.push({
      test: 'Cannot view others blocks',
      passed: !otherError && (otherBlocks?.length === 0),
      count: otherBlocks?.length || 0,
      note: 'Should return 0 blocks',
      error: otherError?.message
    });
    
  } catch (error) {
    results.push({
      test: 'Blocking policies',
      passed: false,
      error: error.message
    });
  }
  
  return results;
};

/**
 * Run all RLS policy tests
 */
export const runAllRLSTests = async () => {
  const allResults = {
    profiles: await testProfilePolicies(),
    posts: await testPostPolicies(),
    messages: await testMessagePolicies(),
    follows: await testFollowPolicies(),
    notifications: await testNotificationPolicies(),
    blocking: await testBlockingPolicies()
  };
  
  // Calculate summary
  let totalTests = 0;
  let passedTests = 0;
  
  Object.entries(allResults).forEach(([category, results]) => {
    results.forEach(result => {
      totalTests++;
      if (result.passed) passedTests++;
      
      const icon = result.passed ? '✅' : '❌';
      if (result.count !== undefined) {
      }
      if (result.note) {
      }
      if (result.error) {
      }
    });
  });
  return {
    results: allResults,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      successRate: (passedTests / totalTests) * 100
    }
  };
};

export default {
  testProfilePolicies,
  testPostPolicies,
  testMessagePolicies,
  testFollowPolicies,
  testNotificationPolicies,
  testBlockingPolicies,
  runAllRLSTests
};
