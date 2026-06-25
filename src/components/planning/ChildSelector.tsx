import { Baby } from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';

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
  const scores = childrenList.map(c => c.score || 0);
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  return (
    <>
      <div className="no-print" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <Baby size={48} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
        <h1>Espace Parent</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Veuillez sélectionner le prénom de votre enfant pour remplir le planning.</p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto', backgroundColor: 'var(--color-bg-secondary)', padding: '0.8rem', borderRadius: 'var(--radius-md)' }}>
          <strong>💡 Astuce :</strong> La jauge sous le prénom indique votre statut <strong>par rapport au reste du groupe</strong>. Si vous êtes "En retard", l'algorithme vous sollicitera très probablement. Si vous êtes "En avance", vous serez exempté(e) d'assignation automatique (mais vous pouvez toujours proposer votre aide !).
        </p>
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
                <ScoreGauge 
                  score={child.score}
                  minScore={minScore}
                  maxScore={maxScore}
                  avgScore={avgScore}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
