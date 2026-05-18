import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'No data available',
  message = 'There is no data to display for the selected filters.',
  icon,
}: EmptyStateProps) {
  return (
    <div className="clay-card flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-clay-surface2 shadow-clay-inset">
        {icon ?? <Inbox className="h-7 w-7 text-clay-soft" />}
      </div>
      <p className="mb-1 text-sm font-semibold text-clay-ink">{title}</p>
      <p className="text-xs text-clay-muted">{message}</p>
    </div>
  );
}
