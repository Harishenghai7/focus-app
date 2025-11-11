describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.setupSupabase();
    cy.visit('/auth');
    cy.wait(1000); // Allow page to load
  });

  it('should display login form', () => {
    cy.get('[data-testid="auth-container"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="email-input"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-testid="password-input"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-testid="login-button"]', { timeout: 5000 }).should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('[data-testid="login-button"]').should('be.disabled');
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').should('not.be.disabled');
  });

  it('should handle form interaction', () => {
    cy.get('[data-testid="email-input"]').should('be.visible').type('demo@focus.com');
    cy.get('[data-testid="password-input"]').should('be.visible').type('password123');
    cy.get('[data-testid="login-button"]').should('be.enabled');
    // Form validation test - no actual login attempt
  });
});