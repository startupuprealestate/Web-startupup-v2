# Brief: Startup Up — Cinematic Single-Page Site

Prompt สำหรับสั่งสร้างหน้าเว็บ cinematic ปรับให้เข้ากับ CI ของ Startup Up แล้ว
คัดลอกทั้งไฟล์นี้ไปใช้เป็น prompt ได้เลย

---

## 0. บทบาทและเป้าหมาย

Act as a world-class creative frontend developer, WebGL specialist, and UI/UX expert.
Build an ultra-premium, cinematic single-page website for **Startup Up** — a Thai
real-estate agency selling inspected pre-owned homes in Phetchabun province and
nearby. The audience is Thai, majority on mobile. The site must feel editorial and
expensive without ever getting in the way of a buyer finding a house.

**ภาษา:** เนื้อหาบนหน้าเป็นภาษาไทยทั้งหมด ยกเว้น label ตกแต่งที่ระบุว่าให้ใช้อังกฤษ

---

## 1. DESIGN SYSTEM & FOUNDATION

### 1.1 Palette — two colors + one accent

ใช้สองสีหลักนี้เท่านั้นทั้งไซต์:

| Token | Value | ใช้ทำอะไร |
|---|---|---|
| `--ink` | `#0B3D1B` | สีเขียวแบรนด์ ใช้เป็นพื้นเข้มหลัก |
| `--paper` | `#F5F2EB` | ครีมอุ่น พื้นสว่าง |
| `--accent` | `#C8A24A` | ทองเหลืองด้าน — ใช้เฉพาะ interactive highlight (เคาะแล้ว) |

- `#061A0E` อนุญาตให้ใช้เป็นเฉดลึกของ `--ink` สำหรับ gradient/shadow เท่านั้น
  ไม่นับเป็นสีที่สาม
- `#EEF3F0` (brand light เดิม) ใช้ได้เฉพาะเป็นพื้น tile ของไอคอน
- **สีสถานะห้ามเอามาใช้เป็น accent**: แดง `#DC2626` (โปรโมชั่น / SOLD OUT) และ
  น้ำเงิน `#2563EB` (มาใหม่) สงวนไว้สำหรับป้ายสถานะบ้านเท่านั้น
- เหตุผลที่เลือกทองเหลืองแทนส้ม/ฟ้า: ส้มชนกับป้ายโปรโมชั่นสีแดง ฟ้า/ไซแอนตัดกับ
  เขียวเข้มแล้วดูเย็นจนไม่เหมือนแบรนด์ ทองเหลืองเข้ากับเขียวเข้มและอ่านว่าพรีเมียม

### 1.2 Typography — Prompt (ฟอนต์แบรนด์)

ใช้ **Prompt** ทั้งไซต์ (Thai + Latin) โหลดแบบ self-host ไม่พึ่ง Google Fonts CDN

**⚠ ข้อบังคับสำหรับภาษาไทย — ห้ามข้าม:**

```css
/* Hero headline */
font-size: clamp(2.75rem, 11vw, 9rem);
font-weight: 700;
line-height: 1.05;        /* ห้ามต่ำกว่า 1.0 */
letter-spacing: -0.01em;  /* ห้ามติดลบเกินนี้ */
```

เหตุผล: ต้นฉบับสั่ง `line-height: 0.85` กับ `letter-spacing: -0.04em` ซึ่งใช้ได้กับ
ภาษาอังกฤษเท่านั้น ภาษาไทยมีสระบนและวรรณยุกต์ซ้อนสองชั้น (เช่น "ที่" "ไม้" "ปื้น")
ถ้าบีบบรรทัดขนาดนั้นวรรณยุกต์จะทับบรรทัดบนและถูกตัดหาย และ tracking ติดลบมาก ๆ
จะทำให้สระลอยไปเกาะผิดตัวอักษร

