/**
 * สร้าง favicon จากโลโก้บริษัท (public/logo-source.png)
 * ใช้เฉพาะ "หลังคา" ของโลโก้ เพราะตัวหนังสือจะอ่านไม่ออกเมื่อย่อเหลือ 16px
 * สีทองบนพื้นเขียวเข้ม ให้เข้ากับแบรนด์
 *
 *   favicon.ico        – 16/32/48/64 สำหรับแท็บเบราว์เซอร์
 *   favicon-new.png    – 512x512 สำหรับ <link rel="icon"> และ apple-touch-icon
 *   apple-touch-icon.png – 180x180 สำหรับหน้าจอโฮมบน iOS
 *
 *   node scripts/make-favicon.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public');

const BG = { r: 0x0b, g: 0x3d, b: 0x1b, alpha: 1 }; // brand.green
const GOLD = [0xe8, 0xbe, 0x79];

// ต้นฉบับมีขอบขาวรอบๆ เยอะ ตัดทิ้งก่อน แล้วเอาเฉพาะส่วนหลังคา (เหนือคำว่า STARTUP UP)
const trimmed = await sharp(path.join(ROOT, 'public', 'logo-source.png'))
  .trim({ threshold: 10 })
  .png()
  .toBuffer();
const { width, height } = await sharp(trimmed).metadata();
const ROOF_RATIO = 862 / 1867; // แถวที่หลังคาจบ หารด้วยความสูงทั้งหมด
const roof = await sharp(trimmed)
  .extract({ left: 0, top: 0, width, height: Math.round(height * ROOF_RATIO) })
  .trim({ threshold: 10 })
  .png()
  .toBuffer();
const roofMeta = await sharp(roof).metadata();
console.log(`หลังคา: ${roofMeta.width}x${roofMeta.height}`);

/** เปลี่ยนหลังคาเป็นสีทองล้วน โดยใช้ความเข้มของภาพเดิมเป็น alpha */
async function goldRoof(markWidth) {
  const { data, info } = await sharp(roof)
    .resize({ width: markWidth })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    // พิกเซลยิ่งเข้ม = ยิ่งเป็นเนื้อโลโก้ คูณกับ alpha เดิมเพื่อคงขอบนุ่ม
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const ink = Math.max(0, Math.min(255, Math.round(255 - lum)));
    data[i] = GOLD[0];
    data[i + 1] = GOLD[1];
    data[i + 2] = GOLD[2];
    data[i + 3] = Math.round((ink * data[i + 3]) / 255);
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

/** ไอคอนสี่เหลี่ยมจัตุรัส: หลังคาสีทองกลางพื้นเขียว กว้าง 80% ของกรอบ */
async function icon(size) {
  const markWidth = Math.max(1, Math.round(size * 0.8));
  const mark = await goldRoof(markWidth);
  const markMeta = await sharp(mark).metadata();
  return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([
      {
        input: mark,
        left: Math.round((size - markMeta.width) / 2),
        top: Math.round((size - markMeta.height) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** ICO ที่ห่อ PNG ไว้ข้างใน — เบราว์เซอร์ยุคใหม่และ Windows Vista+ อ่านได้หมด */
function buildIco(pngs) {
  const header = Buffer.alloc(6 + pngs.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, buf }, i) => {
    const o = 6 + i * 16;
    header[o] = size >= 256 ? 0 : size;
    header[o + 1] = size >= 256 ? 0 : size;
    header[o + 2] = 0; // จำนวนสีในพาเลต (0 = ไม่ใช้พาเลต)
    header[o + 3] = 0;
    header.writeUInt16LE(1, o + 4); // color planes
    header.writeUInt16LE(32, o + 6); // bits per pixel
    header.writeUInt32LE(buf.length, o + 8);
    header.writeUInt32LE(offset, o + 12);
    offset += buf.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.buf)]);
}

const icoSizes = [16, 32, 48, 64];
const ico = buildIco(await Promise.all(icoSizes.map(async (size) => ({ size, buf: await icon(size) }))));
const png512 = await icon(512);
const png180 = await icon(180);

await fs.writeFile(path.join(OUT_DIR, 'favicon.ico'), ico);
await fs.writeFile(path.join(OUT_DIR, 'favicon-new.png'), png512);
await fs.writeFile(path.join(OUT_DIR, 'apple-touch-icon.png'), png180);
console.log('เขียนแล้ว: public/favicon.ico, favicon-new.png, apple-touch-icon.png');
