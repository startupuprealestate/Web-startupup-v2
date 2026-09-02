import * as React from 'react';
import { MapPin, Maximize, Bed, Bath } from 'lucide-react';
import { Badge } from './Badge';
import { CategoryChip } from './CategoryChip';
import { SoldOutRibbon } from './SoldOutRibbon';
import { cn } from './cn';

export interface PropertyCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onClick'> {
  /** Project name - clamped to two lines. */
  title: string;
  /** Photograph of the property. Falls back to a placeholder when omitted. */
  image?: string;
  /** Location line under the title, e.g. "บางนา - ศรีนครินทร์". */
  location?: string;
  /** Price in baht. A number or a digit string; rendered with thousands separators after a ฿ sign. */
  price?: number | string;
  /** Category shown in the chip over the photo, e.g. "บ้านเดี่ยว". */
  category?: string;
  /** Status pill over the photo. Omit for no pill. */
  badge?: string;
  /** Colour of that pill. */
  badgeTone?: 'promotion' | 'new' | 'default';
  /** Draws the diagonal SOLD OUT ribbon instead of the status pill. */
  soldOut?: boolean;
  /** Land area in square wah. */
  areaWah?: number | string;
  /** Bedroom count. */
  bedrooms?: number | string;
  /** Bathroom count. */
  bathrooms?: number | string;
  /** Makes the whole card a link. */
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  /**
   * `carousel` (default) is the fixed 300x400 snap card used in the horizontal
   * rails on the home page. `fluid` lets the card fill its grid cell instead.
   */
  layout?: 'carousel' | 'fluid';
}

const PLACEHOLDER = 'https://placehold.co/600x400';

function formatPrice(price: number | string | undefined): string {
  if (price === undefined || price === null || price === '') return '-';
  const n = Number(String(price).replace(/,/g, ''));
  return Number.isFinite(n) ? n.toLocaleString() : String(price);
}

/**
 * The property listing card used across the site: photo with a category chip
 * and status pill, then title, location, price and the area / bed / bath row.
 */
export function PropertyCard({
  title,
  image,
  location,
  price,
  category,
  badge,
  badgeTone = 'default',
  soldOut = false,
  areaWah,
  bedrooms,
  bathrooms,
  href,
  onClick,
  layout = 'carousel',
  className,
  ...props
}: PropertyCardProps) {
  const Tag = (href ? 'a' : 'div') as 'a';
  const size =
    layout === 'carousel'
      ? 'w-[300px] min-w-[300px] h-[400px] min-h-[400px] snap-center flex-shrink-0'
      : 'w-full h-full';

  return (
    <Tag
      href={href}
      onClick={onClick}
      className={cn(
        'block bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]',
        'hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden flex flex-col',
        (href || onClick) && 'cursor-pointer',
        size,
        className
      )}
      {...props}
    >
      <div className="h-[220px] w-full relative overflow-hidden bg-gray-100 flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image || PLACEHOLDER}
          alt={title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
        {category && <CategoryChip className="absolute top-3 left-3 z-10">{category}</CategoryChip>}
        {!soldOut && badge && (
          <Badge tone={badgeTone} className="absolute top-3 right-3 z-10">
            {badge}
          </Badge>
        )}
        {soldOut && <SoldOutRibbon />}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h4 className="font-bold text-gray-800 text-[18px] mb-2 line-clamp-2 leading-snug">
          {title}
        </h4>
        {location && (
          <div className="text-[13px] text-gray-500 flex items-center gap-1.5 mb-4">
            <MapPin size={15} className="flex-shrink-0 text-gray-400" />
            <span className="font-light truncate">{location}</span>
          </div>
        )}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[20px] font-bold text-brand-green">
            <span className="text-[16px] mr-1">฿</span>
            {formatPrice(price)}
          </span>
          <div className="flex items-center gap-3 text-gray-500 text-[13px]">
            {areaWah !== undefined && (
              <div className="flex items-center gap-1.5" title="พื้นที่">
                <Maximize size={15} /> {areaWah}
              </div>
            )}
            {bedrooms !== undefined && (
              <div className="flex items-center gap-1.5" title="ห้องนอน">
                <Bed size={15} /> {bedrooms}
              </div>
            )}
            {bathrooms !== undefined && (
              <div className="flex items-center gap-1.5" title="ห้องน้ำ">
                <Bath size={15} /> {bathrooms}
              </div>
            )}
          </div>
        </div>
      </div>
    </Tag>
  );
}
