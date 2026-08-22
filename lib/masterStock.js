/**
 * เช็คกับ "Master Stock" (ชุดเดียวกับที่แอป All in One ใช้) ว่าบ้านที่ลงไว้ในเว็บยังอยู่ในสต๊อกไหม
 * — ใช้เตือนในหลังบ้านว่าหลังไหนควรเอาออกจากเว็บแล้ว
 *
 * Master Stock ของ All in One มาจาก 3 ชีต (ดู startup-up-all-in-one/api/_sheets.js
 * และ api/sheets-webhook.js ที่ sync ทั้งสามเข้า Firestore คอลเลกชัน master_stock_data)
 * เว็บนี้อ่านจากชีตต้นทางตรงๆ ผ่าน CSV จะได้ไม่ต้องใช้สิทธิ์ล็อกอินของ All in One
 *
 * ตั้ง env ทับได้ถ้าชีตย้ายที่: MASTER_STOCK_SHEETS = "sheetId:gid:ชื่อที่แสดง,sheetId:gid:ชื่อที่แสดง"
 */
const DEFAULT_SOURCES = [
  { id: '1fdVOGbCgUCRVI_uYDBDZK7Mz0sajTxu4z6e3xS2JDQ4', gid: '0', label: 'Stockบ้าน' },
  { id: '1PvLN75vNw4H5DSzGyDLFXEZRNd5i0QPWNb0XMmKpza8', gid: '1209885880', label: 'Stock update (Naphat)' },
  { id: '1cdkbVABQypyqgQYigFeyDwaoRvIYhxVyztTQpkJkSWg', gid: '597410899', label: 'Stock เจ๊หมวย' },
];

const parseSourcesEnv = (value) => String(value || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const [id, gid, ...label] = entry.split(':');
    return { id: (id || '').trim(), gid: (gid || '0').trim(), label: label.join(':').trim() || 'Master Stock' };
  })
  .filter((source) => source.id);

export const MASTER_STOCK_SOURCES = parseSourcesEnv(process.env.MASTER_STOCK_SHEETS).length
  ? parseSourcesEnv(process.env.MASTER_STOCK_SHEETS)
  : DEFAULT_SOURCES;

export const MASTER_STOCK_SHEET_URL = `https://docs.google.com/spreadsheets/d/${MASTER_STOCK_SOURCES[0].id}/edit#gid=${MASTER_STOCK_SOURCES[0].gid}`;

/** จับคู่บ้านเว็บกับแถวในชีตด้วยบ้านเลขที่ — วิธีเดียวกับที่ stock-map ใช้ */
export const normalizeHouseKey = (value) => String(value ?? '')
  .replace(/[\u200B-\u200D\uFEFF]/g, '')
  .replace(/\u00a0/g, ' ')
  .trim()
  .toLowerCase()
  .replace(/\*+/g, '')
  .replace(/\s+/g, '')
  .replace(/[-–—]/g, '/');

// CSV parser ขนาดเล็ก (RFC4180 — รองรับ field ที่มีเครื่องหมายคำพูด/คอมมา/ขึ้นบรรทัด)
const parseCSV = (text) => {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i += 1; }
        else inQuotes = false;
      } else cur += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\r') { /* ข้าม */ }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }

  return rows;
};

const clean = (value) => String(value ?? '')
  .replace(/[\u200B-\u200D\uFEFF]/g, '')
  .replace(/\u00a0/g, ' ')
  .trim();

// เกณฑ์ "ขายแล้ว" ชุดเดียวกับ All in One (src/app/AppSupport.jsx: isSoldMasterRow)
const SOLD_PATTERN = /ขายแล้ว|ขายไปแล้ว|โอนแล้ว|โอนเรียบร้อย|ปิดการขาย|sold|transferred|closed/;
const STATUS_COLUMNS = ['สถานะ', 'สถานะ2', 'สถานะบ้าน', 'สถานะการขาย', 'Status', 'status'];

