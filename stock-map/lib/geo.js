import geocache from '../data/geocache.json';
import { normalizeKey } from './stock';

const FIRESTORE_PROJECT = 'startup-up-realestate';
const FIRESTORE_KEY = 'AIzaSyDsEeGxKA90-URCn06F-K3U2dvlISf_2Jo';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents/artifacts/${FIRESTORE_PROJECT}/public/data`;

export const MAP_CENTER = [13.99, 100.63];

const inThailand = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng)
  && lat > 5 && lat < 25 && lng > 90 && lng < 110;

const parseCoord = (value) => {
  const n = parseFloat(String(value ?? '').replace(/,/g, '.').replace(/\s/g, ''));
  return Number.isFinite(n) ? n : NaN;
};

const COORD_PATTERNS = [
  /@(-?\d+\.\d+),(-?\d+\.\d+)/,
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  /[?&](?:q|ll|daddr|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/,
  // ลิงก์ย่อบางอันเด้งไปเป็น /maps/search/13.99,+100.54
  /\/maps\/(?:search|place|dir)\/(-?\d+\.\d+),\+?(-?\d+\.\d+)/,
];

// บางลิงก์ในชีตเป็น ?q=<%20 เยอะๆ>14.04,<%20 เยอะๆ>100.65 — ต้องถอดรหัสและตัดช่องว่างก่อนถึงจะจับได้
const decodeCompact = (text) => {
  try {
    return decodeURIComponent(text).replace(/\s+/g, '');
  } catch {
    return text.replace(/%20/g, '').replace(/\s+/g, '');
  }
};

const extractCoords = (text) => {
  const raw = String(text || '');
  const candidates = raw.length <= 2000 ? [raw, decodeCompact(raw)] : [raw];

  for (const candidate of candidates) {
    for (const pattern of COORD_PATTERNS) {
      const match = candidate.match(pattern);
      if (!match) continue;
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (inThailand(lat, lng)) return [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
    }
  }
  return null;
};

// ลิงก์ Google Maps ที่ resolve ตอน runtime จะถูกเก็บไว้ในหน่วยความจำของ instance
const runtimeCache = new Map();

export async function resolveMapUrls(urls) {
  const pending = urls.filter((url) => url && !geocache[url] && !runtimeCache.has(url));
  const unique = [...new Set(pending)];
  const CONCURRENCY = 6;

  const worker = async (list) => {
    for (const url of list) {
      try {
        const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000) });
        const coords = extractCoords(response.url) || extractCoords(await response.text());
        runtimeCache.set(url, coords);
      } catch {
        runtimeCache.set(url, null);
      }
    }
  };

  await Promise.all(
    Array.from({ length: CONCURRENCY }, (_, i) => worker(unique.filter((_, j) => j % CONCURRENCY === i)))
  );

  return (url) => geocache[url] || runtimeCache.get(url) || null;
}

const firestoreValue = (field) => {
  if (!field || typeof field !== 'object') return undefined;
  const key = Object.keys(field)[0];
  if (key === 'arrayValue') return (field.arrayValue.values || []).map(firestoreValue);
  if (key === 'integerValue' || key === 'doubleValue') return Number(field[key]);
  return field[key];
};

// พิกัดสำรองจากเว็บหลัก (คอลเลกชัน properties) — ใช้เมื่อชีตไม่มีลิงก์ Google Maps
export async function fetchFirestoreCoords() {
  const documents = [];
  let pageToken = '';

  do {
    const url = new URL(`${FIRESTORE_BASE}/properties`);
    url.searchParams.set('key', FIRESTORE_KEY);
    url.searchParams.set('pageSize', '300');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Firestore read failed (${response.status})`);

    const payload = await response.json();
    documents.push(...(payload.documents || []));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  const byHouse = new Map();
  const byProject = new Map();

  documents.forEach((document) => {
    const data = Object.fromEntries(
      Object.entries(document.fields || {}).map(([key, field]) => [key, firestoreValue(field)])
    );
    const lat = parseCoord(data.lat);
    const lng = parseCoord(data.lng);
    if (!inThailand(lat, lng)) return;

    const houseKey = normalizeKey(data.house_number);
    const projectKey = normalizeKey(data.project_name);
    if (houseKey && !byHouse.has(houseKey)) byHouse.set(houseKey, [lat, lng]);
    if (projectKey) {
      if (!byProject.has(projectKey)) byProject.set(projectKey, []);
      byProject.get(projectKey).push([lat, lng]);
    }
  });

  return { byHouse, byProject };
}

export const average = (points) => {
  const valid = points.filter((p) => p && inThailand(p[0], p[1]));
  if (!valid.length) return null;
  const lat = valid.reduce((sum, p) => sum + p[0], 0) / valid.length;
  const lng = valid.reduce((sum, p) => sum + p[1], 0) / valid.length;
  return [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
};

/**
 * หาพิกัดของบ้านแต่ละหลัง เรียงตามความแม่นยำ:
 *  exact   – ลิงก์ Google Maps ในชีต (คอลัมน์ Location)
 *  exact   – พิกัดของบ้านหลังเดียวกันในเว็บหลัก (จับคู่ด้วยบ้านเลขที่)
 *  project – ค่าเฉลี่ยพิกัดบ้านหลังอื่นในโครงการเดียวกันจากเว็บหลัก
 *  (ที่เหลือ) – ปล่อยว่างไว้ ให้ชั้นบนเติมด้วยจุดกึ่งกลางของโครงการ/ทำเล
 */
export function locateHouses(houses, lookupMapUrl, firestore) {
  return houses.map((house) => {
    const fromSheet = house.mapUrl ? lookupMapUrl(house.mapUrl) : null;
    if (fromSheet) return { ...house, coords: fromSheet, precision: 'exact', source: 'sheet' };

    const fromHouse = firestore.byHouse.get(normalizeKey(house.houseNumber));
    if (fromHouse) return { ...house, coords: fromHouse, precision: 'exact', source: 'website' };

    const fromProject = average(firestore.byProject.get(normalizeKey(house.project)) || []);
    if (fromProject) return { ...house, coords: fromProject, precision: 'project', source: 'website' };

    return { ...house, coords: null, precision: 'unknown', source: null };
  });
}

// กระจายหมุดที่พิกัดซ้ำกันเป็นวงกลมเล็กๆ เพื่อไม่ให้ทับกันจนคลิกไม่ได้
export function spreadOverlapping(houses) {
  const buckets = new Map();
  houses.forEach((house) => {
    if (!house.coords) return;
    const key = `${house.coords[0].toFixed(5)},${house.coords[1].toFixed(5)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(house);
  });

  buckets.forEach((group) => {
    if (group.length < 2) return;
    const radius = 0.00022;
    group.forEach((house, i) => {
      const angle = (2 * Math.PI * i) / group.length;
      house.coords = [
        Number((house.coords[0] + radius * Math.cos(angle)).toFixed(6)),
        Number((house.coords[1] + radius * Math.sin(angle)).toFixed(6)),
      ];
      house.spread = true;
    });
  });

  return houses;
}
