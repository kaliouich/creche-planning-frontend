describe('Génération du Planning (Admin)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    
    // Mocker la connexion Admin
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: { id: 'admin-1', firstName: 'Jean', lastName: 'Admin', role: 'ADMIN' }
      }
    }).as('loginSuccess');

    // Mocker la liste des semaines avec une semaine prête à être générée
    cy.intercept('GET', '**/api/weeks', {
      statusCode: 200,
      body: [
        { id: 'week-gen', weekNumber: 44, year: 2026, status: 'OPEN_TO_PARENTS', needsRecalculation: true, hasAssignments: false }
      ]
    }).as('getWeeks');

    cy.visit('/login');
    cy.contains('Se connecter').click();
    cy.wait('@loginSuccess');
    cy.wait('@getWeeks');
  });

  it('devrait permettre de générer un planning et voir le résultat', () => {
    // Mocker l'API de génération
    cy.intercept('POST', '**/api/planning/generate/week-gen', {
      statusCode: 200,
      body: { unfilledSlots: [] } // Aucune permanence non-remplie => succès total
    }).as('generatePlanning');

    // Mocker l'API de détails de semaine appelée juste après la redirection
    cy.intercept('GET', '**/api/planning/week-gen', {
      statusCode: 200,
      body: {
        id: 'week-gen', weekNumber: 44, year: 2026, status: 'OPEN_TO_PARENTS',
        slots: [
          {
            id: 'slot-1', dayOfWeek: 'MONDAY', halfDay: 'MORNING', slotType: 'OPEN', requiredParents: 1,
            assignments: [
              { id: 'assign-1', isManual: false, parent: { id: 'parent-1', firstName: 'Paul', lastName: 'Martin' } }
            ],
            availabilities: [],
            childPresences: []
          }
        ]
      }
    }).as('getWeekDetails');

    cy.intercept('GET', '**/api/children', {
      statusCode: 200,
      body: []
    }).as('getChildrenDetails');

    // Cliquer sur le bouton de génération
    cy.contains('Générer Planning').click();
    cy.wait('@generatePlanning');
    cy.wait('@getWeekDetails');
    cy.wait('@getChildrenDetails');

    // Vérifier qu'on est redirigé vers la page de détails et que le message de succès apparaît
    cy.url().should('include', '/admin/weeks/week-gen');
    cy.contains('Généré avec succès').should('be.visible');

    // Vérifier qu'une assignation générée est affichée sur le planning (Paul)
    // Note: Avant publication, l'interface n'affiche que le prénom
    cy.contains('Paul').should('be.visible');
  });
});
