import { getPublicData } from '../../lib/publicDataCache';

export default async function handler(req, res) {
  try {
    const data = await getPublicData({ force: req.query.refresh === '1' });
    // ให้ CDN ของ Vercel รับภาระแทน: ส่วนใหญ่จะไม่ถึงฟังก์ชันนี้ด้วยซ้ำ
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.status(200).json(data);
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: String(error.message || error) });
  }
}
