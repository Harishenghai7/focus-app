describe('Edge Cases & Error Handling', () => {
  const userA = { username: 'edge_user_a', email: 'edge_a@focus.com', password: 'password123' }
  const userB = { username: 'edge_user_b', email: 'edge_b@focus.com', password: 'password123' }

  before(() => {
    cy.task('setupTestUsers', [userA, userB])
  })

  after(() => {
    cy.task('cleanupTestUsers', [userA, userB])
  })

  describe('Network Failure Scenarios', () => {
    it('should handle complete network failure', () => {
      cy.setupMultiUserSession(userA, userB)

      // Simulate complete network failure
      cy.intercept('*', { forceNetworkError: true })

      cy.switchUserSession(userA.username)
      cy.get('[data-testid="like-button"]').first().click()
      cy.get('[data-testid="offline-indicator"]').should('be.visible')
      cy.get('[data-testid="retry-queue"]').should('contain', '1')

      // Restore network
      cy.intercept('*', { statusCode: 200 })

      // Actions should sync
      cy.get('[data-testid="sync-indicator"]').should('be.visible')
      cy.get('[data-testid="retry-queue"]').should('contain', '0')
    })

    it('should handle intermittent connectivity', () => {
      cy.setupMultiUserSession(userA, userB)

      // Simulate intermittent failures
      let requestCount = 0
      cy.intercept('**/rest/v1/**', (req) => {
        requestCount++
        if (requestCount % 3 === 0) {
          req.reply({ forceNetworkError: true })
        } else {
          req.reply({ statusCode: 200 })
        }
      })

      // Perform multiple actions
      cy.switchUserSession(userA.username)
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="like-button"]').first().click()
        cy.wait(500)
      }

      // Should handle failures gracefully and retry
      cy.get('[data-testid="error-count"]').should('be.lessThan', 3)
    })

    it('should handle server errors (5xx)', () => {
      cy.intercept('**/rest/v1/**', { statusCode: 500 })

      cy.switchUserSession(userA.username)
      cy.get('[data-testid="create-post"]').click()
      cy.get('[data-testid="post-caption"]').type('Test post')
      cy.get('[data-testid="publish-post"]').click()
      cy.get('[data-testid="server-error"]').should('be.visible')
      cy.get('[data-testid="retry-button"]').should('be.visible')
    })

    it('should handle authentication errors', () => {
      cy.intercept('**/auth/v1/**', { statusCode: 401 })

      cy.switchUserSession(userA.username)
      cy.reload()
      cy.url().should('include', '/auth')
      cy.get('[data-testid="session-expired"]').should('be.visible')
    })
  })

  describe('Race Conditions', () => {
    it('should handle rapid follow/unfollow', () => {
      cy.setupMultiUserSession(userA, userB)

      cy.switchUserSession(userA.username)
      cy.visit('/profile/' + userB.username)

      // Rapid follow/unfollow clicks
      for (let i = 0; i < 10; i++) {
        cy.get('[data-testid="follow-button"]').click()
        cy.wait(100)
      }

      // Final state should be consistent
      cy.get('[data-testid="follow-button"]').invoke('text').then((text) => {
        // Should be either "Follow" or "Following" but not both
        expect(text.trim()).to.match(/^(Follow|Following)$/)
      })
    })

    it('should handle concurrent likes on same post', () => {
      // Create a post first
      cy.switchUserSession(userA.username)
      cy.visit('/create')
      cy.get('[data-testid="post-caption"]').type('Race condition test post')
      cy.get('[data-testid="publish-post"]').click()

      // Both users like simultaneously
      cy.switchUserSession(userA.username)
      cy.get('[data-testid="like-button"]').first().click()

      cy.switchUserSession(userB.username)
      cy.get('[data-testid="like-button"]').first().click()

      // Verify consistent like count
      cy.switchUserSession(userA.username)
      cy.get('[data-testid="like-count"]').first().invoke('text').as('countA')

      cy.switchUserSession(userB.username)
      cy.get('[data-testid="like-count"]').first().invoke('text').as('countB')

      cy.then(function() {
        expect(this.countA).to.equal(this.countB)
      })
    })

    it('should handle simultaneous message sending', () => {
      cy.setupMultiUserSession(userA, userB)

      // Both users send messages at the same time
      cy.switchUserSession(userA.username)
      cy.get('[data-testid="message-input"]').type('Message A')
      cy.get('[data-testid="send-message"]').click()

      cy.switchUserSession(userB.username)
      cy.get('[data-testid="message-input"]').type('Message B')
      cy.get('[data-testid="send-message"]').click()

      // Both messages should appear in correct order
      cy.switchUserSession(userA.username)
      cy.get('[data-testid="chat-messages"]').should('contain', 'Message A')
      cy.get('[data-testid="chat-messages"]').should('contain', 'Message B')

      cy.switchUserSession(userB.username)
      cy.get('[data-testid="chat-messages"]').should('contain', 'Message A')
      cy.get('[data-testid="chat-messages"]').should('contain', 'Message B')
    })
  })

  describe('Data Integrity Issues', () => {
    it('should handle corrupted local storage', () => {
      cy.switchUserSession(userA.username)

      // Corrupt local storage
      cy.window().then((win) => {
        win.localStorage.setItem('focus-app-data', 'corrupted-json{')
      })

      cy.reload()
      cy.url().should('include', '/auth') // Should redirect to login
      cy.get('[data-testid="data-corruption-warning"]').should('be.visible')
    })

    it('should handle missing required fields', () => {
      // Try to create post with missing caption
      cy.switchUserSession(userA.username)
      cy.visit('/create')
      cy.get('[data-testid="publish-post"]').should('be.disabled')

      // Try to send empty message
      cy.visit('/messages')
      cy.get('[data-testid="send-message"]').should('be.disabled')
    })

    it('should handle extremely long content', () => {
      const longText = 'A'.repeat(10000)

      cy.switchUserSession(userA.username)
      cy.visit('/create')
      cy.get('[data-testid="post-caption"]').type(longText, { delay: 0 })
      cy.get('[data-testid="publish-post"]').click()
      cy.get('[data-testid="length-warning"]').should('be.visible')
    })

    it('should handle special characters and emojis', () => {
      const specialText = '🚀 Special chars: àáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ'

      cy.switchUserSession(userA.username)
      cy.visit('/create')
      cy.get('[data-testid="post-caption"]').type(specialText)
      cy.get('[data-testid="publish-post"]').click()
      cy.get('[data-testid="feed-container"]').should('contain', specialText)
    })
  })

  describe('UI State Management', () => {
    it('should prevent multiple modals opening', () => {
      cy.switchUserSession(userA.username)

      // Try to open multiple modals
      cy.get('[data-testid="create-button"]').click()
      cy.get('[data-testid="post-modal"]').should('be.visible')

      cy.get('[data-testid="settings-button"]').click()
      cy.get('[data-testid="settings-modal"]').should('not.exist') // Should not open

      // Close first modal
      cy.get('[data-testid="close-modal"]').click()
      cy.get('[data-testid="post-modal"]').should('not.exist')

      // Now settings modal should open
      cy.get('[data-testid="settings-button"]').click()
      cy.get('[data-testid="settings-modal"]').should('be.visible')
    })

    it('should handle rapid navigation', () => {
      cy.switchUserSession(userA.username)

      // Rapid navigation clicks
      cy.get('[data-testid="home-nav"]').click()
      cy.get('[data-testid="explore-nav"]').click()
      cy.get('[data-testid="messages-nav"]').click()
      cy.get('[data-testid="profile-nav"]').click()
      cy.get('[data-testid="home-nav"]').click()

      // Should end up on home page without crashes
      cy.url().should('include', '/home')
      cy.get('[data-testid="feed-container"]').should('be.visible')
    })

    it('should handle browser back/forward', () => {
      cy.switchUserSession(userA.username)

      cy.visit('/home')
      cy.visit('/explore')
      cy.visit('/profile')

      // Browser back
      cy.go('back')
      cy.url().should('include', '/explore')

      // Browser forward
      cy.go('forward')
      cy.url().should('include', '/profile')

      // Multiple backs
      cy.go('back')
      cy.go('back')
      cy.url().should('include', '/home')
    })
  })

  describe('Performance Edge Cases', () => {
    it('should handle large data sets', () => {
      // Simulate large feed
      cy.intercept('**/rest/v1/posts**', { fixture: 'large-feed.json' })

      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Should load without crashing
      cy.get('[data-testid="feed-container"]').should('be.visible')

      // Infinite scroll should work
      cy.scrollTo('bottom')
      cy.get('[data-testid="loading-more"]').should('be.visible')
    })

    it('should handle memory leaks', () => {
      cy.switchUserSession(userA.username)

      // Measure initial memory
      cy.window().then((win) => {
        if (win.performance.memory) {
          cy.task('log', `Initial memory: ${win.performance.memory.usedJSHeapSize}`)
        }
      })

      // Perform many actions
      for (let i = 0; i < 50; i++) {
        cy.get('[data-testid="like-button"]').first().click({ force: true })
        cy.wait(50)
      }

      // Check memory hasn't grown excessively
      cy.window().then((win) => {
        if (win.performance.memory) {
          const memoryMB = win.performance.memory.usedJSHeapSize / 1024 / 1024
          cy.task('log', `Final memory: ${memoryMB}MB`)
          expect(memoryMB).to.be.lessThan(300) // Reasonable limit
        }
      })
    })

    it('should handle slow networks', () => {
      // Simulate slow network
      cy.intercept('**', (req) => {
        req.reply((res) => {
          res.delay = 5000 // 5 second delay
        })
      })

      cy.switchUserSession(userA.username)
      cy.get('[data-testid="like-button"]').first().click()
      cy.get('[data-testid="loading-indicator"]').should('be.visible')
      cy.get('[data-testid="timeout-warning"]', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Security Edge Cases', () => {
    it('should prevent XSS attempts', () => {
      const xssPayload = '<script>alert("xss")</script><img src=x onerror=alert(1)>'

      cy.switchUserSession(userA.username)
      cy.visit('/create')
      cy.get('[data-testid="post-caption"]').type(xssPayload)
      cy.get('[data-testid="publish-post"]').click()

      // Should be sanitized
      cy.get('[data-testid="feed-container"]').should('not.contain', '<script>')
      cy.get('[data-testid="feed-container"]').should('contain', '<script>')
    })

    it('should handle SQL injection attempts', () => {
      const sqlPayload = "'; DROP TABLE users; --"

      cy.switchUserSession(userA.username)
      cy.visit('/create')
      cy.get('[data-testid="post-caption"]').type(sqlPayload)
      cy.get('[data-testid="publish-post"]').click()

      // Should not crash the app
      cy.get('[data-testid="feed-container"]').should('be.visible')
    })

    it('should prevent unauthorized access', () => {
      // Try to access another user's private data
      cy.switchUserSession(userA.username)
      cy.visit(`/profile/${userB.username}/private-data`)
      cy.get('[data-testid="access-denied"]').should('be.visible')
    })
  })

  describe('Device and Browser Edge Cases', () => {
    it('should handle various viewport sizes', () => {
      const viewports = [
        [320, 568],   // iPhone SE
        [375, 667],   // iPhone 6/7/8
        [414, 896],   // iPhone 11
        [768, 1024],  // iPad
        [1024, 768],  // iPad landscape
        [1920, 1080]  // Desktop
      ]

      viewports.forEach(([width, height]) => {
        cy.viewport(width, height)
        cy.switchUserSession(userA.username)
        cy.visit('/home')
        cy.get('[data-testid="feed-container"]').should('be.visible')
        cy.get('[data-testid="nav-bar"]').should('be.visible')
      })
    })

    it('should handle touch vs mouse events', () => {
      cy.switchUserSession(userA.username)

      // Test touch events
      cy.get('[data-testid="like-button"]').first().realTouch('tap')
      cy.get('[data-testid="like-button"]').first().should('have.class', 'liked')

      // Test mouse events
      cy.get('[data-testid="like-button"]').first().realHover()
      cy.get('[data-testid="like-button"]').first().click()
      cy.get('[data-testid="like-button"]').first().should('not.have.class', 'liked')
    })

    it('should handle keyboard navigation', () => {
      cy.switchUserSession(userA.username)

      // Tab through interface
      cy.get('body').tab()
      cy.focused().should('be.visible')

      // Enter key on buttons
      cy.get('[data-testid="like-button"]').first().focus()
      cy.focused().type('{enter}')
      cy.get('[data-testid="like-button"]').first().should('have.class', 'liked')

      // Escape key handling
      cy.get('[data-testid="settings-button"]').click()
      cy.get('[data-testid="settings-modal"]').should('be.visible')
      cy.get('body').type('{esc}')
      cy.get('[data-testid="settings-modal"]').should('not.exist')
    })
  })

  describe('Real-time Edge Cases', () => {
    it('should handle WebSocket disconnection', () => {
      cy.switchUserSession(userA.username)

      // Simulate WebSocket disconnect
      cy.window().then((win) => {
        if (win.WebSocket) {
          // Force disconnect
          win.dispatchEvent(new CustomEvent('ws-disconnect'))
        }
      })

      cy.get('[data-testid="connection-lost"]').should('be.visible')

      // Should attempt reconnection
      cy.get('[data-testid="reconnecting-indicator"]').should('be.visible')
    })

    it('should handle duplicate real-time events', () => {
      // Simulate duplicate events
      cy.task('triggerRealtimeEvent', {
        type: 'like',
        data: { postId: '123', userId: userA.username },
        duplicate: true
      })

      cy.switchUserSession(userA.username)
      cy.get('[data-testid="like-count"]').first().invoke('text').then((count) => {
        const numCount = parseInt(count)
        // Should not have duplicate counts
        expect(numCount).to.be.at.most(1)
      })
    })

    it('should handle out-of-order events', () => {
      // Simulate events arriving out of order
      cy.task('triggerRealtimeEvent', {
        type: 'comment',
        data: { postId: '123', commentId: '2', order: 2 },
        delay: 1000
      })

      cy.task('triggerRealtimeEvent', {
        type: 'comment',
        data: { postId: '123', commentId: '1', order: 1 },
        delay: 0
      })

      cy.switchUserSession(userA.username)
      // Comments should appear in correct order despite arrival time
      cy.get('[data-testid="comment-list"]').children().first().should('contain', 'Comment 1')
      cy.get('[data-testid="comment-list"]').children().last().should('contain', 'Comment 2')
    })
  })

  describe('Data Synchronization Edge Cases', () => {
    it('should handle conflicting edits', () => {
      // User A and User B edit the same post simultaneously
      cy.switchUserSession(userA.username)
      cy.get('[data-testid="edit-post"]').first().click()
      cy.get('[data-testid="post-editor"]').type('Version A')

      cy.switchUserSession(userB.username)
      cy.get('[data-testid="edit-post"]').first().click()
      cy.get('[data-testid="post-editor"]').type('Version B')
      cy.get('[data-testid="save-edit"]').click()

      // User A tries to save
      cy.switchUserSession(userA.username)
      cy.get('[data-testid="save-edit"]').click()
      cy.get('[data-testid="conflict-warning"]').should('be.visible')
      cy.get('[data-testid="resolve-conflict"]').should('be.visible')
    })

    it('should handle deleted content references', () => {
      // User A deletes a post
      cy.switchUserSession(userA.username)
      cy.get('[data-testid="delete-post"]').first().click()
      cy.get('[data-testid="confirm-delete"]').click()

      // User B tries to interact with deleted post
      cy.switchUserSession(userB.username)
      cy.get('[data-testid="like-button"]').first().click()
      cy.get('[data-testid="content-not-found"]').should('be.visible')
    })

    it('should handle pagination edge cases', () => {
      // Load feed with exactly page size items
      cy.intercept('**/rest/v1/posts**', { fixture: 'exact-page-size.json' })

      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Should load next page on scroll
      cy.scrollTo('bottom')
      cy.get('[data-testid="loading-more"]').should('be.visible')
      cy.get('[data-testid="no-more-content"]').should('not.exist')
    })
  })
})
