describe('Messaging', () => {
  it('should redirect to auth when accessing messages', () => {
    cy.visit('/messages')
    cy.url().should('include', '/auth')
  })

  it('should redirect to auth when accessing chat', () => {
    cy.visit('/chat/123')
    cy.url().should('include', '/auth')
  })
})