/** ชีตของ Naphat ตั้งชื่อคอลัมน์สถานะยาวๆ ("STOCK NAPHAT ... สถานะ") จึงรับคอลัมน์ที่ลงท้ายด้วย "สถานะ" ด้วย */
const statusColumnsOf = (index) => {
  const columns = Object.keys(index).filter((name) => STATUS_COLUMNS.includes(name) || /สถานะ$/.test(name));
  return [...new Set(columns)];
};

/**
 * บางแท็บมีบรรทัดหัวเรื่องก่อนแถว header จริง (เช่นชีต Naphat) — หาแถวแรกที่มีคอลัมน์ "บ้านเลขที่"
 */
const findHeader = (rows) => {
  for (let i = 0; i < Math.min(rows.length, 10); i += 1) {
    const index = {};
    rows[i].forEach((name, col) => {
      const key = clean(name);
      if (key && !(key in index)) index[key] = col;
    });
    if (index['บ้านเลขที่'] !== undefined) return { headerRow: i, index };
  }
  return null;
};

const fetchSource = async (source) => {
  const url = `https://docs.google.com/spreadsheets/d/${source.id}/export?format=csv&gid=${source.gid}`;
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'startup-up-web-stock-check' },
  });
  if (!response.ok) throw new Error(`อ่าน ${source.label} ไม่สำเร็จ (${response.status})`);

  const rows = parseCSV(await response.text());
  const header = findHeader(rows);
  if (!header) throw new Error(`ไม่พบคอลัมน์ "บ้านเลขที่" ใน ${source.label}`);

  return { source, rows: rows.slice(header.headerRow + 1), index: header.index };
};

/**
 * รวมทั้ง 3 ชีตเป็น index เดียว: บ้านเลขที่ -> { project, status, sold, source }
 * บ้านเลขที่ซ้ำกันข้ามชีต ให้แถวที่ "ยังไม่ขาย" ชนะ (เหมือน All in One ที่กรองแถวขายแล้วทิ้ง)
 */
export async function fetchMasterStockIndex() {
  const results = await Promise.allSettled(MASTER_STOCK_SOURCES.map(fetchSource));

  const houses = {};
  const sources = [];
  const errors = [];
  let rowCount = 0;

  results.forEach((result, i) => {
    const source = MASTER_STOCK_SOURCES[i];
    if (result.status === 'rejected') {
      errors.push(String(result.reason?.message || result.reason));
      sources.push({ label: source.label, ok: false, houseCount: 0 });
      return;
    }

    const { rows, index } = result.value;
    const statusColumns = statusColumnsOf(index);
    let sourceCount = 0;

    rows.forEach((row) => {
      const key = normalizeHouseKey(row[index['บ้านเลขที่']]);
      if (!key) return;
      rowCount += 1;
      sourceCount += 1;

      const status = statusColumns.map((col) => clean(row[index[col]])).filter(Boolean).join(' ');
      const project = index['หมู่บ้าน'] === undefined ? '' : clean(row[index['หมู่บ้าน']]).replace(/\*+\s*$/, '').trim();
      const sold = SOLD_PATTERN.test(status.normalize('NFKC').replace(/\s+/g, '').toLowerCase());

      const existing = houses[key];
      if (!existing || (existing.sold && !sold)) houses[key] = { project, status, sold, source: source.label };
    });

    sources.push({ label: source.label, ok: true, houseCount: sourceCount });
  });

  // ชีตล่มทั้งหมด = เช็คอะไรไม่ได้เลย ให้ error ออกไปดีกว่าบอกว่าบ้านหายทั้งเว็บ
  if (!sources.some((source) => source.ok)) throw new Error(errors[0] || 'อ่าน Master Stock ไม่สำเร็จ');

  return {
    houses,
    rowCount,
    houseCount: Object.keys(houses).length,
    sheetUrl: MASTER_STOCK_SHEET_URL,
    sources,
    // เช็คบ้าน partner ได้ต่อเมื่ออ่านชีตของ partner สำเร็จครบ (ไม่งั้นจะเตือนผิดว่าบ้านหาย)
    coversPartners: sources.length === MASTER_STOCK_SOURCES.length && sources.every((source) => source.ok),
    partialError: errors.length ? errors.join(' | ') : '',
  };
}
