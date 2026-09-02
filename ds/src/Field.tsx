import * as React from 'react';
import { Label } from './Label';
import { cn } from './cn';

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Text of the field's label. */
  label: React.ReactNode;
  /** Marks the field required - renders the red asterisk. */
  required?: boolean;
  /** `htmlFor` passed through to the label. */
  htmlFor?: string;
  /** The control: an `Input`, a `StaticValue`, a select, etc. */
  children?: React.ReactNode;
}

/** A labelled form row - the `Label` + control pairing used throughout the forms. */
export function Field({ label, required, htmlFor, className, children, ...props }: FieldProps) {
  return (
    <div className={cn(className)} {...props}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
    </div>
  );
}
