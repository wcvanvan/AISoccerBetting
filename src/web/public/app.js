/**
 * Soccer Betting Analyzer — Frontend App
 */

// State
let activeLeagues = new Set([
  'soccer_epl',
  'soccer_uefa_champs_league',
  'soccer_germany_bundesliga',
  'soccer_spain_la_liga',
]);
let eventsData = [];
let currentJobId = null;
let eventSource = null;

// ── Page navigation ─────────────────────────────────────────────────────────

function showPage(page) {
  // Clean up resources when leaving results page
  if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }
  if (eventSource) { eventSource.close(); eventSource = null; }

  document.querySelectorAll('.page').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('nav a').forEach((el) => el.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const navLink = document.querySelector(`nav a[data-page="${page}"]`);
  if (navLink) navLink.classList.add('active');

  if (page === 'history') loadHistory();
}

// ── Events / Matches ────────────────────────────────────────────────────────

async function loadEvents() {
  const container = document.getElementById('events-container');
  container.innerHTML = '<div class="loading"><span class="spinner"></span> Loading matches...</div>';

  try {
    const resp = await fetch('/api/events');
    const data = await resp.json();

    if (data.error) {
      container.innerHTML = '<div class="empty-state"><h3>Error</h3><p>' + esc(data.error) + '</p></div>';
      return;
    }

    eventsData = data.events || [];
    renderLeagueFilters(data.leagues || []);
    const filtered = eventsData.filter((e) => activeLeagues.has(e.league_key));
    renderEvents(filtered);
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><h3>Failed to load</h3><p>' + esc(err.message) + '</p></div>';
  }
}

function renderLeagueFilters(leagues) {
  const container = document.getElementById('league-filters');
  container.innerHTML = '';
  leagues.forEach((l) => {
    const label = document.createElement('label');
    label.className = 'filter-chip' + (activeLeagues.has(l.key) ? ' active' : '');
    label.dataset.league = l.key;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = activeLeagues.has(l.key);
    input.addEventListener('change', () => toggleLeague(l.key));
    label.appendChild(input);
    label.appendChild(document.createTextNode(' ' + l.label));
    container.appendChild(label);
  });
}

function toggleLeague(key) {
  if (activeLeagues.has(key)) {
    activeLeagues.delete(key);
  } else {
    activeLeagues.add(key);
  }
  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.classList.toggle('active', activeLeagues.has(chip.dataset.league));
  });
  // Filter client-side instead of re-fetching from API
  const filtered = eventsData.filter((e) => activeLeagues.has(e.league_key));
  renderEvents(filtered);
}

