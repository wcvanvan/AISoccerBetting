/**
 * Build script — generates the web dashboard from pre-existing report data.
 *
 * Scans data/reports/ for match directories, converts markdown to HTML,
 * and produces dist/ with manifest.json + pre-rendered HTML files.
 *
 * Run: npx ts-node scripts/build-web.ts
 */

import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { marked } from 'marked';

// Strip raw HTML blocks for safety (same config as reports.ts)
marked.use({ renderer: { html: () => '' } });

const PROJECT_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'data', 'reports');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

const MARKETS = ['goals', 'corners', 'cards'] as const;

// ── Utilities (ported from reports.ts + report-naming.ts) ──────────────────

function wrapTables(html: string): string {
  return html.replace(/<table[^>]*>/g, '<div class="table-wrap">$&').replace(/<\/table>/g, '</table></div>');
}

function unslug(s: string): string {
  return s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function readFirstLine(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8').split('\n').find((l) => l.trim().length > 0) || '';
}

function parseTitle(line: string): { home: string; away: string } | null {
  const m = line.match(/^#{1,2}\s+(.+?)\s+vs\s+(.+?)(?:\s*[—–\-]\s+.*)?$/i);
  if (!m) return null;
  return { home: m[1].trim(), away: m[2].trim() };
}

function extractValuePicks(markdown: string): string {
  const lines = markdown.split('\n');

  // Primary: find "Value Picks" heading (always present per system prompt)
  const idx = lines.findIndex((l) => /^#{1,4}\s*.*value\s*picks/i.test(l));
  if (idx >= 0) return lines.slice(idx).join('\n');

  // Fallback: last 30% of content (should not happen — system prompt mandates Value Picks heading)
  console.warn('extractValuePicks: no "Value Picks" heading found, using last 30% fallback');
  const cutoff = Math.max(0, Math.floor(lines.length * 0.7));
  return lines.slice(cutoff).join('\n');
}

function normalizePrediction(raw: string): string {
  // 1. Strip preamble — remove everything before the first heading
  let text = raw.replace(/^[\s\S]*?(?=^#\s)/m, '');

  const lines = text.split('\n');

  // Extract h1 title (first line if it's an h1)
  let title = '';
  let bodyStart = 0;
  if (lines[0] && /^#\s/.test(lines[0])) {
    title = lines[0];
    bodyStart = 1;
  }

  const body = lines.slice(bodyStart).join('\n');

  // 2. Unwrap "Phase 4" wrapper — if heading contains a canonical section name after "Phase 4",
  //    keep the section name as an h2; otherwise discard the heading entirely
  const unwrapped = body.replace(
    /^(#{1,3})\s*phase\s*4\s*[—–\-:]*\s*(.*)/gim,
    (_match, _hashes, rest) => {
      const trimmed = rest.trim();
      if (!trimmed) return ''; // bare "Phase 4" heading — discard
      return `## ${trimmed}`; // "Phase 4 — Statistical Summary" → "## Statistical Summary"
    },
  ).replace(
    /^###\s+(Statistical Summary|Detailed Analysis|Value Picks|Bets? to Avoid|Caveats?)/gim,
    '## $1',
  );

  // 3. Parse into sections by h2 headings
  interface Section { heading: string; content: string; canonical: string }
  const sections: Section[] = [];
  let preambleContent = '';

  const sectionRegex = /^##\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  const cuts: { idx: number; fullLen: number; text: string }[] = [];

  while ((match = sectionRegex.exec(unwrapped)) !== null) {
    cuts.push({ idx: match.index, fullLen: match[0].length, text: match[1] });
  }

  for (let i = 0; i < cuts.length; i++) {
    const start = cuts[i].idx + cuts[i].fullLen;
    const end = i + 1 < cuts.length ? cuts[i + 1].idx : unwrapped.length;
    const content = unwrapped.slice(start, end).trim();

    sections.push({ heading: cuts[i].text, content, canonical: '' });
  }

  // Content before the first h2
  if (cuts.length > 0) {
    preambleContent = unwrapped.slice(0, cuts[0].idx).trim();
  } else {
    preambleContent = unwrapped.trim();
  }

  // 4. Classify each section into a canonical bucket
  const canonicalOrder = [
    'Statistical Summary',
    'Detailed Analysis',
    'Value Picks',
    'Bets to Avoid',
    'Caveats',
  ];

  function classify(heading: string): string {
    const h = heading.toLowerCase();
    if (/stat(istical)?\s*summary/i.test(h)) return 'Statistical Summary';
    if (/detailed\s*analysis/i.test(h)) return 'Detailed Analysis';
    if (/phase\s*[1-3]/i.test(h)) return 'Detailed Analysis';
    if (/value\s*picks/i.test(h)) return 'Value Picks';
    if (/bets?\s*to\s*avoid/i.test(h)) return 'Bets to Avoid';
    if (/caveat/i.test(h)) return 'Caveats';
    return '';
  }

  for (const sec of sections) {
    sec.canonical = classify(sec.heading);
  }

  // 5. Merge sections into canonical buckets
  const buckets = new Map<string, string[]>();
  for (const name of canonicalOrder) buckets.set(name, []);

  if (preambleContent) {
    buckets.get('Detailed Analysis')!.push(preambleContent);
  }

  for (const sec of sections) {
    const bucket = sec.canonical || 'Detailed Analysis';
    buckets.get(bucket)!.push(sec.content);
  }

  // 6. Reassemble in canonical order
  const parts: string[] = [];
  if (title) parts.push(title);

  for (const name of canonicalOrder) {
    const content = buckets.get(name)!;
    if (content.length === 0) continue;
    parts.push(`## ${name}\n\n${content.join('\n\n')}`);
  }

  return parts.join('\n\n');
}

function extractReviewSummary(markdown: string): string {
  const lines = markdown.split('\n');
  const idx = lines.findIndex((l) => /^#{1,4}\s*.*summary/i.test(l));
  if (idx >= 0) return lines.slice(idx).join('\n');
  console.warn('extractReviewSummary: no "Summary" heading found, using last 20% fallback');
  const cutoff = Math.max(0, Math.floor(lines.length * 0.8));
  return lines.slice(cutoff).join('\n');
}

function renderMarkdown(md: string): string {
  return wrapTables(marked.parse(md) as string);
}

// ── Manifest types ─────────────────────────────────────────────────────────

interface MarketInfo {
  hasReport: boolean;
  hasPrediction: boolean;
  hasResults: boolean;
  hasReview: boolean;
  hasPredictionPresentation: boolean;
  hasReviewPresentation: boolean;
}

interface ManifestEntry {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  commenceTime: string;
  leagueKey: string;
  leagueLabel: string;
  markets: Record<string, MarketInfo>;
  lastModified: number;
}

// ── Scan reports directory ─────────────────────────────────────────────────

function scanReports(): ManifestEntry[] {
  if (!fs.existsSync(REPORTS_DIR)) return [];

  const matchMap = new Map<string, ManifestEntry>();
  const filePattern = /^(goals|corners|cards)(-prediction|-results|-review|-prediction-presentation|-review-presentation)?\.md$/;
  const dirPattern = /^(.+)-vs-(.+)-(\d{4}-\d{2}-\d{2})$/;

  const entries = fs.readdirSync(REPORTS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dm = entry.name.match(dirPattern);
    if (!dm) continue;

    const [, homeSlug, awaySlug] = dm;
    const matchKey = entry.name;
    const dirPath = path.join(REPORTS_DIR, entry.name);
    const files = fs.readdirSync(dirPath).filter((f) => filePattern.test(f));
    if (files.length === 0) continue;

    let homeTeam = unslug(homeSlug);
    let awayTeam = unslug(awaySlug);
    const firstReport = files.find((f) => /^(goals|corners|cards)\.md$/.test(f));
    if (firstReport) {
      const parsed = parseTitle(readFirstLine(path.join(dirPath, firstReport)));
      if (parsed) { homeTeam = parsed.home; awayTeam = parsed.away; }
    }

    let leagueKey = '';
    let leagueLabel = '';
    let commenceTime = '';
    const metaPath = path.join(dirPath, 'meta.json');
    let metaObj: Record<string, string> = {};
    if (fs.existsSync(metaPath)) {
      try {
        metaObj = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        leagueKey = metaObj.leagueKey || '';
        leagueLabel = metaObj.leagueLabel || '';
        commenceTime = metaObj.commenceTime || '';
      } catch (e) {
        console.warn(`Warning: failed to parse ${metaPath}: ${(e as Error).message}`);
      }
    }

    // Backfill homeTeam/awayTeam into meta.json if missing
    if (fs.existsSync(metaPath) && (!metaObj.homeTeam || !metaObj.awayTeam)) {
      metaObj.homeTeam = homeTeam;
      metaObj.awayTeam = awayTeam;
      try {
        fs.writeFileSync(metaPath, JSON.stringify(metaObj, null, 2) + '\n', 'utf8');
      } catch { /* best-effort */ }
    }

    if (!commenceTime) {
      console.warn(`Warning: ${matchKey} has no commenceTime in meta.json, skipping`);
      continue;
    }

    const date = commenceTime.slice(0, 10);

    const match: ManifestEntry = {
      matchId: matchKey, date, commenceTime, homeTeam, awayTeam, leagueKey, leagueLabel,
      markets: {}, lastModified: 0,
    };

    for (const file of files) {
      const fm = file.match(filePattern);
      if (!fm) continue;
      const [, market, isAnalysis] = fm;
      if (!match.markets[market]) match.markets[market] = { hasReport: false, hasPrediction: false, hasResults: false, hasReview: false, hasPredictionPresentation: false, hasReviewPresentation: false };
      if (isAnalysis === '-prediction-presentation') match.markets[market].hasPredictionPresentation = true;
      else if (isAnalysis === '-review-presentation') match.markets[market].hasReviewPresentation = true;
      else if (isAnalysis === '-prediction') match.markets[market].hasPrediction = true;
      else if (isAnalysis === '-results') match.markets[market].hasResults = true;
      else if (isAnalysis === '-review') match.markets[market].hasReview = true;
      else match.markets[market].hasReport = true;

      const stat = fs.statSync(path.join(dirPath, file));
      if (stat.mtimeMs > match.lastModified) match.lastModified = stat.mtimeMs;
    }

    matchMap.set(matchKey, match);
  }

  return Array.from(matchMap.values()).sort((a, b) => b.lastModified - a.lastModified);
}

// ── Build HTML reports ─────────────────────────────────────────────────────

function buildReportHtml(matches: ManifestEntry[]): void {

  for (const match of matches) {
    const outDir = path.join(DIST_DIR, 'data', 'reports', match.matchId);
    fs.mkdirSync(outDir, { recursive: true });

    for (const market of MARKETS) {
      const info = match.markets[market];
      if (!info) continue;

      const srcDir = path.join(REPORTS_DIR, match.matchId);
      const reportPath = path.join(srcDir, `${market}.md`);
      const predictionPath = path.join(srcDir, `${market}-prediction.md`);

      if (info.hasReport) {
        const md = fs.readFileSync(reportPath, 'utf8');
        fs.writeFileSync(path.join(outDir, `${market}-raw.html`), renderMarkdown(md));
      }

      if (info.hasPrediction) {
        const rawMd = fs.readFileSync(predictionPath, 'utf8');
        const md = normalizePrediction(rawMd);
        fs.writeFileSync(path.join(outDir, `${market}-prediction.html`), renderMarkdown(md));

        // {market}-concise.html — prefer presentation file over extracted value picks
        const presentationPath = path.join(srcDir, `${market}-prediction-presentation.md`);
        if (info.hasPredictionPresentation) {
          const presentationMd = fs.readFileSync(presentationPath, 'utf8');
          fs.writeFileSync(path.join(outDir, `${market}-concise.html`), renderMarkdown(presentationMd));
        } else {
          const conciseMd = extractValuePicks(md);
          fs.writeFileSync(path.join(outDir, `${market}-concise.html`), renderMarkdown(conciseMd));
        }
      }

      // Post-game results
      const resultsPath = path.join(srcDir, `${market}-results.md`);
      if (info.hasResults) {
        const md = fs.readFileSync(resultsPath, 'utf8');
        fs.writeFileSync(path.join(outDir, `${market}-results.html`), renderMarkdown(md));
      }

      // Post-game review
      const reviewPath = path.join(srcDir, `${market}-review.md`);
      if (info.hasReview) {
        const rawMd = fs.readFileSync(reviewPath, 'utf8');
        fs.writeFileSync(path.join(outDir, `${market}-review.html`), renderMarkdown(rawMd));

        // {market}-review-summary.html — prefer presentation file over extracted summary
        const reviewPresentationPath = path.join(srcDir, `${market}-review-presentation.md`);
        if (info.hasReviewPresentation) {
          const reviewPresentationMd = fs.readFileSync(reviewPresentationPath, 'utf8');
          fs.writeFileSync(path.join(outDir, `${market}-review-summary.html`), renderMarkdown(reviewPresentationMd));
        } else {
          const summaryMd = extractReviewSummary(rawMd);
          fs.writeFileSync(path.join(outDir, `${market}-review-summary.html`), renderMarkdown(summaryMd));
        }
      }
    }
  }

}

// ── Copy assets ───────────────────────────────────────────────────────────

function copyAssets(): void {
  for (const file of ['index.html', 'app.js', 'style.css', 'profanity.js', 'comments.js', 'footballer-names.json', 'profanity-list.json']) {
    const src = path.join(PUBLIC_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST_DIR, file));
    }
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  // Clean and create dist
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(path.join(DIST_DIR, 'data', 'reports'), { recursive: true });

  const matches = scanReports();
  fs.writeFileSync(
    path.join(DIST_DIR, 'data', 'manifest.json'),
    JSON.stringify(matches, null, 2),
  );
  buildReportHtml(matches);
  copyAssets();

  console.log(`Built ${matches.length} matches → dist/`);

  if (process.argv.includes('--serve')) {
    const MIME: Record<string, string> = {
      '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
    };
    const server = http.createServer((req, res) => {
      try {
        const raw = (req.url || '/').split('?')[0];
        let fp = path.resolve(DIST_DIR, '.' + path.normalize(raw));
        if (!fp.startsWith(DIST_DIR)) { res.writeHead(403); res.end(); return; }
        if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) fp = path.join(DIST_DIR, 'index.html');
        const ct = MIME[path.extname(fp)] || 'text/html';
        res.writeHead(200, { 'Content-Type': ct + '; charset=utf-8' });
        res.end(fs.readFileSync(fp));
      } catch {
        res.writeHead(500); res.end();
      }
    });
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        server.listen(0, () => {
          const addr = server.address() as { port: number };
          console.log(`http://localhost:${addr.port}`);
        });
      } else {
        console.error(err.message);
        process.exit(1);
      }
    });
    server.listen(3001, () => console.log('http://localhost:3001'));
  }
}

main();