- ถ้าต้องการน้ำหนัก 800/900 ต้องเพิ่มไฟล์ woff2 น้ำหนักนั้นด้วย (ตอนนี้มี 300–700)
- **Side label แนวตั้ง** (`writing-mode: vertical-rl`) ให้ใช้ **ข้อความอังกฤษเท่านั้น**
  เช่น `STARTUP UP — PHETCHABUN` เพราะอักษรไทยไม่ได้ออกแบบมาให้เรียงแนวตั้ง
  สระและวรรณยุกต์จะหลุดตำแหน่ง

```css
.side-label {
  writing-mode: vertical-rl;
  position: fixed; right: 16px; top: 50%;
  transform: translateY(-50%);
  font-size: 11px; letter-spacing: 0.2em;
}
```

- **Mono corner widgets**: Prompt ไม่มีรุ่น monospace ให้ใช้
  `ui-monospace, "JetBrains Mono", "IBM Plex Mono", monospace`

### 1.3 Smooth scroll (Lenis.js)

ครอบทั้งหน้าด้วย Lenis เพื่อให้ scroll มี momentum

- ปิด Lenis บนอุปกรณ์สัมผัส (`syncTouch: false`) — บนมือถือ momentum ของ iOS
  ดีกว่าและ Lenis ทำให้หน่วง
- ปิดทันทีเมื่อ `prefers-reduced-motion: reduce`
- ถ้าหน้าไหนมีแผนที่ Leaflet ต้อง `lenis.stop()` ตอนเคอร์เซอร์อยู่เหนือแผนที่
  ไม่งั้น scroll จะไปซูมแผนที่แทน

---

## 2. PHASE 1 — HONEST ASSET LOADER

- **ห้ามใช้ timer ปลอมหรือเปอร์เซ็นต์มั่ว** ให้นับ asset จริง
- ลงทะเบียนและนับ: ภาพ hero ทุกใบ, ไฟล์ฟอนต์ Prompt (ผ่าน `document.fonts.ready`),
  ฉาก 3D, วิดีโอ (`loadeddata`)
- เพิ่ม `loaded` ทุกครั้งที่ asset จบ ทั้ง `load` และ `error` (error ต้องนับด้วย
  ไม่งั้นรูปเสียใบเดียวค้างตลอดกาล)
- สูตร: `progress = (loaded / total) * 100`
- ตั้ง timeout กันค้างที่ 8 วินาที — ถ้าเกินให้เปิดหน้าเลย
- เมื่อ `loaded === total` ให้ fade-out / mask-up เผยหน้าเว็บ
- **วาดค่า failsafe ก่อนเสมอ** เช่น `--°C`, `00:00`, เส้นโครงการ์ด เพื่อไม่ให้มี
  พื้นที่ว่างเปล่าระหว่างโหลด
- ตัวเลขเปอร์เซ็นต์ใช้เลขอารบิก ไม่ต้องแปลงเป็นเลขไทย

---

## 3. PHASE 2 — HERO: SOFT 3D CLAY & LAYERED DEPTH

**Concept ผูกกับพื้นที่จริง:** เพชรบูรณ์เป็นจังหวัดภูเขา (เขาค้อ ภูทับเบิก)
ฉาก 3D จึงเป็นทิวเขาสไตล์ clay ไม่ใช่ภูเขาลอย ๆ ทั่วไป

- **3D terrain**: ฉากทิวเขาซ้อนชั้นแบบ matte clay แสงสตูดิโอนุ่ม ใช้ Spline
  หรือ Three.js ที่ให้ผลเทียบเท่า โทนวัสดุเป็นเขียว `--ink` ไล่ไปครีม
- **Fake atmospheric glow**: div พื้นหลังใต้ canvas ใส่ CSS `radial-gradient`
  ศูนย์กลางสว่างอมทอง `--accent` จางออกไปขอบเข้ม ให้เหมือนดวงอาทิตย์ยักษ์
  หลังภูเขา (ถูกกว่าการทำ light bloom จริงมาก)
