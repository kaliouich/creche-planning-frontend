import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// useNavigate removed
import { apiClient } from '../api/client';
import { CheckCircle, XCircle, Info, Calendar, User } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

import type { Child, Week } from '../types';

interface ChildHistory {
  [key: string]: {
    permanencesDone: number;
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

  const handleToggle = (childId: string, weekNumber: number, year: number, currentDone: number) => {
    const newDone = currentDone > 0 ? 0 : 1;
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
        <table className="table" style={{ whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'var(--color-surface)', 
                zIndex: 2,
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
                left: '220px', 
                backgroundColor: 'var(--color-surface)', 
                zIndex: 2,
                boxShadow: '4px 0 10px rgba(0,0,0,0.03)',
                textAlign: 'center', 
                padding: '1.2rem', 
                borderBottom: '2px solid var(--color-border)' 
              }}>Score Actuel</th>
              {weeks.map((w: Week) => (
                <th key={w.id} style={{ textAlign: 'center', padding: '1.2rem', borderBottom: '2px solid var(--color-border)', backgroundColor: 'rgba(0,0,0,0.01)' }}>
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
                  borderBottom: '1px solid var(--color-border)' 
                }}>
                  <span className={`badge ${(child.score ?? 0) > 0 ? 'badge-success' : (child.score ?? 0) < 0 ? 'badge-error' : 'badge-warning'}`} style={{ fontSize: '1.1rem', padding: '0.4em 0.8em' }}>
                    {(child.score ?? 0) > 0 ? '+' : ''}{(child.score ?? 0).toFixed(1)}
                  </span>
                </td>
                {weeks.map((w: Week) => {
                  const key = `${w.year}-${w.weekNumber}`;
                  const isDone = child.histories[key]?.permanencesDone > 0;
                  return (
                    <td key={w.id} style={{ textAlign: 'center', padding: '1rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(0,0,0,0.01)' }}>
                      <button 
                        onClick={() => handleToggle(child.id, w.weekNumber, w.year, isDone ? 1 : 0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          transition: 'all 0.2s ease',
                          backgroundColor: isDone ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                        }}
                        title={isDone ? "Marquer comme non fait" : "Marquer comme fait"}
                      >
                        {isDone ? 
                          <CheckCircle size={24} color="#22c55e" /> : 
                          <XCircle size={24} color="#ef4444" opacity={0.5} />
                        }
                      </button>
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
  );
}
