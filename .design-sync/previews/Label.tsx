import { Label, Input } from '@startupup/ds';

export const Default = () => (
  <div className="w-80">
    <Label>ดอกเบี้ย (%)</Label>
    <Input inputMode="numeric" defaultValue="5.5" />
  </div>
);

export const Required = () => (
  <div className="w-80">
    <Label required>ชื่อโครงการ</Label>
    <Input defaultValue="ศุภาลัย ริเวอร์ วิลล์" />
  </div>
);

export const Stacked = () => (
  <div className="w-96 space-y-4">
    <div>
      <Label required>ชื่อโครงการ</Label>
      <Input defaultValue="ศุภาลัย ริเวอร์ วิลล์" />
    </div>
    <div>
      <Label>ทำเล</Label>
      <Input defaultValue="บางนา - ศรีนครินทร์" />
    </div>
  </div>
);
