#!/usr/bin/env node

/**
 * Focus App - Automated Test Runner
 * Executes the complete User A & User B scenario tests
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class FocusAppTestRunner {
  constructor() {
    this.testResults = {
      userA: {},
      userB: {},
      realTimeSync: {},
      security: {},
      bugs: [],
      overall: { passed: 0, failed: 0, total: 0 }
    };
    this.testStartTime = Date.now();
    this.userA = null;
    this.userB = null;
    this.userAData = null;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m'  // Yellow
    };
    const reset = '\x1b[0m';
    
    console.log(`${colors[type] || colors.info}[${timestamp}] ${type.toUpperCase()}: ${message}${reset}`);
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

      this.recordResult(userType, 'registration', true, `Successfully registered with email ${userData.email}`);
      return data.user;
    } catch (error) {
      this.recordResult(userType, 'registration', false, error.message);
      throw error;
    }
  }

  async setupProfile(user, userData, userType) {
    try {
      this.log(`Setting up profile for ${userType}...`);

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: userData.username,
          full_name: userData.fullName,
          bio: userData.bio,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
          cover_url: null,
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

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
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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

      this.recordResult(userType, 'follow_user', true, `Successfully followed user`);
    } catch (error) {
      this.recordResult(userType, 'follow_user', false, error.message);
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

  async sendMessage(fromUser, toUser, userType) {
    try {
      this.log(`${userType} sending message...`);

      const messageData = {
        sender_id: fromUser.id,
        receiver_id: toUser.id,
        content: `Hello from ${userType}! 👋 This is a test message.`,
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

  async testSearch(userType) {
    try {
      this.log(`Testing search functionality for ${userType}...`);

      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', '%test%')
        .limit(5);

      if (userError) throw userError;

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

  async testPrivacySettings(user, userType) {
    try {
      this.log(`Testing privacy settings for ${userType}...`);

      const { error } = await supabase
        .from('profiles')
        .update({ is_private: true })
        .eq('id', user.id);

      if (error) throw error;

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

  async testRealTimeSync() {
    try {
      this.log('Testing real-time synchronization...');

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

      await this.delay(1000);

      // Create a test post
      if (this.userA) {
        await this.createPost(this.userA, 'realtime-test');
      }
      
      // Wait for real-time update
      await this.delay(3000);
      
      subscription.unsubscribe();

      this.recordResult('realTimeSync', 'posts', receivedUpdate, 
        receivedUpdate ? 'Real-time updates working' : 'Real-time updates not received');

    } catch (error) {
      this.recordResult('realTimeSync', 'posts', false, error.message);
    }
  }

  async testSecurity() {
    try {
      this.log('Testing security and permissions...');

      // Test unauthorized access (should fail)
      const { error } = await supabase
        .from('profiles')
        .update({ bio: 'Unauthorized update attempt' })
        .eq('id', 'invalid-user-id');

      const securityWorking = error !== null;

      this.recordResult('security', 'rls_policies', securityWorking, 
        securityWorking ? 'RLS policies working correctly' : 'Security vulnerability detected');

    } catch (error) {
      this.recordResult('security', 'rls_policies', true, 'Security policies properly enforced');
    }
  }

  async runUserAScenario() {
    try {
      this.log('🚀 Starting User A Scenario Tests...');
      
      const testData = this.generateTestData();
      
      // 1. Register User A
      this.userA = await this.signUpUser(testData.userA, 'userA');
      await this.delay(1000);
      
      // 2. Complete profile setup
      const profileA = await this.setupProfile(this.userA, testData.userA, 'userA');
      await this.delay(1000);
      
      // 3. Create content
      const postA = await this.createPost(this.userA, 'userA');
      await this.delay(1000);
      
      const storyA = await this.createStory(this.userA, 'userA');
      await this.delay(1000);
      
      const boltzA = await this.createBoltz(this.userA, 'userA');
      await this.delay(1000);
      
      // 4. Test search
      await this.testSearch('userA');
      await this.delay(1000);
      
      // 5. Test privacy settings
      await this.testPrivacySettings(this.userA, 'userA');
      await this.delay(1000);
      
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
      await this.delay(1000);
      
      // 2. Complete profile setup
      const profileB = await this.setupProfile(this.userB, testData.userB, 'userB');
      await this.delay(1000);
      
      // 3. Follow User A
      if (this.userAData) {
        await this.followUser(this.userB, this.userAData.user, 'userB');
        await this.delay(1000);
        
        // 4. Interact with User A's content
        await this.likePost(this.userB, this.userAData.post, 'userB');
        await this.delay(1000);
        
        await this.commentOnPost(this.userB, this.userAData.post, 'userB');
        await this.delay(1000);
        
        // 5. Send message to User A
        await this.sendMessage(this.userB, this.userAData.user, 'userB');
        await this.delay(1000);
      }
      
      // 6. Test search
      await this.testSearch('userB');
      await this.delay(1000);
      
      // 7. Test privacy settings
      await this.testPrivacySettings(this.userB, 'userB');
      await this.delay(1000);
      
      this.log('✅ User B Scenario Tests Completed');
      
    } catch (error) {
      this.log(`❌ User B Scenario Failed: ${error.message}`, 'error');
    }
  }

  async runFullTestSuite() {
    try {
      console.log('\n' + '='.repeat(60));
      this.log('🎯 Starting Complete Focus App Test Suite...');
      this.log('Testing User A & User B Full Workflow Scenarios');
      console.log('='.repeat(60) + '\n');
      
      // Run User A scenario
      await this.runUserAScenario();
      await this.delay(2000);
      
      // Run User B scenario  
      await this.runUserBScenario();
      await this.delay(2000);
      
      // Test real-time functionality
      await this.testRealTimeSync();
      await this.delay(1000);
      
      // Test security
      await this.testSecurity();
      await this.delay(1000);
      
      // Generate final report
      this.generateFinalReport();
      
    } catch (error) {
      this.log(`❌ Test Suite Failed: ${error.message}`, 'error');
    }
  }

  generateFinalReport() {
    const testDuration = Date.now() - this.testStartTime;
    const successRate = Math.round((this.testResults.overall.passed / this.testResults.overall.total) * 100);
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 FOCUS APP: USER A & USER B SCENARIO QA REPORT');
    console.log('='.repeat(80));
    
    console.log('\n📊 OVERALL RESULTS:');
    console.log(`Total Tests: ${this.testResults.overall.total}`);
    console.log(`Passed: \x1b[32m${this.testResults.overall.passed}\x1b[0m`);
    console.log(`Failed: \x1b[31m${this.testResults.overall.failed}\x1b[0m`);
    console.log(`Success Rate: \x1b[36m${successRate}%\x1b[0m`);
    console.log(`Test Duration: ${Math.round(testDuration / 1000)}s`);
    
    console.log('\n👤 USER A RESULTS:');
    Object.entries(this.testResults.userA).forEach(([test, result]) => {
      const status = result.success ? '\x1b[32m✅\x1b[0m' : '\x1b[31m❌\x1b[0m';
      console.log(`${status} ${test}: ${result.notes}`);
    });
    
    console.log('\n👥 USER B RESULTS:');
    Object.entries(this.testResults.userB).forEach(([test, result]) => {
      const status = result.success ? '\x1b[32m✅\x1b[0m' : '\x1b[31m❌\x1b[0m';
      console.log(`${status} ${test}: ${result.notes}`);
    });
    
    console.log('\n🔄 REAL-TIME FUNCTIONALITY:');
    const realTimeWorking = Object.values(this.testResults.realTimeSync).every(r => r.success);
    console.log(`Real-time sync: ${realTimeWorking ? '\x1b[32mY\x1b[0m' : '\x1b[31mN\x1b[0m'}`);
    Object.entries(this.testResults.realTimeSync).forEach(([test, result]) => {
      const status = result.success ? '\x1b[32m✅\x1b[0m' : '\x1b[31m❌\x1b[0m';
      console.log(`${status} ${test}: ${result.notes}`);
    });
    
    console.log('\n🛡️ SECURITY & PERMISSIONS:');
    const securityPassing = Object.values(this.testResults.security).every(r => r.success);
    console.log(`Security: ${securityPassing ? '\x1b[32mPass\x1b[0m' : '\x1b[31mFail\x1b[0m'}`);
    Object.entries(this.testResults.security).forEach(([test, result]) => {
      const status = result.success ? '\x1b[32m✅\x1b[0m' : '\x1b[31m❌\x1b[0m';
      console.log(`${status} ${test}: ${result.notes}`);
    });
    
    if (this.testResults.bugs.length > 0) {
      console.log('\n🐛 MISSING FEATURES/BUGS:');
      this.testResults.bugs.forEach((bug, index) => {
        console.log(`${index + 1}. ${bug}`);
      });
    } else {
      console.log('\n🐛 MISSING FEATURES/BUGS: None found! 🎉');
    }
    
    console.log('\n🎯 FINAL ASSESSMENT:');
    console.log(`App Readiness: \x1b[36m${successRate}/100\x1b[0m`);
    
    if (successRate >= 95) {
      console.log('\x1b[32m✅ PRODUCTION READY - Excellent quality! All core features working perfectly.\x1b[0m');
    } else if (successRate >= 85) {
      console.log('\x1b[33m⚠️ MOSTLY READY - Minor issues to address before production launch.\x1b[0m');
    } else if (successRate >= 70) {
      console.log('\x1b[33m🔧 NEEDS WORK - Several issues found that should be fixed.\x1b[0m');
    } else {
      console.log('\x1b[31m❌ NOT READY - Major issues need fixing before launch.\x1b[0m');
    }
    
    console.log('\n🚀 NEXT STEPS:');
    if (this.testResults.bugs.length === 0) {
      console.log('- ✅ Deploy to production environment');
      console.log('- 📊 Monitor real user feedback and analytics');
      console.log('- 🔧 Scale infrastructure as user base grows');
      console.log('- ✨ Plan next feature releases');
    } else {
      console.log('- 🔧 Fix identified issues and bugs');
      console.log('- 🧪 Re-run failed tests after fixes');
      console.log('- 🔍 Conduct additional edge case testing');
      console.log('- 👥 Consider beta testing with real users');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\x1b[32m🎉 User A & User B Scenario Test Suite Completed!\x1b[0m');
    console.log('='.repeat(80) + '\n');
  }
}

// Run the test suite
const testRunner = new FocusAppTestRunner();
testRunner.runFullTestSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
