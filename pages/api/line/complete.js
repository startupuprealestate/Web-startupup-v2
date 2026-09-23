import { claimIntent, rateLimit, requireTracking, respondError, sameOrigin, verifyLineToken } from '../../../lib/lineServer';
export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  try {
    requireTracking();
    sameOrigin(req);
    await rateLimit(req, 'complete');
    const profile = await verifyLineToken(req.body?.idToken);
    return res.json(await claimIntent(req.body?.token, profile));
  } catch (error) { return respondError(res, error); }
}
