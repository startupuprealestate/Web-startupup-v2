import * as React from 'react';
import { cn } from './cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** `primary` is the brand pill (green, inverts on hover). `outline` is the light bordered pill used for filters and secondary actions. */
  variant?: 'primary' | 'outline';
  /** `sm` is the compact pill used inside cards and toolbars. */
  size?: 'md' | 'sm';
  /** Full width on mobile, auto from the `sm` breakpoint up - the form-footer pattern. */
  fullWidth?: boolean;
}

const OUTLINE =
  'inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 ' +
  'rounded-full shadow-sm font-light transition hover:border-brand-green hover:text-brand-green ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * The primary call-to-action of the site: a pill button in brand green that
 * inverts to an outlined green pill and lifts slightly on hover.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth = false, className, children, ...props },
  ref
) {
  const base = variant === 'primary' ? 'btn-primary' : OUTLINE;
  const sizing =
    variant === 'primary'
      ? size === 'sm'
        ? 'py-2 px-4 text-sm'
        : ''
      : size === 'sm'
        ? 'px-3 py-1.5 text-xs'
        : 'px-5 py-2.5 text-sm';

  return (
    <button
      ref={ref}
      className={cn(base, sizing, fullWidth && 'w-full sm:w-auto', className)}
      {...props}
    >
      {children}
    </button>
  );
});
