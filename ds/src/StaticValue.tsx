import * as React from 'react';
import { cn } from './cn';

export interface StaticValueProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

/**
 * A computed, non-editable value shown in the shape of an input - used for
 * derived figures such as a loan term the calculator works out for you.
 */
export function StaticValue({ className, children, ...props }: StaticValueProps) {
  return (
    <div
      className={cn('input-modern bg-gray-50 text-gray-500 border-transparent', className)}
      {...props}
    >
      {children}
    </div>
  );
}
