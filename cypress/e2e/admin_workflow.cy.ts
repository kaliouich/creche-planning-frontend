describe('Parcours Administrateur (End-to-End)', () => {
  beforeEach(() => {
    // Mocker la connexion admin
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        message: 'Connexion réussie',
        user: { id: 'admin-123', firstName: 'Admin', lastName: 'Crèche', role: 'ADMIN' }
      }
    }).as('loginRequest');

    // Mocker la création d'une semaine
    cy.intercept('POST', '**/api/weeks', {
      statusCode: 201,
      body: { id: 'week-new', weekNumber: 43, year: 2026, status: 'PREPARATION' }
    }).as('createWeek');

    // Mocker la liste des semaines
    cy.intercept('GET', '**/api/weeks', {
      statusCode: 200,
      body: [
        { id: 'week-1', weekNumber: 42, year: 2026, status: 'PUBLISHED', createdAt: '2026-10-01' },
        { id: 'week-new', weekNumber: 43, year: 2026, status: 'PREPARATION', createdAt: '2026-10-08' }
      ]
    }).as('getWeeks');

    // Mocker le passage au statut ouvert
    cy.intercept('PATCH', '**/api/weeks/*/status', {
      statusCode: 200,
      body: { status: 'OPEN_TO_PARENTS' }
    }).as('updateStatus');
  });

  it('devrait permettre de créer une nouvelle semaine et de l\'ouvrir aux parents', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').clear().type('admin@creche.fr');
    cy.get('input[type="password"]').clear().type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/planning');
    cy.contains('Espace Coordinateur').should('be.visible');

    // 1. Créer une nouvelle semaine
    cy.contains('Créer').click();

    cy.wait('@createWeek');
    cy.wait('@getWeeks');

    // 2. Vérifier que la semaine apparaît dans la liste
    cy.contains('Semaine 43').should('be.visible');
    cy.contains('En Préparation').should('be.visible');

    // 3. Ouvrir aux parents
    cy.contains('Ouvrir aux Parents').click();
    cy.wait('@updateStatus');
    
    // Le statut devrait changer dans l'UI (simulé par le mock ou la réponse)
    // Selon l'implémentation, le bouton change ou disparait
  });
});
