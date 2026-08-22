/**
 * อ่านพิกัดบ้านจากเว็บหลัก (คอลเลกชัน properties) ผ่าน Firestore REST
 *
 * ⚠️ การอ่านทีละครั้งนับเป็น "document read" ทุกหลัง (~180 ครั้งต่อการเรียก 1 รอบ)
 * ซึ่งกินโควตาอ่านรายวันของแพลนฟรีเร็วมากถ้าเรียกตอน runtime ทุกครั้งที่แคชหมดอายุ
 * ปกติจึงเรียกจาก scripts/build-website-coords.mjs ตอน build แล้วเก็บผลไว้ใน
 * data/website-coords.json ให้ /api/stock อ่านจากไฟล์แทน
 */
import { inThailand } from './mapurl.mjs';

const FIRESTORE_PROJECT = 'startup-up-realestate';
const FIRESTORE_KEY = 'AIzaSyDsEeGxKA90-URCn06F-K3U2dvlISf_2Jo';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents/artifacts/${FIRESTORE_PROJECT}/public/data`;

const parseCoord = (value) => {
  const n = parseFloat(String(value ?? '').replace(/,/g, '.').replace(/\s/g, ''));
  return Number.isFinite(n) ? n : NaN;
};

const normalizeKey = (value) => String(value ?? '')
  .replace(/\u00a0/g, ' ')
  .trim()
  .toLowerCase()
  .replace(/\*+/g, '')
  .replace(/\s+/g, '')
  .replace(/[-–—]/g, '/');

const firestoreValue = (field) => {
  if (!field || typeof field !== 'object') return undefined;
  const key = Object.keys(field)[0];
  if (key === 'arrayValue') return (field.arrayValue.values || []).map(firestoreValue);
  if (key === 'integerValue' || key === 'doubleValue') return Number(field[key]);
  return field[key];
};

/** คืนค่าเป็น plain object เพื่อให้เขียนลง JSON snapshot ได้ตรงๆ */
export async function fetchFirestoreCoords() {
  const documents = [];
  let pageToken = '';

  do {
    const url = new URL(`${FIRESTORE_BASE}/properties`);
    url.searchParams.set('key', FIRESTORE_KEY);
    url.searchParams.set('pageSize', '300');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      const detail = response.status === 429 ? ' (โควตาอ่าน Firestore เต็ม)' : '';
      throw new Error(`Firestore read failed (${response.status})${detail}`);
    }

    const payload = await response.json();
    documents.push(...(payload.documents || []));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  const byHouse = {};
  const byProject = {};

  documents.forEach((document) => {
    const data = Object.fromEntries(
      Object.entries(document.fields || {}).map(([key, field]) => [key, firestoreValue(field)])
    );
    const lat = parseCoord(data.lat);
    const lng = parseCoord(data.lng);
    if (!inThailand(lat, lng)) return;

    const houseKey = normalizeKey(data.house_number);
    const projectKey = normalizeKey(data.project_name);
    if (houseKey && !(houseKey in byHouse)) byHouse[houseKey] = [lat, lng];
    if (projectKey) {
      if (!byProject[projectKey]) byProject[projectKey] = [];
      byProject[projectKey].push([lat, lng]);
    }
  });

  return { byHouse, byProject, docCount: documents.length };
}
