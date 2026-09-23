import { createIntent, rateLimit, requireTracking, respondError, sameOrigin } from '../../../lib/lineServer';
export const config = { api: { bodyParser: { sizeLimit: '8kb' } } };
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  try {
    const cfg = requireTracking();
    sameOrigin(req);
    await rateLimit(req, 'start');
    const token = await createIntent(req.body);
    return res.json({ url: `https://liff.line.me/${encodeURIComponent(cfg.liffId)}?t=${token}` });
  } catch (error) { return respondError(res, error); }
}
