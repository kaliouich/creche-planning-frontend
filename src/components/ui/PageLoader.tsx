import { LoadingSpinner } from './LoadingSpinner';

export const PageLoader = ({ text = 'Chargement...' }: { text?: string }) => {
  return (
    <div className="flex-center animate-fade-in" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <LoadingSpinner size={48} />
      <p style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{text}</p>
    </div>
  );
};