function renderEvents(events) {
  const container = document.getElementById('events-container');

  if (events.length === 0) {
    container.innerHTML = '<div class="empty-state"><h3>No matches found</h3><p>Try enabling more leagues.</p></div>';
    return;
  }

  // Update match count in heading
  const heading = document.querySelector('#page-matches .section-title');
  if (heading) heading.innerHTML = 'Upcoming Matches <span class="match-count">(' + events.length + ')</span>';

  // Custom match form
  const customForm = document.createElement('div');
  customForm.className = 'card';
  customForm.style.marginBottom = '16px';
  customForm.innerHTML =
    '<div class="section-title" style="margin-bottom: 12px">Custom Match</div>' +
    '<div style="display: flex; gap: 10px; align-items: end; flex-wrap: wrap">' +
    '  <div><label style="font-size: 12px; color: var(--text-dim); display: block; margin-bottom: 4px">Home Team</label>' +
    '  <input type="text" id="custom-home" class="market-select" style="width: 180px" placeholder="e.g. Arsenal"></div>' +
    '  <div><label style="font-size: 12px; color: var(--text-dim); display: block; margin-bottom: 4px">Away Team</label>' +
    '  <input type="text" id="custom-away" class="market-select" style="width: 180px" placeholder="e.g. Chelsea"></div>' +
    '  <div><label style="font-size: 12px; color: var(--text-dim); display: block; margin-bottom: 4px">Date</label>' +
    '  <input type="date" id="custom-date" class="market-select" style="width: 150px"></div>' +
    '  <div><label style="font-size: 12px; color: var(--text-dim); display: block; margin-bottom: 4px">Market</label>' +
    '  <select class="market-select" id="custom-market">' +
    '    <option value="goals">Goals</option><option value="corners">Corners</option><option value="cards">Cards</option>' +
    '  </select></div>' +
    '  <button class="btn btn-primary btn-sm" id="custom-analyze">Analyze</button>' +
    '  <button class="btn btn-secondary btn-sm" id="custom-collect">Collect Only</button>' +
    '</div>';
  container.innerHTML = '';
  container.appendChild(customForm);

  // Default date to today
  document.getElementById('custom-date').value = new Date().toISOString().slice(0, 10);

  document.getElementById('custom-analyze').addEventListener('click', () => {
    const home = document.getElementById('custom-home').value.trim();
    const away = document.getElementById('custom-away').value.trim();
    const date = document.getElementById('custom-date').value.trim();
    const market = document.getElementById('custom-market').value;
    if (!home || !away || !date) { alert('Fill in all fields'); return; }
    launchWithCacheCheck(home, away, date, market, true);
  });
  document.getElementById('custom-collect').addEventListener('click', () => {
    const home = document.getElementById('custom-home').value.trim();
    const away = document.getElementById('custom-away').value.trim();
    const date = document.getElementById('custom-date').value.trim();
    const market = document.getElementById('custom-market').value;
    if (!home || !away || !date) { alert('Fill in all fields'); return; }
    launchWithCacheCheck(home, away, date, market, false);
  });

  // Events table
  const table = document.createElement('table');
  table.className = 'events-table';

  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Date</th><th>Match</th><th>League</th><th>Market</th><th>Actions</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  events.forEach((e, idx) => {
    const tr = document.createElement('tr');

    const date = new Date(e.commence_time);
    const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // Date cell
    const tdDate = document.createElement('td');
    tdDate.innerHTML = '<div class="match-date">' + esc(dateStr) + '</div><div class="match-date">' + esc(timeStr) + '</div>';
    tr.appendChild(tdDate);

    // Match cell
    const tdMatch = document.createElement('td');
    const homeSpan = document.createElement('span');
    homeSpan.className = 'team-name';
    homeSpan.textContent = e.home_team;
    const vsSpan = document.createElement('span');
    vsSpan.className = 'vs';
    vsSpan.textContent = 'vs';
    const awaySpan = document.createElement('span');
    awaySpan.className = 'team-name';
    awaySpan.textContent = e.away_team;
    tdMatch.append(homeSpan, vsSpan, awaySpan);
    tr.appendChild(tdMatch);

    // League cell
    const tdLeague = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'league-badge';
    badge.dataset.league = e.league_key;
    badge.textContent = e.league_label;
    tdLeague.appendChild(badge);
    tr.appendChild(tdLeague);

    // Market select cell
    const tdMarket = document.createElement('td');
    const select = document.createElement('select');
    select.className = 'market-select';
    select.id = 'market-' + idx;
    ['goals', 'corners', 'cards'].forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m.charAt(0).toUpperCase() + m.slice(1);
      select.appendChild(opt);
    });
    tdMarket.appendChild(select);
    tr.appendChild(tdMarket);

    // Actions cell
    const tdActions = document.createElement('td');
    const btnAnalyze = document.createElement('button');
    btnAnalyze.className = 'btn btn-primary btn-sm';
    btnAnalyze.textContent = 'Analyze';
    btnAnalyze.addEventListener('click', () => {
      const market = select.value;
      launchWithCacheCheck(e.home_team, e.away_team, e.commence_time.slice(0, 10), market, true, btnAnalyze);
    });

    const btnCollect = document.createElement('button');
    btnCollect.className = 'btn btn-secondary btn-sm';
    btnCollect.textContent = 'Collect Only';
    btnCollect.style.marginLeft = '6px';
    btnCollect.addEventListener('click', () => {
      const market = select.value;
      launchWithCacheCheck(e.home_team, e.away_team, e.commence_time.slice(0, 10), market, false, btnCollect);
    });

    tdActions.append(btnAnalyze, btnCollect);
    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

// ── Analysis ────────────────────────────────────────────────────────────────

function launchWithCacheCheck(homeTeam, awayTeam, date, market, analyze, triggerBtn) {
  // First attempt without force — server returns cached results if available
  startJob(homeTeam, awayTeam, date, market, analyze, triggerBtn, false);
}

async function startJob(homeTeam, awayTeam, date, market, analyze, triggerBtn, force) {
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.classList.add('loading');
  }
  try {
    const resp = await fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeTeam, awayTeam, date, market, analyze, force: !!force }),
    });
    const data = await resp.json();

    if (data.error) {
      alert('Error: ' + data.error);
      return;
    }

    currentJobParams = { homeTeam, awayTeam, date, market };

    // Cached results found on disk — show them immediately
    if (data.cached) {
      currentJobId = data.jobId;
      showPage('results');
      renderJobProgress(data.jobId, homeTeam, awayTeam, date, market, true, true);
      appendLog(data.jobId, 'Loaded from cached results');
      updateJobStatus(data.jobId, 'complete', null);
      renderResults(data.jobId);
      return;
    }

    currentJobId = data.jobId;
    showPage('results');
    renderJobProgress(data.jobId, homeTeam, awayTeam, date, market);

    if (data.duplicate) {
      appendLog(data.jobId, 'Reconnecting to existing job...');
    }

    connectSSE(data.jobId);
  } catch (err) {
    alert('Failed to start analysis: ' + err.message);
  } finally {
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.classList.remove('loading');
    }
  }
}

