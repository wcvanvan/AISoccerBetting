import { Redis } from '@upstash/redis';
import { verifyVisitorId } from './identity.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const VALID_MARKETS = ['goals', 'corners', 'cards'];
const FIXTURE_RE = /^[a-z0-9-]+$/;

// Lua script for atomic vote: check existing, update counter, set/del dedup key
// Runs entirely on Redis server — prevents double-counting from concurrent requests
// Returns: "userVote:up:down" (e.g. "up:5:2" or "none:4:2")
const VOTE_SCRIPT = `
local dedupKey = KEYS[1]
local counterKey = KEYS[2]
local direction = ARGV[1]

local existing = redis.call('GET', dedupKey)

if existing == direction then
  redis.call('DEL', dedupKey)
  redis.call('HINCRBY', counterKey, direction, -1)
elseif existing and existing ~= false then
  redis.call('SET', dedupKey, direction)
  redis.call('HINCRBY', counterKey, existing, -1)
  redis.call('HINCRBY', counterKey, direction, 1)
else
  redis.call('SET', dedupKey, direction)
  redis.call('HINCRBY', counterKey, direction, 1)
end

local up = redis.call('HGET', counterKey, 'up') or '0'
local down = redis.call('HGET', counterKey, 'down') or '0'
local current = redis.call('GET', dedupKey)
if current == false then
  current = 'none'
end
return current .. ':' .. up .. ':' .. down
`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var body = req.body;
    var visitorId = body.visitorId;
    var targetType = body.targetType;
    var targetId = body.targetId;
    var fixtureId = body.fixtureId;
    var market = body.market;
    var direction = body.direction;

    if (!visitorId || !targetType || !direction || !fixtureId || !market) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!verifyVisitorId(visitorId, body.signature)) {
      return res.status(403).json({ error: 'Invalid identity signature' });
    }
    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({ error: 'Direction must be "up" or "down"' });
    }
    if (!['analysis', 'comment'].includes(targetType)) {
      return res.status(400).json({ error: 'targetType must be "analysis" or "comment"' });
    }
    // Input validation
    if (typeof visitorId !== 'string' || visitorId.length > 64 || visitorId.length < 3) {
      return res.status(400).json({ error: 'Invalid visitor ID' });
    }
    if (typeof fixtureId !== 'string' || fixtureId.length > 100 || !FIXTURE_RE.test(fixtureId)) {
      return res.status(400).json({ error: 'Invalid fixture ID' });
    }
    if (!VALID_MARKETS.includes(market)) {
      return res.status(400).json({ error: 'Invalid market' });
    }
    if (targetType === 'comment' && (!targetId || typeof targetId !== 'string' || targetId.length > 30)) {
      return res.status(400).json({ error: 'Invalid target ID' });
    }

    // Build keys
    var dedupKey = targetType === 'analysis'
      ? 'voted:' + visitorId + ':analysis:' + fixtureId + ':' + market
      : 'voted:' + visitorId + ':comment:' + targetId;

    var counterKey = targetType === 'analysis'
      ? 'analysis-votes:' + fixtureId + ':' + market
      : 'comment-votes:' + targetId;

    // Atomic vote via Lua — runs on Redis server, not in Node.js
    var result = await redis.eval(VOTE_SCRIPT, [dedupKey, counterKey], [direction]);

    // Parse result: "userVote:up:down"
    var parts = String(result).split(':');
    var userVote = parts[0] === 'none' ? null : parts[0];
    var up = parseInt(parts[1]) || 0;
    var down = parseInt(parts[2]) || 0;

    return res.status(200).json({
      votes: { up: up, down: down },
      userVote: userVote,
    });
  } catch (err) {
    console.error('Vote API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
