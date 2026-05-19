import { useAppDispatch, useAppSelector } from '../store/store';
import type { RootState } from '../store/store';
import type { AppDispatch } from '../store/store';
import type { ActionCreatorWithoutPayload } from '@reduxjs/toolkit';
import { Toast } from '../components/common/Toast';
import type { ToastProps } from '../components/common/Toast';

/**
 * Reads mutateError from the given slice selector and returns Toast props
 * (or null when there is no error). Wire the returned props into a <Toast>.
 *
 * Usage:
 *   const toastProps = useMutateErrorToast((s) => s.holdings, clearHoldingsMutateError);
 *   return toastProps ? <Toast {...toastProps} /> : null;
 */
export function useMutateErrorToast(
  selector: (state: RootState) => { mutateError: string | null },
  clearAction: ActionCreatorWithoutPayload,
): ToastProps | null {
  const dispatch = useAppDispatch();
  const { mutateError } = useAppSelector(selector);

  if (!mutateError) return null;

  return {
    message: mutateError,
    kind: 'error' as const,
    onDismiss: () => dispatch(clearAction()),
  };
}
