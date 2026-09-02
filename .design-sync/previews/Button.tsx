import { Button } from '@startupup/ds';
import { Plus, Search } from 'lucide-react';

export const Primary = () => <Button>บันทึกข้อมูล</Button>;

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-4">
    <Button>บันทึกข้อมูล</Button>
    <Button variant="outline">ตัวกรอง</Button>
  </div>
);

export const WithIcon = () => (
  <div className="flex flex-wrap items-center gap-4">
    <Button>
      <Plus size={16} /> เพิ่มบ้านใหม่
    </Button>
    <Button variant="outline">
      <Search size={16} /> ค้นหาทำเล
    </Button>
  </div>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-4">
    <Button size="md">ขนาดปกติ</Button>
    <Button size="sm">ขนาดเล็ก</Button>
    <Button variant="outline" size="sm">
      เล็ก / outline
    </Button>
  </div>
);

export const Disabled = () => (
  <div className="flex flex-wrap items-center gap-4">
    <Button disabled>กำลังบันทึก…</Button>
    <Button variant="outline" disabled>
      ไม่พร้อมใช้งาน
    </Button>
  </div>
);
