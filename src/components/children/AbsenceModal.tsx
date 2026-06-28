import { useState, useEffect } from 'react';
import { Plus, History, Loader2, Pencil, Trash2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

interface AbsenceModalProps {
  childId: string | null;
  onClose: () => void;
}

export function AbsenceModal({ childId, onClose }: AbsenceModalProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  const [absenceModalTab, setAbsenceModalTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [editingAbsenceId, setEditingAbsenceId] = useState<string | null>(null);
  const [absenceDate, setAbsenceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [startHalfDay, setStartHalfDay] = useState<'ALL' | 'MORNING' | 'AFTERNOON'>('ALL');
  const [absenceEndDate, setAbsenceEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [endHalfDay, setEndHalfDay] = useState<'ALL' | 'MORNING' | 'AFTERNOON'>('ALL');
  const [absenceIsConge, setAbsenceIsConge] = useState<boolean>(false);

  const [absencesHistory, setAbsencesHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (childId) {
      loadAbsencesHistory(childId);
    }
  }, [childId]);

  const loadAbsencesHistory = async (id: string) => {
    setLoadingHistory(true);
    try {
      const res = await apiClient.get(`/children/${id}/absences`);
      setAbsencesHistory(res.data);
    } catch (err) {
      showToast("Erreur lors du chargement de l'historique", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  const calculateAbsenceDuration = (abs: any) => {
    if (!abs.endDate) return 'Durée indéterminée';
    const start = new Date(abs.startDate);
    const end = new Date(abs.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        if (abs.startHalfDay === 'ALL') return '1 jour';
        return '0.5 jour';
    } else if (diffDays > 0) {
        let days = diffDays - 1;
        
        if (abs.startHalfDay === 'ALL' || abs.startHalfDay === 'MORNING') days += 1;
        else if (abs.startHalfDay === 'AFTERNOON') days += 0.5;
        
        if (abs.endHalfDay === 'ALL' || abs.endHalfDay === 'AFTERNOON') days += 1;
        else if (abs.endHalfDay === 'MORNING') days += 0.5;
        
        return `${days} jour${days > 1 ? 's' : ''}`;
    }
    return '';
  };

  const handleEditAbsence = (absence: any) => {
    setEditingAbsenceId(absence.id);
    setAbsenceDate(absence.startDate);
    setStartHalfDay(absence.startHalfDay);
    setAbsenceEndDate(absence.endDate || absence.startDate);
    setEndHalfDay(absence.endHalfDay);
    setAbsenceIsConge(absence.isConge);
    setAbsenceModalTab('NEW');
  };

  const handleDeleteAbsence = async (absenceId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette absence ?')) {
      try {
        await apiClient.delete(`/children/${childId}/absences/${absenceId}`);
        showToast("Absence supprimée avec succès", "success");
        loadAbsencesHistory(childId!);
        queryClient.invalidateQueries({ queryKey: ['children'] });
      } catch (err: any) {
        showToast(err.response?.data?.error || "Erreur lors de la suppression", "error");
      }
    }
  };

  const submitAbsence = () => {
    if (!childId) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(absenceDate)) {
       showToast("Format de date de départ invalide. Utilisez AAAA-MM-JJ.", "error");
       return;
    }
    
    let finalEndDate = absenceEndDate;
    if (!finalEndDate) finalEndDate = absenceDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(finalEndDate)) {
       showToast("Format de date de fin invalide. Utilisez AAAA-MM-JJ.", "error");
       return;
    }

    if (finalEndDate < absenceDate) {
       showToast("La date de retour ne peut pas être avant la date de départ.", "error");
       return;
    }

    let payloadStartHalfDay = startHalfDay;
    let payloadEndHalfDay = endHalfDay;

    if (absenceDate === finalEndDate) {
      payloadStartHalfDay = startHalfDay;
      payloadEndHalfDay = startHalfDay;
    }

    const payload = {
      startDate: absenceDate, 
      startHalfDay: payloadStartHalfDay,
      endDate: finalEndDate,
      endHalfDay: payloadEndHalfDay,
      isConge: absenceIsConge
    };

    const request = editingAbsenceId 
      ? apiClient.put(`/children/${childId}/absences/${editingAbsenceId}`, payload)
      : apiClient.post(`/children/${childId}/absences`, payload);

    request
      .then(() => {
        showToast(absenceIsConge ? "Congé enregistré avec succès." : "Absence enregistrée avec succès.", "success");
        queryClient.invalidateQueries({ queryKey: ['children'] });
        setEditingAbsenceId(null);
        setAbsenceModalTab('HISTORY');
        loadAbsencesHistory(childId);
      })
      .catch((err: any) => showToast(err.response?.data?.error || "Erreur", "error"));
  };

  if (!childId) return null;

  return (
    <div className="animate-fade-in" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="glass-card animate-slide-up modal-content" style={{
        padding: '2rem', 
        width: '90%', maxWidth: '550px',
        backgroundColor: 'var(--color-white)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--color-glass-border)'
      }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-glass-border)', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setAbsenceModalTab('NEW')}
            style={{
              flex: 1, padding: '1rem', background: 'none', border: 'none', 
              borderBottom: absenceModalTab === 'NEW' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: absenceModalTab === 'NEW' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: absenceModalTab === 'NEW' ? 600 : 400,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <Plus size={18} /> {editingAbsenceId ? 'Modifier la demande' : 'Saisir une demande'}
          </button>
          <button 
            onClick={() => setAbsenceModalTab('HISTORY')}
            style={{
              flex: 1, padding: '1rem', background: 'none', border: 'none', 
              borderBottom: absenceModalTab === 'HISTORY' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: absenceModalTab === 'HISTORY' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: absenceModalTab === 'HISTORY' ? 600 : 400,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <History size={18} /> Historique des demandes
          </button>
        </div>
        
        {absenceModalTab === 'NEW' ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Date de départ :</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={absenceDate} 
                    onChange={e => {
                      setAbsenceDate(e.target.value);
                      if (absenceEndDate < e.target.value) setAbsenceEndDate(e.target.value);
                    }} 
                    style={{ flex: '1 1 200px' }}
                  />
                  <select 
                    className="form-input" 
                    value={startHalfDay} 
                    onChange={e => setStartHalfDay(e.target.value as any)}
                    style={{ flex: '1 1 150px' }}
                  >
                    <option value="ALL">Toute la journée</option>
                    <option value="MORNING">Matin</option>
                    <option value="AFTERNOON">Après-midi</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Date de retour :</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={absenceEndDate} 
                    onChange={e => setAbsenceEndDate(e.target.value)} 
                    style={{ flex: '1 1 200px' }}
                  />
                  <select 
                    className="form-input" 
                    value={absenceDate === absenceEndDate ? startHalfDay : endHalfDay} 
                    onChange={e => setEndHalfDay(e.target.value as any)}
                    style={{ flex: '1 1 150px', opacity: absenceDate === absenceEndDate ? 0.6 : 1 }}
                    disabled={absenceDate === absenceEndDate}
                  >
                    <option value="ALL">Toute la journée</option>
                    <option value="MORNING">Matin</option>
                    <option value="AFTERNOON">Après-midi</option>
                  </select>
                </div>
              </div>
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
              <button className="btn btn-outline" onClick={onClose}>Annuler</button>
              <button className="btn btn-primary" onClick={submitAbsence}>{editingAbsenceId ? 'Mettre à jour' : 'Valider la déclaration'}</button>
            </div>
          </>
        ) : (
          <>
            {loadingHistory ? (
              <div className="flex-center" style={{ padding: '2rem' }}>
                <Loader2 size={24} className="spin" style={{ color: 'var(--color-primary)' }} />
              </div>
            ) : absencesHistory.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                Aucun historique d'absence pour cet enfant.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                {absencesHistory.map((abs: any) => (
                  <li key={abs.id} style={{ 
                    padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'var(--color-bg-secondary)'
                  }}>
                    <div>
                      <strong style={{ display: 'block', color: abs.isConge ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
                        {abs.isConge ? 'Congé' : 'Absence'} 
                        <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--color-text-secondary)', marginLeft: '0.5rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '0.5rem' }}>
                          {calculateAbsenceDuration(abs)}
                        </span>
                      </strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                        Du {new Date(abs.startDate).toLocaleDateString('fr-FR')} ({abs.startHalfDay === 'ALL' ? 'Toute la journée' : (abs.startHalfDay === 'MORNING' ? 'Matin' : 'Après-midi')})<br/>
                        Au {abs.endDate ? new Date(abs.endDate).toLocaleDateString('fr-FR') : 'Non défini'} ({abs.endHalfDay === 'ALL' ? 'Toute la journée' : (abs.endHalfDay === 'MORNING' ? 'Matin' : 'Après-midi')})
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        title="Modifier"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                        onClick={() => handleEditAbsence(abs)}
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        title="Supprimer"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }}
                        onClick={() => handleDeleteAbsence(abs.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem' }}>
              <button className="btn btn-outline" onClick={onClose}>Fermer</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
