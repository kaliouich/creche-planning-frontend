# Guide et Rapport de Tests End-to-End (E2E)

Ce document explique comment exécuter la suite de tests automatisés Cypress pour l'application Crèche Planning, et présente le rapport de la dernière exécution validée.

## Comment lancer les tests

Les tests ont été configurés pour tourner en mode *headless* (sans interface graphique), ce qui est idéal pour les environnements de type serveur ou Intégration Continue (CI). Nous utilisons `xvfb-run` pour simuler un affichage virtuel.

### Pré-requis
- Node.js et npm installés
- Dépendances du projet installées (`npm install`)
- Le serveur frontend doit être accessible sur le port défini (généralement le port `5173`)

### Lancer toute la suite de tests
Pour lancer tous les scénarios E2E en une seule commande, placez-vous dans le dossier frontend et exécutez :

```bash
cd /data/homes/kah/creche-planning-frontend
npm run test:e2e:headless
```

*(Cette commande est un raccourci pour : `xvfb-run -a npx cypress run`)*

### Lancer un test spécifique
Si vous souhaitez ne lancer qu'un seul scénario (par exemple, la gestion des enfants) :

```bash
cd /data/homes/kah/creche-planning-frontend
xvfb-run -a npx cypress run --spec cypress/e2e/admin_children.cy.ts
```

---

## Rapport de la Dernière Exécution (Validation Finale)

**Date :** 21 Juin 2026
**Résultat Global :** 100% SUCCÈS (11/11 tests passés)

### Détail des Scénarios Couverts

1. **Authentification et Sécurité (`auth.cy.ts`) : 2/2 Succès**
   - ✅ Rejet des identifiants invalides
   - ✅ Déconnexion propre d'un administrateur avec nettoyage de session

2. **Parcours Administrateur (`admin_workflow.cy.ts`) : 1/1 Succès**
   - ✅ Connexion administrateur réussie et accès direct au tableau de bord

3. **Parcours Parent (`parent_workflow.cy.ts`) : 2/2 Succès**
   - ✅ Connexion parent et soumission correcte des disponibilités
   - ✅ Sécurité : Blocage d'accès aux URLs administrateur pour un parent

4. **Gestion des Enfants (`admin_children.cy.ts`) : 3/3 Succès**
   - ✅ Ajout d'un nouvel enfant avec adresse email parentale
   - ✅ Modification complète des informations d'un enfant existant
   - ✅ Suppression d'un enfant de la base de données

5. **Gestion des Utilisateurs (`admin_users.cy.ts`) : 2/2 Succès**
   - ✅ Ajout d'un nouvel utilisateur (Parent / Professionnel)
   - ✅ Suppression d'un utilisateur depuis le tableau de bord

6. **Gestion du Planning (`admin_planning.cy.ts`) : 1/1 Succès**
   - ✅ Génération du planning via l'algorithme et publication avec succès

### Sortie Console Cypress (Extrait)

```text
====================================================================================================
  (Run Finished)

       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  admin_children.cy.ts                     00:03        3        3        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  admin_planning.cy.ts                     953ms        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  admin_users.cy.ts                        00:01        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  admin_workflow.cy.ts                     00:01        1        1        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  auth.cy.ts                               00:01        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  parent_workflow.cy.ts                    00:02        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        00:12       11       11        -        -        -
```

### Bonnes Pratiques de Sécurité Appliquées
- **Mocks Sécurisés :** L'environnement de test simule l'API, ce qui empêche d'altérer la véritable base de données de production pendant les tests automatisés.
- **Vérification d'Accès :** Les tests de type "Parcours Parent" vérifient activement que les routes restreintes (`/admin/*`) redirigent les utilisateurs non-autorisés.
- **Contrôle de Session :** La déconnexion a été testée pour s'assurer que le token local est invalidé et que le "retour arrière" redirige toujours vers l'écran de login.
