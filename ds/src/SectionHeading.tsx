import * as React from 'react';
import { cn } from './cn';

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** `rule` is the green left bar used above listing rails. `centered` is the large centred heading used between page sections. */
  variant?: 'rule' | 'centered';
  children?: React.ReactNode;
}

/** Section title in brand green - either with a left rule or centred. */
export function SectionHeading({
  variant = 'rule',
  className,
  children,
  ...props
}: SectionHeadingProps) {
  const styles =
    variant === 'rule'
      ? 'text-lg md:text-xl font-medium text-brand-green border-l-4 border-brand-green pl-3'
      : 'text-2xl md:text-3xl font-bold text-brand-green text-center';

  return (
    <h2 className={cn(styles, className)} {...props}>
      {children}
    </h2>
  );
}
