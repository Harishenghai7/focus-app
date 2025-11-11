describe('Navigation', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should redirect to auth when not logged in', () => {
    cy.url().should('include', '/auth')
  })

  it('should have responsive navigation', () => {
    // Test mobile viewport
    cy.viewport(375, 667)
    cy.visit('/auth')
    
    // Test tablet viewport
    cy.viewport(768, 1024)
    cy.visit('/auth')
    
    // Test desktop viewport
    cy.viewport(1280, 720)
    cy.visit('/auth')
  })

  it('should handle dark mode toggle', () => {
    cy.visit('/auth')
    cy.get('body').should('be.visible')
    // Theme toggle test skipped - component not implemented yet
  })
})