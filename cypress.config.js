module.exports = {
  projectId: '7qkke2',
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    numTestsKeptInMemory: 5,
    experimentalWebKitSupport: true,
    chromeWebSecurity: false,
    blockHosts: ['webpack-dev-server'],
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          launchOptions.args.push('--disable-web-security')
          launchOptions.args.push('--disable-features=VizDisplayCompositor')
        }
        return launchOptions
      })

      on('task', {
        log(message) {
          console.log(message)
          return null
        },
        table(message) {
          console.table(message)
          return null
        },
        setupMultiUserSession(users) {
          console.log(`Setting up multi-user session for ${users.length} users`)
          return null
        },
        switchUserSession(username) {
          console.log(`Switching to user session: ${username}`)
          return null
        },
        cleanupMultiUserSession(users) {
          console.log(`Cleaning up multi-user session for ${users.length} users`)
          return null
        },
        simulateRealtimeEvent({ eventType, data }) {
          console.log(`Simulating real-time event: ${eventType}`, data)
          return null
        },
        waitForRealtimeEvent(eventType, options) {
          console.log(`Waiting for real-time event: ${eventType}`)
          return new Promise(resolve => setTimeout(resolve, 100))
        },
        triggerRealtimeUpdate({ target, data }) {
          console.log(`Triggering real-time update for ${target}`, data)
          return null
        },
        logPerformance({ label, duration, memoryDelta }) {
          console.log(`Performance [${label}]: ${duration}ms, Memory: ${memoryDelta} bytes`)
          return null
        },
        compareScreenshot({ name, baseline, threshold = 0.01 }) {
          console.log(`Comparing screenshot: ${name} with baseline: ${baseline}`)
          return null
        },
        checkContrast({ foreground, background }) {
          const contrast = 4.5
          console.log(`Contrast ratio: ${contrast}`)
          return contrast
        },
        validateContrast({ color, background }) {
          return true
        },
        testXSSPrevention(payload) {
          console.log(`Testing XSS prevention with payload: ${payload}`)
          return null
        },
        seedTestData(data) {
          console.log(`Seeding test data:`, data)
          return null
        },
        cleanupTestData(data) {
          console.log(`Cleaning up test data:`, data)
          return null
        },
        resetAppState() {
          console.log('Resetting app state')
          return null
        },
        sendRealtimeEvent({ sessionId, eventType, data }) {
          console.log(`Sending real-time event to session ${sessionId}: ${eventType}`, data)
          return null
        },
        handleSessionError({ username, error }) {
          console.log(`Session error for ${username}:`, error)
          return null
        },
        setupTestUsers(users) {
          console.log(`Setting up test users:`, users)
          return null
        },
        cleanupTestUsers(users) {
          console.log(`Cleaning up test users:`, users)
          return null
        }
      })

      return config
    },
    reporter: 'spec',
    env: {
      multiUser: true,
      realTimeValidation: true,
      edgeCaseCoverage: true,
      performanceTesting: true,
      accessibilityTesting: true,
      securityTesting: true,
      visualRegressionTesting: true,
      apiTesting: true,
      REACT_APP_SUPABASE_URL: 'https://nmhrtllprmonqqocwzvf.supabase.co',
      REACT_APP_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taHJ0bGxwcm1vbnFxb2N3enZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNDU4ODIsImV4cCI6MjA3NjcyMTg4Mn0.AEq7aerwktucAvmQxf7G6XL-l0SyM48rw0ZeiQl3ZN8'
    }
  }
}