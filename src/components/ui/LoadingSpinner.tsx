import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  color?: string;
}

export const LoadingSpinner = ({ size = 24, className = '', color = 'var(--color-primary)' }: LoadingSpinnerProps) => {
  return (
    <Loader2 
      size={size} 
      color={color}
      className={`animate-spin ${className}`} 
    />
  );
};
