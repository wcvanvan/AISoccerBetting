import { Redis } from '@upstash/redis';
import { verifyVisitorId } from './identity.js';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const VALID_MARKETS = ['goals', 'corners', 'cards'];
const MAX_COMMENTS = 500;
const FIXTURE_RE = /^[a-z0-9-]+$/;

// Inline profanity check (defense in depth)
const BAD_WORDS = [
  'ass','asshole','bastard','bitch','bollocks','bullshit','cock','crap','cunt',
  'damn','dick','dickhead','douche','douchebag','fag','faggot','fuck','fucker',
  'fucking','goddamn','horseshit','jackass','motherfucker','nigger','nigga',
  'piss','prick','pussy','retard','retarded','shit','shithead','slut','twat','wanker','whore',
];

function isProfaneServer(text) {
  const lower = text.toLowerCase()
    .replace(/@/g, 'a').replace(/0/g, 'o').replace(/1/g, 'i')
    .replace(/3/g, 'e').replace(/\$/g, 's').replace(/5/g, 's');
  return BAD_WORDS.some(function(w) {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('\\b' + escaped + '\\b', 'i');
    return re.test(lower);
  });
}

function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var id = 'cmt_';
  for (var i = 0; i < 12; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function hashColor(name) {
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  var hue = ((hash % 360) + 360) % 360;
  return 'hsl(' + hue + ', 55%, 45%)';
}

function validateInputs(fixtureId, market, visitorId) {
  if (typeof fixtureId !== 'string' || fixtureId.length > 100 || !FIXTURE_RE.test(fixtureId)) {
    return 'Invalid fixture ID';
  }
  if (!VALID_MARKETS.includes(market)) {
    return 'Invalid market (must be goals, corners, or cards)';
  }
  if (typeof visitorId !== 'string' || visitorId.length > 64 || visitorId.length < 3) {
    return 'Invalid visitor ID';
  }
  return null;
}

// Lua script for atomic comment append with cap enforcement
const APPEND_COMMENT_SCRIPT = `
local key = KEYS[1]
local comment = ARGV[1]
local maxComments = tonumber(ARGV[2])
local existing = redis.call('GET', key)
local list
if existing then
  list = cjson.decode(existing)
else
  list = {}
end
if #list >= maxComments then
  return redis.error_reply('COMMENT_LIMIT_REACHED')
end
table.insert(list, cjson.decode(comment))
redis.call('SET', key, cjson.encode(list))
return #list
`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      var fixture = req.query.fixture;
      var market = req.query.market;
      if (!fixture || !market) return res.status(400).json({ error: 'Missing fixture or market' });

      var inputErr = validateInputs(fixture, market, 'v_x'); // visitor not needed for GET
      if (inputErr && inputErr !== 'Invalid visitor ID') {
        return res.status(400).json({ error: inputErr });
      }

      var commentsKey = 'comments:' + fixture + ':' + market;
      var votesKey = 'analysis-votes:' + fixture + ':' + market;

      var results = await Promise.all([
        redis.get(commentsKey),
        redis.hget(votesKey, 'up'),
        redis.hget(votesKey, 'down'),
      ]);
      var commentList = results[0] || [];
      var up = results[1];
      var down = results[2];

      // Fetch vote counts for all comments
      var commentVotes = {};
      if (commentList.length > 0) {
        var pipeline = redis.pipeline();
        for (var i = 0; i < commentList.length; i++) {
          pipeline.hgetall('comment-votes:' + commentList[i].id);
        }
        var pipeResults = await pipeline.exec();
        for (var j = 0; j < commentList.length; j++) {
          var v = pipeResults[j] || {};
          commentVotes[commentList[j].id] = { up: parseInt(v.up) || 0, down: parseInt(v.down) || 0 };
        }
      }

      return res.status(200).json({
        comments: commentList,
        commentVotes: commentVotes,
        analysisVotes: { up: parseInt(up) || 0, down: parseInt(down) || 0 },
      });
    }

    if (req.method === 'POST') {
      var body = req.body;
      if (!body.fixtureId || !body.market || !body.visitorId || !body.author || !body.text) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      if (!verifyVisitorId(body.visitorId, body.signature)) {
        return res.status(403).json({ error: 'Invalid identity signature' });
      }

      var validationErr = validateInputs(body.fixtureId, body.market, body.visitorId);
      if (validationErr) return res.status(400).json({ error: validationErr });

      if (typeof body.author !== 'string' || body.author.length > 100) {
        return res.status(400).json({ error: 'Invalid author name' });
      }
      if (body.text.length > 2000) {
        return res.status(400).json({ error: 'Comment too long (max 2000 characters)' });
      }
      if (body.parentId && (typeof body.parentId !== 'string' || body.parentId.length > 30 || !body.parentId.startsWith('cmt_'))) {
        return res.status(400).json({ error: 'Invalid parent ID' });
      }
      if (isProfaneServer(body.text)) {
        return res.status(400).json({ error: 'Your comment contains inappropriate language. Please revise and try again.' });
      }

      var cKey = 'comments:' + body.fixtureId + ':' + body.market;

      // Validate parentId if replying
      if (body.parentId) {
        var existing = (await redis.get(cKey)) || [];
        var parent = existing.find(function(c) { return c.id === body.parentId; });
        if (!parent) return res.status(400).json({ error: 'Parent comment not found' });
        if (parent.parentId) return res.status(400).json({ error: 'Cannot reply to a reply (max 2 levels)' });
      }

      var comment = {
        id: generateId(),
        visitorId: body.visitorId,
        author: body.author,
        authorColor: hashColor(body.author),
        text: body.text.trim(),
        parentId: body.parentId || null,
        createdAt: new Date().toISOString(),
      };

      // Atomic append via Lua script — prevents lost updates from concurrent writes
      try {
        await redis.eval(APPEND_COMMENT_SCRIPT, [cKey], [JSON.stringify(comment), String(MAX_COMMENTS)]);
      } catch (luaErr) {
        if (luaErr.message && luaErr.message.includes('COMMENT_LIMIT_REACHED')) {
          return res.status(400).json({ error: 'Comment limit reached for this discussion (' + MAX_COMMENTS + ' max)' });
        }
        throw luaErr;
      }

      return res.status(201).json(comment);
    }

    if (req.method === 'DELETE') {
      var del = req.body;
      if (!del.fixtureId || !del.market || !del.visitorId || !del.commentId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      if (!verifyVisitorId(del.visitorId, del.signature)) {
        return res.status(403).json({ error: 'Invalid identity signature' });
      }

      var delValidation = validateInputs(del.fixtureId, del.market, del.visitorId);
      if (delValidation) return res.status(400).json({ error: delValidation });

      var delKey = 'comments:' + del.fixtureId + ':' + del.market;
      var delList = (await redis.get(delKey)) || [];

      var target = delList.find(function(c) { return c.id === del.commentId; });
      if (!target) return res.status(404).json({ error: 'Comment not found' });
      if (target.visitorId !== del.visitorId) {
        return res.status(403).json({ error: 'You can only delete your own comments' });
      }

      // Remove the comment and any replies to it
      var filtered = delList.filter(function(c) {
        return c.id !== del.commentId && c.parentId !== del.commentId;
      });
      await redis.set(delKey, filtered);

      return res.status(200).json({ deleted: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Comments API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
