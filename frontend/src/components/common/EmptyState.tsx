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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon || <Inbox className="mb-3 h-10 w-10 text-gray-300" />}
      <p className="mb-1 text-sm font-medium text-gray-600">{title}</p>
      <p className="text-xs text-gray-400">{message}</p>
    </div>
  );
}
