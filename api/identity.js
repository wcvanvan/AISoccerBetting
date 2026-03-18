import { createHmac } from 'crypto';

const SECRET = process.env.COMMENT_SECRET || process.env.KV_REST_API_TOKEN || 'fallback-secret';

function generateVisitorId() {
  var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var id = 'v_';
  for (var i = 0; i < 16; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export function signVisitorId(visitorId) {
  return createHmac('sha256', SECRET).update(visitorId).digest('hex').substring(0, 24);
}

export function verifyVisitorId(visitorId, signature) {
  if (!visitorId || !signature) return false;
  var expected = signVisitorId(visitorId);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  var match = true;
  for (var i = 0; i < expected.length; i++) {
    if (expected[i] !== signature[i]) match = false;
  }
  return match;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var visitorId = generateVisitorId();
  var signature = signVisitorId(visitorId);

  return res.status(200).json({ visitorId: visitorId, signature: signature });
}
