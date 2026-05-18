import { Modal } from './Modal';

type ConfirmDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
};

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  body,
  confirmLabel = 'Confirm',
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} widthClass="max-w-sm">
      <p className="text-sm text-clay-muted mb-6 leading-relaxed">{body}</p>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="clay-button-ghost">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={
            danger
              ? 'clay-button bg-clay-coral text-white shadow-clay hover:opacity-90'
              : 'clay-button'
          }
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
