import * as React from 'react';
import { cn } from './cn';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
}

/** Low-emphasis brand-tinted label - project type, area, and other metadata. */
export function Tag({ className, children, ...props }: TagProps) {
  return (
    <span
      className={cn(
        'bg-brand-green/10 text-brand-green px-3 py-1 rounded-full text-[11px] font-medium tracking-wide inline-block',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
