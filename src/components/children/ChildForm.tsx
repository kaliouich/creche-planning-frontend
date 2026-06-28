import React, { useState, useEffect } from 'react';
import { Loader2, Plus } from 'lucide-react';
import type { Child } from '../../types';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_LABELS: Record<string, string> = { MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mer', THURSDAY: 'Jeu', FRIDAY: 'Ven' };
const HALF_DAYS = ['MORNING', 'AFTERNOON'];

interface ChildFormProps {
  editingChild: Child | null;
  childrenList: Child[];
  onCancelEdit: () => void;
  onSubmit: (payload: any) => void;
  isPending: boolean;
}

export function ChildForm({ editingChild, childrenList, onCancelEdit, onSubmit, isPending }: ChildFormProps) {
  const [firstName, setFirstName] = useState('');
  const [parent1Name, setParent1Name] = useState('');
  const [parent2Name, setParent2Name] = useState('');
  const [newChildAgeGroup, setNewChildAgeGroup] = useState<'PETIT' | 'GRAND'>('PETIT');
  const [siblingId, setSiblingId] = useState('');
  const [parent1Email, setParent1Email] = useState('');
  const [parent2Email, setParent2Email] = useState('');
  const [defaultPresences, setDefaultPresences] = useState<{dayOfWeek: string, halfDay: string}[]>(
    DAYS.flatMap(day => HALF_DAYS.map(halfDay => ({ dayOfWeek: day, halfDay })))
  );

  useEffect(() => {
    if (editingChild) {
      setFirstName(editingChild.firstName);
      setParent1Name(editingChild.parent?.firstName || '');
      setParent2Name(editingChild.parent?.lastName || '');
      setNewChildAgeGroup(editingChild.ageGroup ?? 'PETIT');
      setSiblingId(''); // Pas possible de changer la fratrie en édition facilement
      setParent1Email(editingChild.parent?.email || '');
      setParent2Email(editingChild.parent?.secondEmail || '');
      setDefaultPresences(editingChild.defaultPresences || []);
    } else {
      setFirstName('');
      setParent1Name('');
      setParent2Name('');
      setNewChildAgeGroup('GRAND');
      setSiblingId('');
      setParent1Email('');
      setParent2Email('');
      setDefaultPresences(DAYS.flatMap(day => HALF_DAYS.map(halfDay => ({ dayOfWeek: day, halfDay }))));
    }
  }, [editingChild]);

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
      parent2Email,
      appUrl: window.location.origin + '/planning'
    };

    if (!editingChild && siblingId) {
      payload.siblingId = siblingId;
      delete payload.parent1Email;
      delete payload.parent2Email;
    }

    onSubmit(payload);
  };

  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Plus size={20} /> {editingChild ? 'Modifier un enfant' : 'Ajouter un enfant'}
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
          <div style={{ display: editingChild ? 'none' : 'block' }}>
            <label className="form-label" htmlFor="sibling">Fratrie (Optionnel)</label>
            <div>
              <label className="form-label" style={{ fontWeight: 'normal', fontSize: '0.85rem' }}>C'est le frère/sœur de...</label>
              <select className="form-input" value={siblingId} onChange={e => setSiblingId(e.target.value)}>
                <option value="">-- Nouvelle famille --</option>
                {childrenList.filter((c: Child) => c.id !== editingChild?.id).map((c: Child) => (
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
                <strong style={{ fontSize: '0.9rem' }}>{editingChild ? 'Informations de contact du parent' : 'Création du compte parent'}</strong>
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
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isPending}>
            {isPending ? <Loader2 size={18} className="spin" /> : (editingChild ? 'Sauvegarder' : 'Ajouter')}
          </button>
          {editingChild && (
            <button type="button" className="btn btn-outline" onClick={onCancelEdit} disabled={isPending}>
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
