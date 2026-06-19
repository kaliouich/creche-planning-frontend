import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { ArrowLeft, Calendar, ShieldBan, Users, Loader2, Printer } from 'lucide-react';
import { getWeekDateRange } from '../utils/date';

interface Assignment {
  id: string;
  isManual: boolean;
  parent: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  defaultPresences?: { dayOfWeek: string; halfDay: string }[];
  score?: number;
  ageGroup?: 'PETIT' | 'GRAND';
}

interface Availability {
  id: string;
  isAvailable: boolean;
  child: Child;
}

interface ChildPresence {
  id: string;
  isPresent: boolean;
  child: Child;
}

interface Slot {
  id: string;
  dayOfWeek: string;
  halfDay: string;
  slotType: 'OPEN' | 'DOUBLE_PERM' | 'CLOSED';
  requiredParents: number;
  assignments: Assignment[];
  availabilities?: Availability[];
  childPresences?: ChildPresence[];
}

interface Week {
  id: string;
  weekNumber: number;
  year: number;
  status: string;
  slots: Slot[];
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_LABELS: Record<string, string> = { MONDAY: 'Lundi', TUESDAY: 'Mardi', WEDNESDAY: 'Mercredi', THURSDAY: 'Jeudi', FRIDAY: 'Vendredi' };
const HALF_DAYS = ['MORNING', 'AFTERNOON'];
const HALF_DAY_LABELS: Record<string, string> = { MORNING: 'Matin', AFTERNOON: 'Après-midi' };

export default function WeekDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [week, setWeek] = useState<Week | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weekRes, childrenRes] = await Promise.all([
          apiClient.get(`/planning/${id}`),
          apiClient.get('/children')
        ]);
        setWeek(weekRes.data);
        setChildren(childrenRes.data);
      } catch (err) {
        setError('Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleToggleSlotType = async (slot: Slot) => {
    if (!week || week.status !== 'PREPARATION') return;

    // Cycle: OPEN -> DOUBLE_PERM -> CLOSED -> OPEN
    let nextType = 'OPEN';
    if (slot.slotType === 'OPEN') nextType = 'DOUBLE_PERM';
    else if (slot.slotType === 'DOUBLE_PERM') nextType = 'CLOSED';

    try {
      const response = await apiClient.patch(`/slots/${slot.id}`, { slotType: nextType });
      const updatedSlot = response.data;
      
      setWeek(prev => prev ? {
        ...prev,
        slots: prev.slots.map(s => s.id === slot.id ? updatedSlot : s)
      } : null);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Erreur lors de la mise à jour');
      }
    }
  };

  if (loading) return <div className="flex-center" style={{ padding: '4rem' }}><Loader2 size={32} className="spin" style={{ color: 'var(--color-primary)' }} /></div>;
  if (!week) return <div className="animate-fade-in"><h3>Semaine introuvable</h3></div>;

  const isEditable = week.status === 'PREPARATION';

  return (
    <div className="animate-fade-in">
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/')}>
            <ArrowLeft size={20} /> Retour
          </button>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>
            Semaine {week.weekNumber} <span style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>({getWeekDateRange(week.weekNumber, week.year)})</span>
          </h1>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="badge badge-warning">{week.status}</span>
            {week.status === 'PUBLISHED' && (
              <button className="btn btn-outline" onClick={() => window.print()} style={{ padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}>
                <Printer size={16} /> Exporter PDF
              </button>
            )}
          </div>
        </div>

        {/* Titre pour la version imprimée */}
        <h1 className="only-print" style={{ display: 'none', margin: '0 0 1rem 0', fontSize: '2rem', textAlign: 'center', color: 'var(--color-primary)' }}>
          Planning Semaine {week.weekNumber} - Permanences des parents
          <div style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', fontWeight: 'normal', marginTop: '0.2rem' }}>
            ({getWeekDateRange(week.weekNumber, week.year)})
          </div>
        </h1>

      {error && (
        <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-card">
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} /> Créneaux de permanence
        </h3>
        
        {!isEditable && (
          <p className="no-print" style={{ color: 'var(--color-warning)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            La semaine est en mode lecture seule. Les créneaux ne peuvent plus être modifiés.
          </p>
        )}

        <div className="planning-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {DAYS.map(day => (
            <div className="grid-day-row" key={day} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr', gap: '1rem', alignItems: 'start', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '1rem' }}>
              <strong style={{ fontSize: '1.1rem', paddingTop: '0.2rem' }}>{DAY_LABELS[day]}</strong>
              
              {HALF_DAYS.map(halfDay => {
                const slot = week.slots.find(s => s.dayOfWeek === day && s.halfDay === halfDay);
                if (!slot) return <div key={halfDay}>-</div>;

                const isClosed = slot.slotType === 'CLOSED';
                const isDouble = slot.slotType === 'DOUBLE_PERM';

                return (
                  <div key={slot.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{HALF_DAY_LABELS[halfDay]}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                      <button 
                        className={`btn ${isClosed ? 'btn-outline' : isDouble ? 'btn-primary' : 'btn-outline'}`}
                        style={{ 
                          justifyContent: 'center',
                          borderColor: isClosed ? 'var(--color-secondary)' : undefined,
                          color: isClosed ? 'var(--color-secondary)' : undefined,
                          opacity: isEditable ? 1 : 0.8,
                          cursor: isEditable ? 'pointer' : 'default',
                          fontWeight: !isEditable && !isClosed && slot.assignments?.length ? 600 : undefined
                        }}
                        onClick={() => handleToggleSlotType(slot)}
                        disabled={!isEditable}
                      >
                        {isClosed && <><ShieldBan size={16} /> Fermé</>}
                        {!isClosed && !isEditable && (
                          <>
                            {slot.assignments && slot.assignments.length > 0 
                              ? slot.assignments.map(a => `${a.parent.firstName} ${a.parent.lastName}`.trim()).join(' & ')
                              : '✗ Non rempli'}
                          </>
                        )}
                        {!isClosed && isEditable && (
                          <>
                            {isDouble && <><Users size={16} /> Double Perm</>}
                            {!isDouble && 'Normal (1 Parent)'}
                          </>
                        )}
                      </button>

                      {/* Section d'information sur les enfants présents, dispos et absents */}
                      {!isClosed && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.85rem', textAlign: 'left' }}>
                          {(() => {
                            // Calcul des dispos
                            const availableNames = (slot.availabilities || [])
                              .filter(a => a.isAvailable)
                              .map(a => a.child.firstName);
                            
                            // 1. Absents déclarés (ChildPresence = false)
                            const declaredAbsents = (slot.childPresences || [])
                              .filter(cp => !cp.isPresent)
                              .map(cp => cp.child.id);
                              
                            // 2. Non-accueillis (enfant ne vient pas cette demi-journée)
                            const notEnrolled = children.filter(c => {
                              const isEnrolled = c.defaultPresences?.some(dp => dp.dayOfWeek === day && dp.halfDay === halfDay);
                              return !isEnrolled;
                            });

                            // Calcul des absents totaux
                            const absentNames: string[] = [];
                            declaredAbsents.forEach(childId => {
                              const c = children.find(x => x.id === childId);
                              if (c && !notEnrolled.some(ne => ne.id === c.id)) absentNames.push(c.firstName);
                            });
                            notEnrolled.forEach(c => absentNames.push(c.firstName));
                            
                            // Calcul des présents
                            const presentChildren = children
                              .filter(c => !notEnrolled.some(ne => ne.id === c.id)) // is enrolled
                              .filter(c => !declaredAbsents.includes(c.id)); // is not marked absent
                              
                            const grandsPresNames = presentChildren.filter(c => c.ageGroup !== 'PETIT').map(c => c.firstName);
                            const petitsPresNames = presentChildren.filter(c => c.ageGroup === 'PETIT').map(c => c.firstName);
                            
                            const absentChildren = children.filter(c => absentNames.includes(c.firstName));
                            const grandsAbsNames = absentChildren.filter(c => c.ageGroup !== 'PETIT').map(c => c.firstName);
                            const petitsAbsNames = absentChildren.filter(c => c.ageGroup === 'PETIT').map(c => c.firstName);
                            
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                                {/* GRANDS */}
                                <div>
                                  <strong style={{ color: 'var(--color-primary)' }}>
                                    Grands : {grandsPresNames.length} présent{grandsPresNames.length > 1 ? 's' : ''} / {grandsAbsNames.length} absent{grandsAbsNames.length > 1 ? 's' : ''}
                                  </strong>
                                  <div style={{ paddingLeft: '0.5rem', marginTop: '0.2rem', color: 'var(--color-text-secondary)' }}>
                                    <div>- présents : {grandsPresNames.length > 0 ? grandsPresNames.join(', ') : '-'}</div>
                                    <div>- absents : {grandsAbsNames.length > 0 ? grandsAbsNames.join(', ') : '-'}</div>
                                  </div>
                                </div>
                                
                                {/* PETITS */}
                                <div>
                                  <strong style={{ color: 'var(--color-secondary)' }}>
                                    Petits : {petitsPresNames.length} présent{petitsPresNames.length > 1 ? 's' : ''} / {petitsAbsNames.length} absent{petitsAbsNames.length > 1 ? 's' : ''}
                                  </strong>
                                  <div style={{ paddingLeft: '0.5rem', marginTop: '0.2rem', color: 'var(--color-text-secondary)' }}>
                                    <div>- présents : {petitsPresNames.length > 0 ? petitsPresNames.join(', ') : '-'}</div>
                                    <div>- absents : {petitsAbsNames.length > 0 ? petitsAbsNames.join(', ') : '-'}</div>
                                  </div>
                                </div>
                                
                                <div style={{ color: 'var(--color-success)', marginTop: '0.25rem' }}>
                                  <strong>Parent Dispo: </strong> 
                                  {availableNames.length > 0 ? availableNames.join(', ') : '-'}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tableau des disponibilités des parents */}
      <div className="glass-card no-print" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} /> Tableau des disponibilités soumises
        </h3>
        
        {(() => {
          if (children.length === 0) {
            return (
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '1rem' }}>
                Aucun enfant inscrit dans la crèche.
              </p>
            );
          }

          // Déterminer qui a soumis (au moins 1 disponibilité envoyée sur la semaine)
          const submittedChildIds = new Set<string>();
          week.slots.forEach(slot => {
            slot.availabilities?.forEach(avail => {
              submittedChildIds.add(avail.child.id);
            });
          });

          return (
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
                </thead>
                <tbody>
                  {children.map(child => {
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
                          const slot = week.slots.find(s => s.dayOfWeek === day && s.halfDay === halfDay);
                          const avail = slot?.availabilities?.find(a => a.child?.id === child.id);
                          const isEnrolled = child.defaultPresences?.some(dp => dp.dayOfWeek === day && dp.halfDay === halfDay) ?? true;
                          
                          let content = <span style={{ color: 'var(--color-text-secondary)', opacity: 0.3 }}>-</span>;
                          
                          if (!isEnrolled) {
                            content = <span style={{ color: 'var(--color-text-secondary)', opacity: 0.3 }}>-</span>; // Non accueilli
                          } else if (hasSubmitted) {
                            // L'enfant est accueilli et a soumis.
                            const presence = slot?.childPresences?.find(p => p.child.id === child.id);
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
          );
        })()}
      </div>
    </div>
  );
}
