import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export type ToastProps = {
  message: string;
  kind: 'error' | 'success';
  onDismiss: () => void;
};

const AUTO_DISMISS_MS = 5000;

export function Toast({ message, kind, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isError = kind === 'error';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 right-4 z-[100] flex items-start gap-3 clay-card shadow-clay-lg max-w-sm w-full p-4 animate-in"
      style={{
        borderLeft: `3px solid ${isError ? 'var(--color-clay-coral, #f87171)' : 'var(--color-clay-mint, #34d399)'}`,
      }}
      onClick={onDismiss}
    >
      <span className={`mt-0.5 shrink-0 ${isError ? 'text-clay-coral' : 'text-clay-mint'}`}>
        {isError ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
      </span>

      <p className="flex-1 text-sm font-medium text-clay-ink leading-snug">{message}</p>

      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        className="clay-icon-button shrink-0 -mt-0.5 -mr-1"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
