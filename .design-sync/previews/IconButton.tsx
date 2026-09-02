import { IconButton } from '@startupup/ds';
import { ChevronLeft, ChevronRight, Heart, Share2, Pencil } from 'lucide-react';

export const Circle = () => (
  <div className="flex items-center gap-3">
    <IconButton aria-label="ก่อนหน้า">
      <ChevronLeft size={18} />
    </IconButton>
    <IconButton aria-label="ถัดไป">
      <ChevronRight size={18} />
    </IconButton>
  </div>
);

export const Ghost = () => (
  <div className="flex items-center gap-3">
    <IconButton variant="ghost" aria-label="บันทึกไว้ดูภายหลัง">
      <Heart size={18} />
    </IconButton>
    <IconButton variant="ghost" aria-label="แชร์ประกาศ">
      <Share2 size={18} />
    </IconButton>
    <IconButton variant="ghost" aria-label="แก้ไข">
      <Pencil size={18} />
    </IconButton>
  </div>
);

export const Disabled = () => (
  <div className="flex items-center gap-3">
    <IconButton aria-label="ก่อนหน้า" disabled>
      <ChevronLeft size={18} />
    </IconButton>
    <IconButton variant="ghost" aria-label="แชร์ประกาศ" disabled>
      <Share2 size={18} />
    </IconButton>
  </div>
);

export const CarouselHeader = () => (
  <div className="flex items-center justify-between w-full max-w-2xl">
    <h3 className="text-lg font-medium text-brand-green border-l-4 border-brand-green pl-3">
      บ้านมาใหม่
    </h3>
    <div className="flex items-center gap-2">
      <IconButton aria-label="เลื่อนซ้าย">
        <ChevronLeft size={18} />
      </IconButton>
      <IconButton aria-label="เลื่อนขวา">
        <ChevronRight size={18} />
      </IconButton>
    </div>
  </div>
);
