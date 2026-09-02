import { SectionHeading } from '@startupup/ds';

export const Rule = () => <SectionHeading>บ้านมาใหม่</SectionHeading>;

export const Centered = () => (
  <div className="w-full max-w-2xl">
    <SectionHeading variant="centered">ทำไมต้องเลือก Startup Up</SectionHeading>
  </div>
);

export const AboveARail = () => (
  <div className="w-full max-w-2xl">
    <SectionHeading className="mb-4">บ้านแนะนำในเพชรบูรณ์</SectionHeading>
    <div className="flex gap-4">
      <div className="h-24 flex-1 bg-gray-100 rounded-2xl" />
      <div className="h-24 flex-1 bg-gray-100 rounded-2xl" />
      <div className="h-24 flex-1 bg-gray-100 rounded-2xl" />
    </div>
  </div>
);
