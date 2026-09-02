import { SoldOutRibbon } from '@startupup/ds';

const IMG =
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=70';

const Frame = ({ w, h, children }: { w: number; h: number; children: React.ReactNode }) => (
  <div className="relative rounded-2xl overflow-hidden" style={{ width: w, height: h }}>
    <img src={IMG} alt="บ้านเดี่ยว" className="w-full h-full object-cover" />
    {children}
  </div>
);

export const Default = () => (
  <Frame w={300} h={220}>
    <SoldOutRibbon />
  </Frame>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-start gap-6">
    <Frame w={200} h={150}>
      <SoldOutRibbon size="sm" />
    </Frame>
    <Frame w={280} h={200}>
      <SoldOutRibbon size="md" />
    </Frame>
    <Frame w={360} h={260}>
      <SoldOutRibbon size="lg" />
    </Frame>
  </div>
);
