describe('Supreme QA - Multi-User Real-Time Social Media Testing', () => {
  const userA = {
    username: 'testuser_a',
    email: 'testuser_a@focus.com',
    password: 'password123',
    fullName: 'Test User A'
  }

  const userB = {
    username: 'testuser_b',
    email: 'testuser_b@focus.com',
    password: 'password123',
    fullName: 'Test User B'
  }

  before(() => {
    // Setup test users in database
    cy.task('setupTestUsers', [userA, userB])
  })

  after(() => {
    // Cleanup test users
    cy.task('cleanupTestUsers', [userA, userB])
  })

  describe('1. Search, Follow, and Explore Logic', () => {
    it('should handle real-time search and follow across sessions', () => {
      // Session A: User A searches for User B
      cy.session('userA-session', () => {
        cy.visit('/auth')
        cy.get('[data-testid="email-input"]').type(userA.email)
        cy.get('[data-testid="password-input"]').type(userA.password)
        cy.get('[data-testid="login-button"]').click()
        cy.url().should('include', '/home')
      })

      // Session B: User B logs in
      cy.session('userB-session', () => {
        cy.visit('/auth')
        cy.get('[data-testid="email-input"]').type(userB.email)
        cy.get('[data-testid="password-input"]').type(userB.password)
        cy.get('[data-testid="login-button"]').click()
        cy.url().should('include', '/home')
      })

      // User A searches for User B
      cy.session('userA-session', () => {
        cy.visit('/explore')
        cy.get('[data-testid="search-input"]').type(userB.username)
        cy.get('[data-testid="search-results"]').should('contain', userB.username)
        cy.get(`[data-testid="user-card-${userB.username}"]`).should('be.visible')
        cy.get(`[data-testid="follow-button-${userB.username}"]`).should('contain', 'Follow')
      })

      // User A follows User B
      cy.session('userA-session', () => {
        cy.get(`[data-testid="follow-button-${userB.username}"]`).click()
        cy.get(`[data-testid="follow-button-${userB.username}"]`).should('contain', 'Following')
      })

      // User B should receive real-time notification
      cy.session('userB-session', () => {
        cy.get('[data-testid="notifications-badge"]').should('be.visible')
        cy.get('[data-testid="notifications-list"]').should('contain', `${userA.fullName} followed you`)
      })

      // User B follows back
      cy.session('userB-session', () => {
        cy.visit('/profile/' + userA.username)
        cy.get(`[data-testid="follow-button-${userA.username}"]`).click()
        cy.get(`[data-testid="follow-button-${userA.username}"]`).should('contain', 'Following')
      })

      // User A should receive notification
      cy.session('userA-session', () => {
        cy.get('[data-testid="notifications-badge"]').should('be.visible')
        cy.get('[data-testid="notifications-list"]').should('contain', `${userB.fullName} followed you`)
      })

      // Both users should see each other's posts in feed
      cy.session('userA-session', () => {
        cy.visit('/home')
        cy.get('[data-testid="feed-container"]').should('contain', userB.username)
      })

      cy.session('userB-session', () => {
        cy.visit('/home')
        cy.get('[data-testid="feed-container"]').should('contain', userA.username)
      })
    })
  })

  describe('2. Profile Page Logic', () => {
    it('should sync profile changes across sessions', () => {
      // User A updates profile
      cy.session('userA-session', () => {
        cy.visit('/profile/edit')
        cy.get('[data-testid="bio-input"]').clear().type('Updated bio for testing')
        cy.get('[data-testid="save-profile"]').click()
        cy.get('[data-testid="profile-bio"]').should('contain', 'Updated bio for testing')
      })

      // User B views User A's profile and sees update
      cy.session('userB-session', () => {
        cy.visit('/profile/' + userA.username)
        cy.get('[data-testid="profile-bio"]').should('contain', 'Updated bio for testing')
      })

      // Test follow/unfollow sync
      cy.session('userB-session', () => {
        cy.get(`[data-testid="follow-button-${userA.username}"]`).click()
        cy.get(`[data-testid="follow-button-${userA.username}"]`).should('contain', 'Following')
      })

      cy.session('userA-session', () => {
        cy.visit('/profile')
        cy.get('[data-testid="followers-count"]').should('contain', '1')
      })
    })
  })

  describe('3. Posts, Stories, and Interactions', () => {
    let postId

    it('should sync post creation and interactions', () => {
      // User A creates a post
      cy.session('userA-session', () => {
        cy.visit('/create')
        cy.get('[data-testid="post-caption"]').type('Test post for multi-user testing #supremeQA')
        cy.get('[data-testid="publish-post"]').click()
        cy.url().should('include', '/home')
        cy.get('[data-testid="feed-container"]').should('contain', 'Test post for multi-user testing')

        // Get post ID for later reference
        cy.get('[data-testid="post-card"]').first().invoke('attr', 'data-post-id').as('postId')
      })

      // User B sees the post in feed
      cy.session('userB-session', () => {
        cy.visit('/home')
        cy.get('[data-testid="feed-container"]').should('contain', 'Test post for multi-user testing')
      })

      // User B likes the post
      cy.session('userB-session', () => {
        cy.get('[data-testid="like-button"]').first().click()
        cy.get('[data-testid="like-count"]').first().should('contain', '1')
      })

      // User A sees the like
      cy.session('userA-session', () => {
        cy.visit('/home')
        cy.get('[data-testid="like-count"]').first().should('contain', '1')
        cy.get('[data-testid="notifications-badge"]').should('be.visible')
      })

      // User B comments on the post
      cy.session('userB-session', () => {
        cy.get('[data-testid="comment-button"]').first().click()
        cy.get('[data-testid="comment-input"]').type('Great post!')
        cy.get('[data-testid="submit-comment"]').click()
        cy.get('[data-testid="comments-list"]').should('contain', 'Great post!')
      })

      // User A sees the comment
      cy.session('userA-session', () => {
        cy.get('[data-testid="comments-list"]').should('contain', 'Great post!')
        cy.get('[data-testid="notifications-list"]').should('contain', 'commented on your post')
      })
    })
  })

  describe('4. Messaging and Calls', () => {
    it('should handle real-time messaging across sessions', () => {
      // User A sends message to User B
      cy.session('userA-session', () => {
        cy.visit('/messages')
        cy.get('[data-testid="new-message"]').click()
        cy.get('[data-testid="recipient-input"]').type(userB.username)
        cy.get('[data-testid="message-input"]').type('Hello from User A!')
        cy.get('[data-testid="send-message"]').click()
        cy.get('[data-testid="chat-messages"]').should('contain', 'Hello from User A!')
      })

      // User B receives message
      cy.session('userB-session', () => {
        cy.get('[data-testid="messages-badge"]').should('be.visible')
        cy.visit('/messages')
        cy.get('[data-testid="chat-messages"]').should('contain', 'Hello from User A!')
      })

      // User B replies
      cy.session('userB-session', () => {
        cy.get('[data-testid="message-input"]').type('Hello back from User B!')
        cy.get('[data-testid="send-message"]').click()
        cy.get('[data-testid="chat-messages"]').should('contain', 'Hello back from User B!')
      })

      // User A sees reply
      cy.session('userA-session', () => {
        cy.get('[data-testid="chat-messages"]').should('contain', 'Hello back from User B!')
      })

      // Test typing indicators
      cy.session('userB-session', () => {
        cy.get('[data-testid="message-input"]').type('Typing...')
        cy.get('[data-testid="typing-indicator"]').should('be.visible')
      })

      cy.session('userA-session', () => {
        cy.get('[data-testid="typing-indicator"]').should('contain', userB.username)
      })
    })
  })

  describe('5. Notifications System', () => {
    it('should sync notifications across all sessions', () => {
      // User A performs various actions that trigger notifications
      cy.session('userA-session', () => {
        // Create post
        cy.visit('/create')
        cy.get('[data-testid="post-caption"]').type('Notification test post')
        cy.get('[data-testid="publish-post"]').click()
      })

      // User B likes and comments
      cy.session('userB-session', () => {
        cy.visit('/home')
        cy.get('[data-testid="like-button"]').first().click()
        cy.get('[data-testid="comment-button"]').first().click()
        cy.get('[data-testid="comment-input"]').type('Test comment')
        cy.get('[data-testid="submit-comment"]').click()
      })

      // User A checks notifications
      cy.session('userA-session', () => {
        cy.get('[data-testid="notifications-badge"]').should('be.visible')
        cy.get('[data-testid="notifications-list"]').should('contain', 'liked your post')
        cy.get('[data-testid="notifications-list"]').should('contain', 'commented on your post')
      })

      // Mark notifications as read
      cy.session('userA-session', () => {
        cy.get('[data-testid="mark-read"]').click()
        cy.get('[data-testid="notifications-badge"]').should('not.be.visible')
      })

      // Check persistence across sessions
      cy.session('userA-session', () => {
        cy.reload()
        cy.get('[data-testid="notifications-badge"]').should('not.be.visible')
      })
    })
  })

  describe('6. Settings and Privacy', () => {
    it('should sync privacy settings across sessions', () => {
      // User A changes privacy settings
      cy.session('userA-session', () => {
        cy.visit('/settings/privacy')
        cy.get('[data-testid="private-account"]').check()
        cy.get('[data-testid="save-settings"]').click()
        cy.get('[data-testid="success-message"]').should('be.visible')
      })

      // User B tries to view User A's profile
      cy.session('userB-session', () => {
        cy.visit('/profile/' + userA.username)
        cy.get('[data-testid="private-profile-message"]').should('be.visible')
        cy.get('[data-testid="request-follow"]').should('be.visible')
      })

      // User A approves follow request
      cy.session('userA-session', () => {
        cy.get('[data-testid="follow-requests"]').should('contain', userB.username)
        cy.get(`[data-testid="approve-${userB.username}"]`).click()
      })

      // User B can now see User A's posts
      cy.session('userB-session', () => {
        cy.reload()
        cy.get('[data-testid="private-profile-message"]').should('not.exist')
        cy.get('[data-testid="feed-container"]').should('be.visible')
      })
    })
  })

  describe('7. Real-Time Edge Cases', () => {
    it('should handle race conditions and concurrent actions', () => {
      // Test rapid follow/unfollow
      cy.session('userA-session', () => {
        for (let i = 0; i < 5; i++) {
          cy.get(`[data-testid="follow-button-${userB.username}"]`).click()
          cy.wait(100)
          cy.get(`[data-testid="follow-button-${userB.username}"]`).click()
          cy.wait(100)
        }
        // Final state should be consistent
        cy.get(`[data-testid="follow-button-${userB.username}"]`).should('contain', 'Follow')
      })

      // Test concurrent likes
      cy.session('userA-session', () => {
        cy.get('[data-testid="like-button"]').first().as('likeBtn')
        cy.get('@likeBtn').click()
      })

      cy.session('userB-session', () => {
        cy.get('[data-testid="like-button"]').first().click()
      })

      // Both sessions should show consistent like count
      cy.session('userA-session', () => {
        cy.get('[data-testid="like-count"]').first().invoke('text').as('likeCountA')
      })

      cy.session('userB-session', () => {
        cy.get('[data-testid="like-count"]').first().invoke('text').as('likeCountB')
      })

      cy.then(function() {
        expect(this.likeCountA).to.equal(this.likeCountB)
      })
    })

    it('should handle network failures gracefully', () => {
      // Simulate network failure during action
      cy.intercept('POST', '**/rest/v1/**', { forceNetworkError: true }).as('networkError')

      cy.session('userA-session', () => {
        cy.get('[data-testid="like-button"]').first().click()
        cy.get('[data-testid="error-message"]').should('be.visible')
        cy.get('[data-testid="retry-button"]').should('be.visible')
      })

      // Restore network and retry
      cy.intercept('POST', '**/rest/v1/**', { statusCode: 200 }).as('networkRestored')

      cy.session('userA-session', () => {
        cy.get('[data-testid="retry-button"]').click()
        cy.get('[data-testid="error-message"]').should('not.exist')
      })
    })

    it('should handle offline/online transitions', () => {
      // Go offline
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'))
      })

      cy.session('userA-session', () => {
        cy.get('[data-testid="offline-indicator"]').should('be.visible')
        cy.get('[data-testid="like-button"]').first().click()
        // Action should be queued
        cy.get('[data-testid="queued-indicator"]').should('be.visible')
      })

      // Go online
      cy.window().then((win) => {
        win.dispatchEvent(new Event('online'))
      })

      cy.session('userA-session', () => {
        cy.get('[data-testid="offline-indicator"]').should('not.exist')
        cy.get('[data-testid="sync-indicator"]').should('be.visible')
        cy.wait(2000) // Wait for sync
        cy.get('[data-testid="sync-indicator"]').should('not.exist')
      })
    })
  })

  describe('8. Performance and Memory', () => {
    it('should maintain performance under load', () => {
      cy.session('userA-session', () => {
        // Measure initial memory usage
        cy.window().then((win) => {
          if (win.performance.memory) {
            cy.task('log', `Initial memory: ${win.performance.memory.usedJSHeapSize / 1024 / 1024}MB`)
          }
        })

        // Perform many actions
        for (let i = 0; i < 20; i++) {
          cy.get('[data-testid="like-button"]').first().click({ force: true })
          cy.wait(50)
        }

        // Check memory usage after load
        cy.window().then((win) => {
          if (win.performance.memory) {
            const memoryMB = win.performance.memory.usedJSHeapSize / 1024 / 1024
            cy.task('log', `After load memory: ${memoryMB}MB`)
            expect(memoryMB).to.be.lessThan(200) // Less than 200MB
          }
        })
      })
    })
  })

  describe('9. Security and Permissions', () => {
    it('should enforce proper permissions', () => {
      // User A blocks User B
      cy.session('userA-session', () => {
        cy.visit('/profile/' + userB.username)
        cy.get('[data-testid="three-dot-menu"]').click()
        cy.get('[data-testid="block-user"]').click()
        cy.get('[data-testid="confirm-block"]').click()
      })

      // User B should not be able to interact with User A
      cy.session('userB-session', () => {
        cy.visit('/profile/' + userA.username)
        cy.get('[data-testid="blocked-message"]').should('be.visible')
        cy.get('[data-testid="message-button"]').should('not.exist')
        cy.get('[data-testid="follow-button"]').should('not.exist')
      })

      // User B should not see User A's posts
      cy.session('userB-session', () => {
        cy.visit('/home')
        cy.get('[data-testid="feed-container"]').should('not.contain', userA.username)
      })
    })
  })

  describe('10. Accessibility and UI Consistency', () => {
    it('should maintain accessibility standards', () => {
      cy.session('userA-session', () => {
        // Check for proper ARIA labels
        cy.get('[data-testid="like-button"]').should('have.attr', 'aria-label')
        cy.get('[data-testid="comment-button"]').should('have.attr', 'aria-label')

        // Check keyboard navigation
        cy.get('[data-testid="like-button"]').first().focus()
        cy.get('[data-testid="like-button"]').first().type('{enter}')
        cy.get('[data-testid="like-button"]').first().should('have.class', 'liked')

        // Check color contrast (would need axe-core integration)
        cy.task('runAxe')
      })
    })
  })
})
