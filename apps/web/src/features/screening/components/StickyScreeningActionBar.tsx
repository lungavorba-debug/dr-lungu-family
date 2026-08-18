import type { ReactNode } from 'react';

interface StickyScreeningActionBarProps {
  children: ReactNode;
  /** `fixed` pins to the viewport; `inline` renders in normal flow (e.g. above a docked keypad). */
  layout?: 'fixed' | 'inline';
  /** Compact toolbar for mobile measurement dock. */
  density?: 'default' | 'compact';
}

const STICKY_ACTION_BAR_BASE =
  'border-t border-slate-200 bg-white/95 shadow-[0_-8px_32px_rgba(15,23,42,0.12)] backdrop-blur-sm lg:px-8';

export function StickyScreeningActionBar({
  children,
  layout = 'fixed',
  density = 'default',
}: StickyScreeningActionBarProps) {
  const positionClasses = layout === 'fixed' ? 'fixed inset-x-0 bottom-0 z-40' : 'relative z-50 shrink-0';
  const safeAreaClasses =
    layout === 'fixed' ? 'pb-[max(0.75rem,env(safe-area-inset-bottom))]' : '';
  const spacingClasses = density === 'compact' ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div
      className={`${positionClasses} ${STICKY_ACTION_BAR_BASE} ${spacingClasses} ${safeAreaClasses}`}
      role="toolbar"
      aria-label="Acțiuni screening"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {children}
      </div>
    </div>
  );
}

interface StickyActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent';
  type?: 'button';
  density?: 'default' | 'compact';
}

const VARIANT_CLASSES = {
  primary: 'bg-brand-primary text-white hover:bg-brand-secondary',
  accent: 'bg-brand-accent text-white hover:opacity-90',
  secondary: 'border border-brand-primary/30 bg-white text-brand-primary hover:bg-brand-primary/5',
};

export function StickyActionButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  type = 'button',
  density = 'default',
}: StickyActionButtonProps) {
  const sizeClasses =
    density === 'compact'
      ? 'min-h-[44px] rounded-xl text-sm'
      : 'min-h-[56px] rounded-2xl text-base';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center px-4 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[200px] sm:flex-none ${sizeClasses} ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </button>
  );
}