let elapsedTimer = null;
let tabCache = {}; // Cache loaded tab HTML by jobId:tabKey
let currentJobParams = null; // { homeTeam, awayTeam, date, market } for re-run

function renderJobProgress(jobId, home, away, date, market, skipTimer, isCached) {
  const container = document.getElementById('results-container');
  const marketLabel = market.charAt(0).toUpperCase() + market.slice(1);

  container.innerHTML = '';
  tabCache = {};

  // Top bar: back link + re-run button
  const topBar = document.createElement('div');
  topBar.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;';

  const backLink = document.createElement('a');
  backLink.href = '#';
  backLink.style.cssText = 'font-size: 13px; color: var(--text-dim); text-decoration: none;';
  backLink.textContent = '\u2190 Back to matches';
  backLink.addEventListener('click', (e) => { e.preventDefault(); showPage('matches'); });
  topBar.appendChild(backLink);

  if (isCached) {
    const rerunBtn = document.createElement('button');
    rerunBtn.className = 'btn btn-secondary btn-sm';
    rerunBtn.textContent = 'Re-run Pipeline';
    rerunBtn.addEventListener('click', () => {
      if (!currentJobParams) return;
      if (!confirm('Cached results already exist for this match.\n\nRe-run the full pipeline? This will overwrite existing results.')) return;
      const p = currentJobParams;
      startJob(p.homeTeam, p.awayTeam, p.date, p.market, true, rerunBtn, true);
    });
    topBar.appendChild(rerunBtn);
  }

  container.appendChild(topBar);

  const card = document.createElement('div');
  card.className = 'job-card';
  card.id = 'job-' + jobId;

  const header = document.createElement('div');
  header.className = 'job-header';

  const info = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'job-title';
  title.textContent = home + ' vs ' + away;
  const meta = document.createElement('div');
  meta.style.cssText = 'font-size: 12px; color: var(--text-dim); margin-top: 2px';
  meta.textContent = date + ' \u00B7 ' + marketLabel + ' market';
  info.append(title, meta);

  const statusArea = document.createElement('div');
  statusArea.style.cssText = 'display: flex; align-items: center; gap: 12px';

  const elapsed = document.createElement('span');
  elapsed.id = 'job-elapsed-' + jobId;
  elapsed.style.cssText = 'font-size: 12px; color: var(--text-dim); font-family: var(--mono)';
  elapsed.textContent = '0s';

  const status = document.createElement('span');
  status.className = 'job-status status-pending';
  status.id = 'job-status-' + jobId;
  status.innerHTML = '<span class="spinner"></span> Pending';

  statusArea.append(elapsed, status);
  header.append(info, statusArea);

  const log = document.createElement('div');
  log.className = 'progress-log';
  log.id = 'job-log-' + jobId;

  const results = document.createElement('div');
  results.id = 'job-results-' + jobId;
  results.style.marginTop = '16px';

  card.append(header, log, results);
  container.appendChild(card);

  // Start elapsed timer (skip when viewing historical jobs)
  if (elapsedTimer) clearInterval(elapsedTimer);
  if (!skipTimer) {
    const startTime = Date.now();
    elapsedTimer = setInterval(() => {
      const secs = Math.round((Date.now() - startTime) / 1000);
      const el = document.getElementById('job-elapsed-' + jobId);
      if (el) {
        if (secs < 60) el.textContent = secs + 's';
        else el.textContent = Math.floor(secs / 60) + 'm ' + (secs % 60) + 's';
      }
    }, 1000);
  } else {
    elapsed.textContent = '';
  }
}

