import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// useNavigate removed
import { apiClient } from '../api/client';
import { Plus, Baby, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import type { Child } from '../types';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_LABELS: Record<string, string> = { MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mer', THURSDAY: 'Jeu', FRIDAY: 'Ven' };
const HALF_DAYS = ['MORNING', 'AFTERNOON'];

export default function ChildrenManagement() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [parent1Name, setParent1Name] = useState('');
  const [parent2Name, setParent2Name] = useState('');
  const [newChildAgeGroup, setNewChildAgeGroup] = useState<'PETIT' | 'GRAND'>('PETIT');
  const [siblingId, setSiblingId] = useState('');
  
  // Nouveaux champs pour les demi-journées d'accueil
  const [defaultPresences, setDefaultPresences] = useState<{dayOfWeek: string, halfDay: string}[]>(
    DAYS.flatMap(day => HALF_DAYS.map(halfDay => ({ dayOfWeek: day, halfDay })))
  );
  
  // Nouveaux champs d'emails pour la famille
  const [parent1Email, setParent1Email] = useState('');
  const [parent2Email, setParent2Email] = useState('');


  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  
  // Absence Modal State
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [absenceChildId, setAbsenceChildId] = useState<string | null>(null);
  const [absenceDate, setAbsenceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [absenceIsConge, setAbsenceIsConge] = useState<boolean>(false);

  // Reintegrate Modal State

  const { data: children = [], isLoading: loading } = useQuery({
    queryKey: ['children'],
    queryFn: async () => {
      const response = await apiClient.get('/children');
      return response.data.sort((a: Child, b: Child) => a.firstName.localeCompare(b.firstName));
    }
  });



  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingChildId) {
        return apiClient.put(`/children/${editingChildId}`, payload);
      } else {
        return apiClient.post('/children', payload);
      }
    },
    onSuccess: () => {
      showToast(editingChildId ? 'Enfant modifié avec succès.' : 'Enfant ajouté avec succès.', 'success');
      handleCancelEdit();
      queryClient.invalidateQueries({ queryKey: ['children'] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Erreur lors de la sauvegarde', 'error');
    }
  });

  const togglePresence = (dayOfWeek: string, halfDay: string) => {
    setDefaultPresences(prev => {
      const exists = prev.some(p => p.dayOfWeek === dayOfWeek && p.halfDay === halfDay);
      if (exists) {
        return prev.filter(p => !(p.dayOfWeek === dayOfWeek && p.halfDay === halfDay));
      } else {
        return [...prev, { dayOfWeek, halfDay }];
      }
    });
  };

  const handleEditClick = (child: Child) => {
    setEditingChildId(child.id);
    setFirstName(child.firstName);
    
    // Parse the parenthesis format "(khalil & saloua)" back to parent names if possible
    let p1 = child.parent?.firstName || '';
    let p2 = child.parent?.lastName || '';
    
    setParent1Name(p1);
    setParent2Name(p2);
    
    setNewChildAgeGroup(child.ageGroup ?? 'PETIT');
    setSiblingId(''); // Pas possible de changer la fratrie en édition facilement, on la vide
    setParent1Email(child.parent?.email || '');
    setParent2Email(child.parent?.secondEmail || '');
    if (child.defaultPresences) {
      setDefaultPresences(child.defaultPresences);
    } else {
      setDefaultPresences([]);
    }
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingChildId(null);
    setFirstName('');
    setParent1Name('');
    setParent2Name('');
    setNewChildAgeGroup('GRAND');
    setSiblingId('');
    setParent1Email('');
    setParent2Email('');
    setDefaultPresences(DAYS.flatMap(day => HALF_DAYS.map(halfDay => ({ dayOfWeek: day, halfDay }))));
  };

  // La suppression stricte est désactivée de l'UI pour éviter les erreurs, on utilise l'absence.

  const handleStartAbsence = (id: string) => {
    setAbsenceChildId(id);
    setAbsenceDate(new Date().toISOString().split('T')[0]);
    setAbsenceIsConge(false);
    setAbsenceModalOpen(true);
  };

  const submitAbsence = () => {
    if (!absenceChildId) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(absenceDate)) {
       showToast("Format de date invalide. Utilisez AAAA-MM-JJ.", "error");
       return;
    }
    apiClient.post(`/children/${absenceChildId}/absence/start`, { startDate: absenceDate, isConge: absenceIsConge })
      .then(() => {
        showToast(absenceIsConge ? "Congé enregistré avec succès." : "Absence enregistrée avec succès.", "success");
        queryClient.invalidateQueries({ queryKey: ['children'] });
        setAbsenceModalOpen(false);
      })
      .catch(err => showToast(err.response?.data?.error || "Erreur", "error"));
  };

  const handleEndAbsence = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const dateStr = window.prompt("Date de retour (AAAA-MM-JJ) :", today);
    if (dateStr === null) return; 
    
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(dateStr)) {
       showToast("Format de date invalide. Utilisez AAAA-MM-JJ.", "error");
       return;
    }
    apiClient.post(`/children/${id}/absence/end`, { endDate: dateStr })
      .then(() => {
        showToast("Enfant réintégré. Les scores ont été recalculés.", "success");
        queryClient.invalidateQueries({ queryKey: ['children'] });
      })
      .catch(err => showToast(err.response?.data?.error || "Erreur", "error"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedLastName = parent2Name ? `(${parent1Name} & ${parent2Name})` : `(${parent1Name})`;

    let payload: any = {
      firstName,
      lastName: formattedLastName,
      parent1FirstName: parent1Name,
      parent2FirstName: parent2Name,
      ageGroup: newChildAgeGroup,
      defaultPresences,
      parent1Email,
      parent2Email
    };

    if (!editingChildId && siblingId) {
      payload.siblingId = siblingId;
      delete payload.parent1Email;
      delete payload.parent2Email;
    }

    saveMutation.mutate(payload);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ padding: '4rem' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Gestion des Enfants</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Ajoutez de nouveaux enfants et rattachez-les à leurs parents.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> {editingChildId ? 'Modifier un enfant' : 'Ajouter un enfant'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Prénom de l'enfant <span style={{ color: 'var(--color-secondary)' }}>*</span></label>
              <input 
                type="text" 
                className="form-input" 
                value={firstName} 
                onChange={e => setFirstName(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prénom du parent 1 <span style={{ color: 'var(--color-secondary)' }}>*</span></label>
              <input 
                type="text" 
                className="form-input" 
                value={parent1Name} 
                onChange={e => setParent1Name(e.target.value)} 
                required 
                placeholder="Ex: Parent 1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prénom du parent 2 <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 'normal' }}>(Optionnel)</span></label>
              <input 
                type="text" 
                className="form-input" 
                value={parent2Name} 
                onChange={e => setParent2Name(e.target.value)} 
                placeholder="Ex: Parent 2"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Section (Groupe d'âge)</label>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="ageGroup" 
                    value="PETIT" 
                    checked={newChildAgeGroup === 'PETIT'} 
                    onChange={() => setNewChildAgeGroup('PETIT')} 
                  />
                  Petits
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="ageGroup" 
                    value="GRAND" 
                    checked={newChildAgeGroup === 'GRAND'} 
                    onChange={() => setNewChildAgeGroup('GRAND')} 
                  />
                  Grands
                </label>
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: editingChildId ? 'none' : 'block' }}>
                <label className="form-label" htmlFor="sibling">Fratrie (Optionnel)</label>
                <div>
                  <label className="form-label" style={{ fontWeight: 'normal', fontSize: '0.85rem' }}>C'est le frère/sœur de...</label>
                  <select className="form-input" value={siblingId} onChange={e => setSiblingId(e.target.value)}>
                    <option value="">-- Nouvelle famille --</option>
                    {children.filter((c: Child) => c.id !== editingChildId).map((c: Child) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    Optionnel. Permet de lier cet enfant à un parent existant.
                  </p>
                </div>
              </div>
              
              {!siblingId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', backgroundColor: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginTop: '1rem' }}>
                  <div style={{ marginBottom: '-0.5rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{editingChildId ? 'Informations de contact du parent' : 'Création du compte parent'}</strong>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Email du Parent 1 <span style={{ color: 'var(--color-secondary)' }}>*</span></label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={parent1Email} 
                      onChange={e => setParent1Email(e.target.value)} 
                      placeholder="parent1@email.com"
                      required={!siblingId}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Email du Parent 2 <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 'normal' }}>(Optionnel)</span></label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={parent2Email} 
                      onChange={e => setParent2Email(e.target.value)} 
                      placeholder="parent2@email.com"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Jours d'accueil à la crèche</label>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '1rem' }}>
                Cochez les demi-journées où l'enfant est présent à la crèche.
              </span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Jour</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Matin</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>Après-midi</div>
                
                {DAYS.map(day => (
                  <React.Fragment key={day}>
                    <div style={{ fontSize: '0.95rem' }}>{DAY_LABELS[day]}</div>
                    {HALF_DAYS.map(halfDay => {
                      const isChecked = defaultPresences.some(p => p.dayOfWeek === day && p.halfDay === halfDay);
                      return (
                        <div key={`${day}-${halfDay}`} style={{ display: 'flex', justifyContent: 'center' }}>
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePresence(day, halfDay)}
                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                          />
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 size={18} className="spin" /> : (editingChildId ? 'Sauvegarder' : 'Ajouter')}
              </button>
              {editingChildId && (
                <button type="button" className="btn btn-outline" onClick={handleCancelEdit} disabled={saveMutation.isPending}>
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Baby size={20} /> Enfants inscrits ({children.length})
          </h3>
          {children.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
              Aucun enfant inscrit pour le moment.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {children.map((child: Child) => (
                <li key={child.id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1rem', border: '1px solid var(--color-glass-border)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                      {child.firstName} {child.lastName}
                      {!child.isActive && (
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
                      onClick={() => handleEditClick(child)}
                    >
                      Modifier
                    </button>
                    {child.isActive && (
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', color: 'var(--color-secondary)', borderColor: 'var(--color-secondary)' }}
                        onClick={() => handleStartAbsence(child.id)}
                      >
                        Marquer Absent
                      </button>
                    )}
                    {!child.isActive && (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', backgroundColor: '#10b981', borderColor: '#10b981' }}
                        onClick={() => handleEndAbsence(child.id)}
                      >
                        Réintégrer
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      {/* MODAL ABSENCE / CONGÉ */}
      {absenceModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-card animate-fade-in" style={{
            padding: '2rem', 
            width: '90%', maxWidth: '550px',
            backgroundColor: 'var(--color-white)', // Assure opaque background inside glass-card for readability
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--color-glass-border)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.4rem', color: 'var(--color-text-primary)' }}>Déclarer une absence</h3>
            
            <div className="form-group">
              <label className="form-label">Date de départ :</label>
              <input 
                type="date" 
                className="form-input" 
                value={absenceDate} 
                onChange={e => setAbsenceDate(e.target.value)} 
              />
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">Type de départ :</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', padding: '1rem', border: absenceIsConge ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: absenceIsConge ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}>
                  <input 
                    type="radio" 
                    name="absenceType" 
                    checked={absenceIsConge} 
                    onChange={() => setAbsenceIsConge(true)} 
                    style={{ marginTop: '0.25rem' }}
                  />
                  <div>
                    <strong style={{ display: 'block', color: 'var(--color-primary)' }}>Congé (Validé RH)</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>L'enfant est hors effectif. La famille ne paie pas de dette de permanence pour cette période.</span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', padding: '1rem', border: !absenceIsConge ? '2px solid var(--color-secondary)' : '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: !absenceIsConge ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                  <input 
                    type="radio" 
                    name="absenceType" 
                    checked={!absenceIsConge} 
                    onChange={() => setAbsenceIsConge(false)} 
                    style={{ marginTop: '0.25rem' }}
                  />
                  <div>
                    <strong style={{ display: 'block', color: 'var(--color-secondary)' }}>Absence Classique</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>La place est conservée. La famille continue d'accumuler sa dette de permanence normale.</span>
                  </div>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem' }}>
              <button className="btn btn-outline" onClick={() => setAbsenceModalOpen(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={submitAbsence}>Valider la déclaration</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
