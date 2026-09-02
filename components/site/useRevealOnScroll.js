/**
 * useRevealOnScroll — ทำให้ส่วนที่ติดคลาส .reveal-on-scroll ค่อย ๆ ลอยขึ้นมาเมื่อเลื่อนถึง
 *
 * สำคัญ : styles/globals.css ตั้ง .reveal-on-scroll ไว้ที่ opacity 0 ตั้งแต่แรก
 * แล้วรอให้ตัวนี้เติมคลาส .is-revealed ให้ ถ้าหน้าไหนลืมเรียก hook นี้
 * เนื้อหาทั้งหน้าจะโปร่งใสถาวร — ดูเหมือนไม่มีข้อมูลทั้งที่ render ครบแล้ว
 *
 * ตรรกะเดียวกับที่หน้าเดิมใช้ใน components/site/SiteApp.js
 *
 * @param {Array} deps สิ่งที่เปลี่ยนแล้วต้องไล่หา element ใหม่ (เปลี่ยนแท็บ, ข้อมูลมาถึง ฯลฯ)
 */

import { useEffect } from 'react';

export default function useRevealOnScroll(deps = []) {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-revealed');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    // รอให้ React วาดเสร็จก่อนค่อยไล่เก็บ element
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
    }, 100);

    /**
     * ตัวกันพลาด : ถ้า observer ไม่ยิง (เบราว์เซอร์เก่า, จังหวะโหลดชนกัน, หรือ element
     * โผล่หลังจากที่เราไล่เก็บไปแล้ว) เนื้อหาจะโปร่งใสค้างถาวร
     * เลยเช็คซ้ำอีกรอบ แล้วเปิดให้เฉพาะตัวที่อยู่ในจอแล้วจริง ๆ
     * ส่วนที่ยังอยู่ล่าง ๆ ปล่อยให้ observer ทำงานตามปกติ จะได้ยังมีอนิเมชันตอนเลื่อน
     */
    const safety = setTimeout(() => {
      document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)').forEach((el) => {
        const box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) el.classList.add('is-revealed');
      });
    }, 1200);

    return () => {
      clearTimeout(timer);
      clearTimeout(safety);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
