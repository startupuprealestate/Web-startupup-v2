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
- ผูก trigger กับ tag/event ที่ทีมการตลาดกำหนด เช่น GA4 `view_locations`
  แล้วกำหนดเป็น key event/conversion ในระบบปลายทางตามแผนการวัดผล

การเพิ่ม ID ยังไม่ได้สร้างหรือเผยแพร่ trigger/tag ในบัญชี GTM
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
