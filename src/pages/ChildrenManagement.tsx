import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Plus, Baby, Loader2, ArrowLeft } from 'lucide-react';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  ageGroup: 'PETIT' | 'GRAND';
  defaultPresences?: { dayOfWeek: string; halfDay: string }[];
  parent?: {
    id: string;
    email: string;
    secondEmail?: string | null;
    firstName?: string;
    lastName?: string;
  };
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_LABELS: Record<string, string> = { MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mer', THURSDAY: 'Jeu', FRIDAY: 'Ven' };
const HALF_DAYS = ['MORNING', 'AFTERNOON'];

export default function ChildrenManagement() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [parent1Name, setParent1Name] = useState('');
  const [parent2Name, setParent2Name] = useState('');
  const [ageGroup, setAgeGroup] = useState<'PETIT' | 'GRAND'>('GRAND');
  const [siblingId, setSiblingId] = useState('');
  
  // Nouveaux champs pour les demi-journées d'accueil
  const [defaultPresences, setDefaultPresences] = useState<{dayOfWeek: string, halfDay: string}[]>(
    DAYS.flatMap(day => HALF_DAYS.map(halfDay => ({ dayOfWeek: day, halfDay })))
  );
  
  // Nouveaux champs d'emails pour la famille
  const [parent1Email, setParent1Email] = useState('');
  const [parent2Email, setParent2Email] = useState('');

  const [creating, setCreating] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get('/children');
        setChildren(response.data.sort((a: Child, b: Child) => a.firstName.localeCompare(b.firstName)));
      } catch (err) {
        console.error("Erreur de chargement", err);
        setError("Impossible de charger les données");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
    
    setAgeGroup(child.ageGroup);
    setSiblingId(''); // Pas possible de changer la fratrie en édition facilement, on la vide
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
    setAgeGroup('GRAND');
    setSiblingId('');
    setParent1Email('');
    setParent2Email('');
    setDefaultPresences(DAYS.flatMap(day => HALF_DAYS.map(halfDay => ({ dayOfWeek: day, halfDay }))));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const formattedLastName = parent2Name ? `(${parent1Name} & ${parent2Name})` : `(${parent1Name})`;

      if (editingChildId) {
        const response = await apiClient.put(`/children/${editingChildId}`, {
          firstName,
          lastName: formattedLastName,
          parent1FirstName: parent1Name,
          parent2FirstName: parent2Name,
          ageGroup,
          defaultPresences
        });
        setChildren(prev => prev.map(c => c.id === editingChildId ? response.data : c).sort((a, b) => a.firstName.localeCompare(b.firstName)));
        handleCancelEdit();
      } else {
        let payload: any = { 
          firstName, 
          lastName: formattedLastName,
          parent1FirstName: parent1Name,
          parent2FirstName: parent2Name,
          ageGroup,
          defaultPresences 
        };

        if (siblingId) {
          payload.siblingId = siblingId;
        } else {
          payload.parent1Email = parent1Email;
          payload.parent2Email = parent2Email;
        }

        const response = await apiClient.post('/children', payload);
        setChildren(prev => [...prev, response.data].sort((a, b) => a.firstName.localeCompare(b.firstName)));
        handleCancelEdit();
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Erreur lors de la sauvegarde');
      } else {
        setError('Erreur réseau');
      }
    } finally {
      setCreating(false);
    }
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
      <button className="btn btn-outline" style={{ marginBottom: '2rem' }} onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Retour au tableau de bord
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <h1>Gestion des Enfants</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Ajoutez de nouveaux enfants et rattachez-les à leurs parents.</p>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: 'rgba(244, 63, 94, 0.1)', 
          color: 'var(--color-secondary)', 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          fontWeight: 500
        }}>
          {error}
        </div>
      )}

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
                placeholder="Ex: Maman"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prénom du parent 2 <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 'normal' }}>(Optionnel)</span></label>
              <input 
                type="text" 
                className="form-input" 
                value={parent2Name} 
                onChange={e => setParent2Name(e.target.value)} 
                placeholder="Ex: Papa"
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
                    checked={ageGroup === 'PETIT'} 
                    onChange={() => setAgeGroup('PETIT')} 
                  />
                  Petits
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="ageGroup" 
                    value="GRAND" 
                    checked={ageGroup === 'GRAND'} 
                    onChange={() => setAgeGroup('GRAND')} 
                  />
                  Grands
                </label>
              </div>
            </div>

            <div className="form-group" style={{ display: editingChildId ? 'none' : 'block' }}>
              <label className="form-label" htmlFor="sibling">Fratrie (Optionnel)</label>
              <div>
                <label className="form-label" style={{ fontWeight: 'normal', fontSize: '0.85rem' }}>C'est le frère/sœur de...</label>
                <select className="form-input" value={siblingId} onChange={e => setSiblingId(e.target.value)}>
                  <option value="">-- Nouvelle famille --</option>
                  {children.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  Optionnel. Permet de lier cet enfant à un parent existant.
                </p>
              </div>
              
              {!siblingId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', backgroundColor: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginTop: '1rem' }}>
                  <div style={{ marginBottom: '-0.5rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Création du compte parent</strong>
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
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={creating}>
                {creating ? <Loader2 size={18} className="spin" /> : (editingChildId ? 'Sauvegarder' : 'Ajouter')}
              </button>
              {editingChildId && (
                <button type="button" className="btn btn-outline" onClick={handleCancelEdit} disabled={creating}>
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
              {children.map(child => (
                <li key={child.id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1rem', border: '1px solid var(--color-glass-border)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem' }}>{child.firstName} {child.lastName}</strong>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'block' }}>
                      Section : {child.ageGroup === 'PETIT' ? 'Petits' : 'Grands'}
                    </span>
                    <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem', display: 'inline-block', marginTop: '0.25rem', backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>
                      {child.defaultPresences?.length || 0} demi-journées
                    </span>
                  </div>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                    onClick={() => handleEditClick(child)}
                  >
                    Modifier
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
