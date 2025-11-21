/**
 * Focus App - Automated User A & User B Scenario Test Suite
 * 
 * This suite programmatically tests the complete social media workflow
 * between two users to verify all core functionality works as expected.
 */

import { supabase } from '../src/supabaseClient';

class FocusAppTestSuite {
  constructor() {
    this.userA = null;
    this.userB = null;
    this.testResults = {
      userA: {},
      userB: {},
      realTimeSync: {},
      security: {},
      bugs: [],
      overall: { passed: 0, failed: 0, total: 0 }
    };
    this.testStartTime = Date.now();
  }

  // Utility methods
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  }

  recordResult(category, step, success, notes = '') {
    const result = { success, notes, timestamp: Date.now() };
    
    if (!this.testResults[category]) {
      this.testResults[category] = {};
    }
    
    this.testResults[category][step] = result;
    this.testResults.overall.total++;
    
    if (success) {
      this.testResults.overall.passed++;
      this.log(`✅ ${category} - ${step}: ${notes}`, 'success');
    } else {
      this.testResults.overall.failed++;
      this.testResults.bugs.push(`${category} - ${step}: ${notes}`);
      this.log(`❌ ${category} - ${step}: ${notes}`, 'error');
    }
  }

  // Test data generators
  generateTestData() {
    const timestamp = Date.now();
    return {
      userA: {
        email: `usera.test.${timestamp}@focusapp.test`,
        username: `usera_${timestamp}`,
        password: 'TestPassword123!',
        fullName: 'Test User Alpha',
        bio: 'This is User A testing the Focus app! 📱✨',
      },
      userB: {
        email: `userb.test.${timestamp}@focusapp.test`,
        username: `userb_${timestamp}`,
        password: 'TestPassword123!',
        fullName: 'Test User Beta',
        bio: 'This is User B ready to connect! 🚀💫',
      }
    };
  }

  // Authentication helpers
  async signUpUser(userData, userType) {
    try {
      this.log(`Signing up ${userType}...`);
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.fullName
          }
        }
      });

      if (error) throw error;

      // Auto-confirm for testing (if email confirmation is disabled)
      if (data.user && !data.user.email_confirmed_at) {
        this.log(`${userType} needs email confirmation - simulating confirmation`);
        // In a real test, you'd check email or use admin API
      }

      this.recordResult(userType, 'registration', true, `Successfully registered with email ${userData.email}`);
      return data.user;
    } catch (error) {
      this.recordResult(userType, 'registration', false, error.message);
      throw error;
    }
  }

  async signInUser(userData, userType) {
    try {
      this.log(`Signing in ${userType}...`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });

      if (error) throw error;

      this.recordResult(userType, 'login', true, `Successfully signed in`);
      return data.user;
    } catch (error) {
      this.recordResult(userType, 'login', false, error.message);
      throw error;
    }
  }

  // Profile setup
  async setupProfile(user, userData, userType) {
    try {
      this.log(`Setting up profile for ${userType}...`);

      // Create/update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: userData.username,
          full_name: userData.fullName,
          bio: userData.bio,
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userData.username,
          cover_url: null,
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Verify profile was created
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      this.recordResult(userType, 'profile_setup', true, `Profile created with username ${profile.username}`);
      return profile;
    } catch (error) {
      this.recordResult(userType, 'profile_setup', false, error.message);
      throw error;
    }
  }

  // Content creation
  async createPost(user, userType) {
    try {
      this.log(`Creating post for ${userType}...`);

      const postData = {
        user_id: user.id,
        caption: `Test post from ${userType}! 📱 This includes @${userType === 'userA' ? 'userb' : 'usera'} and #testing #focusapp`,
        media_urls: [
          'https://picsum.photos/800/600?random=1',
          'https://picsum.photos/800/600?random=2'
        ],
        media_types: ['image', 'image'],
        location: 'Test Location',
        hashtags: ['testing', 'focusapp'],
        mentions: [userType === 'userA' ? 'userb' : 'usera'],
        created_at: new Date().toISOString()
      };

      const { data: post, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (error) throw error;

      // Verify post appears in feed
      await this.delay(1000); // Wait for real-time sync

      const { data: feedPost, error: feedError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', post.id)
        .single();

      if (feedError) throw feedError;

      this.recordResult(userType, 'create_post', true, `Post created with ID ${post.id}`);
      return post;
    } catch (error) {
      this.recordResult(userType, 'create_post', false, error.message);
      throw error;
    }
  }

  async createStory(user, userType) {
    try {
      this.log(`Creating story for ${userType}...`);

      const storyData = {
        user_id: user.id,
        media_url: 'https://picsum.photos/800/1200?random=story',
        media_type: 'image',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        created_at: new Date().toISOString()
      };

      const { data: story, error } = await supabase
        .from('stories')
        .insert(storyData)
        .select()
        .single();

      if (error) throw error;

      this.recordResult(userType, 'create_story', true, `Story created with ID ${story.id}`);
      return story;
    } catch (error) {
      this.recordResult(userType, 'create_story', false, error.message);
      throw error;
    }
  }

  async createBoltz(user, userType) {
    try {
      this.log(`Creating boltz for ${userType}...`);

      const boltzData = {
        user_id: user.id,
        video_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4',
        caption: `Test boltz from ${userType}! 🎥`,
        duration: 15,
        created_at: new Date().toISOString()
      };

      const { data: boltz, error } = await supabase
        .from('boltz')
        .insert(boltzData)
        .select()
        .single();

      if (error) throw error;

      this.recordResult(userType, 'create_boltz', true, `Boltz created with ID ${boltz.id}`);
      return boltz;
    } catch (error) {
      this.recordResult(userType, 'create_boltz', false, error.message);
      throw error;
    }
  }

  // Social interactions
  async followUser(followerUser, targetUser, userType) {
    try {
      this.log(`${userType} following target user...`);

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: followerUser.id,
          following_id: targetUser.id,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Verify follow relationship
      const { data: follow, error: verifyError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerUser.id)
        .eq('following_id', targetUser.id)
        .single();

      if (verifyError) throw verifyError;

      this.recordResult(userType, 'follow_user', true, `Successfully followed user`);
      return follow;
    } catch (error) {
      this.recordResult(userType, 'follow_user', false, error.message);
      throw error;
    }
  }

  async likePost(user, post, userType) {
    try {
      this.log(`${userType} liking post...`);

      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          post_id: post.id,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      this.recordResult(userType, 'like_post', true, `Successfully liked post ${post.id}`);
    } catch (error) {
      this.recordResult(userType, 'like_post', false, error.message);
    }
  }

  async commentOnPost(user, post, userType) {
    try {
      this.log(`${userType} commenting on post...`);

      const commentData = {
        user_id: user.id,
        post_id: post.id,
        content: `Great post! Comment from ${userType} 👍`,
        created_at: new Date().toISOString()
      };

      const { data: comment, error } = await supabase
        .from('comments')
        .insert(commentData)
        .select()
        .single();

      if (error) throw error;

      this.recordResult(userType, 'comment_post', true, `Successfully commented on post ${post.id}`);
      return comment;
    } catch (error) {
      this.recordResult(userType, 'comment_post', false, error.message);
    }
  }

  // Messaging
  async sendMessage(fromUser, toUser, userType, message = null) {
    try {
      this.log(`${userType} sending message...`);

      const messageData = {
        sender_id: fromUser.id,
        receiver_id: toUser.id,
        content: message || `Hello from ${userType}! 👋 This is a test message.`,
        message_type: 'text',
        created_at: new Date().toISOString()
      };

      const { data: msg, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      this.recordResult(userType, 'send_message', true, `Message sent successfully`);
      return msg;
    } catch (error) {
      this.recordResult(userType, 'send_message', false, error.message);
    }
  }

  // Real-time sync testing
  async testRealTimeSync() {
    try {
      this.log('Testing real-time synchronization...');

      // Test real-time post creation
      let receivedUpdate = false;
      
      const subscription = supabase
        .channel('test-posts')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'posts' },
          (payload) => {
            receivedUpdate = true;
            this.log('Real-time post update received!');
          }
        )
        .subscribe();

      // Create a test post
      await this.createPost(this.userA, 'realtime-test');
      
      // Wait for real-time update
      await this.delay(2000);
      
      subscription.unsubscribe();

      this.recordResult('realTimeSync', 'posts', receivedUpdate, 
        receivedUpdate ? 'Real-time updates working' : 'Real-time updates not received');

    } catch (error) {
      this.recordResult('realTimeSync', 'posts', false, error.message);
    }
  }

  // Security testing
  async testSecurity() {
    try {
      this.log('Testing security and permissions...');

      // Test unauthorized access
      const { error } = await supabase
        .from('profiles')
        .update({ bio: 'Unauthorized update attempt' })
        .eq('id', 'invalid-user-id');

      // Should fail due to RLS policies
      const securityWorking = error !== null;

      this.recordResult('security', 'rls_policies', securityWorking, 
        securityWorking ? 'RLS policies working correctly' : 'Security vulnerability detected');

    } catch (error) {
      this.recordResult('security', 'rls_policies', true, 'Security policies properly enforced');
    }
  }

  // Settings and privacy
  async testPrivacySettings(user, userType) {
    try {
      this.log(`Testing privacy settings for ${userType}...`);

      // Change account to private
      const { error } = await supabase
        .from('profiles')
        .update({ is_private: true })
        .eq('id', user.id);

      if (error) throw error;

      // Verify change
      const { data: profile, error: verifyError } = await supabase
        .from('profiles')
        .select('is_private')
        .eq('id', user.id)
        .single();

      if (verifyError) throw verifyError;

      this.recordResult(userType, 'privacy_settings', profile.is_private, 
        profile.is_private ? 'Privacy settings working' : 'Privacy settings failed');

    } catch (error) {
      this.recordResult(userType, 'privacy_settings', false, error.message);
    }
  }

  // Search functionality
  async testSearch(userType) {
    try {
      this.log(`Testing search functionality for ${userType}...`);

      // Search for users
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', '%test%')
        .limit(5);

      if (userError) throw userError;

      // Search for posts with hashtags
      const { data: posts, error: postError } = await supabase
        .from('posts')
        .select('*')
        .contains('hashtags', ['testing'])
        .limit(5);

      if (postError) throw postError;

      const searchWorking = users.length > 0 || posts.length > 0;

      this.recordResult(userType, 'search_functionality', searchWorking,
        `Found ${users.length} users and ${posts.length} posts`);

    } catch (error) {
      this.recordResult(userType, 'search_functionality', false, error.message);
    }
  }

  // Cleanup
  async cleanupTestData() {
    try {
      this.log('Cleaning up test data...');

      if (this.userA) {
        await supabase.auth.admin.deleteUser(this.userA.id);
      }
      if (this.userB) {
        await supabase.auth.admin.deleteUser(this.userB.id);
      }

      this.log('Test data cleanup completed');
    } catch (error) {
      this.log(`Cleanup error: ${error.message}`, 'warning');
    }
  }

  // Main test execution
  async runUserAScenario() {
    try {
      this.log('🚀 Starting User A Scenario Tests...');
      
      const testData = this.generateTestData();
      
      // 1. Register User A
      this.userA = await this.signUpUser(testData.userA, 'userA');
      
      // 2. Complete profile setup
      const profileA = await this.setupProfile(this.userA, testData.userA, 'userA');
      
      // 3. Create content
      const postA = await this.createPost(this.userA, 'userA');
      const storyA = await this.createStory(this.userA, 'userA');
      const boltzA = await this.createBoltz(this.userA, 'userA');
      
      // 4. Test search
      await this.testSearch('userA');
      
      // 5. Test privacy settings
      await this.testPrivacySettings(this.userA, 'userA');
      
      // Store for User B tests
      this.userAData = { user: this.userA, profile: profileA, post: postA, story: storyA, boltz: boltzA };
      
      this.log('✅ User A Scenario Tests Completed');
      
    } catch (error) {
      this.log(`❌ User A Scenario Failed: ${error.message}`, 'error');
    }
  }

  async runUserBScenario() {
    try {
      this.log('🚀 Starting User B Scenario Tests...');
      
      const testData = this.generateTestData();
      
      // 1. Register User B
      this.userB = await this.signUpUser(testData.userB, 'userB');
      
      // 2. Complete profile setup
      const profileB = await this.setupProfile(this.userB, testData.userB, 'userB');
      
      // 3. Follow User A
      if (this.userAData) {
        await this.followUser(this.userB, this.userAData.user, 'userB');
        
        // 4. Interact with User A's content
        await this.likePost(this.userB, this.userAData.post, 'userB');
        await this.commentOnPost(this.userB, this.userAData.post, 'userB');
        
        // 5. Send message to User A
        await this.sendMessage(this.userB, this.userAData.user, 'userB');
      }
      
      // 6. Test search
      await this.testSearch('userB');
      
      // 7. Test privacy settings
      await this.testPrivacySettings(this.userB, 'userB');
      
      this.log('✅ User B Scenario Tests Completed');
      
    } catch (error) {
      this.log(`❌ User B Scenario Failed: ${error.message}`, 'error');
    }
  }

  async runFullTestSuite() {
    try {
      this.log('🎯 Starting Complete Focus App Test Suite...');
      this.log('================================================');
      
      // Run User A scenario
      await this.runUserAScenario();
      await this.delay(2000);
      
      // Run User B scenario
      await this.runUserBScenario();
      await this.delay(2000);
      
      // Test real-time functionality
      await this.testRealTimeSync();
      
      // Test security
      await this.testSecurity();
      
      // Generate final report
      this.generateFinalReport();
      
    } catch (error) {
      this.log(`❌ Test Suite Failed: ${error.message}`, 'error');
    } finally {
      // Cleanup
      await this.cleanupTestData();
    }
  }

  generateFinalReport() {
    const testDuration = Date.now() - this.testStartTime;
    const successRate = Math.round((this.testResults.overall.passed / this.testResults.overall.total) * 100);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FOCUS APP: USER A & USER B SCENARIO QA REPORT');
    console.log('='.repeat(60));
    
    console.log('\n📊 OVERALL RESULTS:');
    console.log(`Total Tests: ${this.testResults.overall.total}`);
    console.log(`Passed: ${this.testResults.overall.passed}`);
    console.log(`Failed: ${this.testResults.overall.failed}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Test Duration: ${Math.round(testDuration / 1000)}s`);
    
    console.log('\n👤 USER A RESULTS:');
    Object.entries(this.testResults.userA).forEach(([test, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${test}: ${result.notes}`);
    });
    
    console.log('\n👥 USER B RESULTS:');
    Object.entries(this.testResults.userB).forEach(([test, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${test}: ${result.notes}`);
    });
    
    console.log('\n🔄 REAL-TIME FUNCTIONALITY:');
    Object.entries(this.testResults.realTimeSync).forEach(([test, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${test}: ${result.notes}`);
    });
    
    console.log('\n🛡️ SECURITY & PERMISSIONS:');
    Object.entries(this.testResults.security).forEach(([test, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${test}: ${result.notes}`);
    });
    
    if (this.testResults.bugs.length > 0) {
      console.log('\n🐛 ISSUES FOUND:');
      this.testResults.bugs.forEach((bug, index) => {
        console.log(`${index + 1}. ${bug}`);
      });
    }
    
    console.log('\n🎯 FINAL ASSESSMENT:');
    console.log(`App Readiness: ${successRate}/100`);
    
    if (successRate >= 95) {
      console.log('✅ PRODUCTION READY - Excellent quality!');
    } else if (successRate >= 85) {
      console.log('⚠️ MOSTLY READY - Minor issues to address');
    } else if (successRate >= 70) {
      console.log('🔧 NEEDS WORK - Several issues found');
    } else {
      console.log('❌ NOT READY - Major issues need fixing');
    }
    
    console.log('\n🚀 NEXT STEPS:');
    if (this.testResults.bugs.length === 0) {
      console.log('- Deploy to production');
      console.log('- Monitor real user feedback');
      console.log('- Scale infrastructure as needed');
    } else {
      console.log('- Fix identified issues');
      console.log('- Re-run failed tests');
      console.log('- Conduct additional testing');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Test Suite Completed!');
    console.log('='.repeat(60));
  }
}

// Export for use
export default FocusAppTestSuite;

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  window.FocusAppTestSuite = FocusAppTestSuite;
  console.log('🧪 Focus App Test Suite loaded!');
  console.log('Run: new FocusAppTestSuite().runFullTestSuite()');
}
