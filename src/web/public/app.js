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
let currentUser = null; // { username, role }
let currentMatch = null; // { home_team, away_team, date, league_key, league_label, commence_time }
let currentMarket = 'goals';
let currentJobId = null;
let eventSource = null;
let elapsedTimer = null;
let tabCache = {};

// ── Auth ─────────────────────────────────────────────────────────────────────

async function loadUser() {
  try {
    const resp = await fetch('/api/me');
    const data = await resp.json();
    currentUser = data.user;
    if (currentUser) {
      const badge = document.getElementById('user-badge');
      badge.textContent = currentUser.username;
      badge.className = 'user-badge role-' + currentUser.role;
    }
  } catch (_) {
    // If not authenticated, server redirects to login
  }
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

function isAdmin() {
  return currentUser && currentUser.role === 'admin';
}

// ── Page navigation ─────────────────────────────────────────────────────────

function showPage(page) {
  if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }
  if (eventSource) { eventSource.close(); eventSource = null; }

  document.querySelectorAll('.page').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('nav a').forEach((el) => el.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const navLink = document.querySelector('nav a[data-page="' + page + '"]');
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
  const filtered = eventsData.filter((e) => activeLeagues.has(e.league_key));
  renderEvents(filtered);
}

function renderEvents(events) {
  const container = document.getElementById('events-container');

  if (events.length === 0) {
    container.innerHTML = '<div class="empty-state"><h3>No matches found</h3><p>Try enabling more leagues.</p></div>';
    return;
  }

  // Update match count and timestamp in heading
  const heading = document.querySelector('#page-matches .section-title');
  if (heading) {
    const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    heading.innerHTML = 'Upcoming Matches <span class="match-count">(' + events.length + ' &middot; updated ' + timeStr + ')</span>';
  }

  container.innerHTML = '';

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
    '  <button class="btn btn-primary btn-sm" id="custom-go">View Match</button>' +
    '</div>';
  container.appendChild(customForm);

  document.getElementById('custom-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('custom-go').addEventListener('click', () => {
    const home = document.getElementById('custom-home').value.trim();
    const away = document.getElementById('custom-away').value.trim();
    const date = document.getElementById('custom-date').value.trim();
    if (!home || !away || !date) { showToast('Fill in all fields', 'error'); return; }
    openMatchPage({ home_team: home, away_team: away, commence_time: date + 'T00:00:00Z', league_key: '', league_label: 'Custom' });
  });

  // Events table
  const table = document.createElement('table');
  table.className = 'events-table';

  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Date</th><th>Match</th><th>League</th><th>Cached</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  events.forEach((e, idx) => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => openMatchPage(e));

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

    // Cache status cell
    const tdCache = document.createElement('td');
    tdCache.className = 'cache-cell';
    tdCache.id = 'cache-' + idx;
    tdCache.innerHTML = '<span class="cache-loading">...</span>';
    tr.appendChild(tdCache);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  // Fetch cache status for each event (batched, non-blocking)
  loadCacheStatuses(events);
}

async function loadCacheStatuses(events) {
  const seen = new Set();
  const tasks = [];
  events.forEach((e, idx) => {
    const key = e.home_team + '|' + e.away_team + '|' + e.commence_time.slice(0, 10);
    if (seen.has(key)) return;
    seen.add(key);
    tasks.push({ idx, e });
  });

  for (let i = 0; i < tasks.length; i += 6) {
    const batch = tasks.slice(i, i + 6);
    await Promise.all(batch.map(async ({ idx, e }) => {
      try {
        const params = new URLSearchParams({
          homeTeam: e.home_team,
          awayTeam: e.away_team,
          date: e.commence_time.slice(0, 10),
        });
        const resp = await fetch('/api/cache-status?' + params);
        const data = await resp.json();
        renderCacheBadges(idx, data.markets || {});
      } catch (_) {
        const cell = document.getElementById('cache-' + idx);
        if (cell) cell.innerHTML = '';
      }
    }));
  }
}

function renderCacheBadges(idx, markets) {
  const cell = document.getElementById('cache-' + idx);
  if (!cell) return;
  cell.innerHTML = '';
  const marketNames = ['goals', 'corners', 'cards'];
  let hasSome = false;
  marketNames.forEach((m) => {
    const info = markets[m];
    if (info && (info.hasReport || info.hasAnalysis)) {
      hasSome = true;
      const badge = document.createElement('span');
      badge.className = 'cache-badge' + (info.hasAnalysis ? ' cache-full' : ' cache-partial');
      badge.title = m + ': ' + (info.hasAnalysis ? 'report + analysis' : 'report only');
      badge.textContent = m.charAt(0).toUpperCase();
      cell.appendChild(badge);
    }
  });
  if (!hasSome) {
    cell.innerHTML = '<span class="cache-none">&mdash;</span>';
  }
}

