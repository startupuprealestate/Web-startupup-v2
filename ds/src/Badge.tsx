import * as React from 'react';
import { cn } from './cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Colour of the pill: red for promotions, blue for new listings, brand green otherwise. */
  tone?: 'promotion' | 'new' | 'default';
  children?: React.ReactNode;
}

const TONES: Record<NonNullable<BadgeProps['tone']>, string> = {
  promotion: 'bg-red-600',
  new: 'bg-blue-600',
  default: 'bg-brand-green',
};

/** Small status pill shown over a property image - "Promotion", "New", and the like. */
export function Badge({ tone = 'default', className, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'px-3 py-1.5 rounded-full font-medium text-xs shadow-sm text-white',
        TONES[tone],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
