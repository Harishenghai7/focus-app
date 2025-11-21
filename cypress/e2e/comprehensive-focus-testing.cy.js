describe('Comprehensive Focus App Testing Suite', () => {
  const testUser = {
    email: 'test@focusapp.com',
    password: 'TestPass123!',
    username: 'testuser',
    fullName: 'Test User'
  };

  const testUser2 = {
    email: 'test2@focusapp.com',
    password: 'TestPass123!',
    username: 'testuser2',
    fullName: 'Test User 2'
  };

  let testResults = {
    passed: [],
    failed: [],
    skipped: [],
    missing: []
  };

  before(() => {
    // Setup test environment
    cy.task('setupTestUsers', [testUser, testUser2]);
    cy.task('seedTestData', {
      posts: 5,
      users: 10,
      follows: 20,
      messages: 15
    });
  });

  after(() => {
    // Generate comprehensive report
    cy.task('generateTestReport', testResults);
  });

  describe('1. Authentication & Onboarding', () => {
    beforeEach(() => {
      cy.visit('/auth');
    });

    it('1.1 Email/Password Signup Flow', () => {
      try {
        cy.get('[data-testid="signup-tab"]').click();
        cy.get('[data-testid="email-input"]').type(testUser.email);
        cy.get('[data-testid="password-input"]').type(testUser.password);
        cy.get('[data-testid="username-input"]').type(testUser.username);
        cy.get('[data-testid="fullname-input"]').type(testUser.fullName);
        cy.get('[data-testid="birthdate-input"]').type('1990-01-01');
        cy.get('[data-testid="terms-checkbox"]').check();
        cy.get('[data-testid="privacy-checkbox"]').check();
        cy.get('[data-testid="signup-button"]').click();

        // Verify onboarding redirect
        cy.url().should('include', '/onboarding');
        testResults.passed.push('Email/Password Signup Flow');
      } catch (error) {
        testResults.failed.push({ test: 'Email/Password Signup Flow', error: error.message });
      }
    });

    it('1.2 Login Flow', () => {
      try {
        cy.get('[data-testid="email-input"]').type(testUser.email);
        cy.get('[data-testid="password-input"]').type(testUser.password);
        cy.get('[data-testid="login-button"]').click();
        cy.url().should('include', '/home');
        testResults.passed.push('Login Flow');
      } catch (error) {
        testResults.failed.push({ test: 'Login Flow', error: error.message });
      }
    });

    it('1.3 OAuth Login Options', () => {
      try {
        cy.get('[data-testid="google-login"]').should('be.visible');
        cy.get('[data-testid="github-login"]').should('be.visible');
        cy.get('[data-testid="discord-login"]').should('be.visible');
        testResults.passed.push('OAuth Login Options');
      } catch (error) {
        testResults.failed.push({ test: 'OAuth Login Options', error: error.message });
      }
    });

    it('1.4 Password Reset Flow', () => {
      try {
        cy.get('[data-testid="forgot-password"]').click();
        cy.get('[data-testid="reset-email-input"]').type(testUser.email);
        cy.get('[data-testid="reset-submit"]').click();
        cy.contains('Password reset email sent').should('be.visible');
        testResults.passed.push('Password Reset Flow');
      } catch (error) {
        testResults.failed.push({ test: 'Password Reset Flow', error: error.message });
      }
    });

    it('1.5 Form Validation', () => {
      try {
        cy.get('[data-testid="signup-tab"]').click();
        cy.get('[data-testid="signup-button"]').click();
        cy.contains('Email is required').should('be.visible');
        cy.contains('Password is required').should('be.visible');
        cy.contains('Username is required').should('be.visible');
        testResults.passed.push('Form Validation');
      } catch (error) {
        testResults.failed.push({ test: 'Form Validation', error: error.message });
      }
    });
  });

  describe('2. Navigation & Layout', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/home');
    });

    it('2.1 Main Navigation', () => {
      try {
        cy.get('[data-testid="nav-home"]').should('be.visible');
        cy.get('[data-testid="nav-explore"]').should('be.visible');
        cy.get('[data-testid="nav-create"]').should('be.visible');
        cy.get('[data-testid="nav-boltz"]').should('be.visible');
        cy.get('[data-testid="nav-profile"]').should('be.visible');
        cy.get('[data-testid="nav-notifications"]').should('be.visible');
        testResults.passed.push('Main Navigation');
      } catch (error) {
        testResults.failed.push({ test: 'Main Navigation', error: error.message });
      }
    });

    it('2.2 Responsive Design', () => {
      try {
        cy.viewport('iphone-6');
        cy.get('[data-testid="mobile-nav"]').should('be.visible');

        cy.viewport('macbook-15');
        cy.get('[data-testid="desktop-nav"]').should('be.visible');
        testResults.passed.push('Responsive Design');
      } catch (error) {
        testResults.failed.push({ test: 'Responsive Design', error: error.message });
      }
    });

    it('2.3 Page Transitions', () => {
      try {
        cy.get('[data-testid="nav-explore"]').click();
        cy.url().should('include', '/explore');

        cy.get('[data-testid="nav-boltz"]').click();
        cy.url().should('include', '/boltz');

        cy.get('[data-testid="nav-profile"]').click();
        cy.url().should('include', '/profile');
        testResults.passed.push('Page Transitions');
      } catch (error) {
        testResults.failed.push({ test: 'Page Transitions', error: error.message });
      }
    });
  });

  describe('3. Explore Page Features', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/explore');
    });

    it('3.1 Search Functionality', () => {
      try {
        cy.get('[data-testid="search-input"]').type('test query');
        cy.get('[data-testid="search-button"]').click();
        cy.get('[data-testid="search-results"]').should('be.visible');
        testResults.passed.push('Search Functionality');
      } catch (error) {
        testResults.failed.push({ test: 'Search Functionality', error: error.message });
      }
    });

    it('3.2 Tab Navigation', () => {
      try {
        cy.get('[data-testid="tab-for-you"]').click();
        cy.get('[data-testid="for-you-content"]').should('be.visible');

        cy.get('[data-testid="tab-trending"]').click();
        cy.get('[data-testid="trending-content"]').should('be.visible');

        cy.get('[data-testid="tab-boltz"]').click();
        cy.get('[data-testid="boltz-content"]').should('be.visible');

        cy.get('[data-testid="tab-people"]').click();
        cy.get('[data-testid="people-content"]').should('be.visible');

        cy.get('[data-testid="tab-tags"]').click();
        cy.get('[data-testid="tags-content"]').should('be.visible');
        testResults.passed.push('Tab Navigation');
      } catch (error) {
        testResults.failed.push({ test: 'Tab Navigation', error: error.message });
      }
    });

    it('3.3 Content Filtering', () => {
      try {
        cy.get('[data-testid="filter-all"]').click();
        cy.get('[data-testid="filter-photos"]').click();
        cy.get('[data-testid="filter-videos"]').click();
        cy.get('[data-testid="filter-boltz"]').click();
        testResults.passed.push('Content Filtering');
      } catch (error) {
        testResults.failed.push({ test: 'Content Filtering', error: error.message });
      }
    });

    it('3.4 Sorting Options', () => {
      try {
        cy.get('[data-testid="sort-recent"]').click();
        cy.get('[data-testid="sort-popular"]').click();
        cy.get('[data-testid="sort-trending"]').click();
        testResults.passed.push('Sorting Options');
      } catch (error) {
        testResults.failed.push({ test: 'Sorting Options', error: error.message });
      }
    });

    it('3.5 Infinite Scroll', () => {
      try {
        cy.scrollTo('bottom');
        cy.get('[data-testid="loading-more"]').should('be.visible');
        cy.wait(2000); // Wait for content to load
        cy.get('[data-testid="explore-grid"]').children().should('have.length.greaterThan', 10);
        testResults.passed.push('Infinite Scroll');
      } catch (error) {
        testResults.failed.push({ test: 'Infinite Scroll', error: error.message });
      }
    });

    it('3.6 Real-time Updates', () => {
      try {
        // This would require mocking real-time updates
        cy.window().then((win) => {
          win.postMessage({ type: 'NEW_POST', data: { id: 'test-post' } }, '*');
        });
        cy.get('[data-testid="new-content-indicator"]').should('be.visible');
        testResults.passed.push('Real-time Updates');
      } catch (error) {
        testResults.failed.push({ test: 'Real-time Updates', error: error.message });
      }
    });
  });

  describe('4. Boltz Video Features', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/boltz');
    });

    it('4.1 Video Playback', () => {
      try {
        cy.get('[data-testid="boltz-video"]').first().should('be.visible');
        cy.get('[data-testid="boltz-video"]').first().click();
        cy.get('[data-testid="boltz-video"]').first().should('have.prop', 'paused', false);
        testResults.passed.push('Video Playback');
      } catch (error) {
        testResults.failed.push({ test: 'Video Playback', error: error.message });
      }
    });

    it('4.2 Swipe Navigation', () => {
      try {
        const videoContainer = cy.get('[data-testid="boltz-container"]');

        // Swipe up (previous video)
        videoContainer.trigger('touchstart', { touches: [{ clientY: 300 }] });
        videoContainer.trigger('touchmove', { touches: [{ clientY: 100 }] });
        videoContainer.trigger('touchend');

        cy.get('[data-testid="current-video-index"]').should('contain', '1');

        // Swipe down (next video)
        videoContainer.trigger('touchstart', { touches: [{ clientY: 100 }] });
        videoContainer.trigger('touchmove', { touches: [{ clientY: 300 }] });
        videoContainer.trigger('touchend');

        cy.get('[data-testid="current-video-index"]').should('contain', '2');
        testResults.passed.push('Swipe Navigation');
      } catch (error) {
        testResults.failed.push({ test: 'Swipe Navigation', error: error.message });
      }
    });

    it('4.3 Keyboard Navigation', () => {
      try {
        cy.get('body').type('{downarrow}');
        cy.get('[data-testid="current-video-index"]').should('contain', '2');

        cy.get('body').type('{uparrow}');
        cy.get('[data-testid="current-video-index"]').should('contain', '1');
        testResults.passed.push('Keyboard Navigation');
      } catch (error) {
        testResults.failed.push({ test: 'Keyboard Navigation', error: error.message });
      }
    });

    it('4.4 Video Interactions', () => {
      try {
        cy.get('[data-testid="like-button"]').first().click();
        cy.get('[data-testid="like-button"]').first().should('have.class', 'liked');

        cy.get('[data-testid="comment-button"]').first().click();
        cy.get('[data-testid="comment-modal"]').should('be.visible');

        cy.get('[data-testid="share-button"]').first().click();
        cy.get('[data-testid="share-modal"]').should('be.visible');
        testResults.passed.push('Video Interactions');
      } catch (error) {
        testResults.failed.push({ test: 'Video Interactions', error: error.message });
      }
    });

    it('4.5 Volume Controls', () => {
      try {
        cy.get('[data-testid="volume-button"]').click();
        cy.get('[data-testid="boltz-video"]').first().should('have.prop', 'muted', true);

        cy.get('[data-testid="volume-button"]').click();
        cy.get('[data-testid="boltz-video"]').first().should('have.prop', 'muted', false);
        testResults.passed.push('Volume Controls');
      } catch (error) {
        testResults.failed.push({ test: 'Volume Controls', error: error.message });
      }
    });

    it('4.6 Follow User', () => {
      try {
        cy.get('[data-testid="follow-button"]').first().click();
        cy.get('[data-testid="follow-button"]').first().should('contain', 'Following');
        testResults.passed.push('Follow User');
      } catch (error) {
        testResults.failed.push({ test: 'Follow User', error: error.message });
      }
    });

    it('4.7 Video Preloading', () => {
      try {
        // Check if next video is preloaded
        cy.get('[data-testid="boltz-video"]').eq(1).should('have.prop', 'readyState').and('be.greaterThan', 0);
        testResults.passed.push('Video Preloading');
      } catch (error) {
        testResults.failed.push({ test: 'Video Preloading', error: error.message });
      }
    });
  });

  describe('5. Profile Management', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/profile');
    });

    it('5.1 Profile Display', () => {
      try {
        cy.get('[data-testid="profile-avatar"]').should('be.visible');
        cy.get('[data-testid="profile-username"]').should('contain', testUser.username);
        cy.get('[data-testid="profile-fullname"]').should('contain', testUser.fullName);
        cy.get('[data-testid="profile-stats"]').should('be.visible');
        testResults.passed.push('Profile Display');
      } catch (error) {
        testResults.failed.push({ test: 'Profile Display', error: error.message });
      }
    });

    it('5.2 Profile Tabs', () => {
      try {
        cy.get('[data-testid="tab-posts"]').click();
        cy.get('[data-testid="posts-grid"]').should('be.visible');

        cy.get('[data-testid="tab-boltz"]').click();
        cy.get('[data-testid="boltz-grid"]').should('be.visible');

        cy.get('[data-testid="tab-saved"]').click();
        cy.get('[data-testid="saved-grid"]').should('be.visible');
        testResults.passed.push('Profile Tabs');
      } catch (error) {
        testResults.failed.push({ test: 'Profile Tabs', error: error.message });
      }
    });

    it('5.3 Edit Profile', () => {
      try {
        cy.get('[data-testid="edit-profile-button"]').click();
        cy.url().should('include', '/edit-profile');

        cy.get('[data-testid="bio-input"]').type('Updated bio');
        cy.get('[data-testid="website-input"]').type('https://example.com');
        cy.get('[data-testid="location-input"]').type('New York');
        cy.get('[data-testid="save-profile"]').click();

        cy.contains('Profile updated').should('be.visible');
        testResults.passed.push('Edit Profile');
      } catch (error) {
        testResults.failed.push({ test: 'Edit Profile', error: error.message });
      }
    });

    it('5.4 Followers/Following Lists', () => {
      try {
        cy.get('[data-testid="followers-count"]').click();
        cy.get('[data-testid="followers-modal"]').should('be.visible');
        cy.get('[data-testid="followers-list"]').should('be.visible');

        cy.get('[data-testid="close-modal"]').click();

        cy.get('[data-testid="following-count"]').click();
        cy.get('[data-testid="following-modal"]').should('be.visible');
        cy.get('[data-testid="following-list"]').should('be.visible');
        testResults.passed.push('Followers/Following Lists');
      } catch (error) {
        testResults.failed.push({ test: 'Followers/Following Lists', error: error.message });
      }
    });

    it('5.5 Profile Actions Menu', () => {
      try {
        cy.get('[data-testid="profile-menu"]').click();
        cy.get('[data-testid="menu-block"]').should('be.visible');
        cy.get('[data-testid="menu-report"]').should('be.visible');
        cy.get('[data-testid="menu-copy-link"]').should('be.visible');
        cy.get('[data-testid="menu-share"]').should('be.visible');
        testResults.passed.push('Profile Actions Menu');
      } catch (error) {
        testResults.failed.push({ test: 'Profile Actions Menu', error: error.message });
      }
    });
  });

  describe('6. Content Creation', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/create');
    });

    it('6.1 Content Type Selection', () => {
      try {
        cy.get('[data-testid="content-type-post"]').click();
        cy.get('[data-testid="create-form"]').should('be.visible');

        cy.get('[data-testid="back-button"]').click();

        cy.get('[data-testid="content-type-boltz"]').click();
        cy.get('[data-testid="create-form"]').should('be.visible');

        cy.get('[data-testid="back-button"]').click();

        cy.get('[data-testid="content-type-flash"]').click();
        cy.get('[data-testid="create-form"]').should('be.visible');
        testResults.passed.push('Content Type Selection');
      } catch (error) {
        testResults.failed.push({ test: 'Content Type Selection', error: error.message });
      }
    });

    it('6.2 Post Creation', () => {
      try {
        cy.get('[data-testid="content-type-post"]').click();

        // Add media
        cy.get('[data-testid="media-selector"]').selectFile('cypress/fixtures/test-image.jpg');

        // Add caption
        cy.get('[data-testid="caption-input"]').type('Test post caption #test');

        // Submit
        cy.get('[data-testid="submit-post"]').click();

        cy.contains('Post created successfully').should('be.visible');
        testResults.passed.push('Post Creation');
      } catch (error) {
        testResults.failed.push({ test: 'Post Creation', error: error.message });
      }
    });

    it('6.3 Boltz Video Creation', () => {
      try {
        cy.get('[data-testid="content-type-boltz"]').click();

        // Add video
        cy.get('[data-testid="video-input"]').selectFile('cypress/fixtures/test-video.mp4');

        // Add description
        cy.get('[data-testid="description-input"]').type('Test Boltz video');

        // Submit
        cy.get('[data-testid="submit-boltz"]').click();

        cy.contains('Boltz created successfully').should('be.visible');
        testResults.passed.push('Boltz Video Creation');
      } catch (error) {
        testResults.failed.push({ test: 'Boltz Video Creation', error: error.message });
      }
    });

    it('6.4 Flash Creation', () => {
      try {
        cy.get('[data-testid="content-type-flash"]').click();

        // Add media
        cy.get('[data-testid="flash-media-input"]').selectFile('cypress/fixtures/test-image.jpg');

        // Add caption
        cy.get('[data-testid="flash-caption"]').type('Test flash');

        // Set close friends
        cy.get('[data-testid="close-friends-toggle"]').check();

        // Submit
        cy.get('[data-testid="submit-flash"]').click();

        cy.contains('Flash created successfully').should('be.visible');
        testResults.passed.push('Flash Creation');
      } catch (error) {
        testResults.failed.push({ test: 'Flash Creation', error: error.message });
      }
    });

    it('6.5 Draft Management', () => {
      try {
        cy.get('[data-testid="content-type-post"]').click();

        // Add content
        cy.get('[data-testid="caption-input"]').type('Draft content');

        // Save draft
        cy.get('[data-testid="save-draft"]').click();
        cy.contains('Draft saved').should('be.visible');

        // Check drafts
        cy.get('[data-testid="drafts-toggle"]').click();
        cy.get('[data-testid="draft-item"]').should('be.visible');

        // Load draft
        cy.get('[data-testid="draft-item"]').first().click();
        cy.get('[data-testid="caption-input"]').should('have.value', 'Draft content');
        testResults.passed.push('Draft Management');
      } catch (error) {
        testResults.failed.push({ test: 'Draft Management', error: error.message });
      }
    });

    it('6.6 Auto-save Functionality', () => {
      try {
        cy.get('[data-testid="content-type-post"]').click();

        cy.get('[data-testid="caption-input"]').type('Auto-saved content');
        cy.wait(35000); // Wait for auto-save

        cy.get('[data-testid="auto-save-status"]').should('contain', 'Saved');
        testResults.passed.push('Auto-save Functionality');
      } catch (error) {
        testResults.failed.push({ test: 'Auto-save Functionality', error: error.message });
      }
    });

    it('6.7 Mention System', () => {
      try {
        cy.get('[data-testid="content-type-post"]').click();

        cy.get('[data-testid="caption-input"]').type('@testuser2');
        cy.get('[data-testid="mention-suggestions"]').should('be.visible');
        cy.get('[data-testid="mention-suggestion"]').first().click();

        cy.get('[data-testid="caption-input"]').should('contain', '@testuser2');
        testResults.passed.push('Mention System');
      } catch (error) {
        testResults.failed.push({ test: 'Mention System', error: error.message });
      }
    });

    it('6.8 Hashtag System', () => {
      try {
        cy.get('[data-testid="content-type-post"]').click();

        cy.get('[data-testid="caption-input"]').type('#test');
        cy.get('[data-testid="hashtag-suggestions"]').should('be.visible');
        cy.get('[data-testid="hashtag-suggestion"]').first().click();

        cy.get('[data-testid="caption-input"]').should('contain', '#test');
        testResults.passed.push('Hashtag System');
      } catch (error) {
        testResults.failed.push({ test: 'Hashtag System', error: error.message });
      }
    });

    it('6.9 Schedule Post', () => {
      try {
        cy.get('[data-testid="content-type-post"]').click();

        cy.get('[data-testid="caption-input"]').type('Scheduled post');

        cy.get('[data-testid="schedule-button"]').click();
        cy.get('[data-testid="schedule-picker"]').should('be.visible');

        // Select future date
        cy.get('[data-testid="schedule-date"]').type('2024-12-31');
        cy.get('[data-testid="schedule-time"]').type('12:00');

        cy.get('[data-testid="confirm-schedule"]').click();
        cy.get('[data-testid="submit-post"]').click();

        cy.contains('Post scheduled successfully').should('be.visible');
        testResults.passed.push('Schedule Post');
      } catch (error) {
        testResults.failed.push({ test: 'Schedule Post', error: error.message });
      }
    });
  });

  describe('7. Notifications System', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/notifications');
    });

    it('7.1 Notifications Display', () => {
      try {
        cy.get('[data-testid="notifications-list"]').should('be.visible');
        cy.get('[data-testid="notification-item"]').should('have.length.greaterThan', 0);
        testResults.passed.push('Notifications Display');
      } catch (error) {
        testResults.failed.push({ test: 'Notifications Display', error: error.message });
      }
    });

    it('7.2 Mark as Read', () => {
      try {
        cy.get('[data-testid="notification-item"]').first().click();
        cy.get('[data-testid="notification-item"]').first().should('not.have.class', 'unread');
        testResults.passed.push('Mark as Read');
      } catch (error) {
        testResults.failed.push({ test: 'Mark as Read', error: error.message });
      }
    });

    it('7.3 Mark All as Read', () => {
      try {
        cy.get('[data-testid="mark-all-read"]').click();
        cy.get('[data-testid="notification-item"].unread').should('not.exist');
        testResults.passed.push('Mark All as Read');
      } catch (error) {
        testResults.failed.push({ test: 'Mark All as Read', error: error.message });
      }
    });

    it('7.4 Notification Filters', () => {
      try {
        cy.get('[data-testid="filter-all"]').click();
        cy.get('[data-testid="filter-likes"]').click();
        cy.get('[data-testid="filter-comments"]').click();
        cy.get('[data-testid="filter-follows"]').click();
        cy.get('[data-testid="filter-mentions"]').click();
        cy.get('[data-testid="filter-messages"]').click();
        testResults.passed.push('Notification Filters');
      } catch (error) {
        testResults.failed.push({ test: 'Notification Filters', error: error.message });
      }
    });

    it('7.5 Notification Grouping', () => {
      try {
        cy.get('[data-testid="group-select"]').select('type');
        cy.get('[data-testid="notification-group"]').should('be.visible');

        cy.get('[data-testid="group-select"]').select('date');
        cy.get('[data-testid="notification-group"]').should('be.visible');
        testResults.passed.push('Notification Grouping');
      } catch (error) {
        testResults.failed.push({ test: 'Notification Grouping', error: error.message });
      }
    });

    it('7.6 Follow Request Handling', () => {
      try {
        // Create a follow request first
        cy.login(testUser2.email, testUser2.password);
        cy.visit(`/profile/${testUser.username}`);
        cy.get('[data-testid="follow-button"]').click();

        // Switch back to test user
        cy.login(testUser.email, testUser.password);
        cy.visit('/notifications');

        cy.get('[data-testid="follow-request-item"]').first().within(() => {
          cy.get('[data-testid="approve-request"]').click();
        });

        cy.contains('Follow request approved').should('be.visible');
        testResults.passed.push('Follow Request Handling');
      } catch (error) {
        testResults.failed.push({ test: 'Follow Request Handling', error: error.message });
      }
    });

    it('7.7 Delete Notification', () => {
      try {
        const initialCount = Cypress.$('[data-testid="notification-item"]').length;

        cy.get('[data-testid="delete-notification"]').first().click();

        cy.get('[data-testid="notification-item"]').should('have.length', initialCount - 1);
        testResults.passed.push('Delete Notification');
      } catch (error) {
        testResults.failed.push({ test: 'Delete Notification', error: error.message });
      }
    });

    it('7.8 Real-time Notifications', () => {
      try {
        // Simulate real-time notification
        cy.window().then((win) => {
          win.postMessage({
            type: 'NEW_NOTIFICATION',
            data: {
              id: 'test-notification',
              type: 'like',
              text: 'liked your post',
              actor: { username: 'testuser2', avatar_url: null }
            }
          }, '*');
        });

        cy.get('[data-testid="notification-item"]').should('contain', 'liked your post');
        testResults.passed.push('Real-time Notifications');
      } catch (error) {
        testResults.failed.push({ test: 'Real-time Notifications', error: error.message });
      }
    });
  });

  describe('8. Social Interactions', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/home');
    });

    it('8.1 Like/Unlike Post', () => {
      try {
        cy.get('[data-testid="post-item"]').first().within(() => {
          cy.get('[data-testid="like-button"]').click();
          cy.get('[data-testid="like-button"]').should('have.class', 'liked');

          cy.get('[data-testid="like-button"]').click();
          cy.get('[data-testid="like-button"]').should('not.have.class', 'liked');
        });
        testResults.passed.push('Like/Unlike Post');
      } catch (error) {
        testResults.failed.push({ test: 'Like/Unlike Post', error: error.message });
      }
    });

    it('8.2 Comment on Post', () => {
      try {
        cy.get('[data-testid="post-item"]').first().within(() => {
          cy.get('[data-testid="comment-button"]').click();
          cy.get('[data-testid="comment-input"]').type('Test comment');
          cy.get('[data-testid="submit-comment"]').click();
        });

        cy.contains('Test comment').should('be.visible');
        testResults.passed.push('Comment on Post');
      } catch (error) {
        testResults.failed.push({ test: 'Comment on Post', error: error.message });
      }
    });

    it('8.3 Share Post', () => {
      try {
        cy.get('[data-testid="post-item"]').first().within(() => {
          cy.get('[data-testid="share-button"]').click();
          cy.get('[data-testid="share-modal"]').should('be.visible');
          cy.get('[data-testid="copy-link"]').click();
        });

        cy.contains('Link copied').should('be.visible');
        testResults.passed.push('Share Post');
      } catch (error) {
        testResults.failed.push({ test: 'Share Post', error: error.message });
      }
    });

    it('8.4 Save/Unsave Post', () => {
      try {
        cy.get('[data-testid="post-item"]').first().within(() => {
          cy.get('[data-testid="save-button"]').click();
          cy.get('[data-testid="save-button"]').should('have.class', 'saved');

          cy.get('[data-testid="save-button"]').click();
          cy.get('[data-testid="save-button"]').should('not.have.class', 'saved');
        });
        testResults.passed.push('Save/Unsave Post');
      } catch (error) {
        testResults.failed.push({ test: 'Save/Unsave Post', error: error.message });
      }
    });

    it('8.5 Follow/Unfollow User', () => {
      try {
        cy.visit(`/profile/${testUser2.username}`);

        cy.get('[data-testid="follow-button"]').click();
        cy.get('[data-testid="follow-button"]').should('contain', 'Following');

        cy.get('[data-testid="follow-button"]').click();
        cy.get('[data-testid="follow-button"]').should('contain', 'Follow');
        testResults.passed.push('Follow/Unfollow User');
      } catch (error) {
        testResults.failed.push({ test: 'Follow/Unfollow User', error: error.message });
      }
    });

    it('8.6 Direct Messaging', () => {
      try {
        cy.visit(`/messages/${testUser2.username}`);

        cy.get('[data-testid="message-input"]').type('Test message');
        cy.get('[data-testid="send-message"]').click();

        cy.contains('Test message').should('be.visible');
        testResults.passed.push('Direct Messaging');
      } catch (error) {
        testResults.failed.push({ test: 'Direct Messaging', error: error.message });
      }
    });
  });

  describe('9. Performance & Accessibility', () => {
    it('9.1 Page Load Performance', () => {
      try {
        cy.visit('/home', { timeout: 10000 });
        cy.window().then((win) => {
          const loadTime = win.performance.timing.loadEventEnd - win.performance.timing.navigationStart;
          expect(loadTime).to.be.lessThan(3000); // Less than 3 seconds
        });
        testResults.passed.push('Page Load Performance');
      } catch (error) {
        testResults.failed.push({ test: 'Page Load Performance', error: error.message });
      }
    });

    it('9.2 Image Loading', () => {
      try {
        cy.visit('/explore');
        cy.get('img').each(($img) => {
          cy.wrap($img).should('be.visible');
          cy.wrap($img).should('have.prop', 'naturalWidth').and('be.greaterThan', 0);
        });
        testResults.passed.push('Image Loading');
      } catch (error) {
        testResults.failed.push({ test: 'Image Loading', error: error.message });
      }
    });

    it('9.3 Keyboard Navigation', () => {
      try {
        cy.visit('/home');
        cy.get('body').tab();
        cy.focused().should('be.visible');

        // Navigate through focusable elements
        cy.get('body').type('{tab}{tab}{tab}');
        testResults.passed.push('Keyboard Navigation');
      } catch (error) {
        testResults.failed.push({ test: 'Keyboard Navigation', error: error.message });
      }
    });

    it('9.4 Screen Reader Support', () => {
      try {
        cy.visit('/profile');
        cy.get('[aria-label]').should('have.length.greaterThan', 5);
        cy.get('[role]').should('have.length.greaterThan', 3);
        testResults.passed.push('Screen Reader Support');
      } catch (error) {
        testResults.failed.push({ test: 'Screen Reader Support', error: error.message });
      }
    });

    it('9.5 Error Handling', () => {
      try {
        cy.visit('/nonexistent-page');
        cy.contains('Page not found').should('be.visible');
        testResults.passed.push('Error Handling');
      } catch (error) {
        testResults.failed.push({ test: 'Error Handling', error: error.message });
      }
    });
  });

  describe('10. Edge Cases & Error Scenarios', () => {
    it('10.1 Network Error Handling', () => {
      try {
        cy.intercept('GET', '/api/posts', { forceNetworkError: true });
        cy.visit('/home');
        cy.contains('Failed to load').should('be.visible');
        testResults.passed.push('Network Error Handling');
      } catch (error) {
        testResults.failed.push({ test: 'Network Error Handling', error: error.message });
      }
    });

    it('10.2 Invalid File Upload', () => {
      try {
        cy.visit('/create');
        cy.get('[data-testid="content-type-post"]').click();

        // Try to upload invalid file type
        cy.get('[data-testid="media-input"]').selectFile('cypress/fixtures/invalid-file.txt');
        cy.contains('Invalid file type').should('be.visible');
        testResults.passed.push('Invalid File Upload');
      } catch (error) {
        testResults.failed.push({ test: 'Invalid File Upload', error: error.message });
      }
    });

    it('10.3 Rate Limiting', () => {
      try {
        cy.visit('/explore');

        // Rapid fire requests
        for (let i = 0; i < 10; i++) {
          cy.get('[data-testid="like-button"]').first().click();
        }

        cy.contains('Too many requests').should('be.visible');
        testResults.passed.push('Rate Limiting');
      } catch (error) {
        testResults.failed.push({ test: 'Rate Limiting', error: error.message });
      }
    });

    it('10.4 Session Timeout', () => {
      try {
        // Simulate session timeout
        cy.window().then((win) => {
          win.localStorage.removeItem('auth_token');
        });

        cy.visit('/profile');
        cy.url().should('include', '/auth');
        testResults.passed.push('Session Timeout');
      } catch (error) {
        testResults.failed.push({ test: 'Session Timeout', error: error.message });
      }
    });

    it('10.5 Empty States', () => {
      try {
        cy.login('empty@focusapp.com', 'TestPass123!');
        cy.visit('/profile');

        cy.get('[data-testid="empty-posts"]').should('be.visible');
        cy.get('[data-testid="empty-boltz"]').should('be.visible');
        cy.get('[data-testid="empty-saved"]').should('be.visible');
        testResults.passed.push('Empty States');
      } catch (error) {
        testResults.failed.push({ test: 'Empty States', error: error.message });
      }
    });
  });

  describe('11. Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport('iphone-6');
    });

    it('11.1 Mobile Navigation', () => {
      try {
        cy.login(testUser.email, testUser.password);
        cy.visit('/home');

        cy.get('[data-testid="mobile-menu-toggle"]').click();
        cy.get('[data-testid="mobile-nav-menu"]').should('be.visible');

        cy.get('[data-testid="mobile-nav-explore"]').click();
        cy.url().should('include', '/explore');
        testResults.passed.push('Mobile Navigation');
      } catch (error) {
        testResults.failed.push({ test: 'Mobile Navigation', error: error.message });
      }
    });

    it('11.2 Touch Interactions', () => {
      try {
        cy.visit('/boltz');

        // Test swipe gestures
        const videoContainer = cy.get('[data-testid="boltz-container"]');

        videoContainer.trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
        videoContainer.trigger('touchmove', { touches: [{ clientX: 100, clientY: 50 }] });
        videoContainer.trigger('touchend');

        // Assert swipe worked
        cy.get('[data-testid="current-video-index"]').should('contain', '2');
        testResults.passed.push('Touch Interactions');
      } catch (error) {
        testResults.failed.push({ test: 'Touch Interactions', error: error.message });
      }
    });
  });
});
