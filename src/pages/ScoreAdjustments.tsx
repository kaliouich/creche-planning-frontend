import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Pencil, Check, X, Info, Calendar, User } from 'lucide-react';

// useNavigate removed
import { apiClient } from '../api/client';
import { useToast } from '../contexts/ToastContext';

import type { Child, Week } from '../types';

function EditableCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  // Update internal state if external value changes
  useEffect(() => {
    setVal(value);
  }, [value]);

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <input 
          type="number" 
          value={val} 
          onChange={e => setVal(parseFloat(e.target.value) || 0)}
          style={{ width: '60px', padding: '0.2rem', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--color-border)' }}
        />
        <button onClick={() => { onChange(val); setEditing(false); }} style={{ background: 'none', border: 'none', color: 'var(--color-success)', cursor: 'pointer', padding: '2px' }}>
          <Check size={18} />
        </button>
        <button onClick={() => { setVal(value); setEditing(false); }} style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', padding: '2px' }}>
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.2rem' }} onClick={() => setEditing(true)} title="Modifier le nombre">
      <span style={{ fontSize: '1.1rem', fontWeight: 600, color: value > 0 ? 'var(--color-success)' : 'inherit' }}>{value}</span>
      <Pencil size={14} color="var(--color-text-secondary)" />
    </div>
  );
}

interface ChildHistory {
  [key: string]: {
    permanencesDone: number;
    permanencesDue?: number;
    scoreBefore?: number;
    scoreAfter?: number;
  };
}

interface ChildMatrix extends Child {
  parentFirstName: string;
  parentLastName: string;
  histories: ChildHistory;
}

