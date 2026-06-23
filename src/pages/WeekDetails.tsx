import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { getWeekDateRange } from '../utils/date';
import { SlotGrid } from '../components/planning/SlotGrid';
import { AvailabilityTable } from '../components/planning/AvailabilityTable';
import { useToast } from '../contexts/ToastContext';
import type { Week, Child, Slot } from '../types';

export default function WeekDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  const [week, setWeek] = useState<Week | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [generationMessage, setGenerationMessage] = useState<{text: string, type: 'success' | 'warning'} | null>(null);

  useEffect(() => {
    if (location.state && location.state.generationResult) {
      const res = location.state.generationResult;
      const hasUnfilled = res.unfilledSlots && res.unfilledSlots.length > 0;
      
      setGenerationMessage({
        text: hasUnfilled ? "Généré avec des besoins (certaines permanences ne sont pas remplies)" : "Généré avec succès (toutes les demandes sont remplies)",
        type: hasUnfilled ? 'warning' : 'success'
      });

      // Clean up state so refresh doesn't show it again
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
        slots: prev.slots?.map(s => s.id === slot.id ? updatedSlot : s)
      } : null);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Erreur lors de la mise à jour');
      }
    }
  };

  const handleNotifyParent = async (parentId?: string, parentName?: string) => {
    if (!parentId) return;
    try {
      await apiClient.post(`/users/${parentId}/notify`);
      showToast(`${parentName} a été notifié.`, 'success');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Erreur lors de l\'envoi du rappel');
        setTimeout(() => setError(''), 5000);
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
            <ArrowLeft size={20} /> {isEditable ? "Retour & Validation" : "Retour"}
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

        <h1 className="only-print" style={{ margin: '0 0 1rem 0', fontSize: '2rem', textAlign: 'center', color: 'var(--color-primary)' }}>
          Planning Semaine {week.weekNumber} - Permanences des parents
          <div style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', fontWeight: 'normal', marginTop: '0.2rem' }}>
            ({getWeekDateRange(week.weekNumber, week.year)})
          </div>
        </h1>

      {generationMessage && (
        <div style={{ 
          backgroundColor: generationMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(234, 179, 8, 0.1)', 
          color: generationMessage.type === 'success' ? 'var(--color-success)' : '#eab308', 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1.5rem',
          fontWeight: 600,
          border: `1px solid ${generationMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`
        }}>
          {generationMessage.text}
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-card">
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Créneaux de permanence
        </h3>
        
        {!isEditable && (
          <p className="no-print" style={{ color: 'var(--color-warning)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            La semaine est en mode lecture seule. Les créneaux ne peuvent plus être modifiés.
          </p>
        )}

        <SlotGrid 
          week={week} 
          children={children} 
          isEditable={isEditable} 
          onToggleSlotType={handleToggleSlotType} 
        />
      </div>
      
      <AvailabilityTable 
        week={week} 
        children={children} 
        onNotifyParent={handleNotifyParent} 
      />
    </div>
  );
}
