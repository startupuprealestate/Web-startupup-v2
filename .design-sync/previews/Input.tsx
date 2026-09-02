import { Input } from '@startupup/ds';

export const Default = () => (
  <div className="w-80">
    <Input placeholder="ค้นหาทำเล เช่น หล่มสัก, วังชมภู" />
  </div>
);

export const WithValue = () => (
  <div className="w-80">
    <Input defaultValue="บ้านเดี่ยว ศุภาลัย ริเวอร์ วิลล์" />
  </div>
);

export const Numeric = () => (
  <div className="w-80 space-y-3">
    <Input inputMode="numeric" defaultValue="4,590,000" />
    <Input inputMode="numeric" defaultValue="5.5" />
  </div>
);

export const Disabled = () => (
  <div className="w-80">
    <Input defaultValue="แก้ไขไม่ได้ในโหมดนี้" disabled className="opacity-60" />
  </div>
);

export const InAForm = () => (
  <div className="w-96 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
    <div>
      <label className="label">ชื่อโครงการ</label>
      <Input defaultValue="ศุภาลัย ริเวอร์ วิลล์" />
    </div>
    <div>
      <label className="label">ราคา (บาท)</label>
      <Input inputMode="numeric" defaultValue="4,590,000" />
    </div>
  </div>
);
