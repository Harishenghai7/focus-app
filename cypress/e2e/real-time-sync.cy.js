describe('Real-Time Synchronization Testing', () => {
  const userA = { username: 'realtime_user_a', email: 'realtime_a@focus.com', password: 'password123' }
  const userB = { username: 'realtime_user_b', email: 'realtime_b@focus.com', password: 'password123' }

  before(() => {
    cy.task('setupTestUsers', [userA, userB])
  })

  after(() => {
    cy.task('cleanupTestUsers', [userA, userB])
  })

  it('should sync follow actions instantly across sessions', () => {
    // Setup two browser sessions
    cy.session('realtime-session-a', () => {
      cy.visit('/auth')
      cy.get('[data-testid="email-input"]').type(userA.email)
      cy.get('[data-testid="password-input"]').type(userA.password)
      cy.get('[data-testid="login-button"]').click()
      cy.url().should('include', '/home')
    })

    cy.session('realtime-session-b', () => {
      cy.visit('/auth')
      cy.get('[data-testid="email-input"]').type(userB.email)
      cy.get('[data-testid="password-input"]').type(userB.password)
      cy.get('[data-testid="login-button"]').click()
      cy.url().should('include', '/home')
    })

    // User A follows User B
    cy.session('realtime-session-a', () => {
      cy.visit('/explore')
      cy.get('[data-testid="search-input"]').type(userB.username)
      cy.get(`[data-testid="follow-button-${userB.username}"]`).click()
      cy.get(`[data-testid="follow-button-${userB.username}"]`).should('contain', 'Following')
    })

    // User B should see notification instantly
    cy.session('realtime-session-b', () => {
      cy.waitForRealtimeUpdate('[data-testid="notifications-badge"]', '1', 5000)
      cy.get('[data-testid="notifications-list"]').should('contain', 'followed you')
    })

    // User B follows back
    cy.session('realtime-session-b', () => {
      cy.visit('/profile/' + userA.username)
      cy.get(`[data-testid="follow-button-${userA.username}"]`).click()
    })

    // User A should see notification
    cy.session('realtime-session-a', () => {
      cy.waitForRealtimeUpdate('[data-testid="notifications-badge"]', '1', 5000)
    })
  })

  it('should sync post interactions in real-time', () => {
    let postId

    // User A creates post
    cy.session('realtime-session-a', () => {
      cy.visit('/create')
      cy.get('[data-testid="post-caption"]').type('Real-time sync test post')
      cy.get('[data-testid="publish-post"]').click()
      cy.get('[data-testid="post-card"]').first().invoke('attr', 'data-post-id').as('postId')
    })

    // User B sees post instantly
    cy.session('realtime-session-b', () => {
      cy.waitForRealtimeUpdate('[data-testid="feed-container"]', 'Real-time sync test post', 5000)
    })

    // User B likes post
    cy.session('realtime-session-b', () => {
      cy.get('[data-testid="like-button"]').first().click()
      cy.get('[data-testid="like-count"]').first().should('contain', '1')
    })

    // User A sees like instantly
    cy.session('realtime-session-a', () => {
      cy.waitForRealtimeUpdate('[data-testid="like-count"]', '1', 5000)
      cy.get('[data-testid="notifications-badge"]').should('be.visible')
    })

    // User B comments
    cy.session('realtime-session-b', () => {
      cy.get('[data-testid="comment-button"]').first().click()
      cy.get('[data-testid="comment-input"]').type('Real-time comment!')
      cy.get('[data-testid="submit-comment"]').click()
    })

    // User A sees comment instantly
    cy.session('realtime-session-a', () => {
      cy.waitForRealtimeUpdate('[data-testid="comments-list"]', 'Real-time comment!', 5000)
    })
  })

  it('should handle real-time messaging', () => {
    // User A sends message
    cy.session('realtime-session-a', () => {
      cy.visit('/messages')
      cy.get('[data-testid="new-message"]').click()
      cy.get('[data-testid="recipient-input"]').type(userB.username)
      cy.get('[data-testid="message-input"]').type('Real-time message test')
      cy.get('[data-testid="send-message"]').click()
    })

    // User B receives instantly
    cy.session('realtime-session-b', () => {
      cy.waitForRealtimeUpdate('[data-testid="messages-badge"]', '1', 5000)
      cy.visit('/messages')
      cy.get('[data-testid="chat-messages"]').should('contain', 'Real-time message test')
    })

    // Test typing indicators
    cy.session('realtime-session-b', () => {
      cy.get('[data-testid="message-input"]').type('Typing indicator test...')
      // Check if typing indicator appears for User A
    })

    cy.session('realtime-session-a', () => {
      cy.waitForRealtimeUpdate('[data-testid="typing-indicator"]', userB.username, 2000)
    })
  })

  it('should sync profile changes instantly', () => {
    // User A updates bio
    cy.session('realtime-session-a', () => {
      cy.visit('/profile/edit')
      cy.get('[data-testid="bio-input"]').clear().type('Updated bio for real-time testing')
      cy.get('[data-testid="save-profile"]').click()
    })

    // User B sees update instantly
    cy.session('realtime-session-b', () => {
      cy.visit('/profile/' + userA.username)
      cy.waitForRealtimeUpdate('[data-testid="profile-bio"]', 'Updated bio for real-time testing', 5000)
    })
  })

  it('should handle concurrent actions without race conditions', () => {
    // Both users like the same post rapidly
    cy.session('realtime-session-a', () => {
      for (let i = 0; i < 3; i++) {
        cy.get('[data-testid="like-button"]').first().click()
        cy.wait(200)
      }
    })

    cy.session('realtime-session-b', () => {
      for (let i = 0; i < 3; i++) {
        cy.get('[data-testid="like-button"]').first().click()
        cy.wait(150)
      }
    })

    // Verify final state is consistent
    cy.session('realtime-session-a', () => {
      cy.get('[data-testid="like-count"]').first().invoke('text').as('finalCountA')
    })

    cy.session('realtime-session-b', () => {
      cy.get('[data-testid="like-count"]').first().invoke('text').as('finalCountB')
    })

    cy.then(function() {
      expect(this.finalCountA).to.equal(this.finalCountB)
    })
  })

  it('should handle network interruptions gracefully', () => {
    // Simulate network failure
    cy.simulateNetworkFailure('**/rest/v1/**')

    cy.session('realtime-session-a', () => {
      cy.get('[data-testid="like-button"]').first().click()
      cy.get('[data-testid="error-message"]').should('be.visible')
    })

    // Restore network
    cy.restoreNetwork('**/rest/v1/**', { statusCode: 200 })

    cy.session('realtime-session-a', () => {
      cy.get('[data-testid="retry-button"]').click()
      cy.get('[data-testid="error-message"]').should('not.exist')
    })
  })

  it('should maintain real-time connections', () => {
    cy.session('realtime-session-a', () => {
      cy.checkRealTimeConnection()
      cy.window().then((win) => {
        expect(win.WebSocket).to.exist
      })
    })

    cy.session('realtime-session-b', () => {
      cy.checkRealTimeConnection()
    })
  })

  it('should sync story views and expirations', () => {
    // User A creates story
    cy.session('realtime-session-a', () => {
      cy.visit('/create')
      cy.get('[data-testid="story-toggle"]').click()
      cy.get('[data-testid="story-caption"]').type('Real-time story test')
      cy.get('[data-testid="publish-story"]').click()
    })

    // User B sees story instantly
    cy.session('realtime-session-b', () => {
      cy.waitForRealtimeUpdate('[data-testid="story-ring"]', 'unseen', 5000)
      cy.get('[data-testid="story-ring"]').click()
      cy.get('[data-testid="story-viewer"]').should('contain', 'Real-time story test')
    })

    // User A sees view count update
    cy.session('realtime-session-a', () => {
      cy.waitForRealtimeUpdate('[data-testid="story-views"]', '1', 5000)
    })
  })

  it('should handle real-time call notifications', () => {
    // User A initiates call to User B
    cy.session('realtime-session-a', () => {
      cy.visit('/messages')
      cy.get(`[data-testid="call-${userB.username}"]`).click()
      cy.get('[data-testid="call-screen"]').should('be.visible')
    })

    // User B receives call notification instantly
    cy.session('realtime-session-b', () => {
      cy.waitForRealtimeUpdate('[data-testid="incoming-call"]', userA.username, 3000)
      cy.get('[data-testid="incoming-call"]').should('be.visible')
    })

    // User B answers call
    cy.session('realtime-session-b', () => {
      cy.get('[data-testid="answer-call"]').click()
      cy.get('[data-testid="active-call"]').should('be.visible')
    })

    // Both users should be in call
    cy.session('realtime-session-a', () => {
      cy.get('[data-testid="active-call"]').should('be.visible')
    })

    // End call
    cy.session('realtime-session-a', () => {
      cy.get('[data-testid="end-call"]').click()
      cy.get('[data-testid="call-history"]').should('contain', userB.username)
    })

    // User B sees call ended
    cy.session('realtime-session-b', () => {
      cy.get('[data-testid="call-ended"]').should('be.visible')
      cy.get('[data-testid="call-history"]').should('contain', userA.username)
    })
  })

  it('should sync notification read states', () => {
    // User A has notifications
    cy.session('realtime-session-a', () => {
      cy.get('[data-testid="notifications-badge"]').should('be.visible')
      cy.get('[data-testid="notifications-list"]').should('have.length.greaterThan', 0)
    })

    // User A marks as read
    cy.session('realtime-session-a', () => {
      cy.get('[data-testid="mark-all-read"]').click()
      cy.get('[data-testid="notifications-badge"]').should('not.be.visible')
    })

    // State persists across sessions
    cy.session('realtime-session-a', () => {
      cy.reload()
      cy.get('[data-testid="notifications-badge"]').should('not.be.visible')
    })
  })

  it('should handle real-time feed updates', () => {
    // User A creates multiple posts
    cy.session('realtime-session-a', () => {
      for (let i = 1; i <= 3; i++) {
        cy.visit('/create')
        cy.get('[data-testid="post-caption"]').type(`Feed update test post ${i}`)
        cy.get('[data-testid="publish-post"]').click()
        cy.wait(1000)
      }
    })

    // User B sees posts appear in feed instantly
    cy.session('realtime-session-b', () => {
      cy.visit('/home')
      cy.waitForRealtimeUpdate('[data-testid="feed-container"]', 'Feed update test post 1', 5000)
      cy.waitForRealtimeUpdate('[data-testid="feed-container"]', 'Feed update test post 2', 5000)
      cy.waitForRealtimeUpdate('[data-testid="feed-container"]', 'Feed update test post 3', 5000)
    })
  })

  it('should sync block/mute actions instantly', () => {
    // User A blocks User B
    cy.session('realtime-session-a', () => {
      cy.visit('/profile/' + userB.username)
      cy.get('[data-testid="three-dot-menu"]').click()
      cy.get('[data-testid="block-user"]').click()
      cy.get('[data-testid="confirm-block"]').click()
    })

    // User B is instantly blocked
    cy.session('realtime-session-b', () => {
      cy.visit('/profile/' + userA.username)
      cy.waitForRealtimeUpdate('[data-testid="blocked-message"]', 'blocked', 5000)
      cy.get('[data-testid="message-button"]').should('not.exist')
    })

    // User B cannot see User A's posts
    cy.session('realtime-session-b', () => {
      cy.visit('/home')
      cy.get('[data-testid="feed-container"]').should('not.contain', userA.username)
    })
  })
})
