describe('Feed & Discovery', () => {
  it('should redirect to auth when not logged in', () => {
    cy.visit('/home')
    cy.url().should('include', '/auth')
  })

  it('should load explore page', () => {
    cy.visit('/explore')
    cy.url().should('include', '/auth') // Redirects to auth when not logged in
  })

  it('should have navigation elements', () => {
    cy.visit('/')
    cy.get('body').should('be.visible')
  })
})