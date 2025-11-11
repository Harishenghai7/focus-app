// Supreme QA Setup for Focus App - Multi-User Real-Time Testing

// Global test setup for multi-user testing
before(() => {
  // Setup test environment
  cy.task('setupTestEnvironment')
})

after(() => {
  // Cleanup test environment
  cy.task('cleanupTestEnvironment')
})

// Setup for each test
beforeEach(() => {
  // Reset network conditions
  cy.task('resetNetworkConditions')

  // Clear any cached data
  cy.clearLocalStorage()
  cy.clearCookies()

  // Setup real-time monitoring
  cy.window().then((win) => {
    // Add global error handler
    win.addEventListener('error', (event) => {
      cy.task('log', `Global error: ${event.error}`)
    })

    // Add unhandled promise rejection handler
    win.addEventListener('unhandledrejection', (event) => {
      cy.task('log', `Unhandled promise rejection: ${event.reason}`)
    })
  })
})

// Custom error handling
Cypress.on('fail', (error, runnable) => {
  // Log additional context for debugging
  cy.task('log', `Test failed: ${runnable.title}`)
  cy.task('log', `Error: ${error.message}`)

  // Take additional screenshots on failure
  cy.screenshot(`failure-${runnable.title}`, { capture: 'fullPage' })

  throw error
})

// Real-time event monitoring
Cypress.on('window:before:load', (win) => {
  // Setup real-time event listeners
  win.addEventListener('realtime-event', (event) => {
    cy.task('log', `Real-time event: ${event.detail.type}`)
  })

  // Monitor WebSocket connections
  const originalWebSocket = win.WebSocket
  win.WebSocket = function(...args) {
    cy.task('log', `WebSocket connection: ${args[0]}`)
    return new originalWebSocket(...args)
  }
})

// Performance monitoring
Cypress.on('test:after:run', (test) => {
  if (test.state === 'failed') {
    cy.task('log', `Test "${test.title}" failed after ${test.duration}ms`)
  } else {
    cy.task('log', `Test "${test.title}" passed in ${test.duration}ms`)
  }
})
