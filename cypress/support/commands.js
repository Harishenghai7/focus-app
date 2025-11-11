// Custom Cypress commands for multi-user testing
// This file enhances Cypress with commands for managing multiple user sessions,
// real-time synchronization testing, and advanced interaction patterns

// Multi-User Session Management
Cypress.Commands.add('setupMultiUserSession', (users) => {
  cy.task('setupMultiUserSession', users)
})

Cypress.Commands.add('switchUserSession', (username) => {
  cy.task('switchUserSession', username)
})

Cypress.Commands.add('cleanupMultiUserSession', (users) => {
  cy.task('cleanupMultiUserSession', users)
})

// Real-Time Event Simulation
Cypress.Commands.add('simulateRealtimeEvent', (eventType, data) => {
  cy.task('simulateRealtimeEvent', { eventType, data })
})

Cypress.Commands.add('waitForRealtimeEvent', (eventType, timeout = 10000) => {
  cy.task('waitForRealtimeEvent', eventType, { timeout })
})

Cypress.Commands.add('triggerRealtimeUpdate', (target, data) => {
  cy.task('triggerRealtimeUpdate', { target, data })
})

// Advanced Interaction Commands
Cypress.Commands.add('realType', { prevSubject: 'element' }, (subject, text, options = {}) => {
  cy.wrap(subject).type(text, { ...options, delay: 0 })
})

Cypress.Commands.add('realHover', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).trigger('mouseover').trigger('mouseenter')
})

Cypress.Commands.add('realMouseDown', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).trigger('mousedown')
})

Cypress.Commands.add('realMouseUp', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).trigger('mouseup')
})

Cypress.Commands.add('realSwipe', { prevSubject: 'element' }, (subject, direction, options = {}) => {
  const directions = {
    left: { x: -100, y: 0 },
    right: { x: 100, y: 0 },
    up: { x: 0, y: -100 },
    down: { x: 0, y: 100 }
  }

  const delta = directions[direction]
  if (!delta) {
    throw new Error(`Invalid swipe direction: ${direction}`)
  }

  cy.wrap(subject).trigger('touchstart', { touches: [{ clientX: 0, clientY: 0 }] })
    .trigger('touchmove', { touches: [{ clientX: delta.x, clientY: delta.y }] })
    .trigger('touchend')
})

// Performance Monitoring Commands
Cypress.Commands.add('measurePerformance', (label, action) => {
  const startTime = Date.now()
  const startMemory = cy.window().then(win => win.performance.memory?.usedJSHeapSize || 0)

  action()

  cy.then(() => {
    const endTime = Date.now()
    const duration = endTime - startTime

    cy.window().then(win => {
      const endMemory = win.performance.memory?.usedJSHeapSize || 0
      const memoryDelta = endMemory - startMemory

      cy.task('logPerformance', { label, duration, memoryDelta })
    })
  })
})

Cypress.Commands.add('checkMemoryUsage', (threshold = 100 * 1024 * 1024) => { // 100MB default
  cy.window().then(win => {
    if (win.performance.memory) {
      const memoryUsage = win.performance.memory.usedJSHeapSize
      const memoryMB = memoryUsage / (1024 * 1024)

      cy.task('log', `Memory usage: ${memoryMB.toFixed(2)}MB`)

      if (memoryUsage > threshold) {
        throw new Error(`Memory usage exceeded threshold: ${memoryMB.toFixed(2)}MB > ${threshold / (1024 * 1024)}MB`)
      }
    }
  })
})

// Accessibility Testing Commands
Cypress.Commands.add('checkAccessibility', (context = 'document') => {
  cy.injectAxe()
  cy.checkA11y(context, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'section508']
    }
  })
})

Cypress.Commands.add('checkColorContrast', () => {
  cy.get('*').each(($el) => {
    const color = $el.css('color')
    const backgroundColor = $el.css('background-color')

    if (color && backgroundColor) {
      cy.task('checkContrast', { foreground: color, background: backgroundColor }).then((ratio) => {
        if (ratio < 4.5) {
          cy.task('log', `Low contrast ratio: ${ratio} on element: ${$el.prop('tagName')}.${$el.attr('class') || ''}`)
        }
      })
    }
  })
})

// Visual Regression Commands
Cypress.Commands.add('compareScreenshot', (name, options = {}) => {
  cy.screenshot(name, options)
  cy.task('compareScreenshot', { name, ...options })
})

// API Testing Commands
Cypress.Commands.add('apiRequest', (method, url, options = {}) => {
  const defaultOptions = {
    method,
    url,
    failOnStatusCode: false,
    ...options
  }

  return cy.request(defaultOptions)
})

Cypress.Commands.add('apiLogin', (email, password) => {
  cy.apiRequest('POST', '/api/auth/login', {
    body: { email, password }
  }).then((response) => {
    if (response.status === 200) {
      window.localStorage.setItem('authToken', response.body.token)
    }
    return response
  })
})

