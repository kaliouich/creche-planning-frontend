// Removed unused React import
import { Baby, CalendarClock, Trash2 } from 'lucide-react';
import type { Child } from '../../types';

interface ChildListProps {
  childrenList: Child[];
  onEditClick: (child: Child) => void;
  onManageAbsences: (childId: string) => void;
  onDeleteChild: (childId: string) => void;
}

export function ChildList({ childrenList, onEditClick, onManageAbsences, onDeleteChild }: ChildListProps) {
  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Baby size={20} /> Enfants inscrits ({childrenList.length})
      </h3>
      {childrenList.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
          Aucun enfant inscrit pour le moment.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0, margin: 0 }}>
          {childrenList.map((child: Child) => (
            <li key={child.id} style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1rem', border: '1px solid var(--color-glass-border)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                  {child.firstName} {child.lastName}
                  {child.isCurrentlyAbsent && (
                    <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--color-secondary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Absent</span>
                  )}
                </strong>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'block' }}>
                  Section : {child.ageGroup === 'PETIT' ? 'Petits' : 'Grands'}
                </span>
                <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem', display: 'inline-block', marginTop: '0.25rem', backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>
                  {child.defaultPresences?.length || 0} demi-journées
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                  onClick={() => onEditClick(child)}
                >
                  Modifier
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                  onClick={() => onManageAbsences(child.id)}
                >
                  <CalendarClock size={16} style={{ marginRight: '0.3rem', display: 'inline-block', verticalAlign: 'middle' }} />
                  Gérer les absences
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', color: '#e63946', borderColor: '#e63946' }} 
                  onClick={() => onDeleteChild(child.id)}
                >
                  <Trash2 size={16} style={{ marginRight: '0.3rem', display: 'inline-block', verticalAlign: 'middle' }} />
                  Supprimer (Départ)
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