function connectSSE(jobId) {
  if (eventSource) {
    eventSource.close();
  }

  eventSource = new EventSource('/api/analysis/' + jobId + '/stream');

  eventSource.addEventListener('status', (e) => {
    const data = JSON.parse(e.data);
    updateJobStatus(jobId, data.status, data.message);
  });

  eventSource.addEventListener('log', (e) => {
    const data = JSON.parse(e.data);
    appendLog(jobId, data.message);
  });

  eventSource.addEventListener('complete', () => {
    eventSource.close();
    eventSource = null;
    updateJobStatus(jobId, 'complete', 'Complete!');
    renderResults(jobId);
  });

  eventSource.addEventListener('error', (e) => {
    // Custom application-level error (has data) — close permanently
    if (e.data) {
      try {
        const data = JSON.parse(e.data);
        updateJobStatus(jobId, 'failed', data.error);
        appendLog(jobId, 'ERROR: ' + data.error);
      } catch (_) {}
      eventSource.close();
      eventSource = null;
      return;
    }
    // Native SSE connection error — browser auto-reconnects if readyState != CLOSED
    // Only close if EventSource gave up (readyState === CLOSED)
    if (eventSource.readyState === EventSource.CLOSED) {
      appendLog(jobId, 'Connection lost');
      eventSource = null;
    }
  });
}

function updateJobStatus(jobId, status, message) {
  const el = document.getElementById('job-status-' + jobId);
  if (!el) return;

  const labels = {
    pending: 'Pending',
    collecting: 'Collecting Data',
    collected: 'Data Collected',
    analyzing: 'Analyzing',
    complete: 'Complete',
    failed: 'Failed',
  };

  const spinnerStatuses = ['pending', 'collecting', 'analyzing'];
  el.className = 'job-status status-' + status;
  el.innerHTML = '';
  if (spinnerStatuses.includes(status)) {
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    el.appendChild(spinner);
    el.appendChild(document.createTextNode(' '));
  }
  el.appendChild(document.createTextNode(labels[status] || status));

  // Stop elapsed timer on terminal states
  if ((status === 'complete' || status === 'failed') && elapsedTimer) {
    clearInterval(elapsedTimer);
    elapsedTimer = null;
  }

  if (message) appendLog(jobId, message);
}

function appendLog(jobId, message) {
  const log = document.getElementById('job-log-' + jobId);
  if (!log) return;
  const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = '[' + time + '] ' + message;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

// ── Results rendering ───────────────────────────────────────────────────────

async function renderResults(jobId) {
  const resultsEl = document.getElementById('job-results-' + jobId);
  if (!resultsEl) return;

  // Fetch job details to determine available tabs
  let hasAnalysis = false;
  try {
    const resp = await fetch('/api/analysis/' + jobId);
    const job = await resp.json();
    hasAnalysis = !!job.hasAnalysis;
  } catch (_) {}

  resultsEl.innerHTML = '';

  const tabs = document.createElement('div');
  tabs.className = 'tabs';

  const tabDefs = hasAnalysis
    ? [
        { key: 'concise', label: 'Value Picks' },
        { key: 'analysis', label: 'Full Analysis' },
        { key: 'raw', label: 'Data Report' },
      ]
    : [{ key: 'raw', label: 'Data Report' }];

  tabDefs.forEach((t, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (i === 0 ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', () => {
      tabs.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadTabContent(jobId, t.key);
    });
    tabs.appendChild(btn);
  });

  const content = document.createElement('div');
  content.id = 'tab-content-' + jobId;

  resultsEl.append(tabs, content);
  await loadTabContent(jobId, tabDefs[0].key);
}