// ── Match Info Page ─────────────────────────────────────────────────────────

function openMatchPage(event) {
  currentMatch = {
    home_team: event.home_team,
    away_team: event.away_team,
    date: event.commence_time.slice(0, 10),
    commence_time: event.commence_time,
    league_key: event.league_key || '',
    league_label: event.league_label || '',
  };
  currentMarket = 'goals';
  currentJobId = null;
  tabCache = {};
  showPage('match');
  renderMatchPage();
}

async function renderMatchPage() {
  const container = document.getElementById('match-container');
  container.innerHTML = '';

  const m = currentMatch;
  const date = new Date(m.commence_time);
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // Back link
  const back = document.createElement('a');
  back.href = '#';
  back.className = 'back-link';
  back.textContent = '\u2190 Back to matches';
  back.addEventListener('click', (e) => { e.preventDefault(); showPage('matches'); });
  container.appendChild(back);

  // Match info card
  const infoCard = document.createElement('div');
  infoCard.className = 'match-info-card';
  infoCard.innerHTML =
    '<div class="match-info-teams">' +
    '  <span class="match-info-team">' + esc(m.home_team) + '</span>' +
    '  <span class="match-info-vs">vs</span>' +
    '  <span class="match-info-team">' + esc(m.away_team) + '</span>' +
    '</div>' +
    '<div class="match-info-details">' +
    '  <span>' + esc(dateStr) + (timeStr !== '00:00' ? ' &middot; ' + esc(timeStr) : '') + '</span>' +
    (m.league_label ? '  <span class="league-badge" data-league="' + esc(m.league_key) + '">' + esc(m.league_label) + '</span>' : '') +
    '</div>';
  container.appendChild(infoCard);

  // Market tabs + action buttons
  const toolbar = document.createElement('div');
  toolbar.className = 'match-toolbar';

  const marketTabs = document.createElement('div');
  marketTabs.className = 'market-tabs';
  ['goals', 'corners', 'cards'].forEach((mk) => {
    const tab = document.createElement('button');
    tab.className = 'market-tab' + (mk === currentMarket ? ' active' : '');
    tab.textContent = mk.charAt(0).toUpperCase() + mk.slice(1);
    tab.addEventListener('click', () => switchMarket(mk));
    marketTabs.appendChild(tab);
  });
  toolbar.appendChild(marketTabs);

  // Action buttons (admin only)
  if (isAdmin()) {
    const actions = document.createElement('div');
    actions.className = 'match-actions';
    actions.id = 'match-actions';

    const collectBtn = document.createElement('button');
    collectBtn.className = 'btn btn-secondary btn-sm';
    collectBtn.id = 'btn-collect';
    collectBtn.textContent = 'Collect Data';
    collectBtn.addEventListener('click', () => launchJob(false));

    const analyzeBtn = document.createElement('button');
    analyzeBtn.className = 'btn btn-primary btn-sm';
    analyzeBtn.id = 'btn-analyze';
    analyzeBtn.textContent = 'Analyze';
    analyzeBtn.addEventListener('click', () => launchJob(true));

    actions.append(collectBtn, analyzeBtn);
    toolbar.appendChild(actions);
  }

  container.appendChild(toolbar);

  // Job progress area (steps bar + logs)
  const progressArea = document.createElement('div');
  progressArea.id = 'match-progress';
  container.appendChild(progressArea);

  // Results area
  const resultsArea = document.createElement('div');
  resultsArea.id = 'match-results';
  container.appendChild(resultsArea);

  // Load cache status for current market
  loadMarketData();
}

function switchMarket(market) {
  currentMarket = market;

  // Clean up any running job tracking
  if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }
  if (eventSource) { eventSource.close(); eventSource = null; }
  currentJobId = null;
  tabCache = {};

  // Update active tab
  document.querySelectorAll('.market-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.textContent.toLowerCase() === market);
  });

  // Reset progress and results
  document.getElementById('match-progress').innerHTML = '';
  document.getElementById('match-results').innerHTML = '';

  // Re-enable action buttons
  const collectBtn = document.getElementById('btn-collect');
  const analyzeBtn = document.getElementById('btn-analyze');
  if (collectBtn) { collectBtn.disabled = false; collectBtn.classList.remove('loading'); }
  if (analyzeBtn) { analyzeBtn.disabled = false; analyzeBtn.classList.remove('loading'); }

  loadMarketData();
}

