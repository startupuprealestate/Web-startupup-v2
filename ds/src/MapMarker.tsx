import * as React from 'react';
import { cn } from './cn';

export interface MapMarkerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * `green` is the filled brand pin used for the active property, `white` the
   * default pin, `light` the muted brand-light pin used for grouped areas.
   */
  tone?: 'green' | 'white' | 'light';
  children?: React.ReactNode;
}

const TONES: Record<NonNullable<MapMarkerProps['tone']>, string> = {
  green: 'bg-brand-green text-white border-white',
  white: 'bg-white text-brand-green',
  light: 'bg-brand-light text-brand-green font-bold px-4 py-2',
};

/** Rounded map pin label used on the Leaflet property map. */
export function MapMarker({ tone = 'white', className, children, ...props }: MapMarkerProps) {
  return (
    <div
      className={cn(
        'custom-map-marker shadow-lg border-2 transition hover:scale-105 max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap',
        TONES[tone],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
