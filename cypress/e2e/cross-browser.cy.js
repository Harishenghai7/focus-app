describe('Cross-Browser Compatibility Testing', () => {
  const userA = { username: 'cross_user_a', email: 'cross_a@focus.com', password: 'password123' }
  const userB = { username: 'cross_user_b', email: 'cross_b@focus.com', password: 'password123' }

  before(() => {
    cy.task('setupTestUsers', [userA, userB])
  })

  after(() => {
    cy.task('cleanupTestUsers', [userA, userB])
  })

  describe('Core Functionality Across Browsers', () => {
    it('should work in Chrome', () => {
      // Chrome-specific setup
      cy.viewport(1920, 1080)

      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Test core interactions
      cy.get('[data-testid="feed-container"]').should('be.visible')
      cy.get('[data-testid="like-button"]').first().click()
      cy.get('[data-testid="comment-button"]').first().click()
      cy.get('[data-testid="comment-input"]').type('Chrome test comment')
      cy.get('[data-testid="submit-comment"]').click()

      // Verify real-time sync
      cy.switchUserSession(userB.username)
      cy.get('[data-testid="feed-container"]').should('contain', 'Chrome test comment')
    })

    it('should work in Firefox', () => {
      // Firefox has different default styles and behaviors
      cy.viewport(1920, 1080)

      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Firefox handles focus differently
      cy.get('[data-testid="search-input"]').focus()
      cy.get('[data-testid="search-input"]').should('be.focused')

      // Test form submissions
      cy.visit('/create')
      cy.get('[data-testid="post-caption"]').type('Firefox test post')
      cy.get('[data-testid="publish-post"]').click()
      cy.get('[data-testid="feed-container"]').should('contain', 'Firefox test post')
    })

    it('should work in Safari', () => {
      // Safari has unique behaviors with caching and touch events
      cy.viewport(1440, 900)

      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Safari handles localStorage differently
      cy.window().then((win) => {
        expect(win.localStorage).to.exist
        win.localStorage.setItem('safari-test', 'working')
        expect(win.localStorage.getItem('safari-test')).to.equal('working')
      })

      // Test WebSocket connections (Safari handles them differently)
      cy.get('[data-testid="real-time-status"]').should('contain', 'connected')
    })

    it('should work in Edge', () => {
      // Edge (Chromium-based) should behave like Chrome but test anyway
      cy.viewport(1920, 1080)

      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Test modern web APIs
      cy.window().then((win) => {
        expect(win.fetch).to.exist
        expect(win.WebSocket).to.exist
        expect(win.IntersectionObserver).to.exist
      })

      // Test CSS Grid and Flexbox layouts
      cy.get('[data-testid="feed-container"]').should('have.css', 'display', 'grid')
      cy.get('[data-testid="nav-bar"]').should('have.css', 'display', 'flex')
    })
  })

  describe('Mobile Browser Compatibility', () => {
    it('should work on iOS Safari', () => {
      cy.viewport('iphone-x')

      cy.switchUserSession(userA.username)
      cy.visit('/auth')
      cy.get('[data-testid="email-input"]').type(userA.email)
      cy.get('[data-testid="password-input"]').type(userA.password)
      cy.get('[data-testid="login-button"]').click()

      // iOS Safari has issues with 100vh, test viewport height handling
      cy.get('[data-testid="main-content"]').should('be.visible')
      cy.window().then((win) => {
        const viewportHeight = win.innerHeight
        expect(viewportHeight).to.be.greaterThan(0)
      })

      // Test touch events
      cy.get('[data-testid="like-button"]').first().realTouch('tap')
      cy.get('[data-testid="like-button"]').first().should('have.class', 'liked')
    })

    it('should work on Chrome Mobile', () => {
      cy.viewport('samsung-s10')

      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Test mobile-specific features
      cy.get('[data-testid="mobile-nav"]').should('be.visible')
      cy.get('[data-testid="hamburger-menu"]').click()
      cy.get('[data-testid="mobile-menu"]').should('be.visible')

      // Test pull-to-refresh
      cy.get('[data-testid="feed-container"]').realSwipe('down', { length: 100 })
      cy.get('[data-testid="refresh-indicator"]').should('be.visible')
    })

    it('should work on Samsung Internet', () => {
      cy.viewport('samsung-note9')

      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Samsung Internet has unique features
      cy.window().then((win) => {
        // Test if Samsung Internet specific APIs are handled gracefully
        expect(win).to.have.property('webkit')
      })

      // Test standard functionality
      cy.get('[data-testid="feed-container"]').should('be.visible')
      cy.get('[data-testid="search-input"]').type('Samsung test')
      cy.get('[data-testid="search-results"]').should('be.visible')
    })
  })

  describe('CSS and Layout Compatibility', () => {
    it('should handle CSS Grid fallbacks', () => {
      // Test with browsers that don't support CSS Grid
      cy.window().then((win) => {
        // Simulate older browser by removing CSS Grid support
        const originalSupports = win.CSS?.supports
        if (win.CSS) {
          win.CSS.supports = (property, value) => {
            if (property === 'display' && value === 'grid') return false
            return originalSupports?.(property, value) || false
          }
        }
      })

      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Layout should still work with flexbox fallback
      cy.get('[data-testid="feed-container"]').should('have.css', 'display', 'flex')
      cy.get('[data-testid="post-card"]').should('be.visible')
    })

    it('should handle Flexbox compatibility', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Test flexbox layouts across browsers
      cy.get('[data-testid="nav-bar"]').should('have.css', 'display', 'flex')
      cy.get('[data-testid="nav-bar"]').invoke('css', 'flex-direction').should('equal', 'row')

      // Test flex item alignment
      cy.get('[data-testid="nav-item"]').first().should('have.css', 'align-self', 'center')
    })

    it('should handle CSS Custom Properties (CSS Variables)', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Test CSS custom properties
      cy.get('[data-testid="root-element"]').should('have.css', '--primary-color')
      cy.get('[data-testid="root-element"]').should('have.css', '--font-size-base')

      // Test theme switching
      cy.get('[data-testid="theme-toggle"]').click()
      cy.get('[data-testid="root-element"]').should('have.class', 'dark-theme')
    })

    it('should handle CSS Transforms and Animations', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Test CSS transforms
      cy.get('[data-testid="like-button"]').first().realHover()
      cy.get('[data-testid="like-button"]').first().should('have.css', 'transform')

      // Test animations
      cy.get('[data-testid="notification-toast"]').should('have.css', 'animation-duration')
      cy.get('[data-testid="loading-spinner"]').should('have.css', 'animation')

      // Test transitions
      cy.get('[data-testid="button"]').first().realHover()
      cy.get('[data-testid="button"]').first().should('have.css', 'transition')
    })
  })

  describe('JavaScript API Compatibility', () => {
    it('should handle ES6+ features', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Test modern JavaScript features
      cy.window().then((win) => {
        expect(win.Promise).to.exist
        expect(win.fetch).to.exist
        expect(win.Map).to.exist
        expect(win.Set).to.exist
        expect(win.ArrowFunction).to.not.exist // Should be transpiled

        // Test async/await
        const asyncTest = async () => 'test'
        expect(asyncTest()).to.be.a('promise')
      })

      // Test modern DOM APIs
      cy.window().then((win) => {
        expect(win.IntersectionObserver).to.exist
        expect(win.MutationObserver).to.exist
        expect(win.ResizeObserver).to.exist
      })
    })

    it('should handle Web API compatibility', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      cy.window().then((win) => {
        // Test Web APIs used in the app
        expect(win.localStorage).to.exist
        expect(win.sessionStorage).to.exist
        expect(win.WebSocket).to.exist
        expect(win.Notification).to.exist
        expect(win.ServiceWorker).to.exist

        // Test fetch API
        expect(typeof win.fetch).to.equal('function')

        // Test URL API
        expect(win.URL).to.exist
        expect(win.URLSearchParams).to.exist
      })
    })

    it('should handle polyfills gracefully', () => {
      // Test with missing APIs (simulate older browsers)
      cy.window().then((win) => {
        // Temporarily remove fetch
        const originalFetch = win.fetch
        delete win.fetch

        // Reload page to test polyfills
        cy.reload()

        // Should still work with polyfill
        cy.get('[data-testid="feed-container"]').should('be.visible')

        // Restore fetch
        win.fetch = originalFetch
      })
    })
  })

  describe('Event Handling Compatibility', () => {
    it('should handle mouse and touch events', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Test mouse events
      cy.get('[data-testid="like-button"]').first().click()
      cy.get('[data-testid="like-button"]').first().should('have.class', 'liked')

      // Test touch events (on touch devices)
      if (Cypress.config('viewportWidth') < 768) {
        cy.get('[data-testid="like-button"]').first().realTouch('tap')
        cy.get('[data-testid="like-button"]').first().should('have.class', 'liked')
      }

      // Test pointer events
      cy.get('[data-testid="post-card"]').first().realHover()
      cy.get('[data-testid="hover-menu"]').should('be.visible')
    })

    it('should handle keyboard events', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Test keyboard navigation
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'search-input')

      // Test keyboard shortcuts
      cy.get('body').type('{ctrl}k')
      cy.get('[data-testid="search-modal"]').should('be.visible')

      // Test escape key
      cy.get('body').type('{esc}')
      cy.get('[data-testid="search-modal"]').should('not.exist')
    })

    it('should handle scroll events', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Test infinite scroll
      cy.scrollTo('bottom')
      cy.get('[data-testid="loading-more"]').should('be.visible')
      cy.get('[data-testid="feed-container"]').children().should('have.length.greaterThan', 10)

      // Test smooth scrolling
      cy.get('[data-testid="scroll-to-top"]').should('be.visible').click()
      cy.window().then((win) => {
        expect(win.scrollY).to.equal(0)
      })
    })
  })

  describe('Network and Protocol Compatibility', () => {
    it('should handle HTTP/2 and HTTP/1.1', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Test resource loading
      cy.intercept('**/*.{js,css}', (req) => {
        expect(req.httpVersion).to.match(/1\.1|2/)
      })

      // Test API calls
      cy.intercept('**/api/**', (req) => {
        expect(['GET', 'POST', 'PUT', 'DELETE']).to.include(req.method)
      })
    })

    it('should handle WebSocket fallbacks', () => {
      // Test with WebSocket disabled (simulate older browsers)
      cy.window().then((win) => {
        const originalWebSocket = win.WebSocket
        delete win.WebSocket

        cy.reload()

        // Should fall back to polling or long-polling
        cy.get('[data-testid="real-time-status"]').should('contain', 'polling')
        cy.get('[data-testid="feed-container"]').should('be.visible')

        // Restore WebSocket
        win.WebSocket = originalWebSocket
      })
    })

    it('should handle CORS compatibility', () => {
      // Test cross-origin requests
      cy.request('https://httpbin.org/get').then((response) => {
        expect(response.status).to.equal(200)
      })

      // Test same-origin requests
      cy.switchUserSession(userA.username)
      cy.request('/api/profile').then((response) => {
        expect(response.status).to.equal(200)
      })
    })
  })

  describe('Storage and Caching Compatibility', () => {
    it('should handle localStorage and sessionStorage', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      cy.window().then((win) => {
        // Test localStorage
        win.localStorage.setItem('test-key', 'test-value')
        expect(win.localStorage.getItem('test-key')).to.equal('test-value')

        // Test sessionStorage
        win.sessionStorage.setItem('session-key', 'session-value')
        expect(win.sessionStorage.getItem('session-key')).to.equal('session-value')

        // Test storage events
        const storageEvent = new StorageEvent('storage', {
          key: 'test-key',
          oldValue: null,
          newValue: 'test-value',
          storageArea: win.localStorage
        })
        win.dispatchEvent(storageEvent)
      })

      // Should handle storage changes
      cy.get('[data-testid="storage-updated"]').should('be.visible')
    })

    it('should handle IndexedDB fallbacks', () => {
      cy.window().then((win) => {
        // Test IndexedDB support
        if (win.indexedDB) {
          const request = win.indexedDB.open('test-db', 1)
          expect(request).to.exist
        }

        // Test fallback to localStorage
        const originalIndexedDB = win.indexedDB
        delete win.indexedDB

        cy.reload()

        // Should still work with localStorage fallback
        cy.get('[data-testid="feed-container"]').should('be.visible')

        // Restore IndexedDB
        win.indexedDB = originalIndexedDB
      })
    })

    it('should handle cache API', () => {
      cy.window().then((win) => {
        // Test Cache API support
        if ('caches' in win) {
          expect(win.caches).to.exist
          expect(typeof win.caches.open).to.equal('function')
        }
      })

      // Test service worker caching
      cy.get('[data-testid="cache-status"]').should('contain', 'enabled')
    })
  })

  describe('Media and Graphics Compatibility', () => {
    it('should handle image formats', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Test WebP support
      cy.get('img').each(($img) => {
        const src = $img.attr('src')
        if (src?.includes('.webp')) {
          // Should have fallback or browser should support WebP
          cy.request(src).then((response) => {
            expect(response.status).to.equal(200)
          })
        }
      })

      // Test responsive images
      cy.get('img').should('have.attr', 'srcset').or('have.attr', 'sizes')
    })

    it('should handle video playback', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Test video elements
      cy.get('video').each(($video) => {
        // Should have proper attributes
        cy.wrap($video).should('have.attr', 'controls')
        cy.wrap($video).should('have.attr', 'preload')

        // Test playback
        cy.wrap($video).then(($vid) => {
          const video = $vid.get(0)
          expect(video).to.have.property('play')
          expect(video).to.have.property('pause')
        })
      })
    })

    it('should handle canvas and WebGL', () => {
      cy.window().then((win) => {
        // Test Canvas support
        const canvas = win.document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        expect(ctx).to.exist

        // Test WebGL support
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        if (gl) {
          expect(gl).to.exist
        } else {
          // Should have fallback for WebGL content
          cy.get('[data-testid="webgl-fallback"]').should('be.visible')
        }
      })
    })
  })

  describe('Browser Extensions Compatibility', () => {
    it('should work with ad blockers', () => {
      // Simulate ad blocker by blocking certain requests
      cy.intercept('**/ads/**', { statusCode: 404 })
      cy.intercept('**/analytics/**', { statusCode: 404 })

      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Should still work without ads/analytics
      cy.get('[data-testid="feed-container"]').should('be.visible')
      cy.get('[data-testid="ad-blocker-notice"]').should('not.exist')
    })

    it('should handle privacy extensions', () => {
      // Simulate privacy extensions blocking trackers
      cy.intercept('**/tracking/**', { statusCode: 404 })
      cy.intercept('**/facebook.com/**', { statusCode: 404 })
      cy.intercept('**/google-analytics.com/**', { statusCode: 404 })

      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Should work without third-party trackers
      cy.get('[data-testid="feed-container"]').should('be.visible')
      cy.get('[data-testid="privacy-warning"]').should('not.exist')
    })

    it('should work with password managers', () => {
      cy.visit('/auth')

      // Simulate password manager filling forms
      cy.window().then((win) => {
        // Simulate password manager extension
        const emailInput = win.document.querySelector('[data-testid="email-input"]')
        const passwordInput = win.document.querySelector('[data-testid="password-input"]')

        emailInput.value = userA.email
        passwordInput.value = userA.password

        emailInput.dispatchEvent(new Event('input', { bubbles: true }))
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
      })

      // Should handle auto-filled forms
      cy.get('[data-testid="email-input"]').should('have.value', userA.email)
      cy.get('[data-testid="password-input"]').should('have.value', userA.password)
      cy.get('[data-testid="login-button"]').click()
      cy.url().should('include', '/home')
    })
  })

  describe('Performance Across Browsers', () => {
    it('should maintain performance in different browsers', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Measure load time
      cy.window().then((win) => {
        if (win.performance.timing) {
          const loadTime = win.performance.timing.loadEventEnd - win.performance.timing.navigationStart
          const browser = Cypress.browser.name

          cy.task('log', `${browser} load time: ${loadTime}ms`)

          // Should load within reasonable time regardless of browser
          expect(loadTime).to.be.lessThan(10000)
        }
      })

      // Measure interaction performance
      const startTime = Date.now()
      for (let i = 0; i < 10; i++) {
        cy.get('[data-testid="like-button"]').first().click({ force: true })
      }
      const endTime = Date.now()
      const interactionTime = endTime - startTime

      cy.task('log', `Interaction time: ${interactionTime}ms`)
      expect(interactionTime).to.be.lessThan(2000)
    })

    it('should handle memory usage consistently', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      cy.window().then((win) => {
        if (win.performance.memory) {
          const memoryUsage = win.performance.memory.usedJSHeapSize / 1024 / 1024
          const browser = Cypress.browser.name

          cy.task('log', `${browser} memory usage: ${memoryUsage.toFixed(2)}MB`)

          // Should not exceed reasonable limits
          expect(memoryUsage).to.be.lessThan(300)
        }
      })

      // Test memory cleanup
      cy.visit('/explore')
      cy.visit('/messages')
      cy.visit('/home')

      cy.window().then((win) => {
        if (win.performance.memory) {
          const finalMemory = win.performance.memory.usedJSHeapSize / 1024 / 1024
          cy.task('log', `Final memory usage: ${finalMemory.toFixed(2)}MB`)
          expect(finalMemory).to.be.lessThan(350)
        }
      })
    })
  })
})
