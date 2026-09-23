import { getLineConfig, listLeads, requireAdmin, respondError } from '../../../lib/lineServer';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Authorization');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  try {
    await requireAdmin(req);
    return res.json({ ...await listLeads(req.query), setup: getLineConfig() });
  } catch (error) { return respondError(res, error); }
}
