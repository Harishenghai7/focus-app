describe('Post Creation & Interaction', () => {
  it('should redirect to auth when accessing create page', () => {
    cy.visit('/create')
    cy.url().should('include', '/auth')
  })

  it('should redirect to auth when accessing home', () => {
    cy.visit('/home')
    cy.url().should('include', '/auth')
  })

  it('should show auth page elements', () => {
    cy.visit('/auth')
    cy.get('[data-testid="auth-container"]').should('be.visible')
  })
})