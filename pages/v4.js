/**
 * /v4 — ยังเปิดได้เหมือนเดิมหลังจากที่หน้าแรกเปลี่ยนมาใช้ดีไซน์นี้แล้ว
 * ตัวโค้ดจริงอยู่ที่ components/site/SiteV4.js แบบเดียวกับที่หน้าเดิมทำไว้
 */
import SiteV4 from '../components/site/SiteV4';

export default function V4Page() {
  return <SiteV4 basePath="/v4" />;
}
