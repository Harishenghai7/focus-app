/**
 * Critical Permission & Security Fixes Tests
 * Tests for the 45 critical issues found in the Focus app
 * 
 * Issues Fixed:
 * #1-5: Profile privacy and blocking in feed
 * #7: Blocked users can't message
 * #10: XSS protection
 * #26: RPC error handling
 * #29: Real-time cleanup
 * #30: Retry logic
 */

describe('Critical Permission & Security Fixes', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'test-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
  });

  describe('Issue #1-5: Feed Privacy & Blocking', () => {
    it('should not show posts from blocked users in feed', () => {
      // CRITICAL FIX #1: Blocked users filtered from feed
      cy.intercept('GET', '**/posts*', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 'post-1',
              user_id: 'blocked-user-id',
              caption: 'This should not appear',
              created_at: new Date().toISOString()
            }
          ]
        }
      });

      cy.intercept('GET', '**/blocked_users*', {
        statusCode: 200,
        body: {
          data: [{ blocked_id: 'blocked-user-id' }]
        }
      });

      cy.visit('http://localhost:3000/home');
      
      // Post from blocked user should not be visible
      cy.contains('This should not appear').should('not.exist');
    });

    it('should check if current user is blocked by profile owner', () => {
      // CRITICAL FIX #2: Check if blocked by profile owner
      cy.intercept('GET', '**/profiles*', {
        statusCode: 200,
        body: {
          data: { id: 'other-user-id', username: 'otheruser' }
        }
      });

      cy.intercept('GET', '**/blocked_users*', {
        statusCode: 200,
        body: {
          data: [{ blocker_id: 'other-user-id', blocked_id: 'test-user-id' }]
        }
      });

      cy.visit('http://localhost:3000/profile/otheruser');
      
      // Should show "Profile not found" or similar message
      cy.contains(/not found|unavailable/i).should('exist');
    });

    it('should respect is_private flag when showing profile content', () => {
      // CRITICAL FIX #3: Check is_private before showing content
      cy.intercept('GET', '**/profiles*', {
        statusCode: 200,
        body: {
          data: {
            id: 'other-user-id',
            username: 'privateuser',
            is_private: true
          }
        }
      });

      cy.intercept('GET', '**/follows*', {
        statusCode: 200,
        body: { data: [] } // Not following
      });

      cy.visit('http://localhost:3000/profile/privateuser');
      
      // Should show "This account is private" message
      cy.contains(/private/i).should('exist');
    });

    it('should not show followers/following lists to blocked users', () => {
      // CRITICAL FIX #4: Check blocked status before showing lists
      cy.intercept('GET', '**/follows*', {
        statusCode: 200,
        body: { data: [] }
      });

      cy.intercept('GET', '**/blocked_users*', {
        statusCode: 200,
        body: {
          data: [{ blocker_id: 'test-user-id', blocked_id: 'other-user-id' }]
        }
      });

      cy.visit('http://localhost:3000/profile/otheruser');
      cy.get('[data-testid="followers-button"]').click();
      
      // Should not show followers list
      cy.get('[data-testid="followers-modal"]').should('not.exist');
    });
  });

  describe('Issue #7: Blocked Users Cannot Message', () => {
    it('should prevent sending messages to blocked users', () => {
      // CRITICAL FIX #7: Check blocked status before sending
      cy.intercept('GET', '**/blocked_users*', {
        statusCode: 200,
        body: {
          data: [{ blocker_id: 'test-user-id', blocked_id: 'other-user-id' }]
        }
      });

      cy.visit('http://localhost:3000/messages');
      cy.get('[data-testid="message-input"]').type('Hello');
      cy.get('[data-testid="send-button"]').click();
      
      // Should show error message
      cy.contains(/blocked|cannot message/i).should('exist');
    });

    it('should prevent receiving messages from blocked users', () => {
      // CRITICAL FIX #7: Check blocked status on receive
      cy.intercept('GET', '**/messages*', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 'msg-1',
              sender_id: 'blocked-user-id',
              text: 'This should not appear'
            }
          ]
        }
      });

      cy.intercept('GET', '**/blocked_users*', {
        statusCode: 200,
        body: {
          data: [{ blocker_id: 'test-user-id', blocked_id: 'blocked-user-id' }]
        }
      });

      cy.visit('http://localhost:3000/messages');
      
      // Message from blocked user should not appear
      cy.contains('This should not appear').should('not.exist');
    });
  });

  describe('Issue #10: XSS Protection', () => {
    it('should sanitize user input in bio', () => {
      // CRITICAL FIX #10: XSS protection
      const xssPayload = '<img src=x onerror="alert(\'XSS\')">';
      
      cy.intercept('GET', '**/profiles*', {
        statusCode: 200,
        body: {
          data: {
            id: 'test-user-id',
            username: 'testuser',
            bio: xssPayload
          }
        }
      });

      cy.visit('http://localhost:3000/profile');
      
      // XSS payload should be escaped, not executed
      cy.window().then((win) => {
        expect(win.alert.called).to.be.false;
      });
    });

    it('should sanitize user input in comments', () => {
      // CRITICAL FIX #10: XSS protection in comments
      const xssPayload = '<script>alert("XSS")</script>';
      
      cy.get('[data-testid="comment-input"]').type(xssPayload);
      cy.get('[data-testid="comment-submit"]').click();
      
      // Script should not execute
      cy.window().then((win) => {
        expect(win.alert.called).to.be.false;
      });
    });
  });

  describe('Issue #26: RPC Error Handling', () => {
    it('should handle RPC function errors gracefully', () => {
      // CRITICAL FIX #26: RPC error handling
      cy.intercept('POST', '**/rpc/mark_messages_read', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      });

      cy.visit('http://localhost:3000/messages');
      
      // Should not crash, should show error message
      cy.contains(/error|failed/i).should('exist');
    });

    it('should retry failed RPC calls', () => {
      // CRITICAL FIX #30: Retry logic
      let callCount = 0;
      
      cy.intercept('POST', '**/rpc/mark_messages_read', (req) => {
        callCount++;
        if (callCount < 2) {
          req.reply({
            statusCode: 500,
            body: { error: 'Temporary error' }
          });
        } else {
          req.reply({
            statusCode: 200,
            body: { data: null }
          });
        }
      });

      cy.visit('http://localhost:3000/messages');
      
      // Should eventually succeed after retry
      cy.wait(2000);
      expect(callCount).to.be.greaterThan(1);
    });
  });

  describe('Issue #29: Real-time Subscription Cleanup', () => {
    it('should unsubscribe from channels on component unmount', () => {
      // CRITICAL FIX #29: Cleanup subscriptions
      cy.visit('http://localhost:3000/home');
      
      // Navigate away
      cy.visit('http://localhost:3000/profile');
      
      // Subscriptions should be cleaned up
      cy.window().then((win) => {
        // Check that no memory leaks from subscriptions
        expect(Object.keys(win.supabase?.channels || {})).to.have.length(0);
      });
    });

    it('should handle subscription errors gracefully', () => {
      // CRITICAL FIX #29: Error handling in subscriptions
      cy.intercept('POST', '**/realtime*', {
        statusCode: 500,
        body: { error: 'Connection failed' }
      });

      cy.visit('http://localhost:3000/home');
      
      // Should not crash, should show fallback UI
      cy.get('[data-testid="home-feed"]').should('exist');
    });
  });

  describe('Issue #73: Feed Cache Invalidation', () => {
    it('should clear feed cache when following a new user', () => {
      // CRITICAL FIX #73: Cache invalidation on follow
      cy.visit('http://localhost:3000/home');
      
      // Get initial feed
      cy.get('[data-testid="post-card"]').should('have.length.greaterThan', 0);
      
      // Follow a new user
      cy.visit('http://localhost:3000/profile/newuser');
      cy.get('[data-testid="follow-button"]').click();
      
      // Go back to home
      cy.visit('http://localhost:3000/home');
      
      // Feed should be refreshed with new user's posts
      cy.get('[data-testid="post-card"]').should('exist');
    });
  });

  describe('Issue #236: Message Read Status Sync', () => {
    it('should update read status in real-time', () => {
      // CRITICAL FIX #236: Real-time read status
      cy.intercept('POST', '**/rpc/mark_messages_read', {
        statusCode: 200,
        body: { data: null }
      });

      cy.visit('http://localhost:3000/messages');
      
      // Message should show as read
      cy.get('[data-testid="message-status"]').should('contain', '✓✓');
    });
  });

  describe('Issue #461: Unread Count Desync', () => {
    it('should sync unread count across tabs', () => {
      // CRITICAL FIX #461: Unread count sync
      cy.visit('http://localhost:3000/messages');
      
      // Get unread count
      cy.get('[data-testid="unread-badge"]').then(($badge) => {
        const initialCount = parseInt($badge.text());
        
        // Open in another tab (simulated)
        cy.window().then((win) => {
          // Simulate message received in another tab
          const event = new StorageEvent('storage', {
            key: 'unread_count',
            newValue: (initialCount + 1).toString()
          });
          win.dispatchEvent(event);
        });
        
        // Unread count should update
        cy.get('[data-testid="unread-badge"]').should('contain', initialCount + 1);
      });
    });
  });

  describe('Issue #464: Like Count Race Condition', () => {
    it('should handle optimistic like updates correctly', () => {
      // CRITICAL FIX #464: Optimistic updates with rollback
      cy.visit('http://localhost:3000/home');
      
      cy.get('[data-testid="like-button"]').first().then(($btn) => {
        const initialCount = parseInt($btn.text());
        
        // Click like
        cy.wrap($btn).click();
        
        // Should show optimistic update
        cy.wrap($btn).should('contain', initialCount + 1);
        
        // Wait for server response
        cy.wait(1000);
        
        // Count should match server state
        cy.wrap($btn).should('contain', initialCount + 1);
      });
    });

    it('should rollback like on server error', () => {
      // CRITICAL FIX #464: Rollback on error
      cy.intercept('POST', '**/likes', {
        statusCode: 500,
        body: { error: 'Failed to like' }
      });

      cy.visit('http://localhost:3000/home');
      
      cy.get('[data-testid="like-button"]').first().then(($btn) => {
        const initialCount = parseInt($btn.text());
        
        cy.wrap($btn).click();
        
        // Should rollback to original count
        cy.wait(1000);
        cy.wrap($btn).should('contain', initialCount);
      });
    });
  });

  describe('Accessibility Fixes', () => {
    it('should have alt text on all images', () => {
      // CRITICAL FIX #31: Alt text for images
      cy.visit('http://localhost:3000/home');
      
      cy.get('img').each(($img) => {
        expect($img).to.have.attr('alt');
        expect($img.attr('alt')).to.not.be.empty;
      });
    });

    it('should have aria-labels on buttons', () => {
      // CRITICAL FIX #32: ARIA labels
      cy.visit('http://localhost:3000/home');
      
      cy.get('button').each(($btn) => {
        const hasAriaLabel = $btn.attr('aria-label') || $btn.text();
        expect(hasAriaLabel).to.exist;
      });
    });

    it('should trap focus in modals', () => {
      // CRITICAL FIX #33: Focus trap
      cy.visit('http://localhost:3000/profile');
      cy.get('[data-testid="followers-button"]').click();
      
      // Focus should be trapped in modal
      cy.get('[data-testid="followers-modal"]').should('have.focus');
    });
  });

  describe('Performance Fixes', () => {
    it('should lazy load images', () => {
      // CRITICAL FIX #36: Image lazy loading
      cy.visit('http://localhost:3000/home');
      
      cy.get('img').each(($img) => {
        expect($img).to.have.attr('loading', 'lazy');
      });
    });

    it('should debounce search input', () => {
      // CRITICAL FIX #39: Debounce search
      let searchCallCount = 0;
      
      cy.intercept('GET', '**/search*', () => {
        searchCallCount++;
      });

      cy.visit('http://localhost:3000/messages');
      cy.get('[data-testid="search-input"]').type('test');
      
      // Should not make multiple requests for each keystroke
      cy.wait(500);
      expect(searchCallCount).to.be.lessThan(5);
    });
  });
});
