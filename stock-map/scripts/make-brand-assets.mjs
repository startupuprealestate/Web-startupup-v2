/**
 * สร้างไฟล์โลโก้ที่เว็บใช้ จากไฟล์ต้นฉบับ public/logo-source.png
 *   logo.png       – ตัดขอบโปร่งใสออก ย่อเหลือกว้าง 900px (ใช้บนพื้นสว่าง)
 *   logo-white.png – เวอร์ชันสีขาวล้วน สำหรับวางบนหัวเว็บสีเขียวเข้ม
 *
 *   node scripts/make-brand-assets.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicPath = (name) => path.join(ROOT, 'public', name);

// ไฟล์ต้นฉบับมีมาร์จิ้นโปร่งใสรอบๆ เยอะมาก (3508x2480) ตัดทิ้งก่อน
const trimmed = await sharp(publicPath('logo-source.png')).trim({ threshold: 10 }).png().toBuffer();
const trimmedMeta = await sharp(trimmed).metadata();
console.log(`ตัดขอบแล้ว: ${trimmedMeta.width}x${trimmedMeta.height}`);

await sharp(trimmed).resize({ width: 900 }).png({ compressionLevel: 9 }).toFile(publicPath('logo.png'));

// เปลี่ยนทุกพิกเซลที่ไม่โปร่งใสเป็นสีขาว โดยคงรูปทรงและขอบนุ่มเดิมไว้ผ่าน alpha
const { data, info } = await sharp(trimmed)
  .resize({ width: 900 })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  data[i] = 255;
  data[i + 1] = 255;
  data[i + 2] = 255;
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(publicPath('logo-white.png'));

for (const name of ['logo.png', 'logo-white.png']) {
  const meta = await sharp(publicPath(name)).metadata();
  console.log(`${name}: ${meta.width}x${meta.height} · ${(meta.size / 1024).toFixed(0)} KB`);
}
