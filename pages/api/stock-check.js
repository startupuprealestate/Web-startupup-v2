import { fetchMasterStockIndex } from '../../lib/masterStock';

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache = { at: 0, payload: null };

export default async function handler(req, res) {
  const force = req.query.refresh === '1';
  const isFresh = cache.payload && Date.now() - cache.at < CACHE_TTL_MS;

  try {
    if (force || !isFresh) {
      cache = { at: Date.now(), payload: { ...(await fetchMasterStockIndex()), updatedAt: new Date().toISOString() } };
    }
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.status(200).json(cache.payload);
  } catch (error) {
    // มีข้อมูลเก่าอยู่ก็ส่งไปก่อน ดีกว่าให้หลังบ้านไม่เห็นสถานะอะไรเลย
    if (cache.payload) {
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({ ...cache.payload, stale: true, error: String(error.message || error) });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: String(error.message || error) });
  }
}
