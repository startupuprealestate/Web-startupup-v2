import * as React from 'react';
import { cn } from './cn';

export interface SoldOutRibbonProps {
  /** Matches the ribbon to the card it sits on: `sm` for compact list rows, `lg` for the detail hero. */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * The diagonal red "SOLD OUT" ribbon pinned to the top-right corner of a
 * property image. Position it inside a `relative`, `overflow-hidden` parent.
 */
export function SoldOutRibbon({ size = 'md' }: SoldOutRibbonProps) {
  const sizeClass = size === 'sm' ? 'sold-out-ribbon-sm' : size === 'lg' ? 'sold-out-ribbon-lg' : '';
  return (
    <div className={cn('sold-out-ribbon', sizeClass)} aria-label="Sold out">
      <span>SOLD OUT</span>
    </div>
  );
}
