/// <reference types="cypress" />

describe('Parcours Parent', () => {
  beforeEach(() => {
    // Intercepter les appels API vers le backend
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: { token: 'fake-jwt-token', user: { id: 'parent-123', firstName: 'Jean', lastName: 'Dupont', role: 'PARENT' } }
    }).as('login');
    cy.intercept('POST', '**/api/auth/logout', { statusCode: 200 }).as('logout');
    cy.intercept('GET', '**/api/weeks', { statusCode: 200, body: [] }).as('getWeeks');
    cy.intercept('GET', '**/api/children', { statusCode: 200, body: [] }).as('getChildren');
  });

  it('devrait pouvoir se connecter, consulter le dashboard et se déconnecter', () => {
    // 1. Visiter la page de connexion
    cy.visit('/login');
    
    // Le formulaire de login doit être présent
    cy.get('h1').contains('Portail Gestion').should('be.visible');

    // 2. Remplir le formulaire (on utilise des identifiants mockés si la DB est vide, 
    // ou les identifiants normaux si c'est un environnement de dev local avec la prod)
    cy.get('input[type="email"]').clear().type('parent@creche.fr');
    cy.get('input[type="password"]').clear().type('parent123'); // Exemple de mot de passe par défaut
    
    // 3. Soumettre le formulaire
    cy.get('button[type="submit"]').click();
    
    // 4. Attendre la réponse de l'API
    cy.wait('@login');

    // 5. Vérifier la redirection vers le dashboard
    cy.url().should('not.include', '/login');
    
    // 6. Vérifier la présence des éléments de navigation
    cy.get('.navbar').should('be.visible');
    cy.get('.navbar').contains('Déconnexion').should('be.visible');

    // 7. Test de la déconnexion
    cy.get('.navbar').contains('Déconnexion').click();
    
    // 8. Vérifier le retour à la page de login
    cy.url().should('include', '/login');
  });
});
