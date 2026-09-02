import { StaticValue, Label } from '@startupup/ds';

export const Default = () => (
  <div className="w-80">
    <StaticValue>30 ปี</StaticValue>
  </div>
);

export const Labelled = () => (
  <div className="w-80">
    <Label>ผ่อนต่อเดือน (ประมาณ)</Label>
    <StaticValue>26,050 บาท</StaticValue>
  </div>
);

export const NextToAnInput = () => (
  <div className="w-full max-w-md grid grid-cols-2 gap-4">
    <div>
      <Label>ระยะเวลา (ปี)</Label>
      <StaticValue>30 ปี</StaticValue>
    </div>
    <div>
      <Label>ยอดรวมดอกเบี้ย</Label>
      <StaticValue>4,788,000 บาท</StaticValue>
    </div>
  </div>
);

export const Empty = () => (
  <div className="w-80">
    <Label>ระยะเวลา (ปี)</Label>
    <StaticValue>-</StaticValue>
  </div>
);
