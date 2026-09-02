import * as React from 'react';
import { cn } from './cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Appends the red asterisk used on required form fields. */
  required?: boolean;
}

/** Form label - small, light grey, sits above its control. */
export function Label({ required = false, className, children, ...props }: LabelProps) {
  return (
    <label className={cn('label', className)} {...props}>
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}
