describe('Gestion des Enfants (Admin)', () => {
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

    // Mocker la liste initiale des enfants
    cy.intercept('GET', '**/api/children', {
      statusCode: 200,
      body: [
        {
          id: 'child-1',
          firstName: 'Léa',
          lastName: '(Dupont)',
          ageGroup: 'GRAND',
          parent: { id: 'parent-1', email: 'jean.dupont@email.com', firstName: 'Jean' }
        }
      ]
    }).as('getChildren');

    // Mocker les semaines pour le dashboard
    cy.intercept('GET', '**/api/weeks', { statusCode: 200, body: [] }).as('getWeeks');

    cy.visit('/login');
    cy.contains('Se connecter').click();
    cy.wait('@loginSuccess');
    cy.wait('@getWeeks');
    
    // Naviguer vers la gestion des enfants
    cy.contains('Gérer les enfants').click();
    cy.wait('@getChildren');
  });

  it('devrait permettre d\'ajouter un nouvel enfant', () => {
    // Mocker la création
    cy.intercept('POST', '**/api/children', {
      statusCode: 201,
      body: { id: 'child-new', firstName: 'Hugo', lastName: '(Martin)', ageGroup: 'PETIT' }
    }).as('createChild');

    // Mocker le raffraichissement de la liste
    cy.intercept('GET', '**/api/children', {
      statusCode: 200,
      body: [
        { id: 'child-1', firstName: 'Léa', lastName: '(Dupont)', ageGroup: 'GRAND' },
        { id: 'child-new', firstName: 'Hugo', lastName: '(Martin)', ageGroup: 'PETIT' }
      ]
    }).as('getUpdatedChildren');

    // Remplir le formulaire
    cy.contains('label', 'Prénom de l\'enfant').parent().find('input').type('Hugo');
    cy.contains('label', 'Prénom du parent 1').parent().find('input').type('Paul');
    cy.contains('label', 'Petits').click();
    cy.contains('label', 'Email du Parent 1').parent().find('input').type('paul.martin@email.com');
    
    // Soumettre
    cy.contains('button', 'Ajouter').click();
    cy.wait('@createChild');
    cy.wait('@getUpdatedChildren');

    // Vérifier le succès et la présence dans la liste
    cy.contains('Enfant ajouté avec succès.').should('be.visible');
    cy.contains('Hugo (Martin)').should('be.visible');
  });

  it('devrait permettre de modifier un enfant existant', () => {
    // Mocker la mise à jour
    cy.intercept('PUT', '**/api/children/child-1', {
      statusCode: 200,
      body: { message: 'Enfant mis à jour' }
    }).as('updateChild');

    // Cliquer sur Modifier
    cy.contains('li', 'Léa (Dupont)').find('button').contains('Modifier').click();

    // Vérifier que le formulaire est pré-rempli
    cy.contains('label', 'Prénom de l\'enfant').parent().find('input').should('have.value', 'Léa');

    // Changer le prénom
    cy.contains('label', 'Prénom de l\'enfant').parent().find('input').clear().type('Léana');
    
    // Sauvegarder
    cy.contains('button', 'Sauvegarder').click();
    cy.wait('@updateChild');

    // Vérifier le message de succès
    cy.contains('Enfant modifié avec succès.').should('be.visible');
  });

  it('devrait permettre de supprimer un enfant', () => {
    // Stub confirm window
    cy.on('window:confirm', () => true);

    // Mocker la suppression
    cy.intercept('DELETE', '**/api/children/child-1', {
      statusCode: 200,
      body: { message: 'Enfant supprimé' }
    }).as('deleteChild');

    // Mocker la liste vide après suppression
    cy.intercept('GET', '**/api/children', {
      statusCode: 200,
      body: []
    }).as('getEmptyChildren');

    // Cliquer sur Supprimer (maintenant "Supprimer (Départ)")
    cy.contains('li', 'Léa (Dupont)').find('button').contains('Supprimer (Départ)').click();
    cy.wait('@deleteChild');
    cy.wait('@getEmptyChildren');

    // Vérifier le message de succès et la liste vide
    cy.contains('Enfant supprimé avec succès').should('be.visible');
    cy.contains('Aucun enfant inscrit pour le moment.').should('be.visible');
  });
});
