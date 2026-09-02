import { Tag } from '@startupup/ds';

export const Default = () => <Tag>บ้านเดี่ยว</Tag>;

export const Group = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Tag>บ้านเดี่ยว</Tag>
    <Tag>ทาวน์โฮม</Tag>
    <Tag>คอนโด</Tag>
    <Tag>ที่ดินเปล่า</Tag>
    <Tag>อาคารพาณิชย์</Tag>
  </div>
);

export const InACardHeader = () => (
  <div className="w-[320px] bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
    <Tag>พร้อมโอน</Tag>
    <h4 className="font-bold text-gray-800 text-[18px] mt-3 mb-1">
      บ้านเดี่ยว ศุภาลัย ริเวอร์ วิลล์
    </h4>
    <p className="text-[13px] text-gray-500 font-light">บางนา - ศรีนครินทร์</p>
  </div>
);