- **Sandwiched typography**: วางหัวเรื่องขนาดใหญ่ไว้ **ระหว่าง** ท้องฟ้าเรืองแสง
  (ชั้นหลัง) กับยอดเขา clay (ชั้นหน้า) ด้วย `position: absolute` + `z-index`
  ยอดเขาต้องบังตัวอักษรส่วนล่างเพื่อสร้างมิติ
- Headline ที่แนะนำ: **"บ้านพร้อมอยู่ เชิงเขาเพชรบูรณ์"** — ผูกภูเขาในฉากกับ
  ทำเลจริงที่ขาย
- **Mobile**: ห้ามโหลด WebGL ให้สลับเป็นภาพนิ่ง render ล่วงหน้าที่ compose
  ชั้นเดียวกันไว้แล้ว ประหยัดทั้งแบตและ data

---

## 4. PHASE 3 — INTERACTIVE MODULES

### MODULE A — Before / After slider → **ก่อน–หลังรีโนเวท**

ตรงกับธุรกิจที่สุด: บ้านมือสองที่ปรับปรุงแล้ว ใช้ภาพหลังจริงของบริษัท

- ซ้อนภาพสองใบขนาดเท่ากัน `object-fit: cover` ทับกันสนิทในคอนเทนเนอร์เดียว
- **Clip formula**: ภาพบนใช้ `clip-path: inset(0 calc(100% - var(--x)) 0 0)`
- **Pointer events**: `pointerdown` / `pointermove` / `pointerup` อ่านตำแหน่ง
  แนวนอนเทียบความกว้างคอนเทนเนอร์ → `(pointerX / containerWidth) * 100`
- ผูกค่าเปอร์เซ็นต์เข้ากับทั้ง `clip-path` และตำแหน่งด้ามจับพร้อมกัน
- ป้ายมุมภาพ: `ก่อน` / `หลัง` ใช้ตัวอักษรไทย
- **Accessibility**: ด้ามจับต้องเป็น `<input type="range">` ที่ซ่อนสไตล์ไว้ หรือ
  รับคีย์ลูกศรได้ พร้อม `aria-label="เลื่อนเปรียบเทียบก่อนและหลังรีโนเวท"`
- **Touch**: ใส่ `touch-action: none` บนด้ามจับ ไม่งั้นลากแล้วหน้าเลื่อนตาม

### MODULE B — Cursor spotlight + **แปลนบ้าน** blueprint

- **Double surface masking**: ซ้อนพื้นเข้มปกติกับพื้นสว่างกว่าที่ซ่อนไว้
- **Spotlight tracker**: `mousemove` → เก็บพิกัดใน `--mouse-x` / `--mouse-y`
  แล้วใส่ radial-gradient mask บนชั้นสว่าง ให้เหมือนไฟฉายส่อง
- **SVG blueprint**: วาดเป็น **แปลนบ้าน** จริง (ผัง 3 ห้องนอน 2 ห้องน้ำ) เส้นบาง
  มีจุด node ตามมุม พร้อมป้ายบอกขนาดห้องเป็นภาษาไทย
- Animate เส้นวาดตัวเองด้วย `stroke-dasharray` + `stroke-dashoffset` ตอนเข้าเฟรม
- ~~Social proof bar (แถวโลโก้ธนาคาร)~~ — **ตัดออกตามที่เจ้าของเคาะ**
- **Mobile**: ไม่มีเคอร์เซอร์ ให้เปลี่ยนเป็นเผยทั้งแผ่นตอนเลื่อนถึง

### MODULE C — Scroll-scrubbed video

- วิดีโอที่เหมาะกับธุรกิจ: **กล้องเคลื่อนเข้าประตูบ้านแล้วเปิดออกเห็นห้องนั่งเล่น**
  หรือโดรนถอยออกจากบ้านให้เห็นทำเลรอบ (ไม่ใช่ cheese pull)
