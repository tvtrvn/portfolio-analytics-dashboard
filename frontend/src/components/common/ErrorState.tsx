import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="clay-card flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-clay-coralSoft shadow-clay-inset">
        <AlertTriangle className="h-7 w-7 text-clay-coral" />
      </div>
      <p className="mb-1 text-sm font-semibold text-clay-ink">Something looks off</p>
      <p className="mb-5 text-xs text-clay-muted">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="clay-button">
          Try again
        </button>
      )}
    </div>
  );
}
