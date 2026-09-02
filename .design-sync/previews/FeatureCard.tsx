import { FeatureCard } from '@startupup/ds';
import { ShieldCheck, HandCoins, MapPinned } from 'lucide-react';

export const Default = () => (
  <div className="max-w-sm">
    <FeatureCard
      title="คัดสรรทุกหลัง"
      description="ทีมงานลงพื้นที่ตรวจสภาพบ้านและเอกสารสิทธิ์ทุกหลังก่อนลงประกาศ คุณจึงเห็นเฉพาะบ้านที่พร้อมโอนจริง"
    />
  </div>
);

export const WithCustomIcon = () => (
  <div className="max-w-sm">
    <FeatureCard
      icon={<ShieldCheck size={24} />}
      title="ปลอดภัย ตรวจสอบได้"
      description="ตรวจสอบโฉนด ภาระผูกพัน และประวัติเจ้าของก่อนทุกดีล มีเอกสารยืนยันให้ครบทุกขั้นตอน"
    />
  </div>
);

export const Grid = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-3xl">
    <FeatureCard
      icon={<ShieldCheck size={24} />}
      title="ปลอดภัย ตรวจสอบได้"
      description="ตรวจโฉนดและภาระผูกพันก่อนทุกดีล"
    />
    <FeatureCard
      icon={<HandCoins size={24} />}
      title="ช่วยเรื่องสินเชื่อ"
      description="ประเมินวงเงินและยื่นกู้กับหลายธนาคารให้ฟรี"
    />
    <FeatureCard
      icon={<MapPinned size={24} />}
      title="รู้ทำเลจริง"
      description="ข้อมูลทำเล ราคาตลาด และแนวโน้มการพัฒนาในย่านนั้น"
    />
  </div>
);
