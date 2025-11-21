// Lighthouse performance testing commands
Cypress.Commands.add('lighthouse', (options = {}) => {
  const defaultOptions = {
    performance: 90,
    accessibility: 90,
    'best-practices': 90,
    seo: 80,
    pwa: 80
  }
  
  const thresholds = { ...defaultOptions, ...options }
  
  cy.task('lighthouse', {
    url: Cypress.config().baseUrl,
    options: {
      formFactor: 'desktop',
      screenEmulation: { disabled: true }
    },
    thresholds
  })
})

Cypress.Commands.add('checkPerformance', () => {
  // Basic performance checks
  cy.window().then((win) => {
    const navigation = win.performance.getEntriesByType('navigation')[0]
    expect(navigation.loadEventEnd - navigation.loadEventStart).to.be.lessThan(3000)
  })
})