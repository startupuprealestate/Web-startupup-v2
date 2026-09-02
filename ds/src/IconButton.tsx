import * as React from 'react';
import { cn } from './cn';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name - an icon-only control has no text, so this is required. */
  'aria-label': string;
  /** `circle` is the 40px carousel arrow. `ghost` is the flat square-ish control used in section headers. */
  variant?: 'circle' | 'ghost';
}

const CIRCLE =
  'w-10 h-10 rounded-full flex items-center justify-center bg-white border border-gray-200 ' +
  'text-gray-600 shadow-sm transition hover:text-brand-green hover:border-brand-green ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const GHOST =
  'p-2 rounded-full bg-white shadow-sm border border-gray-100 text-brand-green transition ' +
  'hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed';

/** Round icon-only control - carousel arrows, header actions. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'circle', className, children, ...props },
  ref
) {
  return (
    <button ref={ref} className={cn(variant === 'circle' ? CIRCLE : GHOST, className)} {...props}>
      {children}
    </button>
  );
});
