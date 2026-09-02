import { PropertyCardSkeleton, PropertyCard } from '@startupup/ds';

export const Default = () => <PropertyCardSkeleton />;

export const LoadingRail = () => (
  <div className="flex gap-6">
    <PropertyCardSkeleton />
    <PropertyCardSkeleton />
  </div>
);

export const FillingAGap = () => (
  <div className="flex gap-6">
    <PropertyCard
      title="บ้านเดี่ยว ศุภาลัย ริเวอร์ วิลล์"
      image="https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=70"
      location="บางนา - ศรีนครินทร์"
      price={4590000}
      category="บ้านเดี่ยว"
      areaWah={52}
      bedrooms={3}
      bathrooms={2}
      href="#"
    />
    <PropertyCardSkeleton />
  </div>
);
