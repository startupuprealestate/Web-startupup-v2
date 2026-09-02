import * as React from 'react';
import { cn } from './cn';

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The row of items to scroll. It is rendered twice so the loop is seamless. */
  children?: React.ReactNode;
}

/**
 * Continuously scrolling row - used for the partner/logo strip. Children are
 * duplicated internally to make the loop seamless, and the animation pauses on
 * hover.
 */
export function Marquee({ className, children, ...props }: MarqueeProps) {
  return (
    <div className={cn('w-full overflow-hidden relative', className)} {...props}>
      <div className="animate-marquee">
        <div className="flex items-center shrink-0">{children}</div>
        <div className="flex items-center shrink-0" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
