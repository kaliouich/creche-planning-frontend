

interface ScoreGaugeProps {
  score: number;
  minScore: number;
  maxScore: number;
  avgScore: number;
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  let statusText = "À jour (Tranquille pour le moment)";
  let statusColor = "var(--color-success)";
  let bgColor = "rgba(16,185,129,0.1)";
  
  if (score < 0) {
    statusText = "Vous devez vous inscrire";
    statusColor = "var(--color-error)";
    bgColor = "rgba(244,63,94,0.1)";
  }

  return (
    <div style={{ width: '100%', marginTop: '1rem', padding: '0.5rem', backgroundColor: bgColor, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: statusColor }}>
        {score < 0 ? '🔴' : '🟢'} {statusText}
      </span>
    </div>
  );
}
