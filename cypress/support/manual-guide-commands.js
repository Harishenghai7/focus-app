// Custom commands for Manual Testing Guide validation

Cypress.Commands.add('validateFeature', (featureName, selector, action = 'exist') => {
  cy.log(`Validating feature: ${featureName}`);
  
  if (action === 'exist') {
    cy.get(selector).should('exist');
  } else if (action === 'visible') {
    cy.get(selector).should('be.visible');
  } else if (action === 'enabled') {
    cy.get(selector).should('be.enabled');
  }
  
  cy.task('log', `✓ Feature validated: ${featureName}`);
});

Cypress.Commands.add('testAuthentication', () => {
  cy.log('Testing Authentication Features');
  
  // Test login form
  cy.get('[data-testid="email-input"]').should('be.visible');
  cy.get('[data-testid="password-input"]').should('be.visible');
  cy.get('[data-testid="login-button"]').should('be.visible');
  
  // Test social login
  cy.get('.oauth-google').should('be.visible');
  cy.get('.oauth-github').should('be.visible');
  
  // Test forgot password
  cy.get('[data-testid="forgot-password-link"]').should('be.visible');
});

Cypress.Commands.add('testNavigation', () => {
  cy.log('Testing Navigation');
  
  const routes = ['/auth', '/explore', '/profile', '/messages', '/settings'];
  
  routes.forEach(route => {
    cy.visit(route);
    cy.get('body').should('be.visible');
    cy.url().should('include', route);
  });
});

Cypress.Commands.add('testAccessibility', () => {
  cy.log('Testing Accessibility Features');
  
  // Test keyboard navigation
  cy.get('[data-testid="email-input"]').focus().should('be.focused');
  cy.get('[data-testid="email-input"]').tab();
  cy.get('[data-testid="password-input"]').should('be.focused');
  
  // Test ARIA labels
  cy.get('[aria-label]').should('have.length.greaterThan', 0);
  
  // Test form labels
  cy.get('label, [aria-labelledby]').should('exist');
});

Cypress.Commands.add('testResponsiveDesign', () => {
  cy.log('Testing Responsive Design');
  
  const viewports = [
    { width: 375, height: 667, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1280, height: 720, name: 'Desktop' }
  ];
  
  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    cy.get('body').should('be.visible');
    cy.task('log', `✓ ${viewport.name} viewport working`);
  });
});

Cypress.Commands.add('generateFeatureReport', (results) => {
  const report = {
    timestamp: new Date().toISOString(),
    totalFeatures: results.length,
    passedFeatures: results.filter(r => r.status === 'passed').length,
    failedFeatures: results.filter(r => r.status === 'failed').length,
    results: results
  };
  
  cy.writeFile('cypress/reports/manual-guide-report.json', report);
  cy.task('log', `Report generated: ${report.passedFeatures}/${report.totalFeatures} features passed`);
});

// Feature validation helpers
Cypress.Commands.add('validateAuthFeatures', () => {
  const features = [];
  
  // User Registration
  cy.get('[data-testid="signup-tab"]').then($el => {
    features.push({ name: 'User Registration', status: $el.length > 0 ? 'passed' : 'failed' });
  });
  
  // User Login
  cy.get('[data-testid="login-button"]').then($el => {
    features.push({ name: 'User Login', status: $el.length > 0 ? 'passed' : 'failed' });
  });
  
  // Password Reset
  cy.get('[data-testid="forgot-password-link"]').then($el => {
    features.push({ name: 'Password Reset', status: $el.length > 0 ? 'passed' : 'failed' });
  });
  
  // Social Login
  cy.get('.oauth-google').then($el => {
    features.push({ name: 'Social Login', status: $el.length > 0 ? 'passed' : 'failed' });
  });
  
  return cy.wrap(features);
});

Cypress.Commands.add('validatePostFeatures', () => {
  const features = [];
  
  cy.visit('/create');
  
  // Create Post
  cy.get('body').then(() => {
    features.push({ name: 'Create Post Page', status: 'passed' });
  });
  
  // Photo Upload
  cy.get('input[type="file"]').then($el => {
    features.push({ name: 'Photo Upload', status: $el.length > 0 ? 'passed' : 'failed' });
  });
  
  return cy.wrap(features);
});

Cypress.Commands.add('validateMessagingFeatures', () => {
  const features = [];
  
  cy.visit('/messages');
  
  cy.get('body').then(() => {
    features.push({ name: 'Messages Page', status: 'passed' });
  });
  
  return cy.wrap(features);
});

Cypress.Commands.add('runCompleteValidation', () => {
  let allFeatures = [];
  
  cy.visit('/auth');
  
  cy.validateAuthFeatures().then(authFeatures => {
    allFeatures = allFeatures.concat(authFeatures);
  });
  
  cy.validatePostFeatures().then(postFeatures => {
    allFeatures = allFeatures.concat(postFeatures);
  });
  
  cy.validateMessagingFeatures().then(msgFeatures => {
    allFeatures = allFeatures.concat(msgFeatures);
  });
  
  cy.then(() => {
    cy.generateFeatureReport(allFeatures);
  });
});