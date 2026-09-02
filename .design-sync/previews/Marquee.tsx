import { Marquee } from '@startupup/ds';
import { Home, Building2, Trees, Store, MapPinned } from 'lucide-react';

const Item = ({ children }: { children: React.ReactNode }) => (
  <span className="flex items-center gap-2 px-8 text-gray-500 font-light whitespace-nowrap">
    {children}
  </span>
);

export const Default = () => (
  <div className="w-full max-w-2xl py-4">
    <Marquee>
      <Item>
        <Home size={18} className="text-brand-green" /> บ้านเดี่ยว
      </Item>
      <Item>
        <Building2 size={18} className="text-brand-green" /> คอนโด
      </Item>
      <Item>
        <Trees size={18} className="text-brand-green" /> ที่ดินเปล่า
      </Item>
      <Item>
        <Store size={18} className="text-brand-green" /> อาคารพาณิชย์
      </Item>
      <Item>
        <MapPinned size={18} className="text-brand-green" /> เพชรบูรณ์
      </Item>
    </Marquee>
  </div>
);

export const PhotoStrip = () => (
  <div className="w-full max-w-2xl py-4">
    <Marquee>
      {[
        'photo-1568605114967-8130f3a36994',
        'photo-1580587771525-78b9dba3b914',
        'photo-1512917774080-9991f1c4c750',
      ].map((id) => (
        <img
          key={id}
          src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=320&q=70`}
          alt=""
          className="w-[200px] h-[130px] object-cover rounded-2xl mx-3"
        />
      ))}
    </Marquee>
  </div>
);
