describe('Complete User Flows', () => {
  beforeEach(() => {
    cy.visit('/auth');
  });

  it('Full user journey: signup → post → interact → message', () => {
    // Signup flow
    cy.get('[data-testid="signup-tab"]').click();
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="signup-button"]').click();
    
    // Onboarding
    cy.get('[data-testid="username-input"]').type('testuser');
    cy.get('[data-testid="fullname-input"]').type('Test User');
    cy.get('[data-testid="complete-onboarding"]').click();
    
    // Create post
    cy.get('[data-testid="create-button"]').click();
    cy.get('[data-testid="post-caption"]').type('My first post! #test');
    cy.get('[data-testid="publish-post"]').click();
    
    // Interact with posts
    cy.get('[data-testid="like-button"]').first().click();
    cy.get('[data-testid="comment-button"]').first().click();
    cy.get('[data-testid="comment-input"]').type('Great post!');
    cy.get('[data-testid="submit-comment"]').click();
    
    // Navigate to messages
    cy.get('[data-testid="messages-nav"]').click();
    cy.url().should('include', '/messages');
  });

  it('Error handling: network failures', () => {
    cy.intercept('POST', '**/auth/v1/token*', { forceNetworkError: true });
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('Performance: page load times', () => {
    cy.visit('/home', { timeout: 3000 });
    cy.get('[data-testid="feed-container"]').should('be.visible');
    cy.window().its('performance').invoke('now').should('be.lessThan', 3000);
  });
});