- ปิด autoplay ตั้ง `muted` `playsInline` `preload="metadata"`
- **Scrub formula**: `scrollFraction = currentScroll / maxScroll` แล้ว
  `video.currentTime = scrollFraction * video.duration` ขับด้วย
  `requestAnimationFrame` ห้ามเซ็ตใน scroll handler ตรง ๆ
- **การ encode สำคัญมาก**: ต้อง export วิดีโอด้วย keyframe ถี่ (GOP 1–2 เฟรม)
  ไม่งั้น seek จะกระตุก — วิดีโอปกติมี keyframe ทุก 2–5 วินาที scrub แล้วจะสะดุด
- **Sandwiched type**: วางหัวเรื่องแบรนด์ไว้ z-index กลาง ระหว่างพื้นหลังแบนกับ
  วัตถุ/มือในวิดีโอที่เป็นชั้นหน้า ให้ตัวอักษรดูฝังอยู่ในฉากจริง
- **Mobile**: ห้าม scrub ให้แสดง poster แล้วเล่นเมื่อกด

---

## 5. PHASE 4 — EDITORIAL GALLERY & ASYMMETRIC GRID

- **ห้ามแบ่งจอ 50/50** ใช้ `grid-template-columns: 1fr 1.4fr` หรืออัตราส่วนเอียง
  แบบเดียวกัน เยื้อง element ให้หลุด baseline เพื่อบังคับสายตาเป็นตัว Z
- **Picture-in-Picture crop**: วางภาพ detail ใกล้ ๆ ซ้อนทับภาพหลักแบบ absolute
  ใส่ขอบสีเดียวกับพื้นหน้า (`--paper`) และ `box-shadow` นุ่ม ๆ ให้มีมิติ
- **⚠ Grayscale hover — ใช้เฉพาะภาพ editorial/ไลฟ์สไตล์เท่านั้น**
  ห้ามใช้กับรูปประกาศขายบ้าน คนซื้อบ้านต้องเห็นสีจริงของหลังคา ผนัง และสวน
  การทำรูปบ้านเป็นขาวดำสวยในเชิงดีไซน์แต่ทำลายหน้าที่ของหน้าเว็บ
- การ์ดบ้านให้คงรูปแบบ CI เดิม: มุมโค้ง `rounded-2xl` เงานุ่ม ยกลอยตอน hover
  ราคาขึ้นต้นด้วย `฿` ตามด้วยพื้นที่ (ตร.ว.) / ห้องนอน / ห้องน้ำ

---

## 6. PHASE 5 — LUXURY DETAILS

### UTILITY A — Line-by-line clip reveal

- แยกบล็อกข้อความเป็นบรรทัด ครอบแต่ละบรรทัดด้วยกล่อง `overflow: hidden`
- เริ่มที่ `transform: translateY(100%)` → เลื่อนถึงแล้ว `IntersectionObserver`
  สั่งขึ้นเป็น `translateY(0%)` แบบไล่ทีละบรรทัด
- **⚠ ภาษาไทย**: `overflow: hidden` บนกล่องที่พอดีเป๊ะจะ **ตัดสระบนและวรรณยุกต์**
  ต้องให้กล่องสูงกว่าตัวอักษรจริง — ใช้ `line-height: 1.5` ขึ้นไป และเผื่อ
  `padding-top: 0.15em` ทดสอบด้วยคำที่มีสระซ้อนสองชั้น เช่น
  **"บ้านที่ใช่ ผ่อนไหว ไม่ต้องรอ"**

### UTILITY B — Mono weather & time corners

- `navigator.geolocation.getCurrentPosition` พร้อม fallback เป็นพิกัดเพชรบูรณ์
  **`16.4193, 101.1591`** ถ้าผู้ใช้ปฏิเสธหรือ timeout (ตั้ง `timeout: 5000`)
- Weather: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m`
  ปัดด้วย `Math.round()` แล้วแสดงเป็น `28°C`
- Clock: `new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' })`
  ใน `setInterval` 1000ms
