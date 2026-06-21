describe('Gestion des Utilisateurs (Admin)', () => {
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

    // Mocker la liste initiale des utilisateurs
    cy.intercept('GET', '**/api/users', {
      statusCode: 200,
      body: [
        { id: 'user-1', email: 'jean.dupont@email.com', firstName: 'Jean', lastName: 'Dupont', role: 'PARENT' },
        { id: 'user-2', email: 'pro@creche.fr', firstName: 'Marie', lastName: 'Curie', role: 'PROFESSIONAL' }
      ]
    }).as('getUsers');

    // Mocker les semaines pour le dashboard
    cy.intercept('GET', '**/api/weeks', { statusCode: 200, body: [] }).as('getWeeks');

    cy.visit('/login');
    cy.contains('Se connecter').click();
    cy.wait('@loginSuccess');
    cy.wait('@getWeeks');
    
    // Naviguer vers la gestion des utilisateurs
    cy.contains('Utilisateurs').click();
    cy.wait('@getUsers');
  });

  it('devrait afficher la liste des utilisateurs et permettre de promouvoir un parent en pro', () => {
    // Vérifier l'affichage de la liste
    cy.contains('Jean Dupont').should('be.visible');
    cy.contains('Marie Curie').should('be.visible');

    // Mocker la mise à jour
    cy.intercept('PUT', '**/api/users/user-1', {
      statusCode: 200,
      body: { message: 'Utilisateur mis à jour' }
    }).as('updateUser');

    // Cliquer sur Modifier pour le premier utilisateur
    cy.contains('Jean Dupont').parent().find('button').contains('Modifier').click();

    // Vérifier que le modal s'ouvre
    cy.contains('Modifier l\'utilisateur').should('be.visible');

    // Changer le rôle en PRO
    cy.get('select').select('PROFESSIONAL');
    
    // Sauvegarder
    cy.contains('button', 'Sauvegarder').click();
    cy.wait('@updateUser');

    // Vérifier le message de succès
    cy.contains('Utilisateur mis à jour avec succès.').should('be.visible');
  });

  it('devrait permettre de supprimer un utilisateur de test', () => {
    // Mocker la suppression
    cy.intercept('DELETE', '**/api/users/user-1', {
      statusCode: 200,
      body: { message: 'Utilisateur supprimé' }
    }).as('deleteUser');

    // Cliquer sur Supprimer pour Jean Dupont
    cy.contains('Jean Dupont').parent().find('button').contains('Supprimer').click();

    // Le modal de confirmation devrait s'ouvrir
    cy.contains('Confirmer la suppression').should('be.visible');
    cy.contains('Êtes-vous sûr de vouloir supprimer l\'utilisateur').should('be.visible');

    // Confirmer la suppression
    cy.contains('button', 'Supprimer définitivement').click();
    cy.wait('@deleteUser');

    // Vérifier le message de succès
    cy.contains('Utilisateur supprimé avec succès.').should('be.visible');
  });
});
