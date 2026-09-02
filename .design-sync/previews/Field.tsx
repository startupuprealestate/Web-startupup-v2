import { Field, Input, StaticValue } from '@startupup/ds';

export const Default = () => (
  <div className="w-80">
    <Field label="ดอกเบี้ย (%)">
      <Input inputMode="numeric" defaultValue="5.5" />
    </Field>
  </div>
);

export const Required = () => (
  <div className="w-80">
    <Field label="ชื่อโครงการ" required>
      <Input defaultValue="ศุภาลัย ริเวอร์ วิลล์" />
    </Field>
  </div>
);

export const WithComputedValue = () => (
  <div className="w-80">
    <Field label="ระยะเวลาผ่อน (ปี)">
      <StaticValue>30 ปี</StaticValue>
    </Field>
  </div>
);

export const LoanCalculator = () => (
  <div className="w-full max-w-2xl bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
    <div className="grid grid-cols-2 gap-4">
      <Field label="วงเงินกู้ (บาท)" required className="col-span-2">
        <Input inputMode="numeric" defaultValue="4,590,000" />
      </Field>
      <Field label="ดอกเบี้ย (%)">
        <Input inputMode="numeric" defaultValue="5.5" />
      </Field>
      <Field label="อายุผู้กู้ (ปี)">
        <Input inputMode="numeric" defaultValue="35" />
      </Field>
      <Field label="ระยะเวลา (ปี)">
        <StaticValue>30 ปี</StaticValue>
      </Field>
      <Field label="ผ่อนต่อเดือน">
        <StaticValue>26,050 บาท</StaticValue>
      </Field>
    </div>
  </div>
);
