import { useEffect, useRef } from 'react';

type Options = {
  open: boolean;
  modalRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
};

/**
 * Handles keyboard behavior for modal dialogs:
 * - Escape key closes the modal
 * - Captures previous focus on open, restores on close
 * - Traps Tab / Shift+Tab within the modal
 */
export function useModalKeyboardBehavior({ open, modalRef, onClose }: Options) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Focus trap: capture focus on open, trap Tab inside modal, restore on close
  useEffect(() => {
    if (!open) return;

    // Save the previously focused element to restore on close
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Focus the modal container
    const modal = modalRef.current;
    if (modal) modal.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modal) return;

      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => {
      document.removeEventListener('keydown', handleTab);
      // Restore focus to previously focused element
      previousFocusRef.current?.focus();
    };
  }, [open, modalRef]);
}
