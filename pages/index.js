/**
 * หน้าแรกของเว็บ — ใช้ดีไซน์ v4 แล้ว
 *
 * ของเดิมอยู่ที่ components/site/SiteApp.js ยังไม่ได้ลบ
 * ถ้าต้องย้อนกลับ เปลี่ยนไฟล์นี้เป็น export { default } from '../components/site/SiteApp';
 *
 * basePath เป็น '/' เพราะหน้านี้เขียนสถานะ (แท็บ / บ้านที่เลือก / คำค้น)
 * กลับลง query string ของ URL ตัวเอง ถ้าส่งผิดจะเด้งไป /v4 ตอนรีเฟรช
 */
import SiteV4 from '../components/site/SiteV4';

export default function Home() {
  return <SiteV4 basePath="/" />;
}
