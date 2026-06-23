import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { ChildSelector } from '../components/planning/ChildSelector';
import { GlobalPlanning } from '../components/planning/GlobalPlanning';
import { AvailabilityForm } from '../components/planning/AvailabilityForm';
import type { Child, Week, Slot, SlotStatus } from '../types';
import { DAYS, DAY_LABELS, HALF_DAYS, HALF_DAY_LABELS } from '../types';

export default function ParentDashboard() {
  const queryClient = useQueryClient();
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  
  const [openWeek, setOpenWeek] = useState<Week | null>(null); // For the child-specific availability form
  
  const [selectedGlobalWeekId, setSelectedGlobalWeekId] = useState<string>('');
  const [selectedFormWeekId, setSelectedFormWeekId] = useState<string>('');
  
  const [availabilities, setAvailabilities] = useState<Record<string, SlotStatus>>({});
  
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: initData, isLoading: loadingList } = useQuery({
    queryKey: ['parent-init'],
    queryFn: async () => {
      const [childrenRes, weeksRes] = await Promise.all([
        apiClient.get('/children'),
        apiClient.get('/weeks')
      ]);
      
      const childrenList = childrenRes.data as Child[];
      const globalWeeks = weeksRes.data.filter((w: Week) => ['PUBLISHED'].includes(w.status));
      const formWeeks = weeksRes.data.filter((w: Week) => w.status !== 'PUBLISHED');
      
      if (globalWeeks.length > 0 && !selectedGlobalWeekId) {
        setSelectedGlobalWeekId(globalWeeks[0].id);
      }
      if (formWeeks.length > 0 && !selectedFormWeekId) {
        setSelectedFormWeekId(formWeeks[0].id);
      }

      return { childrenList, globalWeeks, formWeeks };
    }
  });

  const childrenList = initData?.childrenList || [];
  const availableGlobalWeeks = initData?.globalWeeks || [];
  const availableFormWeeks = initData?.formWeeks || [];

  // 2. When a child is selected, fetch the planning specific to their family
  const loadChildPlanning = useCallback(async (child: Child, weekId: string) => {
    if (!weekId) return;
    setLoadingGrid(true);
    setError('');
    setSuccess('');
    try {
      const planningRes = await apiClient.get(`/planning/${weekId}`);
      
      const initialAvails: Record<string, SlotStatus> = {};
      (planningRes.data.slots || []).forEach((s: Slot) => {
        const isEnrolled = child.defaultPresences?.some(dp => dp.dayOfWeek === s.dayOfWeek && dp.halfDay === s.halfDay) ?? true;
        if (s.slotType !== 'CLOSED' && isEnrolled) {
          const avail = s.availabilities?.find(a => a.child.id === child.id);
          const presence = s.childPresences?.find(p => p.child.id === child.id);
          const isMarkedAbsent = presence && !presence.isPresent;
          initialAvails[s.id] = isMarkedAbsent ? 'ABSENT' : (avail ? (avail.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE') : 'UNAVAILABLE');
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

  const { data: globalPlanning } = useQuery({
    queryKey: ['global-planning', selectedGlobalWeekId],
    queryFn: async () => {
      if (!selectedGlobalWeekId) return null;
      const res = await apiClient.get(`/planning/${selectedGlobalWeekId}`);
      return res.data;
    },
    enabled: !!selectedGlobalWeekId
  });

  useQuery({
    queryKey: ['child-planning', selectedChild?.id, selectedFormWeekId],
    queryFn: async () => {
      if (!selectedChild || !selectedFormWeekId) return null;
      await loadChildPlanning(selectedChild, selectedFormWeekId);
      return true;
    },
    enabled: !!selectedChild && !!selectedFormWeekId
  });

  const handleCycleStatus = (slotId: string) => {
    setSuccess(''); 
    setAvailabilities(prev => {
      const current = prev[slotId];
      if (current === 'UNAVAILABLE') return { ...prev, [slotId]: 'AVAILABLE' };
      if (current === 'AVAILABLE') return { ...prev, [slotId]: 'ABSENT' };
      return { ...prev, [slotId]: 'UNAVAILABLE' };
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.put(`/availabilities/week/${openWeek?.id}`, payload);
    },
    onSuccess: async () => {
      if (selectedChild && openWeek) {
        await loadChildPlanning(selectedChild, openWeek.id);
      }
      setSuccess('Vos disponibilités ont été enregistrées avec succès !');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      queryClient.invalidateQueries({ queryKey: ['parent-init'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Erreur de sauvegarde');
    }
  });

  const handleSubmit = () => {
    if (!openWeek || !selectedChild) return;
    setError('');
    setSuccess('');

    const payload = Object.entries(availabilities)
      .filter(([slotId]) => {
        const slot = (openWeek.slots || []).find(s => s.id === slotId);
        if (!slot) return false;
        return selectedChild.defaultPresences?.some(dp => dp.dayOfWeek === slot.dayOfWeek && dp.halfDay === slot.halfDay) ?? true;
      })
      .map(([slotId, status]) => ({
        slotId,
        isAvailable: status === 'AVAILABLE',
        isAbsent: status === 'ABSENT'
      }));

    saveMutation.mutate({ 
      availabilities: payload,
      childId: selectedChild.id
    });
  };

  if (loadingList) {
    return <div className="flex-center" style={{ padding: '4rem' }}><Loader2 size={32} className="spin" style={{ color: 'var(--color-primary)' }} /></div>;
  }

  // --- VUE 1 : Liste des enfants et Vue Globale ---
  if (!selectedChild) {
    return (
      <div className="animate-fade-in">
        <ChildSelector childrenList={childrenList} onSelect={handleSelectChild} />

        <GlobalPlanning 
          availableGlobalWeeks={availableGlobalWeeks}
          selectedGlobalWeekId={selectedGlobalWeekId}
          onSelectGlobalWeek={setSelectedGlobalWeekId}
          globalPlanning={globalPlanning}
          childrenList={childrenList}
          DAYS={DAYS}
          DAY_LABELS={DAY_LABELS}
          HALF_DAYS={HALF_DAYS}
          HALF_DAY_LABELS={HALF_DAY_LABELS}
        />
      </div>
    );
  }

  // --- VUE 2 : Grille de l'enfant sélectionné ---
  return (
    <>
      {error && <div style={{ backgroundColor: 'rgba(244,63,94,0.1)', color: 'var(--color-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', fontWeight: 500 }}>{error}</div>}
      {success && <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, border: '1px solid var(--color-success)' }}><CheckCircle2 size={24} /> {success}</div>}
      
      <AvailabilityForm 
        selectedChild={selectedChild}
        onDeselectChild={() => setSelectedChild(null)}
        availableFormWeeks={availableFormWeeks}
        selectedFormWeekId={selectedFormWeekId}
        onSelectFormWeek={setSelectedFormWeekId}
        openWeek={openWeek}
        loadingGrid={loadingGrid}
        availabilities={availabilities}
        handleCycleStatus={handleCycleStatus}
        handleSubmit={handleSubmit}
        isSaving={saveMutation.isPending}
        childrenList={childrenList}
        DAYS={DAYS}
        DAY_LABELS={DAY_LABELS}
        HALF_DAYS={HALF_DAYS}
        HALF_DAY_LABELS={HALF_DAY_LABELS}
      />
    </>
  );
}