export function ScoreAdjustments() {

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['matrix'],
    queryFn: async () => {
      const response = await apiClient.get('/score-adjustments/matrix');
      return response.data;
    }
  });

  const weeks = data?.weeks || [];
  const children = data?.children || [];

  const toggleMutation = useMutation({
    mutationFn: async ({ childId, weekNumber, year, newDone }: any) => {
      return apiClient.patch('/score-adjustments', { childId, weekNumber, year, permanencesDone: newDone });
    },
    onMutate: async ({ childId, weekNumber, year, newDone }) => {
      await queryClient.cancelQueries({ queryKey: ['matrix'] });
      const previousData = queryClient.getQueryData(['matrix']);
      
      queryClient.setQueryData(['matrix'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          children: old.children.map((child: any) => {
            if (child.id === childId) {
              const key = `${year}-${weekNumber}`;
              return {
                ...child,
                histories: { ...child.histories, [key]: { permanencesDone: newDone } }
              };
            }
            return child;
          })
        };
      });
      return { previousData };
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['matrix'], context.previousData);
      }
      showToast("Erreur lors de l'ajustement de la permanence.", 'error');
    },
    onSuccess: (response, { childId }) => {
      queryClient.setQueryData(['matrix'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          children: old.children.map((child: any) => 
            child.id === childId ? { ...child, score: response.data.newScore } : child
          )
        };
      });
    }
  });

  const handleToggle = (childId: string, weekNumber: number, year: number, newDone: number) => {
    toggleMutation.mutate({ childId, weekNumber, year, newDone });
  };

  if (loading) {
    return <div className="loading">Chargement de la matrice...</div>;
  }

  if (error) {
    return <div className="alert alert-error">Erreur lors du chargement de la matrice des rattrapages</div>;
  }

  return (
    <div className="admin-dashboard fade-in" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, var(--color-surface), var(--color-background))', borderLeft: '5px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.8rem' }}>
              <Calendar size={28} color="var(--color-primary)" />
              Gestion des Permanences
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={18} />
              Cliquez sur les statuts pour ajuster manuellement les permanences effectuées dans le passé.
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: '0', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowY: 'auto', maxHeight: '70vh' }}>
          <table className="table" style={{ whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ 
                  position: 'sticky', 
                  top: 0,
                  left: 0, 
                  backgroundColor: 'var(--color-surface)', 
                  zIndex: 3,
                  minWidth: '220px',
                  maxWidth: '220px',
                  padding: '1.2rem 1.5rem',
                  borderBottom: '2px solid var(--color-border)',
                  borderRight: '1px dashed var(--color-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} color="var(--color-text-secondary)"/> Enfant (Famille)
                  </div>
                </th>
                <th style={{ 
                  position: 'sticky', 
                  top: 0,
                  left: '220px', 
                  backgroundColor: 'var(--color-surface)', 
                  zIndex: 3,
                  boxShadow: '4px 0 10px rgba(0,0,0,0.03)',
                  textAlign: 'center', 
                  padding: '1.2rem', 
                  borderBottom: '2px solid var(--color-border)',
                  borderRight: '2px solid var(--color-border)'
                }}>Score Actuel</th>
                {weeks.map((w: Week) => (
                  <th key={w.id} style={{ 
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    textAlign: 'center', 
                    padding: '1.2rem', 
                    borderBottom: '2px solid var(--color-border)', 
                    backgroundColor: 'var(--color-surface)' 
                  }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>Semaine {w.weekNumber}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 'normal' }}>Année {w.year}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {children.map((child: ChildMatrix, idx: number) => (
                <tr key={child.id} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)', transition: 'background-color 0.2s' }}>
                  <td style={{ 
                    position: 'sticky', 
                    left: 0, 
                    backgroundColor: 'var(--color-surface)', 
                    zIndex: 1,
                    minWidth: '220px',
                    maxWidth: '220px',
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    borderRight: '1px dashed var(--color-border)',
                    whiteSpace: 'normal',
                    wordWrap: 'break-word'
                  }}>
                    <strong style={{ fontSize: '1.05rem' }}>{child.firstName} {child.lastName}</strong><br/>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                      Parent: {child.parentFirstName} {child.parentLastName}
                    </span>
                  </td>
                  <td style={{ 
                    position: 'sticky', 
                    left: '220px', 
                    backgroundColor: 'var(--color-surface)', 
                    zIndex: 1,
                    boxShadow: '4px 0 10px rgba(0,0,0,0.03)',
                    textAlign: 'center', 
                    padding: '1rem', 
                    borderBottom: '1px solid var(--color-border)',
                    borderRight: '2px solid var(--color-border)'
                  }}>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      padding: '0.3em 0.8em', 
                      borderRadius: '8px',
                      fontWeight: 600,
                      backgroundColor: (child.score ?? 0) >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                      color: (child.score ?? 0) >= 0 ? 'var(--color-success)' : 'var(--color-secondary)',
                      border: `1px solid ${(child.score ?? 0) >= 0 ? 'var(--color-success)' : 'var(--color-secondary)'}`
                    }}>
                      {(child.score ?? 0) >= 0 ? `☕ Relâche (+${(child.score ?? 0).toFixed(2)})` : `🟩 Perm (${(child.score ?? 0).toFixed(2)})`}
                    </span>
                  </td>
                  {weeks.map((w: Week) => {
                    const key = `${w.year}-${w.weekNumber}`;
                    const history = child.histories[key] || {};
                    const currentDone = history.permanencesDone || 0;
                    const due = history.permanencesDue || 0;
                    const before = history.scoreBefore ?? 0;
                    const after = history.scoreAfter ?? 0;
                    
                    return (
                      <td key={w.id} style={{ textAlign: 'center', padding: '1rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(0,0,0,0.01)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                          <div style={{ backgroundColor: 'var(--color-surface)', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>Dette (avant)</div>
                            <div style={{ fontWeight: 500, color: before < 0 ? 'var(--color-secondary)' : 'var(--color-success)' }}>{before.toFixed(2)}</div>
                          </div>
                          <div style={{ backgroundColor: 'var(--color-surface)', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>Pesée sem.</div>
                            <div style={{ fontWeight: 500 }}>{due.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', backgroundColor: 'var(--color-surface)', padding: '0.5rem', borderRadius: '4px', border: '1px dashed var(--color-primary)' }}>
                          <div style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Effectué:</div>
                          <EditableCell 
                            value={currentDone} 
                            onChange={(newVal) => handleToggle(child.id, w.weekNumber, w.year, newVal)} 
                          />
                        </div>

                        <div style={{ backgroundColor: 'var(--color-surface)', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>Solde (après)</div>
                          <div style={{ fontWeight: 'bold', fontSize: '1rem', color: after < 0 ? 'var(--color-secondary)' : 'var(--color-success)' }}>{after.toFixed(2)}</div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {children.length === 0 && (
                <tr>
                  <td colSpan={weeks.length + 2} style={{ textAlign: 'center', padding: '2rem' }}>
                    Aucun enfant actif trouvé.
                  </td>
                </tr>
              )}
              {weeks.length === 0 && children.length > 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                    Aucune semaine n'a encore été publiée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
