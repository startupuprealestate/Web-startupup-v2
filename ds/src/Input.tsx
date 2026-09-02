import * as React from 'react';
import { cn } from './cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * The site's standard text input: full width, rounded, with a brand-green
 * focus ring and a faint green tint while focused.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return <input ref={ref} className={cn('input-modern', className)} {...props} />;
});
