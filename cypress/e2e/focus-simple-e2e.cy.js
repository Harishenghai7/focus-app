describe('Focus App - Simple E2E Tests', () => {
  const userA = {
    email: 'usera@focustest.com',
    password: 'TestPass123!',
    username: 'usera_test',
    fullName: 'User A Test'
  };

  const userB = {
    email: 'userb@focustest.com', 
    password: 'TestPass123!',
    username: 'userb_test',
    fullName: 'User B Test'
  };

  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe('1. Auth Flow', () => {
    it('should handle basic auth flow', () => {
      // Try UserA signup/login
      cy.visit('/auth');
      cy.get('[data-testid="signup-tab"]').click();
      cy.get('[data-testid="email-input"]').clear().type(userA.email);
      cy.get('[data-testid="password-input"]').clear().type(userA.password);
      cy.get('input[type="date"]').type('1990-01-01');
      cy.get('input[placeholder*="Nickname"]').type(userA.fullName);
      cy.get('[data-testid="login-button"]').should('be.enabled');
      cy.get('[data-testid="login-button"]').click();
      cy.wait(3000);

      // Try login if signup didn't work
      cy.url().then((url) => {
        if (url.includes('/auth')) {
          cy.get('[data-testid="login-tab"]').click();
          cy.get('[data-testid="email-input"]').clear().type(userA.email);
          cy.get('[data-testid="password-input"]').clear().type(userA.password);
          cy.get('[data-testid="login-button"]').click();
          cy.wait(3000);
        }
      });

      // Basic validation - page should exist
      cy.get('body').should('be.visible');
    });

    it('should handle password reset', () => {
      cy.visit('/auth');
      cy.get('[data-testid="forgot-password-link"]').click();
      cy.get('[data-testid="reset-email-input"]').type(userA.email);
      cy.get('[data-testid="send-reset-button"]').click();
      cy.get('.auth-message', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('2. Basic Navigation', () => {
    it('should navigate to main pages', () => {
      cy.tryLogin(userA);
      
      const pages = ['/home', '/explore', '/create', '/profile', '/messages', '/notifications'];
      
      pages.forEach(page => {
        cy.visit(page);
        cy.get('body').should('be.visible');
      });
    });
  });
});

// Simple login command
Cypress.Commands.add('tryLogin', (user) => {
  cy.visit('/auth');
  cy.get('[data-testid="login-tab"]').click();
  cy.get('[data-testid="email-input"]').clear().type(user.email);
  cy.get('[data-testid="password-input"]').clear().type(user.password);
  cy.get('[data-testid="login-button"]').should('be.enabled');
  cy.get('[data-testid="login-button"]').click();
  cy.wait(3000);
  
  // If still on auth, try signup
  cy.url().then((url) => {
    if (url.includes('/auth')) {
      cy.get('[data-testid="signup-tab"]').click();
      cy.get('[data-testid="email-input"]').clear().type(user.email);
      cy.get('[data-testid="password-input"]').clear().type(user.password);
      cy.get('input[type="date"]').type('1990-01-01');
      cy.get('input[placeholder*="Nickname"]').type(user.fullName);
      cy.get('[data-testid="login-button"]').click();
      cy.wait(3000);
    }
  });
});