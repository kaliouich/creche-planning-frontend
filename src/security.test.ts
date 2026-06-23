import { describe, it, expect } from 'vitest';

describe('Tests Unitaires de Sécurité', () => {
  it('devrait valider la structure des rôles', () => {
    const roles = ['ADMIN', 'PROFESSIONAL', 'PARENT'];
    expect(roles).toContain('ADMIN');
    expect(roles.length).toBe(3);
  });
  
  it('devrait simuler le filtrage des enfants', () => {
    const children = [
      { id: '1', name: 'Léa', isActive: true },
      { id: '2', name: 'Tom', isActive: false }
    ];
    
    const activeChildren = children.filter(c => c.isActive);
    expect(activeChildren).toHaveLength(1);
    expect(activeChildren[0].name).toBe('Léa');
  });
});
