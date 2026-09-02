import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from './cn';

export interface FeatureCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Icon placed in the rounded brand-light tile. Defaults to a star. */
  icon?: React.ReactNode;
  /** Heading of the selling point. */
  title: React.ReactNode;
  /** Supporting copy under the heading. */
  description?: React.ReactNode;
}

/**
 * A selling-point card - rounded white panel with a brand-light icon tile that
 * lifts on hover. Used in the "why choose us" grid.
 */
export function FeatureCard({
  icon,
  title,
  description,
  className,
  children,
  ...props
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'bg-white p-6 md:p-8 rounded-3xl shadow-sm transition hover:shadow-md hover:-translate-y-1',
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 md:w-14 md:h-14 bg-brand-light text-brand-green rounded-2xl flex items-center justify-center mb-5 md:mb-6">
        {icon ?? <Star size={24} />}
      </div>
      <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 md:mb-3">{title}</h3>
      {description && <p className="text-gray-500 font-light leading-relaxed">{description}</p>}
      {children}
    </div>
  );
}