async function loadMarketData() {
  const resultsArea = document.getElementById('match-results');
  if (!currentMatch) return;

  const m = currentMatch;

  // Check if cached data exists for this market
  try {
    const params = new URLSearchParams({
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      date: m.date,
    });
    const resp = await fetch('/api/cache-status?' + params);
    const data = await resp.json();
    const marketInfo = (data.markets || {})[currentMarket];

    if (marketInfo && (marketInfo.hasReport || marketInfo.hasAnalysis)) {
      // Load cached results by creating a temp job that references cached files
      const jobResp = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          date: m.date,
          market: currentMarket,
          analyze: false,
          force: false,
        }),
      });
      const jobData = await jobResp.json();

      if (jobData.cached && jobData.jobId) {
        currentJobId = jobData.jobId;
        renderCachedResults(jobData.jobId, marketInfo.hasAnalysis);
        return;
      }
    }
  } catch (_) {}

  // No cached data
  resultsArea.innerHTML = '<div class="empty-state"><p>No data collected yet for ' + currentMarket + ' market.</p></div>';
}

async function renderCachedResults(jobId, hasAnalysis) {
  const resultsArea = document.getElementById('match-results');
  resultsArea.innerHTML = '';

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

  resultsArea.append(tabs, content);
  await loadTabContent(jobId, tabDefs[0].key);
}

// ── Job launch + progress ───────────────────────────────────────────────────

function launchJob(analyze) {
  if (!currentMatch) return;
  const m = currentMatch;

  // Check if there's an existing running job for this market
  if (currentJobId && eventSource) {
    showToast('A job is already running for this market', 'error');
    return;
  }

  startJob(m.home_team, m.away_team, m.date, currentMarket, analyze);
}

async function startJob(homeTeam, awayTeam, date, market, analyze) {
  const collectBtn = document.getElementById('btn-collect');
  const analyzeBtn = document.getElementById('btn-analyze');
  if (collectBtn) { collectBtn.disabled = true; collectBtn.classList.add('loading'); }
  if (analyzeBtn) { analyzeBtn.disabled = true; analyzeBtn.classList.add('loading'); }

  try {
    const resp = await fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeTeam, awayTeam, date, market, analyze, force: true }),
    });
    const data = await resp.json();

    if (data.error) {
      showToast(data.error, 'error');
      if (collectBtn) { collectBtn.disabled = false; collectBtn.classList.remove('loading'); }
      if (analyzeBtn) { analyzeBtn.disabled = false; analyzeBtn.classList.remove('loading'); }
      return;
    }

    currentJobId = data.jobId;
    tabCache = {};

    if (data.cached) {
      if (collectBtn) { collectBtn.disabled = false; collectBtn.classList.remove('loading'); }
      if (analyzeBtn) { analyzeBtn.disabled = false; analyzeBtn.classList.remove('loading'); }
      renderCachedResults(data.jobId, true);
      return;
    }

    renderJobProgress(data.jobId);
    connectSSE(data.jobId);
  } catch (err) {
    showToast('Failed to start: ' + err.message, 'error');
    if (collectBtn) { collectBtn.disabled = false; collectBtn.classList.remove('loading'); }
    if (analyzeBtn) { analyzeBtn.disabled = false; analyzeBtn.classList.remove('loading'); }
  }
}

function renderJobProgress(jobId) {
  const progressArea = document.getElementById('match-progress');
  progressArea.innerHTML = '';

  // Step progress bar
  const stepsBar = document.createElement('div');
  stepsBar.className = 'steps-bar';
  stepsBar.id = 'job-steps-' + jobId;
  ['Collect', 'Process', 'Analyze', 'Done'].forEach((label) => {
    const step = document.createElement('div');
    step.className = 'step';
    step.textContent = label;
    stepsBar.appendChild(step);
  });
  progressArea.appendChild(stepsBar);

  // Status + elapsed
  const statusRow = document.createElement('div');
  statusRow.style.cssText = 'display: flex; align-items: center; gap: 12px; margin: 8px 0';

  const status = document.createElement('span');
  status.className = 'job-status status-pending';
  status.id = 'job-status-' + jobId;
  status.innerHTML = '<span class="spinner"></span> Pending';

  const elapsed = document.createElement('span');
  elapsed.id = 'job-elapsed-' + jobId;
  elapsed.style.cssText = 'font-size: 12px; color: var(--text-dim); font-family: var(--mono)';
  elapsed.textContent = '0s';

  statusRow.append(status, elapsed);
  progressArea.appendChild(statusRow);

  // Collapsible log panel
  const logToggle = document.createElement('div');
  logToggle.className = 'log-toggle';
  const arrow = document.createElement('span');
  arrow.className = 'arrow open';
  arrow.textContent = '\u25B6';
  const toggleLabel = document.createElement('span');
  toggleLabel.textContent = 'Pipeline Logs';
  logToggle.append(arrow, toggleLabel);

  const log = document.createElement('div');
  log.className = 'progress-log';
  log.id = 'job-log-' + jobId;

  logToggle.addEventListener('click', () => {
    log.classList.toggle('collapsed');
    arrow.classList.toggle('open');
  });

  progressArea.append(logToggle, log);

  // Start elapsed timer
  if (elapsedTimer) clearInterval(elapsedTimer);
  const startTime = Date.now();
  elapsedTimer = setInterval(() => {
    const secs = Math.round((Date.now() - startTime) / 1000);
    const el = document.getElementById('job-elapsed-' + jobId);
    if (el) {
      if (secs < 60) el.textContent = secs + 's';
      else el.textContent = Math.floor(secs / 60) + 'm ' + (secs % 60) + 's';
    }
  }, 1000);
}

