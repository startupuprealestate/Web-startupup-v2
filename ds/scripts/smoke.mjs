import { renderToStaticMarkup } from 'react-dom/server';
import { createElement as h } from 'react';
import * as DS from '../dist/index.js';

const cases = {
  Button: h(DS.Button, {}, 'บันทึกข้อมูล'),
  ButtonOutline: h(DS.Button, { variant: 'outline' }, 'ตัวกรอง'),
  IconButton: h(DS.IconButton, { 'aria-label': 'ถัดไป' }, '>'),
  Label: h(DS.Label, { required: true }, 'ชื่อโครงการ'),
  Input: h(DS.Input, { placeholder: 'ค้นหา...' }),
  StaticValue: h(DS.StaticValue, {}, '30 ปี'),
  Field: h(DS.Field, { label: 'ดอกเบี้ย (%)', required: true }, h(DS.Input, { defaultValue: '5.5' })),
  Badge: h(DS.Badge, { tone: 'promotion' }, 'Promotion'),
  Tag: h(DS.Tag, {}, 'บ้านเดี่ยว'),
  CategoryChip: h(DS.CategoryChip, {}, 'ทาวน์โฮม'),
  SoldOutRibbon: h(DS.SoldOutRibbon, { size: 'lg' }),
  PropertyCard: h(DS.PropertyCard, {
    title: 'บ้านเดี่ยว ศุภาลัย ริเวอร์ วิลล์',
    location: 'บางนา - ศรีนครินทร์',
    price: 4590000, category: 'บ้านเดี่ยว', badge: 'New', badgeTone: 'new',
    areaWah: 52, bedrooms: 3, bathrooms: 2, href: '#',
  }),
  PropertyCardSkeleton: h(DS.PropertyCardSkeleton, {}),
  FeatureCard: h(DS.FeatureCard, { title: 'คัดสรรทุกหลัง', description: 'ตรวจสอบเอกสารครบ' }),
  SectionHeading: h(DS.SectionHeading, {}, 'บ้านแนะนำ'),
  MapMarker: h(DS.MapMarker, { tone: 'green' }, '฿4.59M'),
  Reveal: h(DS.Reveal, { delay: 100 }, 'เนื้อหา'),
  Marquee: h(DS.Marquee, {}, h('span', { className: 'px-6' }, 'พาร์ทเนอร์')),
};

let fail = 0;
for (const [name, el] of Object.entries(cases)) {
  try {
    const html = renderToStaticMarkup(el);
    if (!html || html.length < 5) throw new Error('empty output');
    console.log(`ok   ${name.padEnd(22)} ${html.length} bytes`);
  } catch (e) {
    fail++;
    console.log(`FAIL ${name.padEnd(22)} ${e.message}`);
  }
}
const missing = Object.keys(DS).filter((k) => k !== 'cn' && !(k in cases));
if (missing.length) console.log('NOT COVERED:', missing.join(', '));
console.log(fail ? `\n${fail} failed` : `\nall ${Object.keys(cases).length} rendered`);
process.exit(fail ? 1 : 0);
