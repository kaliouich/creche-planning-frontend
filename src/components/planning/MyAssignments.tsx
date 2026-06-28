import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Calendar, Loader2, ArrowRightLeft } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { Child } from '../../types';
import { DAY_LABELS, HALF_DAY_LABELS } from '../../types';
import { isDatePassed } from '../../utils/date';

interface MyAssignmentsProps {
  selectedChild: Child;
}

export function MyAssignments({ selectedChild }: MyAssignmentsProps) {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['my-assignments', selectedChild.id],
    queryFn: async () => {
      const res = await apiClient.get(`/assignments/my/${selectedChild.id}`);
      
      return res.data.filter((a: any) => !isDatePassed(a.weekNumber, a.year, a.dayOfWeek));
    }
  });

  const offerMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return apiClient.post('/exchange/offers', { assignmentId });
    },
    onSuccess: () => {
      setSuccess('Permanence proposée à la bourse d\'échange avec succès !');
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['exchange-offers'] });
      queryClient.invalidateQueries({ queryKey: ['global-planning'] });
      setTimeout(() => setSuccess(''), 5000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Erreur lors de la mise en bourse d\'échange');
      setTimeout(() => setError(''), 5000);
    }
  });

  if (isLoading) {
    return <div className="flex-center" style={{ padding: '2rem' }}><LoadingSpinner /></div>;
  }

  if (!assignments || assignments.length === 0) {
    return null; // Don't show the section if no assignments
  }

  return (
    <div className="glass-card no-print" style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Calendar size={20} /> Vos Permanences (Validées) à venir
      </h3>
      
      {error && <div style={{ backgroundColor: 'rgba(244,63,94,0.1)', color: 'var(--color-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
      {success && <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem' }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {assignments.map((a: any, idx: number) => (
          <div key={`${a.weekId}-${a.slotId}-${idx}`} style={{ border: '1px solid var(--color-glass-border)', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '1.1rem' }}>Semaine {a.weekNumber}</strong>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  {DAY_LABELS[a.dayOfWeek]} {HALF_DAY_LABELS[a.halfDay]}
                </span>
              </div>
            </div>
            
            {a.isOfferedForExchange ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.9rem', backgroundColor: 'var(--color-bg-tertiary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                <ArrowRightLeft size={16} /> <span>En cours d'échange (voir Bourse)</span>
              </div>
            ) : (
              <button 
                className="btn btn-outline" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.5rem' }}
                onClick={() => offerMutation.mutate(a.assignmentId)}
                disabled={offerMutation.isPending}
              >
                {offerMutation.isPending && offerMutation.variables === a.assignmentId ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <ArrowRightLeft size={16} />
                )}
                Proposer à l'échange
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
