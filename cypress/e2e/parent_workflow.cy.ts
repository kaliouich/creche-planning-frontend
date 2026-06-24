describe('Parcours Parent (End-to-End)', () => {
  beforeEach(() => {
    // Intercepter l'authentification et mocker la réponse
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        message: 'Connexion réussie',
        user: { id: 'parent-123', firstName: 'Jean', lastName: 'Dupont', role: 'PARENT' }
      }
    }).as('loginRequest');

    // Mocker la liste des enfants pour le parent
    cy.intercept('GET', '**/api/children', {
      statusCode: 200,
      body: [
        { id: 'child-1', firstName: 'Léa', lastName: 'Dupont', ageGroup: 'MOYENS', isActive: true, parentId: 'parent-123' }
      ]
    }).as('getChildren');

    // Mocker les semaines ouvertes (OPEN_TO_PARENTS)
    cy.intercept('GET', '**/api/weeks', {
      statusCode: 200,
      body: [
        { id: 'week-1', weekNumber: 42, year: 2026, status: 'OPEN_TO_PARENTS', createdAt: '2026-10-01' }
      ]
    }).as('getWeeks');

    // Mocker le planning d'une semaine spécifique
    cy.intercept('GET', '**/api/planning/week-1*', {
      statusCode: 200,
      body: {
        id: 'week-1',
        weekNumber: 42,
        year: 2026,
        status: 'OPEN_TO_PARENTS',
        slots: [
          { id: 'slot-1', dayOfWeek: 'MONDAY', halfDay: 'MORNING', slotType: 'OPEN', availabilities: [] },
          { id: 'slot-2', dayOfWeek: 'MONDAY', halfDay: 'AFTERNOON', slotType: 'OPEN', availabilities: [] }
        ]
      }
    }).as('getPlanning');
  });

  it('devrait connecter un parent et lui permettre de soumettre ses disponibilités', () => {
    // 1. Accéder à la page de login
    cy.visit('/login');
    cy.get('input[type="email"]').clear().type('parent@creche.fr');
    cy.get('input[type="password"]').clear().type('password123');
    cy.get('button[type="submit"]').click();

    // Vérifier la redirection vers le dashboard parent
    cy.wait('@loginRequest');
    cy.url().should('include', '/planning');
    cy.contains('Espace Parent').should('be.visible');
    cy.contains('Jean Dupont').should('be.visible');

    // 2. Sélectionner l'enfant et charger les disponibilités
    cy.wait('@getChildren');
    cy.wait('@getWeeks');
    cy.contains('Léa').click();
    cy.wait('@getPlanning');

    // 3. Cocher des disponibilités sur le planning
    cy.contains('Indisponible').first().click();

    // 4. Mocker la sauvegarde
    cy.intercept('PUT', '**/api/availabilities/week/week-1', {
      statusCode: 200,
      body: { message: 'Disponibilités enregistrées avec succès' }
    }).as('saveAvailabilities');

    // 5. Soumettre
    cy.contains('Enregistrer mes disponibilités').click();
    cy.wait('@saveAvailabilities');

    // 5. Vérifier le message de succès
    cy.contains('Vos disponibilités ont été enregistrées avec succès !').should('be.visible');
  });

  it('devrait empêcher un parent d\'accéder à l\'espace administrateur', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').clear().type('parent@creche.fr');
    cy.get('input[type="password"]').clear().type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    // Tenter d'accéder à l'espace enfants admin
    cy.visit('/admin/children');
    cy.url().should('include', '/planning'); // Redirigé vers la page d'accueil parent
    cy.contains('Espace Parent').should('be.visible');
  });
});
