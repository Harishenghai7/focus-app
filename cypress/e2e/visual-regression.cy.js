describe('Visual Regression Testing', () => {
  const userA = { username: 'visual_user_a', email: 'visual_a@focus.com', password: 'password123' }
  const userB = { username: 'visual_user_b', email: 'visual_b@focus.com', password: 'password123' }

  before(() => {
    cy.task('setupTestUsers', [userA, userB])
  })

  after(() => {
    cy.task('cleanupTestUsers', [userA, userB])
  })

  describe('Layout and Design Consistency', () => {
    it('should maintain consistent home feed layout', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Take baseline screenshot
      cy.screenshot('home-feed-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      })

      // Verify key elements are positioned correctly
      cy.get('[data-testid="nav-bar"]').should('be.visible').and('have.css', 'position', 'fixed')
      cy.get('[data-testid="feed-container"]').should('be.visible').and('have.css', 'display', 'grid')
      cy.get('[data-testid="post-card"]').first().should('be.visible')

      // Compare with baseline (would use Percy, Chromatic, or similar service)
      cy.task('compareScreenshot', {
        name: 'home-feed',
        baseline: 'home-feed-baseline',
        threshold: 0.01
      })
    })

    it('should maintain consistent profile page layout', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/profile')

      cy.screenshot('profile-page-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      })

      // Verify layout elements
      cy.get('[data-testid="profile-header"]').should('be.visible')
      cy.get('[data-testid="profile-stats"]').should('be.visible')
      cy.get('[data-testid="profile-posts"]').should('be.visible')

      cy.task('compareScreenshot', {
        name: 'profile-page',
        baseline: 'profile-page-baseline',
        threshold: 0.01
      })
    })

    it('should maintain consistent modal layouts', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/create')

      cy.screenshot('create-modal-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      })

      // Verify modal structure
      cy.get('[data-testid="create-modal"]').should('be.visible')
      cy.get('[data-testid="post-caption"]').should('be.visible')
      cy.get('[data-testid="publish-post"]').should('be.visible')

      cy.task('compareScreenshot', {
        name: 'create-modal',
        baseline: 'create-modal-baseline',
        threshold: 0.01
      })
    })
  })

  describe('Responsive Design Testing', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ]

    viewports.forEach((viewport) => {
      it(`should maintain layout on ${viewport.name}`, () => {
        cy.viewport(viewport.width, viewport.height)

        cy.switchUserSession(userA.username)
        cy.visit('/home')

        cy.screenshot(`home-${viewport.name}-baseline`, {
          capture: 'viewport',
          clip: { x: 0, y: 0, width: viewport.width, height: viewport.height }
        })

        // Verify responsive elements
        cy.get('[data-testid="feed-container"]').should('be.visible')
        cy.get('[data-testid="nav-bar"]').should('be.visible')

        // Check for layout breaks
        cy.get('[data-testid="post-card"]').each(($card) => {
          cy.wrap($card).should('be.visible')
          cy.wrap($card).should('not.have.css', 'overflow', 'hidden')
        })

        cy.task('compareScreenshot', {
          name: `home-${viewport.name}`,
          baseline: `home-${viewport.name}-baseline`,
          threshold: 0.02 // Slightly higher threshold for responsive layouts
        })
      })
    })
  })

  describe('Theme and Styling Consistency', () => {
    it('should maintain consistent light theme', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Ensure light theme
      cy.get('[data-testid="theme-toggle"]').then(($toggle) => {
        if ($toggle.hasClass('dark')) {
          cy.wrap($toggle).click()
        }
      })

      cy.screenshot('light-theme-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      })

      // Verify theme colors
      cy.get('[data-testid="root-element"]').should('have.css', '--bg-color', 'rgb(255, 255, 255)')
      cy.get('[data-testid="root-element"]').should('have.css', '--text-color', 'rgb(33, 37, 41)')

      cy.task('compareScreenshot', {
        name: 'light-theme',
        baseline: 'light-theme-baseline',
        threshold: 0.005
      })
    })

    it('should maintain consistent dark theme', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Switch to dark theme
      cy.get('[data-testid="theme-toggle"]').click()

      cy.screenshot('dark-theme-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      })

      // Verify dark theme colors
      cy.get('[data-testid="root-element"]').should('have.css', '--bg-color', 'rgb(33, 37, 41)')
      cy.get('[data-testid="root-element"]').should('have.css', '--text-color', 'rgb(248, 249, 250)')

      cy.task('compareScreenshot', {
        name: 'dark-theme',
        baseline: 'dark-theme-baseline',
        threshold: 0.005
      })
    })

    it('should maintain consistent high contrast mode', () => {
      // Enable high contrast
      cy.window().then((win) => {
        win.document.documentElement.style.filter = 'contrast(200%)'
      })

      cy.switchUserSession(userA.username)
      cy.visit('/home')

      cy.screenshot('high-contrast-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      })

      // Verify high contrast elements are still distinguishable
      cy.get('[data-testid="like-button"]').should('be.visible')
      cy.get('[data-testid="comment-button"]').should('be.visible')

      cy.task('compareScreenshot', {
        name: 'high-contrast',
        baseline: 'high-contrast-baseline',
        threshold: 0.01
      })
    })
  })

  describe('Interactive Element States', () => {
    it('should maintain consistent button states', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Normal state
      cy.screenshot('button-normal-baseline', {
        capture: 'runner',
        clip: { x: 0, y: 0, width: 200, height: 50 }
      })

      // Hover state
      cy.get('[data-testid="like-button"]').first().realHover()
      cy.screenshot('button-hover-baseline', {
        capture: 'runner',
        clip: { x: 0, y: 0, width: 200, height: 50 }
      })

      // Active/pressed state
      cy.get('[data-testid="like-button"]').first().realMouseDown()
      cy.screenshot('button-active-baseline', {
        capture: 'runner',
        clip: { x: 0, y: 0, width: 200, height: 50 }
      })

      // Verify state changes are consistent
      cy.task('compareScreenshot', {
        name: 'button-states',
        baseline: 'button-normal-baseline',
        variants: ['button-hover-baseline', 'button-active-baseline'],
        threshold: 0.02
      })
    })

    it('should maintain consistent form states', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/create')

      // Empty form
      cy.screenshot('form-empty-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 800, height: 400 }
      })

      // Filled form
      cy.get('[data-testid="post-caption"]').type('Test post content')
      cy.screenshot('form-filled-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 800, height: 400 }
      })

      // Error state
      cy.get('[data-testid="publish-post"]').click()
      cy.screenshot('form-error-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 800, height: 400 }
      })

      cy.task('compareScreenshot', {
        name: 'form-states',
        baseline: 'form-empty-baseline',
        variants: ['form-filled-baseline', 'form-error-baseline'],
        threshold: 0.01
      })
    })

    it('should maintain consistent loading states', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Trigger loading state
      cy.scrollTo('bottom')
      cy.get('[data-testid="loading-spinner"]').should('be.visible')

      cy.screenshot('loading-state-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 400, height: 100 }
      })

      // Verify loading animation
      cy.get('[data-testid="loading-spinner"]').should('have.css', 'animation')

      cy.task('compareScreenshot', {
        name: 'loading-state',
        baseline: 'loading-state-baseline',
        threshold: 0.005
      })
    })
  })

  describe('Content and Typography', () => {
    it('should maintain consistent typography', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      cy.screenshot('typography-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 1280, height: 400 }
      })

      // Verify font properties
      cy.get('[data-testid="post-title"]').should('have.css', 'font-family')
      cy.get('[data-testid="post-content"]').should('have.css', 'font-size')
      cy.get('[data-testid="post-content"]').should('have.css', 'line-height')

      // Check text rendering
      cy.get('[data-testid="post-content"]').each(($text) => {
        cy.wrap($text).should('be.visible')
        cy.wrap($text).should('not.have.css', 'overflow', 'hidden')
      })

      cy.task('compareScreenshot', {
        name: 'typography',
        baseline: 'typography-baseline',
        threshold: 0.005
      })
    })

    it('should handle special characters and emojis', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/create')

      const specialContent = '🚀 Special chars: àáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ 🌟'

      cy.get('[data-testid="post-caption"]').type(specialContent)
      cy.get('[data-testid="publish-post"]').click()

      cy.screenshot('special-characters-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 800, height: 200 }
      })

      // Verify special characters render correctly
      cy.get('[data-testid="feed-container"]').should('contain', specialContent)

      cy.task('compareScreenshot', {
        name: 'special-characters',
        baseline: 'special-characters-baseline',
        threshold: 0.01
      })
    })

    it('should maintain consistent icon rendering', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      cy.screenshot('icons-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 400, height: 100 }
      })

      // Verify icon fonts or SVGs are loaded
      cy.get('[data-testid="like-icon"]').should('be.visible')
      cy.get('[data-testid="comment-icon"]').should('be.visible')
      cy.get('[data-testid="share-icon"]').should('be.visible')

      // Check icon sizing
      cy.get('[data-testid="like-icon"]').should('have.css', 'font-size')
      cy.get('[data-testid="like-icon"]').should('have.css', 'width')

      cy.task('compareScreenshot', {
        name: 'icons',
        baseline: 'icons-baseline',
        threshold: 0.005
      })
    })
  })

  describe('Animation and Transition Testing', () => {
    it('should maintain consistent animations', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Trigger notification animation
      cy.task('triggerRealtimeEvent', { type: 'notification', data: { message: 'Test notification' } })

      cy.screenshot('notification-animation-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 400, height: 100 }
      })

      // Verify animation properties
      cy.get('[data-testid="notification-toast"]').should('have.css', 'animation-duration')
      cy.get('[data-testid="notification-toast"]').should('have.css', 'animation-timing-function')

      cy.task('compareScreenshot', {
        name: 'notification-animation',
        baseline: 'notification-animation-baseline',
        threshold: 0.02 // Higher threshold for animations
      })
    })

    it('should maintain consistent page transitions', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Navigate with transition
      cy.get('[data-testid="profile-nav"]').click()

      cy.screenshot('page-transition-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      })

      // Verify transition properties
      cy.get('[data-testid="page-container"]').should('have.css', 'transition')

      cy.task('compareScreenshot', {
        name: 'page-transition',
        baseline: 'page-transition-baseline',
        threshold: 0.03 // Higher threshold for transitions
      })
    })

    it('should handle reduced motion preferences', () => {
      // Simulate prefers-reduced-motion
      cy.window().then((win) => {
        win.matchMedia = cy.stub().returns({ matches: true })
      })

      cy.switchUserSession(userA.username)
      cy.visit('/home')

      cy.screenshot('reduced-motion-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      })

      // Verify animations are disabled
      cy.get('[data-testid="animated-element"]').should('have.css', 'animation-duration', '0s')
      cy.get('[data-testid="transition-element"]').should('have.css', 'transition-duration', '0s')

      cy.task('compareScreenshot', {
        name: 'reduced-motion',
        baseline: 'reduced-motion-baseline',
        threshold: 0.01
      })
    })
  })

  describe('Error and Edge Case Visuals', () => {
    it('should maintain consistent error states', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/create')

      // Trigger validation error
      cy.get('[data-testid="publish-post"]').click()

      cy.screenshot('error-state-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 800, height: 300 }
      })

      // Verify error styling
      cy.get('[data-testid="error-message"]').should('have.css', 'color', 'rgb(220, 53, 69)') // Red color
      cy.get('[data-testid="error-border"]').should('have.css', 'border-color', 'rgb(220, 53, 69)')

      cy.task('compareScreenshot', {
        name: 'error-state',
        baseline: 'error-state-baseline',
        threshold: 0.01
      })
    })

    it('should handle empty states consistently', () => {
      // Create user with no content
      const emptyUser = { username: 'empty_user', email: 'empty@focus.com', password: 'password123' }
      cy.task('setupTestUsers', [emptyUser])

      cy.switchUserSession(emptyUser.username)
      cy.visit('/profile')

      cy.screenshot('empty-state-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 1280, height: 400 }
      })

      // Verify empty state styling
      cy.get('[data-testid="empty-state"]').should('be.visible')
      cy.get('[data-testid="empty-icon"]').should('be.visible')
      cy.get('[data-testid="empty-message"]').should('contain', 'No posts yet')

      cy.task('compareScreenshot', {
        name: 'empty-state',
        baseline: 'empty-state-baseline',
        threshold: 0.01
      })

      cy.task('cleanupTestUsers', [emptyUser])
    })

    it('should maintain consistent offline states', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Go offline
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'))
      })

      cy.screenshot('offline-state-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 1280, height: 100 }
      })

      // Verify offline indicator
      cy.get('[data-testid="offline-banner"]').should('be.visible')
      cy.get('[data-testid="offline-banner"]').should('have.css', 'background-color', 'rgb(255, 193, 7)') // Warning color

      cy.task('compareScreenshot', {
        name: 'offline-state',
        baseline: 'offline-state-baseline',
        threshold: 0.01
      })
    })
  })

  describe('Cross-browser Visual Consistency', () => {
    it('should maintain visual consistency across browsers', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      const browser = Cypress.browser.name

      cy.screenshot(`${browser}-baseline`, {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      })

      // Verify browser-specific elements
      if (browser === 'chrome') {
        cy.get('[data-testid="chrome-specific-element"]').should('be.visible')
      } else if (browser === 'firefox') {
        cy.get('[data-testid="firefox-specific-element"]').should('be.visible')
      } else if (browser === 'edge') {
        cy.get('[data-testid="edge-specific-element"]').should('be.visible')
      }

      cy.task('compareScreenshot', {
        name: `${browser}-compatibility`,
        baseline: `${browser}-baseline`,
        threshold: 0.02 // Higher threshold for cross-browser differences
      })
    })
  })

  describe('Performance Visual Indicators', () => {
    it('should show performance indicators correctly', () => {
      cy.switchUserSession(userA.username)
      cy.visit('/home')

      // Trigger slow operation
      cy.intercept('**/api/posts', (req) => {
        req.reply((res) => {
          res.delay = 3000 // 3 second delay
        })
      })

      cy.scrollTo('bottom')

      cy.screenshot('performance-indicator-baseline', {
        capture: 'viewport',
        clip: { x: 0, y: 0, width: 400, height: 100 }
      })

      // Verify performance indicators
      cy.get('[data-testid="slow-loading-indicator"]').should('be.visible')
      cy.get('[data-testid="performance-warning"]').should('be.visible')

      cy.task('compareScreenshot', {
        name: 'performance-indicator',
        baseline: 'performance-indicator-baseline',
        threshold: 0.01
      })
    })
  })
})
