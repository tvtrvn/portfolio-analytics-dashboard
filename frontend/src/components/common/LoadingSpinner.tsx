export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-12 ${className}`}>
      <span
        className="h-2.5 w-2.5 animate-pulse rounded-full bg-clay-primary"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="h-2.5 w-2.5 animate-pulse rounded-full bg-clay-primary"
        style={{ animationDelay: '200ms' }}
      />
      <span
        className="h-2.5 w-2.5 animate-pulse rounded-full bg-clay-primary"
        style={{ animationDelay: '400ms' }}
      />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="clay-card animate-pulse space-y-3 p-5">
      <div className="h-3 w-24 rounded-clay bg-clay-surface2" />
      <div className="h-7 w-32 rounded-clay bg-clay-surface2" />
      <div className="h-3 w-16 rounded-clay bg-clay-surface2" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="clay-card animate-pulse">
      <div className="border-b border-clay-border px-5 py-3">
        <div className="h-4 w-40 rounded-clay bg-clay-surface2" />
      </div>
      <div className="p-5">
        <div className="h-64 rounded-clay bg-clay-surface2" />
      </div>
    </div>
  );
}
