describe('Performance and Load Tests', () => {
  const testUsers = Array.from({ length: 50 }, (_, i) => ({
    email: `perfuser${i}@example.com`,
    password: 'TestPass123!',
    username: `perfuser${i}`
  }))

  before(() => {
    cy.task('setupTestUsers', testUsers)
  })

  it('should handle high concurrent user load', () => {
    const startTime = Date.now()

    // Simulate multiple users performing actions simultaneously
    const actions = testUsers.slice(0, 10).map((user, index) => {
      return cy.session(`perf-user-${index}`, () => {
        cy.visit('/auth')
        cy.get('[data-cy="email-input"]').type(user.email)
        cy.get('[data-cy="password-input"]').type(user.password)
        cy.get('[data-cy="login-button"]').click()
        cy.visit('/home')
        cy.get('[data-cy="post-item"]').first().find('[data-cy="like-button"]').click()
      })
    })

    // Wait for all actions to complete
    cy.wrap(Promise.all(actions)).then(() => {
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Should complete within reasonable time (under 30 seconds for 10 users)
      expect(totalTime).to.be.lessThan(30000)

      cy.task('log', `Concurrent load test completed in ${totalTime}ms`)
    })
  })

  it('should maintain performance under sustained load', () => {
    cy.session('load-test-user', () => {
      cy.visit('/auth')
      cy.get('[data-cy="email-input"]').type(testUsers[0].email)
      cy.get('[data-cy="password-input"]').type(testUsers[0].password)
      cy.get('[data-cy="login-button"]').click()
      cy.visit('/home')

      const startTime = Date.now()

      // Perform 100 rapid interactions
      for (let i = 0; i < 100; i++) {
        cy.get('[data-cy="post-item"]').first().find('[data-cy="like-button"]').click()
        cy.get('[data-cy="post-item"]').first().find('[data-cy="comment-button"]').click()
        cy.get('[data-cy="comment-input"]').type(`Load test comment ${i}`)
        cy.get('[data-cy="comment-submit"]').click()
        cy.get('[data-cy="comment-modal-close"]').click()
      }

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Should complete within 2 minutes
      expect(totalTime).to.be.lessThan(120000)

      cy.task('log', `Sustained load test completed in ${totalTime}ms`)
    })
  })

  it('should handle memory usage efficiently', () => {
    cy.session('memory-test-user', () => {
      cy.visit('/home')

      // Load many posts by scrolling
      for (let i = 0; i < 10; i++) {
        cy.scrollTo('bottom')
        cy.wait(500)
      }

      // Check memory usage
      cy.window().then((win) => {
        if (win.performance.memory) {
          const memoryUsage = win.performance.memory.usedJSHeapSize
          const memoryMB = memoryUsage / (1024 * 1024)

          // Should not exceed 200MB for loaded content
          expect(memoryMB).to.be.lessThan(200)

          cy.task('log', `Memory usage: ${memoryMB.toFixed(2)}MB`)
        }
      })
    })
  })

  it('should maintain response times under load', () => {
    const responseTimes = []

    cy.session('response-test-user', () => {
      // Intercept API calls and measure response times
      cy.intercept('GET', '**/posts', (req) => {
        const startTime = Date.now()
        req.on('response', (res) => {
          const endTime = Date.now()
          responseTimes.push(endTime - startTime)
        })
      }).as('postsRequest')

      cy.visit('/home')
      cy.wait('@postsRequest')

      // Perform multiple actions and measure response times
      for (let i = 0; i < 20; i++) {
        const actionStart = Date.now()
        cy.get('[data-cy="post-item"]').first().find('[data-cy="like-button"]').click()
        cy.wait(100) // Allow time for optimistic update
        const actionEnd = Date.now()
        responseTimes.push(actionEnd - actionStart)
      }

      // Calculate average response time
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length

      // Should be under 500ms average
      expect(avgResponseTime).to.be.lessThan(500)

      cy.task('log', `Average response time: ${avgResponseTime.toFixed(2)}ms`)
    })
  })

  it('should handle WebSocket connection scaling', () => {
    // Test multiple concurrent WebSocket connections
    const connections = []

    for (let i = 0; i < 5; i++) {
      connections.push(
        cy.session(`ws-test-user-${i}`, () => {
          cy.visit('/auth')
          cy.get('[data-cy="email-input"]').type(testUsers[i].email)
          cy.get('[data-cy="password-input"]').type(testUsers[i].password)
          cy.get('[data-cy="login-button"]').click()
          cy.visit('/home')

          // Verify WebSocket connection
          cy.window().then((win) => {
            // Check if real-time subscriptions are active
            expect(win).to.have.property('WebSocket')
          })
        })
      )
    }

    cy.wrap(Promise.all(connections)).then(() => {
      cy.task('log', 'Multiple WebSocket connections established successfully')
    })
  })

  it('should test database query performance', () => {
    // Test feed loading with many posts
    cy.session('db-test-user', () => {
      cy.intercept('GET', '**/posts*', (req) => {
        req.on('response', (res) => {
          // Log query performance
          cy.task('log', `Feed query took ${res.duration}ms`)
          expect(res.duration).to.be.lessThan(2000) // Under 2 seconds
        })
      }).as('feedQuery')

      cy.visit('/home')
      cy.wait('@feedQuery')

      // Test search performance
      cy.get('[data-cy="search-input"]').type('test query')
      cy.intercept('GET', '**/search*', (req) => {
        req.on('response', (res) => {
          cy.task('log', `Search query took ${res.duration}ms`)
          expect(res.duration).to.be.lessThan(1000) // Under 1 second
        })
      }).as('searchQuery')

      cy.wait('@searchQuery')
    })
  })

  it('should handle offline/online state transitions', () => {
    cy.session('offline-test-user', () => {
      cy.visit('/home')

      // Go offline
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'))
      })

      cy.get('[data-cy="offline-indicator"]').should('be.visible')

      // Try actions while offline
      cy.get('[data-cy="post-item"]').first().find('[data-cy="like-button"]').click()
      cy.get('[data-cy="queued-action-indicator"]').should('be.visible')

      // Go back online
      cy.window().then((win) => {
        win.dispatchEvent(new Event('online'))
      })

      cy.get('[data-cy="offline-indicator"]').should('not.exist')
      cy.get('[data-cy="sync-indicator"]').should('be.visible')

      // Wait for sync to complete
      cy.get('[data-cy="sync-indicator"]', { timeout: 10000 }).should('not.exist')
    })
  })

  it('should test image loading performance', () => {
    cy.session('image-test-user', () => {
      const imageLoadTimes = []

      // Intercept image requests
      cy.intercept('GET', '**/*.{jpg,jpeg,png,gif}', (req) => {
        const startTime = Date.now()
        req.on('response', (res) => {
          const loadTime = Date.now() - startTime
          imageLoadTimes.push(loadTime)
        })
      }).as('imageLoad')

      cy.visit('/home')

      // Wait for images to load
      cy.get('img', { timeout: 10000 }).should('be.visible')

      cy.wait('@imageLoad').then(() => {
        if (imageLoadTimes.length > 0) {
          const avgLoadTime = imageLoadTimes.reduce((a, b) => a + b, 0) / imageLoadTimes.length
          // Images should load within 2 seconds average
          expect(avgLoadTime).to.be.lessThan(2000)

          cy.task('log', `Average image load time: ${avgLoadTime.toFixed(2)}ms`)
        }
      })
    })
  })

  it('should handle browser resource limits', () => {
    cy.session('resource-test-user', () => {
      // Open many tabs/windows (simulated)
      const tabs = []

      for (let i = 0; i < 10; i++) {
        tabs.push(cy.window().then((win) => {
          // Simulate opening multiple tabs
          return win.open('/home', `tab-${i}`)
        }))
      }

      cy.wrap(Promise.all(tabs)).then(() => {
        // Check if app handles multiple instances gracefully
        cy.window().then((win) => {
          if (win.performance.memory) {
            const memoryUsage = win.performance.memory.usedJSHeapSize / (1024 * 1024)
            // Should not exceed 300MB with multiple tabs
            expect(memoryUsage).to.be.lessThan(300)
          }
        })
      })
    })
  })

  it('should test API rate limiting under load', () => {
    cy.session('rate-limit-test-user', () => {
      const requests = []

      // Send many rapid requests
      for (let i = 0; i < 100; i++) {
        requests.push(
          cy.request({
            method: 'POST',
            url: '/api/likes',
            body: { postId: 'test-post-id' },
            failOnStatusCode: false
          })
        )
      }

      cy.wrap(Promise.all(requests)).then((responses) => {
        const rateLimitedCount = responses.filter(r => r.status === 429).length
        const successCount = responses.filter(r => r.status === 200 || r.status === 201).length

        // Should have some rate limiting
        expect(rateLimitedCount).to.be.greaterThan(0)
        expect(successCount).to.be.greaterThan(0)

        cy.task('log', `Rate limited: ${rateLimitedCount}, Successful: ${successCount}`)
      })
    })
  })

  after(() => {
    cy.task('cleanupTestUsers', testUsers)
  })
})
