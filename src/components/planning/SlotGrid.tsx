import { useMemo } from 'react';
import { ShieldBan, Users } from 'lucide-react';
import type { Week, Slot, Child } from '../../types';
import { getDateForDayOfWeek } from '../../utils/date';
import { DAYS, DAY_LABELS, HALF_DAYS, HALF_DAY_LABELS } from '../../types';

interface PresenceStats {
  grandsPresNames: string[];
  grandsAbsNames: string[];
  petitsPresNames: string[];
  petitsAbsNames: string[];
}

interface SlotGridProps {
  week: Week;
  children: Child[];
  isEditable: boolean;
  onToggleSlotType: (slot: Slot) => void;
}

/**
 * Computes presence/absence stats for all slots in one pass (memoized).
 */
function usePresenceStats(week: Week, children: Child[]): Map<string, PresenceStats> {
  return useMemo(() => {
    const statsMap = new Map<string, PresenceStats>();
    const activeChildren = children.filter(c => c.isActive);

    for (const slot of (week.slots || [])) {
      const stats: PresenceStats = { grandsPresNames: [], grandsAbsNames: [], petitsPresNames: [], petitsAbsNames: [] };

      activeChildren.forEach(child => {
        const override = slot.childPresences?.find(cp => cp.child.id === child.id);
        const isEnrolled = child.defaultPresences?.some(dp => dp.dayOfWeek === slot.dayOfWeek && dp.halfDay === slot.halfDay);
        const isPresent = override ? override.isPresent : isEnrolled;

        if (isPresent) {
          if (child.ageGroup === 'PETIT') stats.petitsPresNames.push(child.firstName);
          else stats.grandsPresNames.push(child.firstName);
        } else {
          if (child.ageGroup === 'PETIT') stats.petitsAbsNames.push(child.firstName);
          else stats.grandsAbsNames.push(child.firstName);
        }
      });

      statsMap.set(slot.id, stats);
    }
    return statsMap;
  }, [week.slots, children]);
}

export function SlotGrid({ week, children, isEditable, onToggleSlotType }: SlotGridProps) {
  const presenceStats = usePresenceStats(week, children);

  return (
    <div className="planning-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {DAYS.map(day => (
        <div className="grid-day-row" key={day} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr', gap: '1rem', alignItems: 'start', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '0.2rem' }}>
            <strong style={{ fontSize: '1.1rem' }}>{DAY_LABELS[day]}</strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              {getDateForDayOfWeek(week.weekNumber, week.year, day)}
            </span>
          </div>
          
          {HALF_DAYS.map(halfDay => {
            const slot = week.slots?.find(s => s.dayOfWeek === day && s.halfDay === halfDay);
            if (!slot) return <div key={halfDay}>-</div>;

            const isClosed = slot.slotType === 'CLOSED' || slot.slotType === 'NO_PERM';
            const isNoPerm = slot.slotType === 'NO_PERM';
            const isDouble = slot.slotType === 'DOUBLE_PERM';
            const stats = presenceStats.get(slot.id);

            return (
              <div key={slot.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{HALF_DAY_LABELS[halfDay]}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                  {isEditable ? (
                    <button 
                      className={`btn ${isClosed ? 'btn-outline' : isDouble ? 'btn-primary' : 'btn-outline'}`}
                      style={{ 
                        justifyContent: 'center',
                        borderColor: isClosed ? 'var(--color-secondary)' : undefined,
                        color: isClosed ? 'var(--color-secondary)' : undefined,
                      }}
                      onClick={() => onToggleSlotType(slot)}
                    >
                      {isClosed && <><ShieldBan size={16} /> {isNoPerm ? 'Pas de perm' : 'Fermé'}</>}
                      {!isClosed && (
                        <>
                          {isDouble && <><Users size={16} /> Double Perm</>}
                          {!isDouble && 'Normal (1 Parent)'}
                        </>
                      )}
                    </button>
                  ) : (
                    <div 
                      className="btn btn-primary"
                      style={{ justifyContent: 'center', cursor: 'default', fontWeight: 600, padding: '0.5rem', height: 'auto', opacity: isClosed ? 0.7 : 1 }}
                    >
                      {isClosed && (isNoPerm ? 'Pas de perm' : 'Fermé')}
                      {!isClosed && week.status === 'PUBLISHED' && (
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {slot.assignments && slot.assignments.length > 0 
                            ? slot.assignments.map((a, index) => {
                                const schedule = index > 0 
                                  ? '12h00 - 17h00' 
                                  : (halfDay === 'MORNING' ? '8h00 - 13h00' : '13h45 - 18h45');
                                return (
                                  <div key={a.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span>{a.parent.firstName} {a.parent.lastName}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'normal', opacity: 0.9 }}>({schedule})</span>
                                  </div>
                                );
                              })
                            : '✗ Non rempli'}
                        </div>
                      )}
                      {!isClosed && week.status !== 'PUBLISHED' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isDouble ? <Users size={16} /> : <ShieldBan size={16} style={{ opacity: 0 }} />}
                          {slot.assignments && slot.assignments.length > 0 
                            ? slot.assignments.map(a => a.parent.firstName).join(' & ')
                            : 'Non rempli'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Presence/absence stats */}
                  {!isClosed && stats && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.85rem', textAlign: 'left' }}>
                      <div>
                        <strong style={{ color: 'var(--color-primary)' }}>
                          Grands : {stats.grandsPresNames.length} présent{stats.grandsPresNames.length > 1 ? 's' : ''} / {stats.grandsAbsNames.length} absent{stats.grandsAbsNames.length > 1 ? 's' : ''}
                        </strong>
                        <div style={{ paddingLeft: '0.5rem', marginTop: '0.2rem', color: 'var(--color-text-secondary)' }}>
                          <div>- présents : {stats.grandsPresNames.length > 0 ? stats.grandsPresNames.join(', ') : '-'}</div>
                          <div>- absents : {stats.grandsAbsNames.length > 0 ? stats.grandsAbsNames.join(', ') : '-'}</div>
                        </div>
                      </div>
                      <div>
                        <strong style={{ color: 'var(--color-secondary)' }}>
                          Petits : {stats.petitsPresNames.length} présent{stats.petitsPresNames.length > 1 ? 's' : ''} / {stats.petitsAbsNames.length} absent{stats.petitsAbsNames.length > 1 ? 's' : ''}
                        </strong>
                        <div style={{ paddingLeft: '0.5rem', marginTop: '0.2rem', color: 'var(--color-text-secondary)' }}>
                          <div>- présents : {stats.petitsPresNames.length > 0 ? stats.petitsPresNames.join(', ') : '-'}</div>
                          <div>- absents : {stats.petitsAbsNames.length > 0 ? stats.petitsAbsNames.join(', ') : '-'}</div>
                        </div>
                      </div>
                      {week.status !== 'PUBLISHED' && (
                        <div style={{ color: 'var(--color-success)', marginTop: '0.25rem' }}>
                          <strong>Parent Dispo: </strong> 
                          {(slot.availabilities || []).filter(a => a.isAvailable).map(a => a.child.firstName).join(', ') || '-'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
