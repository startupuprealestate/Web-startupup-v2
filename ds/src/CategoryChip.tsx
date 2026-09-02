import * as React from 'react';
import { Home } from 'lucide-react';
import { cn } from './cn';

export interface CategoryChipProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon shown before the text. Defaults to the house glyph. */
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Frosted white chip that names a property's category. Designed to sit over a
 * photograph - it uses a translucent background and a backdrop blur.
 */
export function CategoryChip({ icon, className, children, ...props }: CategoryChipProps) {
  return (
    <div
      className={cn(
        'bg-white/95 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-full font-medium text-xs shadow-sm inline-flex items-center gap-1.5',
        className
      )}
      {...props}
    >
      {icon ?? <Home size={14} className="text-brand-green" />}
      {children}
    </div>
  );
}
