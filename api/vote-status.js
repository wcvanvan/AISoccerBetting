import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const VALID_MARKETS = ['goals', 'corners', 'cards'];
const FIXTURE_RE = /^[a-z0-9-]+$/;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var fixture = req.query.fixture;
    var market = req.query.market;
    var visitor = req.query.visitor;
    if (!fixture || !market || !visitor) {
      return res.status(400).json({ error: 'Missing fixture, market, or visitor' });
    }

    // Input validation
    if (typeof fixture !== 'string' || fixture.length > 100 || !FIXTURE_RE.test(fixture)) {
      return res.status(400).json({ error: 'Invalid fixture ID' });
    }
    if (!VALID_MARKETS.includes(market)) {
      return res.status(400).json({ error: 'Invalid market' });
    }
    if (typeof visitor !== 'string' || visitor.length > 64 || visitor.length < 3) {
      return res.status(400).json({ error: 'Invalid visitor ID' });
    }

    // Check analysis vote
    var analysisVote = await redis.get('voted:' + visitor + ':analysis:' + fixture + ':' + market);

    // Get all comments for this fixture/market to check comment votes
    var comments = (await redis.get('comments:' + fixture + ':' + market)) || [];

    var votes = {};
    if (analysisVote) {
      votes['analysis:' + fixture + ':' + market] = analysisVote;
    }

    if (comments.length > 0) {
      var pipeline = redis.pipeline();
      for (var i = 0; i < comments.length; i++) {
        pipeline.get('voted:' + visitor + ':comment:' + comments[i].id);
      }
      var results = await pipeline.exec();
      for (var j = 0; j < comments.length; j++) {
        if (results[j]) votes[comments[j].id] = results[j];
      }
    }

    return res.status(200).json(votes);
  } catch (err) {
    console.error('Vote status API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
