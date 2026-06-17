import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { Calendar, Loader2, Save, CheckCircle2, Baby, ArrowLeft } from 'lucide-react';
import { getWeekDateRange } from '../utils/date';


interface Child {
  id: string;
  firstName: string;
  lastName: string;
  defaultPresences?: { dayOfWeek: string; halfDay: string }[];
  score?: number;
  parentId?: string;
}

interface Slot {
  id: string;
  dayOfWeek: string;
  halfDay: string;
  slotType: string;
  requiredParents: number;
  availabilities?: {
    id: string;
    isAvailable: boolean;
    isAbsent: boolean;
    child: { id: string; firstName: string; lastName: string };
  }[];
  childPresences?: {
    id: string;
    isPresent: boolean;
    child: { id: string; firstName: string; lastName: string };
  }[];
  assignments?: {
    id: string;
    isManual: boolean;
    parent: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
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

type SlotStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'ABSENT';

export default function ParentDashboard() {
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  
  const [openWeek, setOpenWeek] = useState<Week | null>(null); // For the child-specific availability form
  const [globalPlanning, setGlobalPlanning] = useState<Week | null>(null); // For the global view
  
  const [availableGlobalWeeks, setAvailableGlobalWeeks] = useState<Week[]>([]);
  const [availableFormWeeks, setAvailableFormWeeks] = useState<Week[]>([]);
  const [selectedGlobalWeekId, setSelectedGlobalWeekId] = useState<string>('');
  const [selectedFormWeekId, setSelectedFormWeekId] = useState<string>('');
  
  const [availabilities, setAvailabilities] = useState<Record<string, SlotStatus>>({});
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const userStr = localStorage.getItem('userMeta');
  const user = userStr ? JSON.parse(userStr) : null;
  const loggedInUserId = user?.id;

  // 1. Fetch children and the open week definition
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [childrenRes, weeksRes] = await Promise.all([
          apiClient.get('/children'),
          apiClient.get('/weeks')
        ]);
        
        setChildrenList(childrenRes.data);
        
        const globalWeeks = weeksRes.data.filter((w: Week) => ['PUBLISHED'].includes(w.status));
        setAvailableGlobalWeeks(globalWeeks);
        if (globalWeeks.length > 0) {
          setSelectedGlobalWeekId(globalWeeks[0].id);
        }

        const formWeeks = weeksRes.data.filter((w: Week) => w.status !== 'PUBLISHED');
        setAvailableFormWeeks(formWeeks);
        if (formWeeks.length > 0) {
          setSelectedFormWeekId(formWeeks[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchInitialData();
  }, []);

  // 2. When a child is selected, fetch the planning specific to their family
  const loadChildPlanning = useCallback(async (child: Child, weekId: string) => {
    if (!weekId) return;
    setLoadingGrid(true);
    setError('');
    setSuccess('');
    try {
      const planningRes = await apiClient.get(`/planning/${weekId}?childId=${child.id}`);
      
      const initialAvails: Record<string, SlotStatus> = {};
      planningRes.data.slots.forEach((s: Slot) => {
        const isEnrolled = child.defaultPresences?.some(dp => dp.dayOfWeek === s.dayOfWeek && dp.halfDay === s.halfDay) ?? true;
        if (s.slotType !== 'CLOSED' && isEnrolled) {
          const avail = s.availabilities?.find(a => a.child.id === child.id);
          initialAvails[s.id] = avail ? (avail.isAbsent ? 'ABSENT' : (avail.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE')) : 'UNAVAILABLE';
        }
      });
      setAvailabilities(initialAvails);
      setOpenWeek(planningRes.data);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les disponibilités pour cet enfant.');
    } finally {
      setLoadingGrid(false);
    }
  }, []);

  const handleSelectChild = useCallback((child: Child) => {
    setSelectedChild(child);
    if (selectedFormWeekId) {
      loadChildPlanning(child, selectedFormWeekId);
    }
  }, [selectedFormWeekId, loadChildPlanning]);

  useEffect(() => {
    if (selectedChild && selectedFormWeekId) {
      loadChildPlanning(selectedChild, selectedFormWeekId);
    }
  }, [selectedFormWeekId, selectedChild, loadChildPlanning]);

  useEffect(() => {
    if (selectedGlobalWeekId) {
      apiClient.get(`/planning/${selectedGlobalWeekId}`)
        .then(res => setGlobalPlanning(res.data))
        .catch(e => console.error("Erreur chargement planning global", e));
    }
  }, [selectedGlobalWeekId]);

  const handleCycleStatus = (slotId: string) => {
    if (selectedChild?.parentId !== loggedInUserId) return; // Lecture seule

    setSuccess(''); // Masquer le message de succès si on modifie une valeur
    setAvailabilities(prev => {
      const current = prev[slotId];
      if (current === 'UNAVAILABLE') return { ...prev, [slotId]: 'AVAILABLE' };
      if (current === 'AVAILABLE') return { ...prev, [slotId]: 'ABSENT' };
      return { ...prev, [slotId]: 'UNAVAILABLE' };
    });
  };

  const handleSubmit = async () => {
    if (!openWeek || !selectedChild) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = Object.entries(availabilities)
        .filter(([slotId]) => {
          const slot = openWeek.slots.find(s => s.id === slotId);
          if (!slot) return false;
          return selectedChild.defaultPresences?.some(dp => dp.dayOfWeek === slot.dayOfWeek && dp.halfDay === slot.halfDay) ?? true;
        })
        .map(([slotId, status]) => ({
          slotId,
          isAvailable: status === 'AVAILABLE',
          isAbsent: status === 'ABSENT'
        }));

      await apiClient.put(`/availabilities/week/${openWeek.id}`, { 
        availabilities: payload,
        childId: selectedChild.id
      });
      setSuccess('Disponibilités enregistrées avec succès !');
      // Le message restera affiché jusqu'à ce que l'utilisateur quitte la page ou modifie à nouveau le formulaire
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Erreur de sauvegarde');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingList) {
    return <div className="flex-center" style={{ padding: '4rem' }}><Loader2 size={32} className="spin" style={{ color: 'var(--color-primary)' }} /></div>;
  }

  // --- VUE 1 : Liste des enfants ---
  if (!selectedChild) {
    return (
      <div className="animate-fade-in">
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Baby size={48} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
          <h1>Espace Parent</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Veuillez sélectionner le prénom de votre enfant pour remplir le planning.</p>
        </div>

        {childrenList.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Aucun enfant n'est enregistré dans la crèche pour le moment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {childrenList.map(child => (
              <button 
                key={child.id} 
                className="btn btn-outline glass-card hover-lift"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem 1rem', height: 'auto', border: '2px solid transparent' }}
                onClick={() => handleSelectChild(child)}
              >
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', opacity: 0.1, position: 'absolute' }}></div>
                <Baby size={32} color="var(--color-primary)" style={{ zIndex: 1 }} />
                <strong style={{ fontSize: '1.2rem', zIndex: 1 }}>{child.firstName}</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', zIndex: 1 }}>{child.lastName}</span>
                {child.score !== undefined && (
                  <span className={`badge ${child.score > 0 ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: '0.5rem', zIndex: 1 }}>
                    {child.score > 0 ? `En relâche (${child.score.toFixed(1)})` : `Actif (${child.score.toFixed(1)})`}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Vue Globale du Planning */}
        {availableGlobalWeeks.length > 0 && globalPlanning ? (
          <div className="glass-card" style={{ marginTop: '3rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Calendar size={20} /> Planning Global
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <select 
                  value={selectedGlobalWeekId} 
                  onChange={(e) => setSelectedGlobalWeekId(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-glass-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                >
                  {availableGlobalWeeks.map(w => (
                    <option key={w.id} value={w.id}>Semaine {w.weekNumber} ({getWeekDateRange(w.weekNumber, w.year)})</option>
                  ))}
                </select>

                {globalPlanning.status === 'PUBLISHED' ? (
                  <span className="badge badge-success">Publié</span>
                ) : (
                  <span className="badge badge-warning">En cours d'élaboration</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', opacity: globalPlanning.status === 'PUBLISHED' ? 1 : 0.6 }}>
              {DAYS.map(day => (
                <div key={day} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr', gap: '1rem', alignItems: 'start', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '1rem' }}>
                  <strong style={{ fontSize: '1.1rem', paddingTop: '0.2rem' }}>{DAY_LABELS[day]}</strong>
                  
                  {HALF_DAYS.map(halfDay => {
                    const slot = globalPlanning.slots.find(s => s.dayOfWeek === day && s.halfDay === halfDay);
                    if (!slot) return <div key={halfDay}>-</div>;

                    const isClosed = slot.slotType === 'CLOSED';
                    const isDouble = slot.slotType === 'DOUBLE_PERM';

                    return (
                      <div key={slot.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{HALF_DAY_LABELS[halfDay]}</span>
                        
                        <div 
                          className={`btn ${isClosed ? 'btn-outline' : globalPlanning.status === 'PUBLISHED' ? 'btn-primary' : 'btn-outline'}`}
                          style={{ 
                            justifyContent: 'center',
                            borderColor: isClosed ? 'var(--color-secondary)' : undefined,
                            color: isClosed ? 'var(--color-secondary)' : undefined,
                            cursor: 'default',
                            fontWeight: globalPlanning.status === 'PUBLISHED' && !isClosed && slot.assignments?.length ? 600 : undefined
                          }}
                        >
                          {isClosed && 'Fermé'}
                          {!isClosed && globalPlanning.status === 'PUBLISHED' && (
                            <>
                              {slot.assignments && slot.assignments.length > 0 
                                ? slot.assignments.map(a => `${a.parent.firstName} ${a.parent.lastName}`.trim()).join(' & ')
                                : '✗ Non rempli'}
                            </>
                          )}
                          {!isClosed && globalPlanning.status !== 'PUBLISHED' && (
                            <>
                              {isDouble ? 'Double Perm (à définir)' : 'Normal (à définir)'}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // --- VUE 2 : Grille de l'enfant sélectionné ---
  return (
    <div className="animate-fade-in">
      <button className="btn btn-outline" style={{ marginBottom: '2rem' }} onClick={() => setSelectedChild(null)}>
        <ArrowLeft size={18} /> Retour à la liste
      </button>

      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Planning de {selectedChild.firstName}</h1>
          <p style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            Famille {selectedChild.lastName}
            {selectedChild.score !== undefined && (
              <span className={`badge ${selectedChild.score > 0 ? 'badge-success' : 'badge-warning'}`}>
                {selectedChild.score > 0 ? `En relâche (${selectedChild.score.toFixed(1)})` : `Actif (${selectedChild.score.toFixed(1)})`}
              </span>
            )}
            {selectedChild.parentId !== loggedInUserId && (
              <span className="badge badge-error" style={{ backgroundColor: 'var(--color-secondary)', color: 'white' }}>Lecture seule</span>
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
                onChange={(e) => setSelectedFormWeekId(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-glass-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              >
                {availableFormWeeks.map(w => (
                  <option key={w.id} value={w.id}>Semaine {w.weekNumber} ({getWeekDateRange(w.weekNumber, w.year)})</option>
                ))}
              </select>
              <span className="badge badge-success">Saisie Ouverte</span>
            </div>
          ) : (
            <span className="badge badge-warning">Aucune saisie ouverte</span>
          )}
        </div>
        
        {error && <div style={{ backgroundColor: 'rgba(244,63,94,0.1)', color: 'var(--color-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={18} /> {success}</div>}

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
                  <strong style={{ fontSize: '1.1rem' }}>{DAY_LABELS[day]}</strong>
                  
                  {HALF_DAYS.map(halfDay => {
                    const slot = openWeek.slots.find(s => s.dayOfWeek === day && s.halfDay === halfDay);
                    if (!slot) return <div key={halfDay}>-</div>;

                    const isClosed = slot.slotType === 'CLOSED';
                    const isEnrolled = selectedChild.defaultPresences?.some(dp => dp.dayOfWeek === day && dp.halfDay === halfDay) ?? true;
                    const status = availabilities[slot.id];

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
                              cursor: selectedChild.parentId !== loggedInUserId ? 'default' : 'pointer'
                            }}
                            onClick={() => handleCycleStatus(slot.id)}
                            disabled={selectedChild.parentId !== loggedInUserId}
                          >
                            {status === 'AVAILABLE' && 'Disponible'}
                            {status === 'UNAVAILABLE' && 'Indisponible'}
                            {status === 'ABSENT' && 'Enfant Absent'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {selectedChild.parentId === loggedInUserId ? (
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                {saving ? 'Enregistrement...' : 'Enregistrer mes disponibilités'}
              </button>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--color-glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)' }}>
                Vous consultez le planning d'une autre famille. Vous ne pouvez modifier que les disponibilités de vos propres enfants.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tableau Recap de suivi de remplissage */}
      {openWeek && childrenList.length > 0 && (
        <div className="glass-card" style={{ marginTop: '2rem' }}>
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
              </thead>
              <tbody>
                {childrenList.map(child => {
                  const submittedChildIds = new Set<string>();
                  openWeek.slots.forEach(slot => {
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
                        const slot = openWeek.slots.find(s => s.dayOfWeek === day && s.halfDay === halfDay);
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
    </div>
  );
}