async function loadTabContent(jobId, tab) {
  const container = document.getElementById('tab-content-' + jobId);
  const cacheKey = jobId + ':' + tab;

  // Serve from cache if available
  if (tabCache[cacheKey]) {
    container.innerHTML = '';
    const body = document.createElement('div');
    body.className = 'markdown-body';
    body.innerHTML = tabCache[cacheKey];
    container.appendChild(body);
    return;
  }

  container.innerHTML = '<div class="loading"><span class="spinner"></span> Loading...</div>';

  try {
    const resp = await fetch('/api/reports/' + jobId + '/' + tab);
    const data = await resp.json();

    if (data.error) {
      container.innerHTML = '';
      const msg = document.createElement('div');
      msg.className = 'empty-state';
      const p = document.createElement('p');
      p.textContent = data.error;
      msg.appendChild(p);
      container.appendChild(msg);
      return;
    }

    tabCache[cacheKey] = data.html;
    container.innerHTML = '';
    const body = document.createElement('div');
    body.className = 'markdown-body';
    body.innerHTML = data.html;
    container.appendChild(body);
  } catch (err) {
    container.innerHTML = '';
    const msg = document.createElement('div');
    msg.className = 'empty-state';
    const p = document.createElement('p');
    p.textContent = 'Failed to load: ' + err.message;
    msg.appendChild(p);
    container.appendChild(msg);
  }
}

// ── History ─────────────────────────────────────────────────────────────────

async function loadHistory() {
  const container = document.getElementById('history-container');
  container.innerHTML = '<div class="loading"><span class="spinner"></span> Loading...</div>';

  try {
    const resp = await fetch('/api/jobs');
    const data = await resp.json();
    const jobs = data.jobs || [];

    if (jobs.length === 0) {
      container.innerHTML = '<div class="empty-state"><h3>No analyses yet</h3><p>Run your first analysis from the Matches page.</p></div>';
      return;
    }

    const card = document.createElement('div');
    card.className = 'card';

    jobs.forEach((job) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.addEventListener('click', () => viewJob(job.id));

      const info = document.createElement('div');
      info.className = 'history-info';

      const teams = document.createElement('div');
      teams.className = 'history-teams';
      teams.textContent = job.homeTeam + ' vs ' + job.awayTeam;

      const meta = document.createElement('div');
      meta.className = 'history-meta';
      const createdDate = new Date(job.createdAt).toLocaleString('en-GB', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      meta.textContent = job.date + ' \u00B7 ' + job.market + ' \u00B7 ' + createdDate;

      info.append(teams, meta);

      const statusBadge = document.createElement('span');
      statusBadge.className = 'job-status status-' + job.status;
      statusBadge.textContent = job.status.charAt(0).toUpperCase() + job.status.slice(1);

      item.append(info, statusBadge);
      card.appendChild(item);
    });

    container.innerHTML = '';
    container.appendChild(card);
  } catch (err) {
    container.innerHTML = '';
    const msg = document.createElement('div');
    msg.className = 'empty-state';
    const p = document.createElement('p');
    p.textContent = 'Failed to load: ' + err.message;
    msg.appendChild(p);
    container.appendChild(msg);
  }
}

async function viewJob(jobId) {
  try {
    const resp = await fetch('/api/analysis/' + jobId);
    const job = await resp.json();

    if (job.error && !job.id) {
      alert(job.error);
      return;
    }

    currentJobId = jobId;
    currentJobParams = { homeTeam: job.homeTeam, awayTeam: job.awayTeam, date: job.date, market: job.market };
    showPage('results');
    const isCached = job.status === 'complete';
    renderJobProgress(jobId, job.homeTeam, job.awayTeam, job.date, job.market, true, isCached);

    // Replay logs
    (job.logs || []).forEach((log) => appendLog(jobId, log.message));
    updateJobStatus(jobId, job.status, null);

    if (job.status === 'complete') {
      renderResults(jobId);
    } else if (job.status === 'failed') {
      appendLog(jobId, 'ERROR: ' + (job.error || 'Unknown error'));
    } else {
      connectSSE(jobId);
    }
  } catch (err) {
    alert('Failed to load job: ' + err.message);
  }
}

// ── Utilities ───────────────────────────────────────────────────────────────

function esc(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = String(s);
  return div.innerHTML;
}

// ── Init ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
});
