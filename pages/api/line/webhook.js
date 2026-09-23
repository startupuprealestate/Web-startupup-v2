import { httpError, recordLineEvent, requireTracking, respondError, validSignature } from '../../../lib/lineServer';
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  try {
    if (!process.env.LINE_CHANNEL_SECRET) throw httpError(503, 'Webhook is not configured');
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 1024 * 1024) throw httpError(413, 'Payload too large');
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks);
    if (!validSignature(raw, req.headers['x-line-signature'], process.env.LINE_CHANNEL_SECRET)) throw httpError(401, 'Invalid signature');
    let payload;
    try { payload = JSON.parse(raw.toString('utf8')); } catch { throw httpError(400, 'Invalid JSON'); }
    if (!Array.isArray(payload.events) || payload.events.length > 100) throw httpError(400, 'Invalid events');
    if (process.env.LINE_BOT_USER_ID && payload.destination !== process.env.LINE_BOT_USER_ID) throw httpError(403, 'Wrong account');
    if (payload.events.length) requireTracking();
    // No automated replies: the existing OA greeting and human chat keep working.
    for (const event of payload.events) await recordLineEvent(event);
    return res.json({ ok: true });
  } catch (error) { return respondError(res, error); }
}
