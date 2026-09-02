import * as React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from './cn';

export interface PropertyCardSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Match this to the `PropertyCard` it stands in for. */
  layout?: 'carousel' | 'fluid';
}

/** Dashed placeholder that holds a `PropertyCard`'s slot while listings load. */
export function PropertyCardSkeleton({
  layout = 'carousel',
  className,
  ...props
}: PropertyCardSkeletonProps) {
  const size =
    layout === 'carousel'
      ? 'w-[300px] min-w-[300px] h-[400px] min-h-[400px] snap-center flex-shrink-0'
      : 'w-full h-full';

  return (
    <div
      className={cn(
        'bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col opacity-60',
        size,
        className
      )}
      {...props}
    >
      <div className="h-[220px] w-full bg-gray-50 rounded-t-2xl flex items-center justify-center">
        <ImageIcon size={48} className="text-gray-300" />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-full mb-4" />
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}
