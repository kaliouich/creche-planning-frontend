import { Baby } from 'lucide-react';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  score?: number;
}

interface ChildSelectorProps {
  childrenList: Child[];
  onSelect: (child: Child) => void;
}

export function ChildSelector({ childrenList, onSelect }: ChildSelectorProps) {
  return (
    <>
      <div className="no-print" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <Baby size={48} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
        <h1>Espace Parent</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Veuillez sélectionner le prénom de votre enfant pour remplir le planning.</p>
      </div>

      {childrenList.length === 0 ? (
        <div className="glass-card no-print" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Aucun enfant n'est enregistré dans la crèche pour le moment.</p>
        </div>
      ) : (
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {childrenList.map(child => (
            <button 
              key={child.id} 
              className="btn btn-outline glass-card hover-lift"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem 1rem', height: 'auto', border: '2px solid transparent' }}
              onClick={() => onSelect(child)}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', opacity: 0.1, position: 'absolute' }}></div>
              <Baby size={32} color="var(--color-primary)" style={{ zIndex: 1 }} />
              <strong style={{ fontSize: '1.2rem', zIndex: 1 }}>{child.firstName}</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', zIndex: 1 }}>{child.lastName}</span>
              {child.score !== undefined && (
                <span className={`badge ${child.score >= 0 ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: '0.5rem', zIndex: 1, backgroundColor: child.score >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: child.score >= 0 ? 'var(--color-success)' : 'var(--color-secondary)', border: `1px solid ${child.score >= 0 ? 'var(--color-success)' : 'var(--color-secondary)'}` }}>
                  {child.score >= 0 ? `☕ En relâche (${child.score.toFixed(2)})` : `🟩 En Perm (${child.score.toFixed(2)})`}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