- แสดงชื่อเมืองเป็นไทย: `เพชรบูรณ์ 28°C 14:32`
- สไตล์: monospace, `font-size: 11px`, `letter-spacing: 0.1em`, วางมุมจอแบบ absolute
  (`text-transform: uppercase` ไม่มีผลกับอักษรไทย ใส่ได้แต่ไม่ต้องคาดหวังผล)

### UTILITY C — Floating props & cursor parallax

- วาง PNG โปร่งใสคนละชั้น `z-index` — ใช้ของที่เกี่ยวกับธุรกิจ เช่น พวงกุญแจบ้าน
  โมเดลบ้าน clay ต้นไม้ หมุดปักแผนที่
- ยึดพื้นด้วย `filter: drop-shadow(0 20px 30px rgba(6,26,14,0.45))`
- ลอยขึ้นลงด้วย keyframe `translateY` 6px, duration สุ่ม 4s–6s พร้อม delay ต่างกัน
  เพื่อไม่ให้ลอยพร้อมกัน
- **Mouse parallax**: `(clientX / window.innerWidth - 0.5)` คูณด้วย depth factor
  ต่างกัน (30 สำหรับชั้นหน้า, 8 สำหรับชั้นหลัง) แล้วส่งเข้า `translate3d`
- ปิดทั้งหมดเมื่อ `prefers-reduced-motion: reduce` และบนมือถือ

---

## 7. ข้อจำกัดทางเทคนิค (ต้องทำตาม)

1. **สร้างเป็นหน้าใหม่แยก** `pages/v3.js` ในโปรเจกต์ Next.js เดิม
   **ห้ามแก้ `pages/index.js` และ `styles/globals.css`** เด็ดขาด
   CSS ทั้งหมดอยู่ในไฟล์หน้านั้นผ่าน `<style jsx global>`
2. Stack ที่มีอยู่: Next.js 16 (pages router), React 19, Tailwind v4, `lucide-react`
3. Dependency ใหม่ที่อนุญาต: `lenis` และ `@splinetool/react-spline` เท่านั้น
   นอกจากนี้ต้องถามก่อน
4. ใส่ `<meta name="robots" content="noindex, nofollow" />` — ยังเป็นหน้าทดลอง
5. รูปทั้งหมดต้องรวมไว้ใน object `IMG` เดียวบนสุดของไฟล์ เพื่อให้สลับเป็นรูปจริง
   ได้จุดเดียว ข้อความก็แยกเป็น array ด้านล่างถัดมา
6. **Performance budget**: บนมือถือต้องไม่โหลด WebGL, ไม่ scrub วิดีโอ, และ LCP
   ต้องมาจากภาพ hero ที่ `preload` ไว้
7. **Reduced motion**: ทุก animation ต้องมีทางปิดผ่าน
   `@media (prefers-reduced-motion: reduce)`
8. Responsive: ทดสอบที่ 1440px, 768px และ 390px
9. ทุกปุ่ม/คอนโทรลต้องมี `aria-label` ภาษาไทย

---

## 8. เกณฑ์ตรวจรับ

- [ ] Loader นับ asset จริง ไม่ใช่ timer และมี failsafe timeout
- [ ] หัวเรื่องภาษาไทยไม่มีวรรณยุกต์หรือสระถูกตัดที่ทุก breakpoint
- [ ] Line reveal ไม่ตัดสระบน
- [ ] Side label เป็นภาษาอังกฤษ
- [ ] รูปประกาศขายบ้านเป็นสีเต็มเสมอ ไม่ถูกทำเป็นขาวดำ
- [ ] Before/after ลากได้ทั้งเมาส์ นิ้ว และคีย์บอร์ด
- [ ] ปิด Lenis และ animation เมื่อผู้ใช้ตั้ง reduced motion
- [ ] มือถือไม่โหลด WebGL และไม่ scrub วิดีโอ
- [ ] `pages/index.js` กับ `styles/globals.css` ไม่ถูกแก้แม้แต่บรรทัดเดียว
