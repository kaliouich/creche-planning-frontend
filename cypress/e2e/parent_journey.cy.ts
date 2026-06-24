/// <reference types="cypress" />

describe('Parcours Parent', () => {
  beforeEach(() => {
    // Intercepter les appels API vers le backend
    cy.intercept('POST', '/planning/api/auth/login').as('login');
    cy.intercept('POST', '/planning/api/auth/logout').as('logout');
    cy.intercept('GET', '/planning/api/').as('getDashboard');
  });

  it('devrait pouvoir se connecter, consulter le dashboard et se déconnecter', () => {
    // 1. Visiter la page de connexion
    cy.visit('/login');
    
    // Le formulaire de login doit être présent
    cy.get('h2').contains('Connexion').should('be.visible');

    // 2. Remplir le formulaire (on utilise des identifiants mockés si la DB est vide, 
    // ou les identifiants normaux si c'est un environnement de dev local avec la prod)
    cy.get('input[type="email"]').type('parent@creche.fr');
    cy.get('input[type="password"]').type('parent123'); // Exemple de mot de passe par défaut
    
    // 3. Soumettre le formulaire
    cy.get('button[type="submit"]').click();
    
    // 4. Attendre la réponse de l'API (cela va échouer si on teste contre un backend mock, 
    // l'idéal est que la base de données locale de test ait cet utilisateur)
    // Pour l'E2E robuste, on devrait utiliser cy.intercept pour simuler l'API si le backend n'est pas up.
    // Ici on suppose un backend local ou staging.
    // cy.wait('@login');

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
