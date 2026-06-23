import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Plus, ArrowRight, Users, Baby, TrendingUp, Loader2, Trash2, Settings, ClipboardList } from 'lucide-react';
import { getWeekDateRange } from '../utils/date';
import type { Week } from '../types';

const STATUS_LABELS: Record<string, string> = {
  PREPARATION: 'En Préparation',
  OPEN_TO_PARENTS: 'Ouvert aux Parents',
  PUBLISHED: 'Publié',
};

const STATUS_BADGE: Record<string, string> = {
  PREPARATION: 'badge-warning',
  OPEN_TO_PARENTS: 'badge-success',
  PUBLISHED: 'badge-success',
};

const NEXT_STATUS: Record<string, string> = {
  PREPARATION: 'OPEN_TO_PARENTS',
  OPEN_TO_PARENTS: 'PUBLISHED',
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  PREPARATION: 'Ouvrir aux Parents',
  OPEN_TO_PARENTS: 'Publier',
};

export default function AdminDashboard() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedWeekToCreate, setSelectedWeekToCreate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ONGOING' | 'PUBLISHED'>('ONGOING');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const userMeta = JSON.parse(localStorage.getItem('userMeta') || '{}');
  const isPro = userMeta.role === 'PROFESSIONAL';

  const upcomingWeeks = useMemo(() => {
    const weeksList = [];
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDays = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    const currentWeekNumber = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
    const year = now.getFullYear();

    for (let i = 0; i < 13; i++) {
      let weekNum = currentWeekNumber + i;
      let wYear = year;
      if (weekNum > 52) {
        weekNum -= 52;
        wYear += 1;
      }
      weeksList.push({ weekNumber: weekNum, year: wYear });
    }
    return weeksList;
  }, []);

  useEffect(() => {
    if (upcomingWeeks.length > 0 && !selectedWeekToCreate) {
      setSelectedWeekToCreate(`${upcomingWeeks[0].year}-${upcomingWeeks[0].weekNumber}`);
    }
  }, [upcomingWeeks, selectedWeekToCreate]);

  const fetchWeeks = useCallback(async () => {
    try {
      const response = await apiClient.get('/weeks');
      setWeeks(response.data);
    } catch (err: unknown) {
      console.error("Erreur récupération semaines:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeeks();
  }, [fetchWeeks]);

  const handleCreateWeek = async () => {
    if (!selectedWeekToCreate) return;
    setCreating(true);
    setError('');
    
    const [yearStr, weekStr] = selectedWeekToCreate.split('-');
    const weekNumber = parseInt(weekStr, 10);
    const year = parseInt(yearStr, 10);
    
    try {
      const response = await apiClient.post('/weeks', {
        weekNumber,
        year,
      });
      setWeeks(prev => [response.data, ...prev]);
      setActiveTab('ONGOING');
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Erreur lors de la création');
      } else {
        setError('Erreur réseau');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleAdvanceStatus = async (week: Week) => {
    const nextStatus = NEXT_STATUS[week.status];
    if (!nextStatus) return;

    // Pas besoin d'intercepter la transition vers CALCULATION puisqu'elle a été supprimée


    try {
      const response = await apiClient.patch(`/weeks/${week.id}/status`, { status: nextStatus });
      setWeeks(prev => prev.map(w => w.id === week.id ? { ...w, status: response.data.status } : w));
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Erreur lors de la transition');
      }
    }
  };

  const handleGenerate = async (weekId: string) => {
    setGenerating(weekId);
    setError('');
    try {
      const response = await apiClient.post(`/planning/generate/${weekId}`);
      navigate(`/admin/weeks/${weekId}`, { state: { generationResult: response.data } });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Erreur lors de la génération');
      }
    } finally {
      setGenerating(null);
    }
  };

  const handleDelete = async (weekId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette semaine et tout son planning ?")) return;
    
    try {
      await apiClient.delete(`/weeks/${weekId}`);
      setWeeks(prev => prev.filter(w => w.id !== weekId));
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Erreur lors de la suppression');
      }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Espace Coordinateur</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {!isPro && (
            <button 
              className="btn btn-outline" 
              onClick={() => navigate('/admin/gestion-perms')}
            >
              <ClipboardList size={20} />
              Gestion Perms
            </button>
          )}
          <button 
            className="btn btn-outline" 
            onClick={() => navigate('/admin/children')}
          >
            <Baby size={20} />
            Gérer les enfants
          </button>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
            <select
              value={selectedWeekToCreate}
              onChange={(e) => setSelectedWeekToCreate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-glass-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
            >
              {upcomingWeeks.map((w: { year: number, weekNumber: number }) => (
                <option key={`${w.year}-${w.weekNumber}`} value={`${w.year}-${w.weekNumber}`}>
                  Semaine {w.weekNumber} ({getWeekDateRange(w.weekNumber, w.year)})
                </option>
              ))}
            </select>
            <button 
              id="create-week-btn"
              className="btn btn-primary" 
              onClick={handleCreateWeek}
              disabled={creating}
            >
              {creating ? <Loader2 size={20} className="spin" /> : <Plus size={20} />}
              {creating ? 'Création...' : 'Créer'}
            </button>
          </div>
        </div>
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

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '1rem' }}>
        <button 
          className={`btn ${activeTab === 'ONGOING' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('ONGOING')}
          style={{ padding: '0.5rem 1.5rem' }}
        >
          Semaines en cours
        </button>
        <button 
          className={`btn ${activeTab === 'PUBLISHED' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('PUBLISHED')}
          style={{ padding: '0.5rem 1.5rem' }}
        >
          Semaines publiées
        </button>
      </div>

      {weeks.filter(w => activeTab === 'ONGOING' ? w.status !== 'PUBLISHED' : w.status === 'PUBLISHED').length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Baby size={64} style={{ color: 'var(--color-text-secondary)', opacity: 0.4, margin: '0 auto 1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Aucune semaine créée</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {activeTab === 'ONGOING' ? 'Cliquez sur "Créer" pour démarrer la planification d\'une nouvelle semaine.' : 'Aucune semaine n\'a encore été publiée.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {weeks.filter(w => activeTab === 'ONGOING' ? w.status !== 'PUBLISHED' : w.status === 'PUBLISHED').map(week => (
            <div key={week.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Semaine {week.weekNumber} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>({getWeekDateRange(week.weekNumber, week.year)})</span></h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge ${STATUS_BADGE[week.status] || 'badge-warning'}`}>
                      {STATUS_LABELS[week.status] || week.status}
                    </span>
                    {(week.status === 'OPEN_TO_PARENTS' && week.needsRecalculation) && (
                      <span className="badge badge-error" style={{ backgroundColor: 'var(--color-secondary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        ⚠️ À recalculer
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.4rem', color: 'var(--color-secondary)', borderColor: 'var(--color-secondary)' }}
                  onClick={() => handleDelete(week.id)}
                  title="Supprimer la semaine"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <button 
                className="btn btn-outline" 
                style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}
                onClick={() => navigate(`/admin/weeks/${week.id}`)}
              >
                <Settings size={18} />
                {week.status === 'PREPARATION' 
                  ? 'Configurer les créneaux' 
                  : week.status === 'OPEN_TO_PARENTS'
                    ? 'Consulter le remplissage'
                    : 'Voir le planning'}
              </button>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {(!isPro || week.status === 'PREPARATION') && NEXT_STATUS[week.status] && (
                  <button 
                    id={`advance-${week.id}`}
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                    onClick={() => handleAdvanceStatus(week)}
                    disabled={week.status === 'OPEN_TO_PARENTS' && !week.hasAssignments}
                    title={week.status === 'OPEN_TO_PARENTS' && !week.hasAssignments ? "Générez d'abord le planning" : undefined}
                  >
                    <ArrowRight size={18} />
                    {NEXT_STATUS_LABEL[week.status]}
                  </button>
                )}
                
                {!isPro && week.status === 'OPEN_TO_PARENTS' && (
                  <button 
                    id={`generate-${week.id}`}
                    className={`btn ${week.needsRecalculation ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                    onClick={() => handleGenerate(week.id)}
                    disabled={generating === week.id}
                  >
                    {generating === week.id ? <Loader2 size={18} className="spin" /> : <TrendingUp size={18} />}
                    {generating === week.id ? 'Génération...' : 'Générer Planning'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Quick stats card */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem' }}>Aperçu Rapide</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-glass-border)' }}>
                <span><Users size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Semaines créées</span>
                <strong>{weeks.length}</strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><Baby size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Dernière action</span>
                <strong style={{ color: 'var(--color-success)' }}>Prête</strong>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
