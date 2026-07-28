/**
 * แปลงลิงก์ Google Maps ทุกอันในคอลัมน์ Location ของชีต Stockบ้าน เป็นพิกัด
 * แล้วเขียนทับ data/geocache.json เพื่อให้ /api/stock ไม่ต้องยิง redirect ตอน runtime
 *
 *   node scripts/build-geocache.mjs           แปลงเฉพาะลิงก์ใหม่ที่ยังไม่มีในแคช
 *   node scripts/build-geocache.mjs --force   แปลงใหม่ทั้งหมด (ใช้เมื่อแก้วิธีอ่านพิกัดใน lib/mapurl.mjs)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { parseCSV } = await import(pathToFileURL(path.join(ROOT, 'lib', 'csv.mjs')).href);
const { extractCoords } = await import(pathToFileURL(path.join(ROOT, 'lib', 'mapurl.mjs')).href);
const CACHE_PATH = path.join(ROOT, 'data', 'geocache.json');
const FORCE = process.argv.includes('--force');
const SHEET_ID = '1fdVOGbCgUCRVI_uYDBDZK7Mz0sajTxu4z6e3xS2JDQ4';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const CONCURRENCY = 8;

const response = await fetch(CSV_URL, { redirect: 'follow' });
if (!response.ok) throw new Error(`อ่านชีตไม่สำเร็จ (${response.status})`);

// ต้อง parse CSV จริงๆ ไม่ใช่จับด้วย regex — URL ที่มีพิกัดจะมีคอมมาอยู่ข้างใน แล้วจะโดนตัดกลางคัน
// ทำให้ key ในแคชไม่ตรงกับค่าที่ /api/stock อ่านได้จริง
const rows = parseCSV(await response.text());
const locationColumn = rows[0].findIndex((header) => String(header).trim() === 'Location');
if (locationColumn < 0) throw new Error('ไม่พบคอลัมน์ Location ในชีต');

const links = [...new Set(
  rows.slice(1)
    .map((row) => String(row[locationColumn] || '').trim())
    .filter((url) => /^https?:\/\//.test(url))
)];
if (!links.length) throw new Error('ไม่พบลิงก์ Google Maps ในคอลัมน์ Location');

const existing = fs.existsSync(CACHE_PATH) ? JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')) : {};
const pending = FORCE ? links : links.filter((url) => !existing[url]);
console.log(`ลิงก์ทั้งหมด ${links.length} · มีในแคชแล้ว ${links.filter((url) => existing[url]).length} · ต้องแปลง ${pending.length}${FORCE ? ' (--force)' : ''}`);

const resolved = {};
const failed = [];
let done = 0;

const worker = async (list) => {
  for (const url of list) {
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(10000) });
      const coords = extractCoords(res.url) || extractCoords(await res.text());
      if (coords) resolved[url] = coords;
      else failed.push(url);
    } catch {
      failed.push(url);
    }
    done += 1;
    if (done % 25 === 0) console.log(`  ${done}/${pending.length}`);
  }
};

await Promise.all(
  Array.from({ length: CONCURRENCY }, (_, i) => worker(pending.filter((_, j) => j % CONCURRENCY === i)))
);

// เก็บเฉพาะลิงก์ที่ยังอยู่ในชีต เพื่อไม่ให้ไฟล์แคชโตขึ้นเรื่อยๆ
const merged = {};
links.forEach((url) => {
  const coords = resolved[url] || existing[url];
  if (coords) merged[url] = coords;
});

fs.writeFileSync(CACHE_PATH, JSON.stringify(merged));
console.log(`เขียน ${Object.keys(merged).length} พิกัดลง data/geocache.json`);
if (failed.length) console.log(`แปลงไม่ได้ ${failed.length} ลิงก์:\n${failed.join('\n')}`);