function connectSSE(jobId) {
  if (eventSource) eventSource.close();

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
    showToast('Analysis complete!', 'success');

    // Re-enable buttons
    const collectBtn = document.getElementById('btn-collect');
    const analyzeBtn = document.getElementById('btn-analyze');
    if (collectBtn) { collectBtn.disabled = false; collectBtn.classList.remove('loading'); }
    if (analyzeBtn) { analyzeBtn.disabled = false; analyzeBtn.classList.remove('loading'); }

    // Load results
    loadMarketData();
  });

  eventSource.addEventListener('error', (e) => {
    if (e.data) {
      try {
        const data = JSON.parse(e.data);
        updateJobStatus(jobId, 'failed', data.error);
        appendLog(jobId, 'ERROR: ' + data.error);
      } catch (_) {}
      eventSource.close();
      eventSource = null;

      const collectBtn = document.getElementById('btn-collect');
      const analyzeBtn = document.getElementById('btn-analyze');
      if (collectBtn) { collectBtn.disabled = false; collectBtn.classList.remove('loading'); }
      if (analyzeBtn) { analyzeBtn.disabled = false; analyzeBtn.classList.remove('loading'); }
      return;
    }
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

  const steps = ['collecting', 'collected', 'analyzing', 'complete'];
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

  // Update step progress bar
  const stepsEl = document.getElementById('job-steps-' + jobId);
  if (stepsEl && status !== 'failed') {
    const currentIdx = steps.indexOf(status);
    stepsEl.querySelectorAll('.step').forEach((step, i) => {
      step.classList.toggle('step-done', i <= currentIdx);
      step.classList.toggle('step-active', i === currentIdx && currentIdx < steps.length - 1);
    });
  }

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

// ── Tab content loading ─────────────────────────────────────────────────────

async function loadTabContent(jobId, tab) {
  const container = document.getElementById('tab-content-' + jobId);
  if (!container) return;
  const cacheKey = jobId + ':' + tab;

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
      container.innerHTML = '<div class="empty-state"><p>' + esc(data.error) + '</p></div>';
      return;
    }

    tabCache[cacheKey] = data.html;
    container.innerHTML = '';
    const body = document.createElement('div');
    body.className = 'markdown-body';
    body.innerHTML = data.html;
    container.appendChild(body);
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><p>Failed to load: ' + esc(err.message) + '</p></div>';
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
      container.innerHTML = '<div class="empty-state"><h3>No analyses yet</h3><p>Run your first analysis from a match page.</p></div>';
      return;
    }

    const card = document.createElement('div');
    card.className = 'card';

    jobs.forEach((job) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.addEventListener('click', () => {
        // Navigate to match info page for this job's match
        openMatchPage({
          home_team: job.homeTeam,
          away_team: job.awayTeam,
          commence_time: job.date + 'T00:00:00Z',
          league_key: '',
          league_label: '',
        });
      });

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
    container.innerHTML = '<div class="empty-state"><p>Failed to load: ' + esc(err.message) + '</p></div>';
  }
}

// ── Utilities ───────────────────────────────────────────────────────────────

function esc(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = String(s);
  return div.innerHTML;
}

function showToast(message, type) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast' + (type ? ' toast-' + type : '');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Init ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadUser();
  loadEvents();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const matchPage = document.getElementById('page-match');
      if (matchPage && matchPage.classList.contains('active')) {
        showPage('matches');
      }
    }
  });
});
