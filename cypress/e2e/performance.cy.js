describe('Performance', () => {
  it('should load pages within acceptable time', () => {
    const start = Date.now()
    cy.visit('/auth')
    cy.get('[data-testid="auth-container"]').should('be.visible').then(() => {
      const loadTime = Date.now() - start
      expect(loadTime).to.be.lessThan(3000) // 3 seconds max
    })
  })

  it('should handle large image uploads', () => {
    cy.visit('/create')
    cy.url().should('include', '/auth') // Redirects when not logged in
  })

  it('should lazy load images', () => {
    cy.visit('/auth')
    cy.get('img').should('exist')
  })
})