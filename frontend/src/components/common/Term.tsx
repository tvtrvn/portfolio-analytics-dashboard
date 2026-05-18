import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { HelpCircle } from 'lucide-react';
import { glossary, type TermKey } from '../../utils/glossary';

type Props = {
  termKey: TermKey;
  children?: React.ReactNode;
  iconOnly?: boolean;
  className?: string;
  inline?: boolean;
};

type Position = {
  top: number;
  left: number;
};

const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: none)').matches;
};

export function Term({
  termKey,
  children,
  iconOnly = false,
  className = '',
  inline = true,
}: Props): JSX.Element {
  const entry = glossary[termKey];
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tooltipId = useId();

  const computePosition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const GAP = 8;
    const POPOVER_WIDTH = 288; // w-72 = 18rem = 288px
    const POPOVER_HEIGHT = popoverRect.height || 200;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default: below the trigger
    let top = triggerRect.bottom + GAP;
    let left = triggerRect.left;

    // Flip above if overflows bottom
    if (top + POPOVER_HEIGHT > viewportHeight - 8) {
      top = triggerRect.top - POPOVER_HEIGHT - GAP;
    }

    // Shift left if overflows right
    if (left + POPOVER_WIDTH > viewportWidth - 8) {
      left = viewportWidth - POPOVER_WIDTH - 8;
    }

    // Ensure doesn't go off the left edge
    if (left < 8) {
      left = 8;
    }

    setPosition({ top, left });
  }, []);

  const openPopover = useCallback(() => {
    setOpen(true);
  }, []);

  const closePopover = useCallback(() => {
    setOpen(false);
  }, []);

  // Recompute position whenever popover opens or content changes
  useEffect(() => {
    if (open) {
      // Use rAF to allow the DOM to paint the popover first so getBoundingClientRect is accurate
      requestAnimationFrame(() => {
        computePosition();
      });
    }
  }, [open, computePosition]);

  // Keyboard and outside-click handling
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePopover();
        triggerRef.current?.focus();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        closePopover();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open, closePopover]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (isTouchDevice()) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    openTimerRef.current = setTimeout(() => {
      openPopover();
    }, 120);
  };

  const handleMouseLeave = () => {
    if (isTouchDevice()) return;
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    closeTimerRef.current = setTimeout(() => {
      closePopover();
    }, 200);
  };

  const handlePopoverMouseEnter = () => {
    if (isTouchDevice()) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    if (isTouchDevice()) return;
    closeTimerRef.current = setTimeout(() => {
      closePopover();
    }, 200);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isTouchDevice()) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  const wrapperTag = inline ? 'span' : 'div';
  const WrapperElement = wrapperTag as React.ElementType;

  return (
    <>
      <WrapperElement
        className={`inline-flex items-center gap-1 ${className}`}
        style={{ verticalAlign: inline ? 'baseline' : undefined }}
      >
        {!iconOnly && (
          <span className="text-clay-ink">
            {children ?? entry.label}
          </span>
        )}
        <button
          ref={triggerRef}
          type="button"
          aria-label={`What is ${entry.label}?`}
          aria-expanded={open}
          aria-describedby={open ? tooltipId : undefined}
          className="inline-flex items-center justify-center text-clay-soft hover:text-clay-primary cursor-help transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-primary focus-visible:ring-offset-1 rounded-sm"
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <HelpCircle size={14} aria-hidden="true" />
        </button>
      </WrapperElement>

      {open && (
        <div
          id={tooltipId}
          ref={popoverRef}
          role="tooltip"
          className="bg-clay-surface rounded-clay shadow-clay-lg border border-clay-border w-72 p-4 z-50 text-sm text-clay-ink"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
          }}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
        >
          <p className="font-bold text-clay-ink mb-3">{entry.label}</p>

          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-clay-primary mb-1">
              What it is
            </p>
            <p className="text-clay-muted leading-relaxed">{entry.whatItIs}</p>
          </div>

          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-clay-primary mb-1">
              What it does
            </p>
            <p className="text-clay-muted leading-relaxed">{entry.whatItDoes}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-clay-primary mb-1">
              How it's used
            </p>
            <p className="text-clay-muted leading-relaxed">{entry.howItsUsed}</p>
          </div>
        </div>
      )}
    </>
  );
}
