describe('Campagne de Simulation E2E', () => {
  it('Scénario complet : Vue Admin et Parent', () => {
    // Mocker la connexion Admin
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: { token: 'fake-jwt-token', user: { id: 'admin-1', firstName: 'Admin', lastName: 'Admin', role: 'ADMIN' } }
    }).as('loginAdmin');

    cy.intercept('GET', '**/api/weeks', { statusCode: 200, body: [] }).as('getWeeks');
    
    // ============================================
    // 1. ADMIN LOGS IN
    // ============================================
    cy.visit('/login');
    cy.contains('Se connecter').click();
    cy.wait('@loginAdmin');
    cy.url().should('include', '/planning');

    // Mocker la création de semaine
    cy.intercept('POST', '**/api/weeks', {
        statusCode: 201,
        body: { id: 'w1', status: 'OPEN_TO_PARENTS', year: 2026, week_number: 25 }
    }).as('createWeek');

    // ============================================
    // 2. PARENT LOGS IN
    // ============================================
    // Mocker la connexion Parent
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: { token: 'fake-jwt-token', user: { id: 'parent-1', firstName: 'Parent', lastName: 'Un', role: 'PARENT' } }
    }).as('loginParent');

    // Mocker le GET children
    cy.intercept('GET', '**/api/children', { statusCode: 200, body: [] }).as('getChildren');

    cy.contains('Déconnexion').click();
    
    cy.visit('/login');
    cy.contains('Se connecter').click();
    cy.wait('@loginParent');
    cy.url().should('include', '/planning');

    // Verify parent dashboard
    cy.contains('Espace Parent').should('be.visible');
  });
});
