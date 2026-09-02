import { Reveal, FeatureCard } from '@startupup/ds';
import { ShieldCheck, HandCoins, MapPinned } from 'lucide-react';

// `immediate` renders the revealed end state so the card captures a stable
// frame. In a real page you omit it and the entrance fires on scroll.

export const Default = () => (
  <Reveal immediate>
    <div className="w-full max-w-lg text-center">
      <h2 className="text-2xl font-bold text-brand-green mb-2">บ้านคุณภาพ คัดมาแล้วทุกหลัง</h2>
      <p className="text-gray-500 font-light">
        เลือกดูบ้านพร้อมโอนในเพชรบูรณ์และจังหวัดใกล้เคียง
      </p>
    </div>
  </Reveal>
);

export const StaggeredGroup = () => (
  <div className="grid grid-cols-3 gap-6 w-full">
    <Reveal immediate>
      <FeatureCard
        icon={<ShieldCheck size={24} />}
        title="ปลอดภัย"
        description="ตรวจโฉนดก่อนทุกดีล"
      />
    </Reveal>
    <Reveal immediate delay={100}>
      <FeatureCard
        icon={<HandCoins size={24} />}
        title="ช่วยเรื่องกู้"
        description="ยื่นหลายธนาคารให้ฟรี"
      />
    </Reveal>
    <Reveal immediate delay={200}>
      <FeatureCard
        icon={<MapPinned size={24} />}
        title="รู้ทำเล"
        description="ข้อมูลราคาตลาดจริง"
      />
    </Reveal>
  </div>
);
