import { Users, Bell } from 'lucide-react';
import type { Week, Child } from '../../types';
import { DAYS, DAY_LABELS, HALF_DAYS } from '../../types';

interface AvailabilityTableProps {
  week: Week;
  children: Child[];
  onNotifyParent: (parentId?: string, secondId?: string | null, parentName?: string) => void;
}

export function AvailabilityTable({ week, children, onNotifyParent }: AvailabilityTableProps) {
  if (children.length === 0) {
    return (
      <div className="glass-card no-print" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} /> Tableau des disponibilités soumises
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '1rem' }}>
          Aucun enfant inscrit dans la crèche.
        </p>
      </div>
    );
  }

  // Determine who has submitted (at least 1 availability sent for the week)
  const submittedChildIds = new Set<string>();
  week.slots?.forEach(slot => {
    slot.availabilities?.forEach(avail => {
      if (avail.child?.id) {
        submittedChildIds.add(avail.child.id);
      }
    });
  });

  return (
    <div className="glass-card no-print" style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Users size={20} /> Tableau des disponibilités soumises
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
              {DAYS.flatMap(day => {
                return HALF_DAYS.map(halfDay => {
                  const slot = week.slots?.find(s => s.dayOfWeek === day && s.halfDay === halfDay);
                  let petitsPres = 0, grandsPres = 0, petitsAbs = 0, grandsAbs = 0;
                  const activeChildren = children.filter(c => c.isActive);
                  activeChildren.forEach(child => {
                    const override = slot?.childPresences?.find(cp => cp.child?.id === child.id);
                    const isEnrolled = child.defaultPresences?.some(dp => dp.dayOfWeek === day && dp.halfDay === halfDay);
                    const isPresent = override ? override.isPresent : isEnrolled;
                    
                    if (isPresent) {
                      if (child.ageGroup === 'PETIT') petitsPres++; else grandsPres++;
                    } else {
                      if (child.ageGroup === 'PETIT') petitsAbs++; else grandsAbs++;
                    }
                  });

                  return (
                    <th key={`stats-${day}-${halfDay}`} style={{ padding: '0.5rem', borderBottom: '2px solid var(--color-glass-border)', borderLeft: halfDay === 'MORNING' ? '1px solid var(--color-glass-border)' : 'none', fontSize: '0.75rem', fontWeight: 'normal', lineHeight: '1.2' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: 'var(--color-success)' }}>{petitsPres}P {grandsPres}G (Présents)</span>
                        <span style={{ color: 'var(--color-secondary)' }}>{petitsAbs}P {grandsAbs}G (Absents)</span>
                      </div>
                    </th>
                  );
                });
              })}
            </tr>
          </thead>
          <tbody>
            {children.map(child => {
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-error">En attente</span>
                      {child.parent?.id && week.status === 'OPEN_TO_PARENTS' && (
                        <button 
                          onClick={() => onNotifyParent(child.parent?.id, child.parent?.secondId, child.parent?.firstName)}
                          title="Envoyer un rappel par email"
                          style={{ 
                            background: 'none', border: 'none', cursor: 'pointer', 
                            color: 'var(--color-warning)', display: 'flex', alignItems: 'center', padding: '0.2rem' 
                          }}
                        >
                          <Bell size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
                {DAYS.flatMap(day => {
                  return HALF_DAYS.map(halfDay => {
                    const slot = week.slots?.find(s => s.dayOfWeek === day && s.halfDay === halfDay);
                    const avail = slot?.availabilities?.find(a => a.child?.id === child.id);
                    const isEnrolled = child.defaultPresences?.some(dp => dp.dayOfWeek === day && dp.halfDay === halfDay) ?? true;
                    
                    let content = <span style={{ color: 'var(--color-text-secondary)', opacity: 0.3 }}>-</span>;
                    
                    if (!isEnrolled) {
                      content = <span style={{ color: 'var(--color-text-secondary)', opacity: 0.3 }}>-</span>; // Not enrolled
                    } else if (hasSubmitted) {
                      // Child is enrolled and has submitted.
                      const presence = slot?.childPresences?.find(p => p.child?.id === child.id);
                      const isMarkedAbsent = presence && !presence.isPresent;
                      
                      if (isMarkedAbsent) {
                        content = <span style={{ color: 'var(--color-secondary)' }}>✗</span>; // Marked absent
                      } else if (avail && avail.isAvailable) {
                        content = <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✓</span>; // Available
                      } else {
                        content = <span style={{ color: 'var(--color-text-secondary)' }}>✗</span>; // Unavailable
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
  );
}
