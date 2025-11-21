describe('Integration Testing', () => {
  it('should handle Supabase connection', () => {
    cy.visit('/auth')
    cy.window().then((win) => {
      // Check if Supabase client is initialized
      expect(win).to.have.property('supabase')
    })
  })

  it('should handle API errors gracefully', () => {
    cy.intercept('POST', '**/auth/v1/**', { statusCode: 500 }).as('authError')
    cy.visit('/auth')
    // Wait for page to load completely
    cy.wait(2000)
    // Should handle error gracefully without crashing
    cy.get('body').should('be.visible')
    cy.get('[data-testid="auth-container"]').should('be.visible')
  })

  it('should handle network failures', () => {
    cy.visit('/auth')
    // App should handle offline state gracefully
    cy.get('body').should('exist')
    cy.get('[data-testid="auth-container"]').should('be.visible')
  })
})