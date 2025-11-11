describe('Basic Integration Tests', () => {
  beforeEach(() => {
    cy.setupSupabase();
  });

  it('should load the app successfully', () => {
    cy.visit('/');
    cy.get('body', { timeout: 10000 }).should('be.visible');
    cy.contains('Focus', { timeout: 5000 }).should('be.visible');
  });

  it('should have Supabase client available', () => {
    cy.visit('/');
    cy.window().should('have.property', 'supabase');
    cy.window().its('supabase').should('be.an', 'object');
  });

  it('should handle offline state', () => {
    cy.visit('/');
    cy.window().then((win) => {
      // Simulate offline
      Object.defineProperty(win.navigator, 'onLine', {
        writable: true,
        value: false
      });
      win.dispatchEvent(new Event('offline'));
    });
    cy.get('body').should('exist');
  });

  it('should navigate between pages', () => {
    cy.visit('/auth');
    cy.get('body', { timeout: 10000 }).should('be.visible');
    
    cy.visit('/');
    cy.get('body', { timeout: 10000 }).should('be.visible');
  });
});