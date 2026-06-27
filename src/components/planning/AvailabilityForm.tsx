import { Calendar, Loader2, Save, ArrowLeft, History } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getWeekDateRange, getDateForDayOfWeek } from '../../utils/date';
import { apiClient } from '../../api/client';

import type { Child, Week, SlotStatus } from '../../types';

interface AvailabilityFormProps {
  selectedChild: Child;
  onDeselectChild: () => void;
  availableFormWeeks: Week[];
  selectedFormWeekId: string;
  onSelectFormWeek: (id: string) => void;
  openWeek: Week | null;
  loadingGrid: boolean;
  availabilities: Record<string, SlotStatus>;
  handleCycleStatus: (slotId: string) => void;
  handleSubmit: () => void;
  isSaving: boolean;
  childrenList: Child[];
  DAYS: readonly string[];
  DAY_LABELS: Record<string, string>;
  HALF_DAYS: readonly string[];
  HALF_DAY_LABELS: Record<string, string>;
}

export function AvailabilityForm({
  selectedChild,
  onDeselectChild,
  availableFormWeeks,
  selectedFormWeekId,
  onSelectFormWeek,
  openWeek,
  loadingGrid,
  availabilities,
  handleCycleStatus,
  handleSubmit,
  isSaving,
  childrenList,
  DAYS,
  DAY_LABELS,
  HALF_DAYS,
  HALF_DAY_LABELS
}: AvailabilityFormProps) {

  const { data: scoreHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['score-history', selectedChild.id],
    queryFn: async () => {
      const res = await apiClient.get(`/children/${selectedChild.id}/history`);
      return res.data;
    }
  });

  return (
    <div className="animate-fade-in no-print">
      <button className="btn btn-outline" style={{ marginBottom: '2rem' }} onClick={onDeselectChild}>
        <ArrowLeft size={18} /> Retour à la liste
      </button>

      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Panneau de configuration : {selectedChild.firstName}</h1>
          <p style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            Famille {selectedChild.lastName}
            {selectedChild.score !== undefined && (
              <span className={`badge ${selectedChild.score > 0 ? 'badge-success' : 'badge-warning'}`}>
                {selectedChild.score > 0 ? `En relâche (${selectedChild.score.toFixed(1)})` : `Actif (${selectedChild.score.toFixed(1)})`}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Disponibilités</h3>
          {availableFormWeeks.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <select 
                value={selectedFormWeekId} 
                onChange={(e) => onSelectFormWeek(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-glass-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              >
                {availableFormWeeks.map((w: Week) => (
                  <option key={w.id} value={w.id}>Semaine {w.weekNumber} ({getWeekDateRange(w.weekNumber, w.year)})</option>
                ))}
              </select>
              <span className="badge badge-success">Saisie Ouverte</span>
            </div>
          ) : (
            <span className="badge badge-warning">Aucune saisie ouverte</span>
          )}
        </div>
        
        {!openWeek || availableFormWeeks.length === 0 ? (
          <div style={{ border: '2px dashed var(--color-glass-border)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontWeight: 500, marginBottom: '1rem' }}>Aucune semaine n'est actuellement ouverte à la saisie des disponibilités.</p>
          </div>
        ) : loadingGrid || !openWeek.slots ? (
          <div className="flex-center" style={{ padding: '3rem' }}><Loader2 size={32} className="spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {DAYS.map(day => (
                <div key={day} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr', gap: '1rem', alignItems: 'center', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{DAY_LABELS[day]}</strong>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                      {getDateForDayOfWeek(openWeek.weekNumber, openWeek.year, day)}
                    </span>
                  </div>
                  
                  {HALF_DAYS.map(halfDay => {
                    const slot = (openWeek.slots || []).find(s => s.dayOfWeek === day && s.halfDay === halfDay);
                    if (!slot) return <div key={halfDay}>-</div>;

                    const isClosed = slot.slotType === 'CLOSED';
                    const isEnrolled = selectedChild.defaultPresences?.some(dp => dp.dayOfWeek === day && dp.halfDay === halfDay) ?? true;
                    
                    // If the slot is NO_PERM and somehow was saved as AVAILABLE before, map it visually to UNAVAILABLE
                    const rawStatus = availabilities[slot.id];
                    const status = (slot.slotType === 'NO_PERM' && rawStatus === 'AVAILABLE') ? 'UNAVAILABLE' : rawStatus;

                    return (
                      <div key={slot.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{HALF_DAY_LABELS[halfDay]}</span>
                        {isClosed ? (
                          <div style={{ padding: '0.5rem', textAlign: 'center', backgroundColor: 'var(--color-glass-border)', borderRadius: 'var(--radius-md)', opacity: 0.5, fontSize: '0.9rem' }}>
                            Fermé
                          </div>
                        ) : !isEnrolled ? (
                          <div style={{ padding: '0.5rem', textAlign: 'center', backgroundColor: 'var(--color-glass-border)', borderRadius: 'var(--radius-md)', opacity: 0.7, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                            Non accueilli
                          </div>
                        ) : (
                          <button 
                            className={`btn ${status === 'AVAILABLE' ? 'btn-primary' : status === 'ABSENT' ? 'btn-outline' : 'btn-outline'}`}
                            style={{ 
                              justifyContent: 'center',
                              borderColor: status === 'ABSENT' ? 'var(--color-secondary)' : undefined,
                              color: status === 'ABSENT' ? 'var(--color-secondary)' : undefined,
                              cursor: 'pointer'
                            }}
                            onClick={() => handleCycleStatus(slot.id)}
                          >
                            {status === 'AVAILABLE' && 'Disponible'}
                            {status === 'UNAVAILABLE' && (slot.slotType === 'NO_PERM' ? 'Aucune perm. requise' : 'Indisponible')}
                            {status === 'ABSENT' && 'Enfant Absent'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ fontSize: '1.1rem', padding: '0.8rem 2rem' }} 
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? <><Loader2 size={20} className="spin" /> Enregistrement...</> : <><Save size={20} /> Enregistrer mes disponibilités</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tableau Recap de suivi de remplissage */}
      {openWeek && childrenList.length > 0 && (
        <div className="glass-card no-print" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} /> Tableau de suivi de remplissage global
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--color-glass-border)', textAlign: 'left' }}>Enfant</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--color-glass-border)', textAlign: 'center' }}>Statut</th>
                  {DAYS.map(day => (
                    <th key={day} colSpan={2} style={{ padding: '0.75rem', borderBottom: '2px solid var(--color-glass-border)', borderLeft: '1px solid var(--color-glass-border)' }}>
                      {DAY_LABELS[day]}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-glass-border)' }}></th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-glass-border)' }}></th>
                  {DAYS.flatMap(day => [
                    <th key={`${day}-MORNING`} style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-glass-border)', borderLeft: '1px solid var(--color-glass-border)', fontWeight: 'normal', color: 'var(--color-text-secondary)' }}>Matin</th>,
                    <th key={`${day}-AFTERNOON`} style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-glass-border)', fontWeight: 'normal', color: 'var(--color-text-secondary)' }}>Aprèm</th>
                  ])}
                </tr>
                <tr>
                  <th style={{ padding: '0.5rem', borderBottom: '2px solid var(--color-glass-border)' }}></th>
                  <th style={{ padding: '0.5rem', borderBottom: '2px solid var(--color-glass-border)', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>Statistiques</th>
                  {DAYS.flatMap(day => {
                    return HALF_DAYS.map(halfDay => {
                      const slot = (openWeek.slots || []).find(s => s.dayOfWeek === day && s.halfDay === halfDay);
                      let petitsPres = 0;
                      let grandsPres = 0;
                      let petitsAbs = 0;
                      let grandsAbs = 0;

                      const activeChildren = childrenList.filter(c => c.isActive);
                      activeChildren.forEach(child => {
                        const override = slot?.childPresences?.find((cp: any) => cp.child.id === child.id);
                        const isEnrolled = child.defaultPresences?.some((dp: any) => dp.dayOfWeek === day && dp.halfDay === halfDay);
                        const isPresent = override ? override.isPresent : isEnrolled;
                        
                        if (isPresent) {
                          if (child.ageGroup === 'PETIT') petitsPres++; else grandsPres++;
                        } else {
                          if (child.ageGroup === 'PETIT') petitsAbs++; else grandsAbs++;
                        }
                      });

                      return (
                        <th key={`stats-${day}-${halfDay}`} style={{ padding: '0.5rem', borderBottom: '2px solid var(--color-glass-border)', borderLeft: halfDay === 'MORNING' ? '1px solid var(--color-glass-border)' : 'none', fontSize: '0.75rem', fontWeight: 'normal', lineHeight: '1.2' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ color: 'var(--color-success)' }}>{petitsPres}P {grandsPres}G (Présents)</span>
                            <span style={{ color: 'var(--color-secondary)' }}>{petitsAbs}P {grandsAbs}G (Absents)</span>
                          </div>
                        </th>
                      );
                    });
                  })}
                </tr>
              </thead>
              <tbody>
                {childrenList.map(child => {
                  const submittedChildIds = new Set<string>();
                  (openWeek.slots || []).forEach(slot => {
                    slot.availabilities?.forEach((avail: any) => {
                      submittedChildIds.add(avail.child.id);
                    });
                  });
                  const hasSubmitted = submittedChildIds.has(child.id);
                  return (
                  <tr key={child.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                      {child.firstName} {child.lastName.charAt(0)}.
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {hasSubmitted ? (
                        <span className="badge badge-success">Saisi</span>
                      ) : (
                        <span className="badge badge-error">En attente</span>
                      )}
                    </td>
                    {DAYS.flatMap(day => {
                      return HALF_DAYS.map(halfDay => {
                        const slot = (openWeek.slots || []).find(s => s.dayOfWeek === day && s.halfDay === halfDay);
                        const avail = slot?.availabilities?.find((a: any) => a.child?.id === child.id);
                        const isEnrolled = child.defaultPresences?.some(dp => dp.dayOfWeek === day && dp.halfDay === halfDay) ?? true;
                        
                        let content = <span style={{ color: 'var(--color-text-secondary)', opacity: 0.3 }}>-</span>;
                        
                        if (!isEnrolled) {
                          content = <span style={{ color: 'var(--color-text-secondary)', opacity: 0.3 }}>-</span>; // Non accueilli
                        } else if (hasSubmitted) {
                          const presence = slot?.childPresences?.find((p: any) => p.child.id === child.id);
                          const isMarkedAbsent = presence && !presence.isPresent;
                          
                          if (isMarkedAbsent) {
                            content = <span style={{ color: 'var(--color-secondary)' }}>✗</span>; // Absent déclaré
                          } else if (avail && avail.isAvailable) {
                            content = <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✓</span>; // Dispo
                          } else {
                            content = <span style={{ color: 'var(--color-text-secondary)' }}>✗</span>; // Indispo
                          }
                        }

                        return (
                          <td key={`${day}-${halfDay}`} style={{ padding: '0.75rem', borderLeft: halfDay === 'MORNING' ? '1px solid var(--color-glass-border)' : 'none' }}>
                            {content}
                          </td>
                        );
                      });
                    })}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historique des permanences du parent */}
      <div className="glass-card no-print" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={20} /> Historique de vos permanences
        </h3>
        
        {loadingHistory ? (
          <div className="flex-center" style={{ padding: '2rem' }}><Loader2 size={24} className="spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : !scoreHistory || scoreHistory.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>Aucun historique de score disponible.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--color-glass-border)', textAlign: 'left' }}>Semaine</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--color-glass-border)' }}>Dette (avant)</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--color-glass-border)' }}>Pesée sem.</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--color-glass-border)' }}>Effectué</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--color-glass-border)', textAlign: 'right' }}>Solde (après)</th>
                </tr>
              </thead>
              <tbody>
                {scoreHistory.map((h: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 500 }}>
                      Semaine {h.weekNumber} <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>({h.year})</span>
                    </td>
                    <td style={{ padding: '0.75rem', color: h.scoreBefore < 0 ? 'var(--color-secondary)' : 'var(--color-success)' }}>
                      {h.scoreBefore > 0 ? '+' : ''}{(h.scoreBefore || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {(h.permanencesDue || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                      {h.permanencesDone > 0 ? (
                        <span style={{ color: 'var(--color-primary)' }}>{h.permanencesDone}</span>
                      ) : (
                        <span style={{ color: 'var(--color-success)' }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <span className={`badge ${h.scoreAfter > 0 ? 'badge-success' : h.scoreAfter < 0 ? 'badge-error' : 'badge-warning'}`}>
                        {h.scoreAfter > 0 ? '+' : ''}{(h.scoreAfter || 0).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
