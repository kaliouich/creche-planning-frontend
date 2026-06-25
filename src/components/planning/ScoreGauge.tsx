

interface ScoreGaugeProps {
  score: number;
  minScore: number;
  maxScore: number;
  avgScore: number;
}

export function ScoreGauge({ score, minScore, maxScore, avgScore }: ScoreGaugeProps) {
  // Ensure we have a reasonable scale even if all scores are 0
  const effectiveMin = Math.min(minScore, -2);
  const effectiveMax = Math.max(maxScore, 2);
  const range = effectiveMax - effectiveMin;

  const scorePercent = Math.max(0, Math.min(100, ((score - effectiveMin) / range) * 100));
  const avgPercent = Math.max(0, Math.min(100, ((avgScore - effectiveMin) / range) * 100));
  const zeroPercent = Math.max(0, Math.min(100, ((0 - effectiveMin) / range) * 100));

  let statusText = "À l'équilibre";
  let statusColor = "var(--color-primary)";
  
  if (score < -1) {
    statusText = "En retard (Perm requise)";
    statusColor = "var(--color-secondary)";
  } else if (score > 1) {
    statusText = "En avance (Relâche)";
    statusColor = "var(--color-success)";
  }

  return (
    <div style={{ width: '100%', marginTop: '1rem', padding: '0 0.5rem', zIndex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', fontWeight: 500 }}>
        <span>Statut : <strong style={{ color: statusColor }}>{statusText}</strong></span>
      </div>
      
      <div style={{ position: 'relative', height: '8px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
        {/* Background gradient from red to green */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, var(--color-secondary) 0%, #fbbf24 50%, var(--color-success) 100%)', opacity: 0.2 }}></div>
        
        {/* The actual score bar from 0 to score (or just a dot?) A filled bar from zero to score is nice */}
        {score < 0 ? (
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${scorePercent}%`, width: `${zeroPercent - scorePercent}%`, backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}></div>
        ) : (
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${zeroPercent}%`, width: `${scorePercent - zeroPercent}%`, backgroundColor: 'var(--color-success)', borderRadius: '4px' }}></div>
        )}
      </div>

      <div style={{ position: 'relative', height: '15px', marginTop: '2px', fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
        {/* Zero marker */}
        <div style={{ position: 'absolute', left: `${zeroPercent}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '2px', height: '4px', backgroundColor: 'var(--color-text-tertiary)' }}></div>
          <span>0</span>
        </div>
        
        {/* Average marker */}
        <div style={{ position: 'absolute', left: `${avgPercent}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--color-primary)' }}>
          <div style={{ width: '2px', height: '4px', backgroundColor: 'var(--color-primary)' }}></div>
          <span style={{ fontWeight: 600 }}>Moy</span>
        </div>

        {/* Current score marker */}
        <div style={{ position: 'absolute', left: `${scorePercent}%`, transform: 'translateX(-50%)', top: '-14px', zIndex: 10 }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#fff', border: `2px solid ${statusColor}`, borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
        </div>
      </div>
    </div>
  );
}
