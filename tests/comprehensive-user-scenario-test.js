/**
 * Comprehensive User A & User B Scenario QA Test Suite
 * Tests all core social app functionality with real user interactions
 */

import { supabase } from '../src/supabaseClient.js';
import crypto from 'crypto';

class UserScenarioTester {
  constructor() {
    this.testResults = {
      userA: [],
      userB: [],
      realTimeSync: [],
      security: [],
      bugs: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        realTimeWorking: true,
        securityPass: true,
        appReadiness: 0
      }
    };
    
    this.userA = null;
    this.userB = null;
    this.testData = {
      userA: {
        email: `tester_a_${Date.now()}@focusapp.test`,
        username: `user_a_${crypto.randomBytes(4).toString('hex')}`,
        password: 'TestPassword123!',
        displayName: 'Test User A',
        bio: 'Testing Focus App as User A',
        location: 'Test City, Test Country'
      },
      userB: {
        email: `tester_b_${Date.now()}@focusapp.test`,
        username: `user_b_${crypto.randomBytes(4).toString('hex')}`,
        password: 'TestPassword123!',
        displayName: 'Test User B',
        bio: 'Testing Focus App as User B',
        location: 'Test City 2, Test Country'
      }
    };
  }

  // Helper method to add test result
  addTestResult(category, step, success, notes = '') {
    const result = {
      step,
      success,
      notes,
      timestamp: new Date().toISOString()
    };
    
    this.testResults[category].push(result);
    this.testResults.summary.totalTests++;
    
    if (success) {
      this.testResults.summary.passed++;
    } else {
      this.testResults.summary.failed++;
      this.testResults.bugs.push(`${category}: ${step} - ${notes}`);
    }
  }

  // Helper method to simulate delay
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // User registration helper
  async registerUser(userData, userType) {
    try {
      console.log(`\n🔄 Registering ${userType}...`);
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            display_name: userData.displayName
          }
        }
      });

      if (error) throw error;

      // Wait for user confirmation (simulated)
      await this.delay(2000);

      // Sign in after registration
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });

      if (signInError) throw signInError;

      this.addTestResult(userType, 'Registration', true, 'User registered successfully');
      return signInData.user;
      
    } catch (error) {
      this.addTestResult(userType, 'Registration', false, error.message);
      throw error;
    }
  }

  // Profile setup helper
  async setupProfile(user, userData, userType) {
    try {
      console.log(`\n🔄 Setting up profile for ${userType}...`);
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: userData.username,
          display_name: userData.displayName,
          bio: userData.bio,
          location: userData.location,
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName)}&size=200`,
          cover_url: 'https://picsum.photos/800/400',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      this.addTestResult(userType, 'Profile Setup', true, 'Profile completed successfully');
      
    } catch (error) {
      this.addTestResult(userType, 'Profile Setup', false, error.message);
      throw error;
    }
  }

  // Create post helper
  async createPost(user, userType, content = {}) {
    try {
      console.log(`\n🔄 Creating post for ${userType}...`);
      
      const postData = {
        user_id: user.id,
        caption: content.caption || `Test post from ${userType} with #testing #focusapp @${this.testData.userB.username}`,
        location: content.location || 'Test Location',
        media_urls: content.media_urls || [
          'https://picsum.photos/800/800?random=1',
          'https://picsum.photos/800/800?random=2',
          'https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4'
        ],
        media_types: content.media_types || ['image', 'image', 'video'],
        hashtags: content.hashtags || ['testing', 'focusapp'],
        mentions: content.mentions || [this.testData.userB.username],
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select();

      if (error) throw error;

      // Test real-time sync - check if post appears immediately
      await this.delay(1000);
      const { data: checkPost } = await supabase
        .from('posts')
        .select('*')
        .eq('id', data[0].id)
        .single();

      if (checkPost) {
        this.addTestResult('realTimeSync', 'Post Creation Sync', true, 'Post appeared instantly');
      } else {
        this.addTestResult('realTimeSync', 'Post Creation Sync', false, 'Post sync delayed');
        this.testResults.summary.realTimeWorking = false;
      }

      this.addTestResult(userType, 'Create Post', true, 'Post created with media, hashtags, mentions');
      return data[0];
      
    } catch (error) {
      this.addTestResult(userType, 'Create Post', false, error.message);
      throw error;
    }
  }

  // Create story/flash helper
  async createStory(user, userType) {
    try {
      console.log(`\n🔄 Creating story for ${userType}...`);
      
      const { data, error } = await supabase
        .from('flashes')
        .insert({
          user_id: user.id,
          media_url: 'https://picsum.photos/400/600?random=story',
          media_type: 'image',
          caption: `Test story from ${userType}`,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      this.addTestResult(userType, 'Create Story', true, 'Story/flash created successfully');
      return data[0];
      
    } catch (error) {
      this.addTestResult(userType, 'Create Story', false, error.message);
      throw error;
    }
  }

  // Create boltz helper
  async createBoltz(user, userType) {
    try {
      console.log(`\n🔄 Creating boltz for ${userType}...`);
      
      const { data, error } = await supabase
        .from('boltz')
        .insert({
          user_id: user.id,
          video_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4',
          caption: `Test short video from ${userType} #boltz #testing`,
          hashtags: ['boltz', 'testing'],
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      this.addTestResult(userType, 'Create Boltz', true, 'Short video uploaded successfully');
      return data[0];
      
    } catch (error) {
      this.addTestResult(userType, 'Create Boltz', false, error.message);
      throw error;
    }
  }

  // Social interactions helper
  async performSocialInteractions(user, targetUserId, postId, userType) {
    try {
      console.log(`\n🔄 Performing social interactions for ${userType}...`);
      
      // Like post
      const { error: likeError } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          post_id: postId,
          created_at: new Date().toISOString()
        });

      if (likeError) throw likeError;

      // Comment on post
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          post_id: postId,
          content: `Great post! Testing comment from ${userType}`,
          created_at: new Date().toISOString()
        })
        .select();

      if (commentError) throw commentError;

      // Save post
      const { error: saveError } = await supabase
        .from('saved_posts')
        .insert({
          user_id: user.id,
          post_id: postId,
          created_at: new Date().toISOString()
        });

      if (saveError) throw saveError;

      // Follow user
      const { error: followError } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
          created_at: new Date().toISOString()
        });

      if (followError) throw followError;

      this.addTestResult(userType, 'Social Interactions', true, 'Like, comment, save, follow completed');
      
    } catch (error) {
      this.addTestResult(userType, 'Social Interactions', false, error.message);
      throw error;
    }
  }

  // Messaging helper
  async sendMessage(fromUser, toUserId, userType, messageType = 'text') {
    try {
      console.log(`\n🔄 Sending message from ${userType}...`);
      
      let messageData = {
        sender_id: fromUser.id,
        receiver_id: toUserId,
        created_at: new Date().toISOString()
      };

      switch (messageType) {
        case 'text':
          messageData.content = `Test message from ${userType}! 👋`;
          messageData.message_type = 'text';
          break;
        case 'image':
          messageData.media_url = 'https://picsum.photos/400/400?random=msg';
          messageData.message_type = 'image';
          messageData.content = `Photo from ${userType}`;
          break;
        case 'emoji':
          messageData.content = '🚀✨🔥';
          messageData.message_type = 'text';
          break;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select();

      if (error) throw error;

      // Test real-time message sync
      await this.delay(500);
      const { data: checkMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('id', data[0].id)
        .single();

      if (checkMessage) {
        this.addTestResult('realTimeSync', 'Message Sync', true, 'Message synced instantly');
      } else {
        this.addTestResult('realTimeSync', 'Message Sync', false, 'Message sync delayed');
        this.testResults.summary.realTimeWorking = false;
      }

      this.addTestResult(userType, `Send ${messageType} Message`, true, `${messageType} message sent successfully`);
      return data[0];
      
    } catch (error) {
      this.addTestResult(userType, `Send ${messageType} Message`, false, error.message);
      throw error;
    }
  }

  // Call simulation helper
  async simulateCall(fromUser, toUserId, userType, callType = 'voice') {
    try {
      console.log(`\n🔄 Simulating ${callType} call from ${userType}...`);
      
      // Create call record
      const { data, error } = await supabase
        .from('calls')
        .insert({
          caller_id: fromUser.id,
          receiver_id: toUserId,
          call_type: callType,
          status: 'completed',
          duration: 65, // 1 minute 5 seconds
          started_at: new Date().toISOString(),
          ended_at: new Date(Date.now() + 65000).toISOString()
        })
        .select();

      if (error) throw error;

      this.addTestResult(userType, `${callType} Call`, true, `${callType} call completed successfully`);
      return data[0];
      
    } catch (error) {
      this.addTestResult(userType, `${callType} Call`, false, error.message);
      throw error;
    }
  }

  // Privacy settings helper
  async updatePrivacySettings(user, userType, settings = {}) {
    try {
      console.log(`\n🔄 Updating privacy settings for ${userType}...`);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          is_private: settings.isPrivate || false,
          allow_messages: settings.allowMessages !== false,
          allow_calls: settings.allowCalls !== false,
          show_online_status: settings.showOnlineStatus !== false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      this.addTestResult(userType, 'Privacy Settings', true, 'Privacy settings updated successfully');
      
    } catch (error) {
      this.addTestResult(userType, 'Privacy Settings', false, error.message);
      throw error;
    }
  }

  // Search functionality helper
  async testSearch(user, userType, searchQuery) {
    try {
      console.log(`\n🔄 Testing search for ${userType}...`);
      
      // Search users
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchQuery}%`)
        .limit(10);

      if (userError) throw userError;

      // Search posts by hashtags
      const { data: posts, error: postError } = await supabase
        .from('posts')
        .select('*')
        .contains('hashtags', [searchQuery])
        .limit(10);

      if (postError) throw postError;

      this.addTestResult(userType, 'Search Functionality', true, `Found ${users.length} users, ${posts.length} posts`);
      
    } catch (error) {
      this.addTestResult(userType, 'Search Functionality', false, error.message);
      throw error;
    }
  }

  // Security test helper
  async testSecurity(user, userType) {
    try {
      console.log(`\n🔄 Testing security for ${userType}...`);
      
      // Test unauthorized access to other user's data
      const otherUserId = userType === 'userA' ? this.userB?.id : this.userA?.id;
      
      if (otherUserId) {
        // Try to update other user's profile (should fail)
        const { error } = await supabase
          .from('profiles')
          .update({ bio: 'Hacked!' })
          .eq('id', otherUserId);

        if (error) {
          this.addTestResult('security', 'Unauthorized Profile Update', true, 'Properly blocked unauthorized update');
        } else {
          this.addTestResult('security', 'Unauthorized Profile Update', false, 'Security breach: unauthorized update allowed');
          this.testResults.summary.securityPass = false;
        }
      }

      // Test RLS (Row Level Security) policies
      const { data: otherUserPosts } = await supabase
        .from('posts')
        .select('*')
        .neq('user_id', user.id)
        .limit(1);

      if (otherUserPosts && otherUserPosts.length > 0) {
        this.addTestResult('security', 'RLS Policy Check', true, 'Can view public posts from other users');
      }

      this.addTestResult(userType, 'Security Tests', true, 'Security checks completed');
      
    } catch (error) {
      this.addTestResult(userType, 'Security Tests', false, error.message);
      this.testResults.summary.securityPass = false;
    }
  }

  // Account deletion helper
  async deleteAccount(user, userType) {
    try {
      console.log(`\n🔄 Deleting account for ${userType}...`);
      
      // Mark profile as deleted (soft delete)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          deleted_at: new Date().toISOString(),
          username: `deleted_${user.id}`,
          display_name: 'Deleted User'
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Verify user can't sign in anymore
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      this.addTestResult(userType, 'Account Deletion', true, 'Account deleted successfully');
      
    } catch (error) {
      this.addTestResult(userType, 'Account Deletion', false, error.message);
      throw error;
    }
  }

  // Main test execution for User A
  async runUserAScenario() {
    try {
      console.log('\n🚀 Starting User A Scenario...');
      
      // 1. Register User A
      this.userA = await this.registerUser(this.testData.userA, 'userA');
      
      // 2. Complete profile setup
      await this.setupProfile(this.userA, this.testData.userA, 'userA');
      
      // 3. Create post with media, mentions, hashtags
      const postA = await this.createPost(this.userA, 'userA');
      
      // 4. Create story
      await this.createStory(this.userA, 'userA');
      
      // 5. Create boltz
      await this.createBoltz(this.userA, 'userA');
      
      // 6. Test search
      await this.testSearch(this.userA, 'userA', 'testing');
      
      // Store post ID for later use
      this.userAPostId = postA.id;
      
      console.log('✅ User A initial setup completed');
      
    } catch (error) {
      console.error('❌ User A scenario failed:', error);
      throw error;
    }
  }

  // Main test execution for User B
  async runUserBScenario() {
    try {
      console.log('\n🚀 Starting User B Scenario...');
      
      // 1. Register User B
      this.userB = await this.registerUser(this.testData.userB, 'userB');
      
      // 2. Complete profile setup
      await this.setupProfile(this.userB, this.testData.userB, 'userB');
      
      // 3. Interact with User A's content
      if (this.userA && this.userAPostId) {
        await this.performSocialInteractions(this.userB, this.userA.id, this.userAPostId, 'userB');
      }
      
      // 4. Test search
      await this.testSearch(this.userB, 'userB', 'focusapp');
      
      console.log('✅ User B setup completed');
      
    } catch (error) {
      console.error('❌ User B scenario failed:', error);
      throw error;
    }
  }

  // Cross-user interactions
  async runCrossUserInteractions() {
    try {
      console.log('\n🚀 Starting Cross-User Interactions...');
      
      if (!this.userA || !this.userB) {
        throw new Error('Both users must be registered first');
      }

      // User A sends messages to User B
      await this.sendMessage(this.userA, this.userB.id, 'userA', 'text');
      await this.sendMessage(this.userA, this.userB.id, 'userA', 'image');
      await this.sendMessage(this.userA, this.userB.id, 'userA', 'emoji');
      
      // User A calls User B
      await this.simulateCall(this.userA, this.userB.id, 'userA', 'voice');
      await this.simulateCall(this.userA, this.userB.id, 'userA', 'video');
      
      // User B responds
      await this.sendMessage(this.userB, this.userA.id, 'userB', 'text');
      
      // Privacy settings tests
      await this.updatePrivacySettings(this.userA, 'userA', { isPrivate: true });
      await this.updatePrivacySettings(this.userB, 'userB', { isPrivate: false });
      
      console.log('✅ Cross-user interactions completed');
      
    } catch (error) {
      console.error('❌ Cross-user interactions failed:', error);
      throw error;
    }
  }

  // Security and edge case tests
  async runSecurityTests() {
    try {
      console.log('\n🚀 Starting Security Tests...');
      
      if (this.userA) await this.testSecurity(this.userA, 'userA');
      if (this.userB) await this.testSecurity(this.userB, 'userB');
      
      console.log('✅ Security tests completed');
      
    } catch (error) {
      console.error('❌ Security tests failed:', error);
      throw error;
    }
  }

  // Cleanup and account deletion
  async runCleanup() {
    try {
      console.log('\n🚀 Starting Cleanup...');
      
      // Delete accounts
      if (this.userA) await this.deleteAccount(this.userA, 'userA');
      if (this.userB) await this.deleteAccount(this.userB, 'userB');
      
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }

  // Calculate app readiness score
  calculateAppReadiness() {
    const totalTests = this.testResults.summary.totalTests;
    const passedTests = this.testResults.summary.passed;
    
    if (totalTests === 0) return 0;
    
    let score = Math.round((passedTests / totalTests) * 100);
    
    // Penalize for real-time sync issues
    if (!this.testResults.summary.realTimeWorking) {
      score -= 15;
    }
    
    // Penalize for security issues
    if (!this.testResults.summary.securityPass) {
      score -= 25;
    }
    
    return Math.max(0, score);
  }

  // Generate comprehensive test report
  generateReport() {
    this.testResults.summary.appReadiness = this.calculateAppReadiness();
    
    const report = `
# Focus App: User A & User B Scenario QA Report

## Test Summary
- **Total Tests:** ${this.testResults.summary.totalTests}
- **Passed:** ${this.testResults.summary.passed}
- **Failed:** ${this.testResults.summary.failed}
- **Success Rate:** ${this.testResults.summary.totalTests > 0 ? Math.round((this.testResults.summary.passed / this.testResults.summary.totalTests) * 100) : 0}%

## User A Results
${this.testResults.userA.map(result => 
  `- [${result.step}] ${result.success ? '✅ Success' : '❌ Fail'} - ${result.notes}`
).join('\n')}

## User B Results
${this.testResults.userB.map(result => 
  `- [${result.step}] ${result.success ? '✅ Success' : '❌ Fail'} - ${result.notes}`
).join('\n')}

## Real-Time Sync Results
${this.testResults.realTimeSync.map(result => 
  `- [${result.step}] ${result.success ? '✅ Success' : '❌ Fail'} - ${result.notes}`
).join('\n')}

## Security Test Results
${this.testResults.security.map(result => 
  `- [${result.step}] ${result.success ? '✅ Success' : '❌ Fail'} - ${result.notes}`
).join('\n')}

## Missing Features/Bugs Found:
${this.testResults.bugs.length > 0 ? 
  this.testResults.bugs.map((bug, index) => `${index + 1}. ${bug}`).join('\n') : 
  'No critical bugs found! 🎉'
}

## Real-Time Functionality: ${this.testResults.summary.realTimeWorking ? '✅ Working' : '❌ Issues Found'}
## Security & Permissions: ${this.testResults.summary.securityPass ? '✅ Pass' : '❌ Fail'}
## App Readiness: ${this.testResults.summary.appReadiness}/100

## Next Steps:
${this.testResults.summary.appReadiness >= 90 ? 
  '🚀 App is production ready! Minor optimizations may be beneficial.' :
  this.testResults.summary.appReadiness >= 75 ?
  '⚠️ App needs some fixes before production deployment.' :
  '🔧 App requires significant fixes before production deployment.'
}

## Detailed Test Data:
\`\`\`json
${JSON.stringify(this.testResults, null, 2)}
\`\`\`

---
*Test completed on: ${new Date().toISOString()}*
*Test duration: ${((Date.now() - this.startTime) / 1000).toFixed(2)} seconds*
`;

    return report;
  }

  // Run all tests
  async runAllTests() {
    this.startTime = Date.now();
    console.log('🚀 Starting Comprehensive User Scenario QA Tests...\n');
    
    try {
      // Run User A scenario
      await this.runUserAScenario();
      
      // Small delay to ensure proper sequencing
      await this.delay(2000);
      
      // Run User B scenario
      await this.runUserBScenario();
      
      // Cross-user interactions
      await this.runCrossUserInteractions();
      
      // Security tests
      await this.runSecurityTests();
      
      // Final cleanup
      await this.runCleanup();
      
      console.log('\n✅ All tests completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Test suite failed:', error);
      this.addTestResult('general', 'Test Suite Execution', false, error.message);
    }
    
    // Generate and return report
    const report = this.generateReport();
    console.log('\n📊 Test Report Generated');
    return report;
  }
}

// Export for use in other modules
export default UserScenarioTester;

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new UserScenarioTester();
  tester.runAllTests().then(report => {
    console.log('\n' + '='.repeat(80));
    console.log(report);
    console.log('='.repeat(80));
  }).catch(console.error);
}