Cypress.Commands.add('apiLogout', () => {
  const token = window.localStorage.getItem('authToken')
  if (token) {
    cy.apiRequest('POST', '/api/auth/logout', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    window.localStorage.removeItem('authToken')
  }
})

// Security Testing Commands
Cypress.Commands.add('testXSS', (payload) => {
  cy.get('[data-testid="input-field"]').clear().type(payload)
  cy.get('[data-testid="submit-button"]').click()

  // Check if XSS was prevented
  cy.get('script').should('not.exist')
  cy.get('[data-testid="content"]').should('not.contain', '<script>')
})

Cypress.Commands.add('testSQLInjection', (payload) => {
  cy.get('[data-testid="search-input"]').clear().type(payload)
  cy.get('[data-testid="search-button"]').click()

  // Should not crash or return sensitive data
  cy.get('[data-testid="error-message"]').should('not.exist')
  cy.url().should('include', '/search')
})

// Cross-Browser Compatibility Commands
Cypress.Commands.add('checkBrowserSupport', (feature) => {
  cy.window().then((win) => {
    const support = {
      webgl: !!win.WebGLRenderingContext,
      websockets: !!win.WebSocket,
      localStorage: !!win.localStorage,
      indexedDB: !!win.indexedDB,
      serviceWorker: !!win.navigator.serviceWorker,
      geolocation: !!win.navigator.geolocation,
      notifications: !!win.Notification,
      fetch: typeof win.fetch === 'function',
      promises: typeof win.Promise === 'function'
    }

    if (!(feature in support)) {
      throw new Error(`Unknown feature: ${feature}`)
    }

    if (!support[feature]) {
      cy.task('log', `Feature not supported: ${feature}`)
    }

    return support[feature]
  })
})

// Mobile Testing Commands
Cypress.Commands.add('setMobileViewport', (device = 'iphone-x') => {
  const devices = {
    'iphone-x': { width: 375, height: 812 },
    'iphone-8': { width: 375, height: 667 },
    'samsung-s10': { width: 360, height: 760 },
    'pixel-3': { width: 393, height: 786 },
    'ipad': { width: 768, height: 1024 },
    'ipad-landscape': { width: 1024, height: 768 }
  }

  if (!devices[device]) {
    throw new Error(`Unknown device: ${device}`)
  }

  cy.viewport(devices[device].width, devices[device].height)
})

Cypress.Commands.add('simulateTouch', { prevSubject: 'element' }, (subject, action = 'tap') => {
  const actions = {
    tap: { event: 'touchstart', options: { touches: [{ clientX: 0, clientY: 0 }] } },
    press: { event: 'touchstart', options: { touches: [{ clientX: 0, clientY: 0 }], duration: 500 } },
    swipe: { event: 'touchmove', options: { touches: [{ clientX: 100, clientY: 0 }] } }
  }

  if (!actions[action]) {
    throw new Error(`Unknown touch action: ${action}`)
  }

  cy.wrap(subject).trigger(actions[action].event, actions[action].options)
})

// Real-Time Synchronization Commands
Cypress.Commands.add('waitForSync', (expectedState, timeout = 5000) => {
  cy.window().then((win) => {
    return new Cypress.Promise((resolve, reject) => {
      const checkSync = () => {
        // Check if real-time sync has completed
        if (win.appState && win.appState.isSynced === expectedState) {
          resolve()
        } else if (timeout <= 0) {
          reject(new Error('Sync timeout'))
        } else {
          timeout -= 100
          setTimeout(checkSync, 100)
        }
      }
      checkSync()
    })
  })
})

Cypress.Commands.add('verifyRealtimeUpdate', (selector, expectedContent, timeout = 2000) => {
  cy.get(selector, { timeout }).should('contain', expectedContent)
  cy.task('log', `Real-time update verified: ${expectedContent}`)
})

// Error Handling Commands
Cypress.Commands.add('expectError', (action, expectedError) => {
  cy.on('uncaught:exception', (err) => {
    if (err.message.includes(expectedError)) {
      return false // Prevent test failure
    }
  })

  action()

  cy.then(() => {
    cy.task('log', `Expected error caught: ${expectedError}`)
  })
})

Cypress.Commands.add('handleAsyncError', (promise, expectedError) => {
  return promise.catch((error) => {
    if (!error.message.includes(expectedError)) {
      throw error
    }
    cy.task('log', `Async error handled: ${expectedError}`)
  })
})

// Data Management Commands
Cypress.Commands.add('seedTestData', (data) => {
  cy.task('seedTestData', data)
})

Cypress.Commands.add('cleanupTestData', (data) => {
  cy.task('cleanupTestData', data)
})

Cypress.Commands.add('resetAppState', () => {
  cy.task('resetAppState')
  cy.reload()
})

// Network Interception Commands
Cypress.Commands.add('interceptRealtime', (eventType) => {
  cy.intercept('WebSocket', (req) => {
    req.on('message', (msg) => {
      if (msg.data.includes(eventType)) {
        cy.task('log', `Intercepted real-time event: ${eventType}`)
      }
    })
  })
})

Cypress.Commands.add('mockRealtimeEvent', (eventType, data) => {
  cy.window().then((win) => {
    if (win.WebSocket) {
      // Simulate WebSocket message
      const event = new MessageEvent('message', {
        data: JSON.stringify({ type: eventType, payload: data })
      })
      win.dispatchEvent(event)
    }
  })
})

// Performance Testing Commands
Cypress.Commands.add('benchmarkAction', (actionName, action, iterations = 10) => {
  const times = []

  for (let i = 0; i < iterations; i++) {
    const start = Date.now()
    action()
    cy.then(() => {
      times.push(Date.now() - start)
    })
  }

  cy.then(() => {
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)

    cy.task('log', `${actionName} benchmark: avg=${avg}ms, min=${min}ms, max=${max}ms`)
  })
})

