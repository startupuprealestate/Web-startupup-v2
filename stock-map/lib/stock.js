import { parseCSV } from './csv.mjs';

export const SHEET_ID = '1fdVOGbCgUCRVI_uYDBDZK7Mz0sajTxu4z6e3xS2JDQ4';
export const SHEET_GID = '0'; // แท็บ "Stockบ้าน"
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${SHEET_GID}`;
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

// สถานะจาก Master Stock -> กลุ่มที่ใช้แสดงผล
const STATUS_GROUPS = {
  'ยังไม่เสร็จ': 'wip',
  'ว่าง': 'ready',
  'ยื่นกู้': 'hold',
  'ยื่นซ้อนได้': 'hold',
  'ประเมิน': 'hold',
  'รอโอน': 'hold',
  'ขายแล้ว': 'sold',
};

export const GROUP_META = {
  wip: { key: 'wip', label: 'ยังไม่เสร็จ', color: '#b45309', desc: 'อยู่ระหว่างปรับปรุง' },
  ready: { key: 'ready', label: 'พร้อมขาย', color: '#0b3d1b', desc: 'บ้านว่าง พร้อมเสนอลูกค้า' },
  hold: { key: 'hold', label: 'ติดลูกค้า', color: '#1d4ed8', desc: 'ประเมิน / ยื่นกู้ / ยื่นซ้อนได้ / รอโอน' },
};

export const GROUP_ORDER = ['wip', 'ready', 'hold'];

const CONSIGNMENT_MARK = 'ฝากขาย';
const CONSIGNMENT_SHARE = '3%';

const clean = (value) => String(value ?? '').replace(/ /g, ' ').trim();

// ชื่อโครงการในชีตมีการต่อท้ายด้วย ** เพื่อทำเครื่องหมายภายใน — ตัดออกเพื่อให้จัดกลุ่มถูกโครงการเดียวกัน
export const cleanProjectName = (value) => clean(value).replace(/\*+\s*$/, '').replace(/\s{2,}/g, ' ').trim();

export const normalizeKey = (value) => clean(value)
  .toLowerCase()
  .replace(/\*+/g, '')
  .replace(/\s+/g, '')
  .replace(/[-–—]/g, '/');

const toNumber = (value) => {
  const n = Number(clean(value).replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const headerIndex = (headerRow) => {
  const index = {};
  headerRow.forEach((name, i) => {
    const key = clean(name);
    if (key && !(key in index)) index[key] = i;
  });
  return index;
};

export async function fetchStockRows() {
  const response = await fetch(CSV_URL, {
    redirect: 'follow',
    headers: { 'User-Agent': 'startup-up-stock-map' },
  });
  if (!response.ok) throw new Error(`Google Sheet read failed (${response.status})`);

  const rows = parseCSV(await response.text());
  if (!rows.length) throw new Error('Google Sheet returned no rows');

  const idx = headerIndex(rows[0]);
  const at = (row, name) => (idx[name] === undefined ? '' : clean(row[idx[name]]));

  return rows.slice(1)
    .filter((row) => clean(row[idx['หมู่บ้าน']]) || clean(row[idx['บ้านเลขที่']]))
    .map((row, i) => {
      const share = at(row, 'หุ้นส่วน');
      const isConsignment = share === CONSIGNMENT_SHARE
        || at(row, 'Website') === CONSIGNMENT_MARK
        || at(row, 'หมดสัญญา') === CONSIGNMENT_MARK;

      const rawStatus = at(row, 'สถานะ');

      return {
        rowIndex: i + 2, // เลขแถวจริงในชีต (1-based + header)
        project: cleanProjectName(row[idx['หมู่บ้าน']]),
        houseNumber: at(row, 'บ้านเลขที่'),
        soi: at(row, 'ซอย'),
        zone: at(row, 'ทำเล'),
        area: at(row, 'พื้นที่'),
        bedrooms: at(row, 'ห้องนอน'),
        bathrooms: at(row, 'ห้องน้ำ'),
        style: at(row, 'รูปแบบ'),
        price: toNumber(at(row, 'ราคา')),
        rawStatus,
        group: STATUS_GROUPS[rawStatus] || (rawStatus ? 'hold' : 'ready'),
        share,
        isConsignment,
        mapUrl: /^https?:\/\//.test(at(row, 'Location')) ? at(row, 'Location') : '',
        startedAt: at(row, 'เริ่มทำ'),
        finishedAt: at(row, 'ทำเสร็จเมื่อ'),
        worker: at(row, 'ช่างที่ทำบ้าน'),
      };
    });
}

// บ้านของ Startup Up ที่ยังไม่ขาย (ตัดรายการฝากขายและที่ขายแล้วออก)
export const selectOwnedActive = (rows) => rows
  .filter((row) => !row.isConsignment && row.group !== 'sold');
