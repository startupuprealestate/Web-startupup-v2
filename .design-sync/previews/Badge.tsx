import { Badge } from '@startupup/ds';

export const Tones = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Badge tone="promotion">Promotion</Badge>
    <Badge tone="new">New</Badge>
    <Badge>แนะนำ</Badge>
  </div>
);

export const OverAPhoto = () => (
  <div className="relative w-[300px] h-[200px] rounded-2xl overflow-hidden">
    <img
      src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=70"
      alt="บ้านเดี่ยว"
      className="w-full h-full object-cover"
    />
    <Badge tone="promotion" className="absolute top-3 right-3">
      ลดพิเศษ
    </Badge>
  </div>
);

export const ThaiLabels = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Badge tone="promotion">ลดพิเศษ</Badge>
    <Badge tone="new">มาใหม่</Badge>
    <Badge>พร้อมโอน</Badge>
  </div>
);
