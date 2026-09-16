# Tracking ส่วนทำเลหน้าแรก

Container ของหัวข้อและการ์ดทำเลใน `components/site/CinemaHero.js` ใช้ ID
`home-locations` (CSS selector: `#home-locations`) โดยกล่องนี้เลื่อนเข้า viewport
พร้อมเนื้อหาจริง และถูกซ่อนไว้ก่อนถึงฉากทำเล

## ตั้งค่าใน GTM

- Trigger type: **Element Visibility**
- Selection method: **ID**
- Element ID: **home-locations** (ไม่ใส่ `#`)
- When to fire: **Once per page**
- Minimum Percent Visible: **50**
- Observe DOM changes: **เปิด** เพราะหน้าเว็บสร้างส่วนนี้ด้วย React
- Trigger: `EV - Home Locations - 50% - Once per page`
- Tag: `GA4 - View Locations` ส่ง event `view_locations`
- Measurement ID: `G-989XMRNC6Y`

เผยแพร่แล้วใน GTM `GTM-N27PQGL2` เวอร์ชัน 27 เมื่อ 16 กันยายน 2026
ชื่อเวอร์ชัน `Track home location views in GA4`
การกำหนด `view_locations` เป็น GA4 key event ยังรอสิทธิ์แก้ไข GA4:
บัญชีที่ใช้ตรวจสอบมีปุ่มสร้างเหตุการณ์และสลับสถานะ key event เป็น disabled
สิทธิ์นี้แยกจากสิทธิ์เผยแพร่ GTM

ผลตรวจ Tag Assistant บน `/v4` วันที่ 16 กันยายน 2026:
- ก่อนเลื่อนถึงทำเล tag ยังไม่ทำงาน
- เมื่อส่วนทำเลแสดงใน viewport เกิด `gtm.elementVisibility` และ tag ทำงาน 1 ครั้ง
- เลื่อนออกและกลับเข้าใหม่ จำนวนครั้งยังเป็น 1
- พบ Hit `view_locations` ไปยัง `https://analytics.google.com/g/collect`
  โดยมี `tid=G-989XMRNC6Y`
- ยังไม่ได้ยืนยันการปรากฏในรายงาน GA4 Realtime/DebugView ณ เวลาตรวจ

หากใช้การนำทางภายในเว็บโดยไม่ reload ให้ตรวจพฤติกรรม Once per page
ใน Preview ด้วย เพราะการกลับหน้าหลักอาจยังเป็น page เดิมของ GTM

## ตรวจหลัง deploy

1. เปิด GTM Preview / Tag Assistant ที่หน้าแรก ตรวจว่า `home-locations` มีเพียงหนึ่งตัว
2. ก่อนเลื่อนถึงทำเลต้องยังไม่เกิด event นี้
3. เลื่อนจนเห็นกล่องทำเลอย่างน้อย 50% ต้องเกิด Element Visibility และ tag ที่ผูกไว้
4. เลื่อนออกแล้วกลับเข้ามา ต้องไม่ยิงซ้ำใน page เดิม
5. ตรวจทั้ง desktop และ mobile รวมถึงการกลับหน้าแรกผ่านเมนูภายในเว็บ
6. ตรวจ Console / Network ว่า Google Ads และ TikTok requests ไม่ถูก CSP บล็อก
   และยืนยันการรับ event ใน Tag Assistant / GA4 DebugView / TikTok Events Manager

## CSP

`next.config.mjs` อนุญาต endpoint ของ Google Ads และ TikTok ที่ใช้งานอยู่
แยกตาม script, image, connection และ iframe โดยยังคง CSP เดิมไว้
รองรับ Google country endpoint ของไทย (`www.google.co.th`); หากแท็กใช้ประเทศอื่น
หรือเพิ่มผู้ให้บริการใหม่ ให้ตรวจ hostname ที่ถูกบล็อกแล้วอนุญาตเฉพาะที่จำเป็น
ต้อง restart server / deploy ใหม่เพื่อให้ header เปลี่ยน

ข้อผิดพลาดในรูปเป็น Tracking ที่ถูก CSP บล็อก การแก้ช่วยให้แท็กทำงานได้
แต่ไม่ได้ยืนยันว่าเว็บเร็วขึ้น เพราะแท็กที่เคยถูกบล็อกจะเริ่มโหลดได้
ควรวัด performance แยกหากต้องการเปรียบเทียบความเร็ว

อ้างอิง:

- [Google: CSP สำหรับ GTM และ Google Ads](https://developers.google.com/tag-platform/security/guides/csp)
- [Google: Element Visibility trigger](https://support.google.com/tagmanager/answer/7679410?hl=en)
