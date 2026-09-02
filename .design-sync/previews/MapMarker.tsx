import { MapMarker } from '@startupup/ds';

export const Tones = () => (
  <div className="flex flex-wrap items-center gap-4">
    <MapMarker tone="white">฿4.59M</MapMarker>
    <MapMarker tone="green">฿2.89M</MapMarker>
    <MapMarker tone="light">เพชรบูรณ์ 12 หลัง</MapMarker>
  </div>
);

export const OnAMap = () => (
  <div className="relative w-full max-w-xl h-[280px] rounded-2xl overflow-hidden bg-[#eaf0ec] border border-gray-200">
    <div className="absolute inset-0 opacity-40 bg-[linear-gradient(90deg,#cfe0d5_1px,transparent_1px),linear-gradient(#cfe0d5_1px,transparent_1px)] bg-[length:40px_40px]" />
    <div className="absolute top-8 left-10">
      <MapMarker tone="green">฿4.59M</MapMarker>
    </div>
    <div className="absolute top-28 left-48">
      <MapMarker tone="white">฿2.89M</MapMarker>
    </div>
    <div className="absolute bottom-12 right-16">
      <MapMarker tone="light">หล่มสัก 8 หลัง</MapMarker>
    </div>
  </div>
);

export const LongLabel = () => (
  <MapMarker tone="white">โครงการศุภาลัย ริเวอร์ วิลล์ เฟส 2</MapMarker>
);
