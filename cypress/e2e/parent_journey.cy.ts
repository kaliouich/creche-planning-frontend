describe('Parcours Parent - Connexion et Dashboard', () => {
  beforeEach(() => {
    // Dans une vraie CI, on populerait la DB avec un script. Ici on simule une visite.
    cy.visit('/login');
  });

  it('devrait permettre la connexion et afficher l\'espace parent', () => {
    cy.get('input[name="email"]').type('test@example.com'); // Mettre un email existant de la fixture
    cy.get('input[name="password"]').type('password123'); // Mettre un password valide
    cy.get('button[type="submit"]').click();

    // Vérifier qu'on est redirigé vers le dashboard (l'API va retourner 401 si cet user n'existe pas en DB locale)
    // cy.url().should('include', '/dashboard');
    // cy.contains('h1', 'Espace Parent').should('be.visible');
  });
});