// Visual Testing Commands
Cypress.Commands.add('assertVisible', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.visible')
  cy.wrap(subject).should('have.css', 'opacity', '1')
  cy.wrap(subject).should('not.have.css', 'visibility', 'hidden')
})

Cypress.Commands.add('assertHidden', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('not.be.visible').or('have.css', 'opacity', '0').or('have.css', 'visibility', 'hidden')
})

// Session Management Commands
Cypress.Commands.add('preserveSession', () => {
  let sessionData

  cy.window().then((win) => {
    sessionData = {
      localStorage: { ...win.localStorage },
      sessionStorage: { ...win.sessionStorage }
    }
  })

  cy.then(() => {
    Cypress.env('sessionData', sessionData)
  })
})

Cypress.Commands.add('restoreSession', () => {
  const sessionData = Cypress.env('sessionData')

  if (sessionData) {
    cy.window().then((win) => {
      Object.keys(sessionData.localStorage).forEach(key => {
        win.localStorage.setItem(key, sessionData.localStorage[key])
      })

      Object.keys(sessionData.sessionStorage).forEach(key => {
        win.sessionStorage.setItem(key, sessionData.sessionStorage[key])
      })
    })
  }
})

// Debug Commands
Cypress.Commands.add('debugElement', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).then(($el) => {
    cy.task('log', `Element debug: ${$el.prop('tagName')}.${$el.attr('class') || ''}`)
    cy.task('log', `Position: ${$el.offset().left}, ${$el.offset().top}`)
    cy.task('log', `Size: ${$el.width()}x${$el.height()}`)
    cy.task('log', `Visible: ${$el.is(':visible')}`)
  })
})

Cypress.Commands.add('debugPerformance', () => {
  cy.window().then((win) => {
    if (win.performance) {
      const timing = win.performance.timing
      const loadTime = timing.loadEventEnd - timing.navigationStart

      cy.task('log', `Page load time: ${loadTime}ms`)

      if (win.performance.memory) {
        const memory = win.performance.memory
        cy.task('log', `JS heap: ${memory.usedJSHeapSize / 1024 / 1024}MB`)
        cy.task('log', `Total heap: ${memory.totalJSHeapSize / 1024 / 1024}MB`)
      }
    }
  })
})

// Custom Assertions
Cypress.Commands.add('shouldBeAccessible', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.visible')
  cy.wrap(subject).should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby').or('have.text')
  cy.wrap(subject).should('have.css', 'outline-width').and('not.equal', '0px')
})

Cypress.Commands.add('shouldHaveValidContrast', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).then(($el) => {
    const color = $el.css('color')
    const backgroundColor = $el.css('background-color')

    cy.task('validateContrast', { color, backgroundColor }).then((isValid) => {
      expect(isValid).to.be.true
    })
  })
})

// Export custom commands for use in other files
export default {}

// Supabase test commands
Cypress.Commands.add('setupSupabase', () => {
  cy.window().then((win) => {
    // Mock Supabase client if not available
    if (!win.supabase) {
      win.supabase = {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
          signUp: () => Promise.resolve({ data: { user: null }, error: null }),
          signOut: () => Promise.resolve({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        },
        from: () => ({
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
          insert: () => Promise.resolve({ data: null, error: null }),
          update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
          delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
        })
      };
    }
  });
});

Cypress.Commands.add('mockAuth', (user = null) => {
  cy.window().then((win) => {
    if (win.supabase) {
      win.supabase.auth.getSession = () => Promise.resolve({ 
        data: { session: user ? { user } : null } 
      });
    }
  });
});
