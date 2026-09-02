import { CategoryChip } from '@startupup/ds';
import { Building2, Trees, Store } from 'lucide-react';

export const Default = () => <CategoryChip>บ้านเดี่ยว</CategoryChip>;

export const Icons = () => (
  <div className="flex flex-wrap items-center gap-3">
    <CategoryChip>บ้านเดี่ยว</CategoryChip>
    <CategoryChip icon={<Building2 size={14} className="text-brand-green" />}>คอนโด</CategoryChip>
    <CategoryChip icon={<Trees size={14} className="text-brand-green" />}>ที่ดินเปล่า</CategoryChip>
    <CategoryChip icon={<Store size={14} className="text-brand-green" />}>อาคารพาณิชย์</CategoryChip>
  </div>
);

export const OverAPhoto = () => (
  <div className="relative w-[300px] h-[200px] rounded-2xl overflow-hidden">
    <img
      src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=70"
      alt="ทาวน์โฮม"
      className="w-full h-full object-cover"
    />
    <CategoryChip className="absolute top-3 left-3">ทาวน์โฮม</CategoryChip>
  </div>
);
