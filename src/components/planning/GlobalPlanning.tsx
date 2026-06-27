import { useMemo } from 'react';
import { Calendar, Printer } from 'lucide-react';
import { getWeekDateRange, getDateForDayOfWeek } from '../../utils/date';
import type { Child, Week } from '../../types';

interface Slot {
  id: string;
  dayOfWeek: string;
  halfDay: string;
  slotType: string;
  requiredParents: number;
  childPresences?: {
    isPresent: boolean;
    child: { id: string; firstName: string; lastName: string };
  }[];
  assignments?: {
    id: string;
    parent: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
}

interface GlobalPlanningProps {
  availableGlobalWeeks: Week[];
  selectedGlobalWeekId: string;
  onSelectGlobalWeek: (id: string) => void;
  globalPlanning: Week | null;
  childrenList: Child[];
  DAYS: readonly string[];
  DAY_LABELS: Record<string, string>;
  HALF_DAYS: readonly string[];
  HALF_DAY_LABELS: Record<string, string>;
}

export function GlobalPlanning({
  availableGlobalWeeks,
  selectedGlobalWeekId,
  onSelectGlobalWeek,
  globalPlanning,
  childrenList,
  DAYS,
  DAY_LABELS,
  HALF_DAYS,
  HALF_DAY_LABELS
}: GlobalPlanningProps) {

  // Memoize the attendance statistics to prevent recalculating them on every re-render
  const slotStats = useMemo(() => {
    const stats: Record<string, any> = {};
    if (!globalPlanning || globalPlanning.status !== 'PUBLISHED') return stats;

    (globalPlanning.slots || []).forEach(slot => {
      const isClosed = slot.slotType === 'CLOSED';
      if (isClosed) return;

      const declaredAbsents = (slot.childPresences || [])
        .filter((cp: any) => !cp.isPresent)
        .map((cp: any) => cp.child.id);
        
      const notEnrolled = childrenList.filter(c => {
        const isEnrolled = c.defaultPresences?.some(dp => dp.dayOfWeek === slot.dayOfWeek && dp.halfDay === slot.halfDay);
        return !isEnrolled;
      });

      const absentNames: string[] = [];
      declaredAbsents.forEach((childId: string) => {
        const c = childrenList.find(x => x.id === childId);
        if (c && !notEnrolled.some(ne => ne.id === c.id)) absentNames.push(c.firstName);
      });
      notEnrolled.forEach(c => absentNames.push(c.firstName));
      
      const presentChildren = childrenList
        .filter(c => !notEnrolled.some(ne => ne.id === c.id))
        .filter(c => !declaredAbsents.includes(c.id));
        
      stats[slot.id] = {
        grandsPresNames: presentChildren.filter(c => c.ageGroup !== 'PETIT').map(c => c.firstName),
        petitsPresNames: presentChildren.filter(c => c.ageGroup === 'PETIT').map(c => c.firstName),
        grandsAbsNames: childrenList.filter(c => absentNames.includes(c.firstName)).filter(c => c.ageGroup !== 'PETIT').map(c => c.firstName),
        petitsAbsNames: childrenList.filter(c => absentNames.includes(c.firstName)).filter(c => c.ageGroup === 'PETIT').map(c => c.firstName),
      };
    });

    return stats;
  }, [globalPlanning, childrenList]);


  if (availableGlobalWeeks.length === 0 || !globalPlanning) {
    return null;
  }

  return (
    <div className="glass-card" style={{ marginTop: '3rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Calendar size={20} /> Planning Global
        </h3>
        
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <select 
            value={selectedGlobalWeekId} 
            onChange={(e) => onSelectGlobalWeek(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-glass-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
          >
            {availableGlobalWeeks.map((w: Week) => (
              <option key={w.id} value={w.id}>Semaine {w.weekNumber} ({getWeekDateRange(w.weekNumber, w.year)})</option>
            ))}
          </select>
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', opacity: globalPlanning.status === 'PUBLISHED' ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {globalPlanning.status === 'PUBLISHED' ? (
                <>
                  <span className="badge badge-success">Publié</span>
                  <button className="btn btn-outline" onClick={() => window.print()} style={{ padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}>
                    <Printer size={16} /> Exporter PDF
                  </button>
                </>
              ) : (
                <span className="badge badge-warning">En cours d'élaboration</span>
              )}
            </div>
          </div>
        </div>
        
        {globalPlanning.status === 'PUBLISHED' && (
          <h1 className="only-print" style={{ margin: '0 0 1rem 0', fontSize: '2rem', textAlign: 'center', color: 'var(--color-primary)' }}>
            Planning Semaine {globalPlanning.weekNumber} - Permanences des parents
            <div style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', fontWeight: 'normal', marginTop: '0.2rem' }}>
              ({getWeekDateRange(globalPlanning.weekNumber, globalPlanning.year)})
            </div>
          </h1>
        )}
      </div>

      <div className="planning-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', opacity: globalPlanning.status === 'PUBLISHED' ? 1 : 0.6 }}>
        {DAYS.map(day => (
          <div className="grid-day-row" key={day} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr', gap: '1rem', alignItems: 'start', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '0.2rem' }}>
              <strong style={{ fontSize: '1.1rem' }}>{DAY_LABELS[day]}</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                {getDateForDayOfWeek(globalPlanning.weekNumber, globalPlanning.year, day)}
              </span>
            </div>
            
            {HALF_DAYS.map(halfDay => {
              const slot = (globalPlanning.slots || []).find((s: Slot) => s.dayOfWeek === day && s.halfDay === halfDay);
              if (!slot) return <div key={halfDay}>-</div>;

              const isClosed = slot.slotType === 'CLOSED';
              const isNoPerm = slot.slotType === 'NO_PERM';
              const isDouble = slot.slotType === 'DOUBLE_PERM';
              const slotStat = slotStats[slot.id];

              return (
                <div key={slot.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{HALF_DAY_LABELS[halfDay]}</span>
                  
                  <div 
                    className={`btn ${(isClosed || isNoPerm) ? 'btn-outline' : globalPlanning.status === 'PUBLISHED' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ 
                      justifyContent: 'center',
                      borderColor: (isClosed || isNoPerm) ? 'var(--color-secondary)' : undefined,
                      color: (isClosed || isNoPerm) ? 'var(--color-secondary)' : undefined,
                      cursor: 'default',
                      fontWeight: globalPlanning.status === 'PUBLISHED' && !(isClosed || isNoPerm) && slot.assignments?.length ? 600 : undefined,
                      padding: '0.5rem',
                      height: 'auto'
                    }}
                  >
                    {isClosed && 'Fermé'}
                    {isNoPerm && 'Pas de perm'}
                    {!(isClosed || isNoPerm) && globalPlanning.status === 'PUBLISHED' && (
                      <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {slot.assignments && slot.assignments.length > 0 
                          ? slot.assignments.map((a: any, index: number) => {
                              const schedule = index > 0 
                                ? '12h00 - 17h00' 
                                : (halfDay === 'MORNING' ? '8h00 - 13h00' : '13h45 - 18h45');
                              return (
                                <div key={a.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 600 }}>{a.child?.firstName}</span>
                                  <span style={{ fontSize: '0.9rem' }}>({a.parent.firstName}{a.parent.lastName ? ` & ${a.parent.lastName}` : ''})</span>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 'normal', opacity: 0.9 }}>({schedule})</span>
                                </div>
                              );
                            })
                          : '✗ Non rempli'}
                      </div>
                    )}
                    {!(isClosed || isNoPerm) && globalPlanning.status !== 'PUBLISHED' && (
                      <>
                        {isDouble ? 'Double Perm (à définir)' : 'Normal (à définir)'}
                      </>
                    )}
                  </div>

                  {!isClosed && globalPlanning.status === 'PUBLISHED' && slotStat && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.85rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                        <div>
                          <strong style={{ color: 'var(--color-primary)' }}>
                            Grands : {slotStat.grandsPresNames.length} présent{slotStat.grandsPresNames.length > 1 ? 's' : ''} / {slotStat.grandsAbsNames.length} absent{slotStat.grandsAbsNames.length > 1 ? 's' : ''}
                          </strong>
                          <div style={{ paddingLeft: '0.5rem', marginTop: '0.2rem', color: 'var(--color-text-secondary)' }}>
                            <div>- présents : {slotStat.grandsPresNames.length > 0 ? slotStat.grandsPresNames.join(', ') : '-'}</div>
                            <div>- absents : {slotStat.grandsAbsNames.length > 0 ? slotStat.grandsAbsNames.join(', ') : '-'}</div>
                          </div>
                        </div>
                        
                        <div>
                          <strong style={{ color: 'var(--color-secondary)' }}>
                            Petits : {slotStat.petitsPresNames.length} présent{slotStat.petitsPresNames.length > 1 ? 's' : ''} / {slotStat.petitsAbsNames.length} absent{slotStat.petitsAbsNames.length > 1 ? 's' : ''}
                          </strong>
                          <div style={{ paddingLeft: '0.5rem', marginTop: '0.2rem', color: 'var(--color-text-secondary)' }}>
                            <div>- présents : {slotStat.petitsPresNames.length > 0 ? slotStat.petitsPresNames.join(', ') : '-'}</div>
                            <div>- absents : {slotStat.petitsAbsNames.length > 0 ? slotStat.petitsAbsNames.join(', ') : '-'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
