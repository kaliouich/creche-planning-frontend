describe('Authentification et Sécurité (End-to-End)', () => {
  beforeEach(() => {
    // S'assurer qu'aucune session n'est active avant chaque test
    cy.clearLocalStorage();
  });

  it('devrait afficher une erreur avec des identifiants invalides', () => {
    // 1. Mocker une réponse d'erreur 401 pour la connexion
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { error: 'Email ou mot de passe incorrect' }
    }).as('loginFailed');

    // 2. Visiter la page de connexion
    cy.visit('/login');

    // 3. Remplir le formulaire avec des identifiants invalides
    cy.get('input[type="email"]').clear().type('mauvais@email.com');
    cy.get('input[type="password"]').clear().type('mauvais-mdp');
    
    // 4. Soumettre le formulaire
    cy.contains('Se connecter').click();
    cy.wait('@loginFailed');

    // 5. Vérifier que le message d'erreur est bien affiché
    cy.contains('Email ou mot de passe incorrect').should('be.visible');
    
    // 6. Vérifier que l'on reste sur la page de connexion
    cy.url().should('include', '/login');
  });

  it('devrait permettre à un administrateur de se déconnecter avec succès', () => {
    // 1. Mocker une connexion réussie
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: { id: 'admin-1', firstName: 'Jean', lastName: 'Admin', role: 'ADMIN' }
      }
    }).as('loginSuccess');

    // Mocker la requête weeks pour éviter le 401 sur le dashboard
    cy.intercept('GET', '**/api/weeks', {
      statusCode: 200,
      body: []
    }).as('getWeeks');

    // 2. Visiter la page et se connecter
    cy.visit('/login');
    cy.contains('Se connecter').click(); // Les identifiants par défaut sont déjà pré-remplis
    cy.wait('@loginSuccess');
    cy.wait('@getWeeks');

    // 3. Vérifier qu'on est bien sur le dashboard
    cy.url().should('include', '/planning');
    cy.contains('Espace Coordinateur').should('be.visible');

    // 4. Cliquer sur le bouton de déconnexion
    cy.contains('Déconnexion').click();

    // 5. Vérifier qu'on est redirigé vers la page de login
    cy.url().should('include', '/login');
    
    // 6. S'assurer qu'on ne peut pas revenir en arrière sans être connecté
    // (Puisque c'est un mock, cy.visit en direct devrait rediriger)
    cy.visit('/');
    cy.url().should('include', '/login');
  });
});
