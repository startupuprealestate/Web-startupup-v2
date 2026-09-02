import { PropertyCard } from '@startupup/ds';

const HOUSE =
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=70';
const TOWNHOME =
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=70';
const CONDO =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=70';

export const Default = () => (
  <PropertyCard
    title="บ้านเดี่ยว ศุภาลัย ริเวอร์ วิลล์"
    image={HOUSE}
    location="บางนา - ศรีนครินทร์"
    price={4590000}
    category="บ้านเดี่ยว"
    areaWah={52}
    bedrooms={3}
    bathrooms={2}
    href="#"
  />
);

export const WithBadges = () => (
  <div className="flex flex-wrap gap-6">
    <PropertyCard
      title="ทาวน์โฮม 2 ชั้น กลางเมือง"
      image={TOWNHOME}
      location="เมืองเพชรบูรณ์ - ในเมือง"
      price={2890000}
      category="ทาวน์โฮม"
      badge="New"
      badgeTone="new"
      areaWah={24}
      bedrooms={3}
      bathrooms={2}
      href="#"
    />
    <PropertyCard
      title="คอนโดวิวแม่น้ำ ชั้นสูง"
      image={CONDO}
      location="หล่มสัก - ริมน้ำ"
      price={1750000}
      category="คอนโด"
      badge="Promotion"
      badgeTone="promotion"
      areaWah={18}
      bedrooms={1}
      bathrooms={1}
      href="#"
    />
  </div>
);

export const SoldOut = () => (
  <PropertyCard
    title="บ้านเดี่ยวพร้อมสวน 60 ตร.ว."
    image={HOUSE}
    location="วังชมภู - ท่าพล"
    price={3250000}
    category="บ้านเดี่ยว"
    soldOut
    areaWah={60}
    bedrooms={4}
    bathrooms={3}
    href="#"
  />
);

export const FluidGrid = () => (
  <div className="grid grid-cols-3 gap-6">
    <PropertyCard
      layout="fluid"
      title="บ้านเดี่ยว ศุภาลัย ริเวอร์ วิลล์"
      image={HOUSE}
      location="บางนา - ศรีนครินทร์"
      price={4590000}
      category="บ้านเดี่ยว"
      areaWah={52}
      bedrooms={3}
      bathrooms={2}
      href="#"
    />
    <PropertyCard
      layout="fluid"
      title="ทาวน์โฮม 2 ชั้น กลางเมือง"
      image={TOWNHOME}
      location="เมืองเพชรบูรณ์ - ในเมือง"
      price={2890000}
      category="ทาวน์โฮม"
      badge="New"
      badgeTone="new"
      areaWah={24}
      bedrooms={3}
      bathrooms={2}
      href="#"
    />
    <PropertyCard
      layout="fluid"
      title="คอนโดวิวแม่น้ำ ชั้นสูง"
      image={CONDO}
      location="หล่มสัก - ริมน้ำ"
      price={1750000}
      category="คอนโด"
      areaWah={18}
      bedrooms={1}
      bathrooms={1}
      href="#"
    />
  </div>
);
