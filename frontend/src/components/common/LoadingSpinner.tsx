export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="card-body space-y-3">
        <div className="h-3 w-24 rounded bg-gray-200" />
        <div className="h-7 w-32 rounded bg-gray-200" />
        <div className="h-3 w-16 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="card animate-pulse">
      <div className="card-header">
        <div className="h-4 w-40 rounded bg-gray-200" />
      </div>
      <div className="card-body">
        <div className="h-64 rounded bg-gray-100" />
      </div>
    </div>
  );
}
