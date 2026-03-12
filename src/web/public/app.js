/**
 * Soccer Betting Analyzer — Frontend App
 */

// State
let eventsData = [];
let currentUser = null; // { username, role }
let currentMatch = null; // { home_team, away_team, date, league_key, league_label, commence_time }
let currentMarket = 'goals';
let currentJobId = null;
let currentJobAnalyze = false;
let eventSource = null;
let elapsedTimer = null;
let tabCache = {};

// ── Auth ─────────────────────────────────────────────────────────────────────

async function loadUser() {
  try {
    const resp = await fetch('/api/me');
    if (resp.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    const data = await resp.json();
    currentUser = data.user;
    if (currentUser) {
      const badge = document.getElementById('user-badge');
      badge.textContent = currentUser.username;
      badge.className = 'user-badge role-' + currentUser.role;

      // Hide History nav for reader accounts
      if (currentUser.role === 'reader') {
        const historyNav = document.getElementById('nav-history');
        if (historyNav) historyNav.style.display = 'none';
      }
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
  // Don't kill SSE/timer when navigating away — preserve running job state
  document.querySelectorAll('.page').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('nav a').forEach((el) => el.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const navLink = document.querySelector('nav a[data-page="' + page + '"]');
  if (navLink) navLink.classList.add('active');

  if (page === 'history') loadHistory();
}

// ── Events / Matches ────────────────────────────────────────────────────────

var datePages = [];   // [{ date: 'YYYY-MM-DD', events: [...] }, ...]
var currentDateIdx = 0;

async function loadEvents() {
  var container = document.getElementById('events-container');
  container.innerHTML = '<div class="loading"><span class="spinner"></span> Loading matches...</div>';

  var oddsEvents = [];
  var historyEvents = [];

  // Fetch Odds API events + history in parallel
  var results = await Promise.allSettled([
    fetch('/api/events').then(function (r) { return r.json(); }),
    fetch('/api/history').then(function (r) { return r.json(); }),
  ]);

  if (results[0].status === 'fulfilled' && !results[0].value.error) {
    oddsEvents = results[0].value.events || [];
  }
  if (results[1].status === 'fulfilled') {
    var matches = results[1].value.matches || [];
    historyEvents = matches.map(function (m) {
      return {
        home_team: m.homeTeam,
        away_team: m.awayTeam,
        commence_time: m.date + 'T00:00:00Z',
        league_key: m.leagueKey || '',
        league_label: m.leagueLabel || '',
        markets: m.markets || {},
      };
    });
  }

  // Merge: start with odds events, add history-only matches
  var seen = new Set();
  oddsEvents.forEach(function (e) {
    seen.add(e.home_team + '|' + e.away_team + '|' + e.commence_time.slice(0, 10));
  });
  var merged = oddsEvents.slice();
  historyEvents.forEach(function (e) {
    var key = e.home_team + '|' + e.away_team + '|' + e.commence_time.slice(0, 10);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(e);
    } else {
      var existing = merged.find(function (m) {
        return m.home_team === e.home_team && m.away_team === e.away_team &&
          m.commence_time.slice(0, 10) === e.commence_time.slice(0, 10);
      });
      if (existing && e.markets) existing.markets = e.markets;
    }
  });

  if (merged.length === 0) {
    container.innerHTML = '<div class="empty-state"><h3>No matches found</h3><p>No event data or cached reports available.</p></div>';
    return;
  }

  eventsData = merged;

  // Sort by date ascending, then group into date pages
  var sorted = merged.slice().sort(function (a, b) {
    return a.commence_time.localeCompare(b.commence_time);
  });
  var groupMap = {};
  datePages = [];
  sorted.forEach(function (e) {
    var dateKey = e.commence_time.slice(0, 10);
    if (!groupMap[dateKey]) {
      groupMap[dateKey] = { date: dateKey, events: [] };
      datePages.push(groupMap[dateKey]);
    }
    groupMap[dateKey].events.push(e);
  });

  // Find today's page (or nearest future)
  var todayStr = new Date().toISOString().slice(0, 10);
  currentDateIdx = 0;
  for (var i = 0; i < datePages.length; i++) {
    if (datePages[i].date >= todayStr) {
      currentDateIdx = i;
      break;
    }
    // If all dates are past, land on the last one
    currentDateIdx = i;
  }

  document.getElementById('date-nav').style.display = '';
  renderDatePills();
  renderDatePage();
}

function renderDatePills() {
  var container = document.getElementById('date-pills');
  container.innerHTML = '';
  var todayStr = new Date().toISOString().slice(0, 10);

  datePages.forEach(function (page, idx) {
    var pill = document.createElement('button');
    pill.className = 'date-pill' + (idx === currentDateIdx ? ' active' : '');
    var d = new Date(page.date + 'T12:00:00Z');
    var dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
    var dayNum = d.getUTCDate();
    pill.innerHTML = '<span class="date-pill-day">' + dayName + '</span>' +
      '<span class="date-pill-num">' + dayNum + '</span>';
    if (page.date === todayStr) pill.classList.add('today');
    pill.addEventListener('click', function () { goToDate(idx); });
    container.appendChild(pill);
  });

  // Update arrow states
  document.getElementById('date-prev').disabled = currentDateIdx === 0;
  document.getElementById('date-next').disabled = currentDateIdx === datePages.length - 1;

  // Scroll active pill into view
  var activePill = container.querySelector('.date-pill.active');
  if (activePill) {
    activePill.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }
}

function flipDate(dir) {
  var next = currentDateIdx + dir;
  if (next < 0 || next >= datePages.length) return;
  goToDate(next);
}

function goToDate(idx) {
  currentDateIdx = idx;
  renderDatePills();
  renderDatePage();
}

function renderDatePage() {
  var container = document.getElementById('events-container');
  var page = datePages[currentDateIdx];
  if (!page) {
    container.innerHTML = '<div class="empty-state"><h3>No matches</h3></div>';
    return;
  }

  container.innerHTML = '';

  // Date heading
  var todayStr = new Date().toISOString().slice(0, 10);
  var d = new Date(page.date + 'T12:00:00Z');
  var heading = document.createElement('div');
  heading.className = 'date-page-heading';
  var label = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (page.date === todayStr) label += ' — Today';
  heading.innerHTML = '<span class="date-page-label">' + esc(label) + '</span>' +
    '<span class="date-page-count">' + page.events.length + ' match' + (page.events.length !== 1 ? 'es' : '') + '</span>';
  container.appendChild(heading);

  // Group events by league
  var leagueGroups = [];
  var leagueMap = {};
  var noLeague = [];
  page.events.forEach(function (e) {
    if (e.league_key && e.league_label) {
      if (!leagueMap[e.league_key]) {
        leagueMap[e.league_key] = { key: e.league_key, label: e.league_label, events: [] };
        leagueGroups.push(leagueMap[e.league_key]);
      }
      leagueMap[e.league_key].events.push(e);
    } else {
      noLeague.push(e);
    }
  });

  // Render each league section
  leagueGroups.forEach(function (lg) { renderLeagueSection(container, lg.key, lg.label, lg.events); });
  if (noLeague.length > 0) renderLeagueSection(container, '', 'Other', noLeague);

  // Fetch cache status for events without inline markets
  loadCacheStatuses(page.events);
}

function renderLeagueSection(container, leagueKey, leagueLabel, events) {
  var section = document.createElement('div');
  section.className = 'league-section';

  var header = document.createElement('div');
  header.className = 'league-section-header';
  var badge = document.createElement('span');
  badge.className = 'league-badge league-badge-lg';
  if (leagueKey) badge.dataset.league = leagueKey;
  badge.textContent = leagueLabel;
  header.appendChild(badge);
  section.appendChild(header);

  var table = document.createElement('table');
  table.className = 'events-table';
  var tbody = document.createElement('tbody');

  events.forEach(function (e) {
    var tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', function () { openMatchPage(e); });

    // Time cell
    var tdTime = document.createElement('td');
    tdTime.className = 'match-time-cell';
    var dt = new Date(e.commence_time);
    var hasTime = dt.getUTCHours() !== 0 || dt.getUTCMinutes() !== 0;
    if (hasTime) {
      tdTime.textContent = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    tr.appendChild(tdTime);

    // Match cell
    var tdMatch = document.createElement('td');
    var homeSpan = document.createElement('span');
    homeSpan.className = 'team-name';
    homeSpan.textContent = e.home_team;
    var vsSpan = document.createElement('span');
    vsSpan.className = 'vs';
    vsSpan.textContent = 'vs';
    var awaySpan = document.createElement('span');
    awaySpan.className = 'team-name';
    awaySpan.textContent = e.away_team;
    tdMatch.append(homeSpan, vsSpan, awaySpan);
    tr.appendChild(tdMatch);

    // Analyzed status cell (right-aligned)
    var tdCache = document.createElement('td');
    tdCache.className = 'cache-cell col-right';
    if (e.markets && Object.keys(e.markets).length > 0) {
      renderInlineMarketBadges(tdCache, e.markets);
    } else {
      tdCache.id = 'cache-' + e.home_team + '|' + e.away_team + '|' + e.commence_time.slice(0, 10);
      tdCache.innerHTML = '<span class="cache-loading">...</span>';
    }
    tr.appendChild(tdCache);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  section.appendChild(table);
  container.appendChild(section);
}

function renderInlineMarketBadges(cell, markets) {
  var marketNames = ['goals', 'corners', 'cards'];
  var hasSome = false;
  marketNames.forEach(function (m) {
    var info = markets[m];
    if (info && (info.hasReport || info.hasAnalysis)) {
      hasSome = true;
      var badge = document.createElement('span');
      badge.className = 'cache-badge' + (info.hasAnalysis ? ' cache-full' : ' cache-partial');
      badge.title = m + ': ' + (info.hasAnalysis ? 'report + analysis' : 'report only');
      badge.textContent = m.charAt(0).toUpperCase() + m.slice(1);
      cell.appendChild(badge);
    }
  });
  if (!hasSome) {
    cell.innerHTML = '<span class="cache-none">&mdash;</span>';
  }
}

async function loadCacheStatuses(events) {
  var seen = new Set();
  var tasks = [];
  events.forEach(function (e) {
    if (e.markets && Object.keys(e.markets).length > 0) return;
    var key = e.home_team + '|' + e.away_team + '|' + e.commence_time.slice(0, 10);
    if (seen.has(key)) return;
    seen.add(key);
    tasks.push({ key: key, e: e });
  });

  for (var i = 0; i < tasks.length; i += 6) {
    var batch = tasks.slice(i, i + 6);
    await Promise.all(batch.map(async function (t) {
      try {
        var params = new URLSearchParams({
          homeTeam: t.e.home_team,
          awayTeam: t.e.away_team,
          date: t.e.commence_time.slice(0, 10),
        });
        var resp = await fetch('/api/cache-status?' + params);
        var data = await resp.json();
        var cell = document.getElementById('cache-' + t.key);
        if (cell) {
          cell.innerHTML = '';
          renderInlineMarketBadges(cell, data.markets || {});
        }
      } catch (_) {
        var cell = document.getElementById('cache-' + t.key);
        if (cell) cell.innerHTML = '';
      }
    }));
  }
}

// ── Match Info Page ─────────────────────────────────────────────────────────

function openMatchPage(event) {
  const isSameMatch = currentMatch &&
    currentMatch.home_team === event.home_team &&
    currentMatch.away_team === event.away_team &&
    currentMatch.date === event.commence_time.slice(0, 10);

  if (!isSameMatch) {
    // Different match — clean up running job state
    if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }
    if (eventSource) { eventSource.close(); eventSource = null; }
    currentJobId = null;
    tabCache = {};
    currentMarket = 'goals';
  }

  currentMatch = {
    home_team: event.home_team,
    away_team: event.away_team,
    date: event.commence_time.slice(0, 10),
    commence_time: event.commence_time,
    league_key: event.league_key || '',
    league_label: event.league_label || '',
  };
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
    collectBtn.textContent = 'Collect Data Only';
    collectBtn.addEventListener('click', () => launchJob(false));

    const analyzeBtn = document.createElement('button');
    analyzeBtn.className = 'btn btn-primary btn-sm';
    analyzeBtn.id = 'btn-analyze';
    analyzeBtn.textContent = 'Run Analysis';
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
  currentJobAnalyze = false;
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
      // Render cached results directly using match-based report routes (no job creation)
      renderMatchCachedResults(m, currentMarket, marketInfo.hasAnalysis);
      return;
    }
  } catch (_) {}

  // Check for active (running) jobs for this match+market
  const activeJob = await findActiveJob(m.home_team, m.away_team, m.date, currentMarket);
  if (activeJob) {
    currentJobId = activeJob.id;
    restoreJobProgress(activeJob);
    return;
  }

  // No cached data and no running jobs
  resultsArea.innerHTML = '<div class="empty-state"><p>No data collected yet for ' + currentMarket + ' market.</p></div>';
}

async function findActiveJob(homeTeam, awayTeam, date, market) {
  try {
    const resp = await fetch('/api/jobs');
    const data = await resp.json();
    const jobs = data.jobs || [];
    return jobs.find(
      (j) =>
        j.homeTeam === homeTeam &&
        j.awayTeam === awayTeam &&
        j.date === date &&
        j.market === market &&
        !['complete', 'failed'].includes(j.status)
    ) || null;
  } catch (_) {
    return null;
  }
}

function restoreJobProgress(job) {
  currentJobAnalyze = !!job.analyze;
  // Render progress UI and replay existing logs
  renderJobProgress(job.id, job.createdAt);

  // Replay status and logs from server state
  if (job.status !== 'pending') {
    updateJobStatus(job.id, job.status);
  }
  const logEl = document.getElementById('job-log-' + job.id);
  if (logEl && job.logs) {
    job.logs.forEach((log) => {
      const time = new Date(log.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.textContent = '[' + time + '] ' + log.message;
      logEl.appendChild(entry);
    });
  }

  // Disable action buttons while job is running
  const collectBtn = document.getElementById('btn-collect');
  const analyzeBtn = document.getElementById('btn-analyze');
  if (collectBtn) { collectBtn.disabled = true; collectBtn.classList.add('loading'); }
  if (analyzeBtn) { analyzeBtn.disabled = true; analyzeBtn.classList.add('loading'); }

  // Reconnect SSE
  connectSSE(job.id);
}

async function renderCachedResults(jobId, hasAnalysis) {
  const resultsArea = document.getElementById('match-results');
  await renderResultTabs(resultsArea, hasAnalysis, (container, tab) => {
    return loadReportTab(container, '/api/reports/' + jobId + '/' + tab, jobId + ':' + tab);
  });
}

async function renderMatchCachedResults(match, market, hasAnalysis) {
  const resultsArea = document.getElementById('match-results');
  const params = new URLSearchParams({
    homeTeam: match.home_team, awayTeam: match.away_team,
    date: match.date, market: market,
  });
  const contentKey = match.home_team + '|' + match.away_team + '|' + match.date + '|' + market;
  await renderResultTabs(resultsArea, hasAnalysis, (container, tab) => {
    return loadReportTab(container, '/api/match-report/' + tab + '?' + params, contentKey + ':' + tab);
  });
}

// ── Job launch + progress ───────────────────────────────────────────────────

async function launchJob(analyze) {
  if (!currentMatch) return;
  const m = currentMatch;

  // Check if there's an existing running job for this market
  if (currentJobId && eventSource) {
    showToast('A job is already running for this market', 'error');
    return;
  }

  // Check if data already exists — confirm before overwriting
  let force = false;
  try {
    const params = new URLSearchParams({
      homeTeam: m.home_team, awayTeam: m.away_team, date: m.date,
    });
    const resp = await fetch('/api/cache-status?' + params);
    const data = await resp.json();
    const marketInfo = (data.markets || {})[currentMarket];
    if (marketInfo) {
      let msg = null;
      if (analyze && (marketInfo.hasReport || marketInfo.hasAnalysis)) {
        msg = 'This will re-collect data and re-analyze, overwriting current ' + currentMarket + ' results. Proceed?';
      } else if (!analyze && marketInfo.hasReport) {
        msg = 'This will re-collect data, overwriting the current ' + currentMarket + ' report. Proceed?';
      }
      if (msg && !confirm(msg)) return;
      if (msg) force = true;
    }
  } catch (_) {}

  startJob(m.home_team, m.away_team, m.date, currentMarket, analyze, force);
}

async function startJob(homeTeam, awayTeam, date, market, analyze, force) {
  currentJobAnalyze = analyze;
  const collectBtn = document.getElementById('btn-collect');
  const analyzeBtn = document.getElementById('btn-analyze');
  if (collectBtn) { collectBtn.disabled = true; collectBtn.classList.add('loading'); }
  if (analyzeBtn) { analyzeBtn.disabled = true; analyzeBtn.classList.add('loading'); }

  try {
    const resp = await fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeTeam, awayTeam, date, market, analyze, force,
        leagueKey: currentMatch ? currentMatch.league_key : '',
        leagueLabel: currentMatch ? currentMatch.league_label : '',
      }),
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

function renderJobProgress(jobId, createdAt) {
  const progressArea = document.getElementById('match-progress');
  progressArea.innerHTML = '';

  // Step progress bar
  const stepsBar = document.createElement('div');
  stepsBar.className = 'steps-bar';
  stepsBar.id = 'job-steps-' + jobId;
  ['Collect', 'Analyze', 'Done'].forEach((label) => {
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

  // Start elapsed timer (use createdAt if restoring an existing job)
  if (elapsedTimer) clearInterval(elapsedTimer);
  const startTime = createdAt || Date.now();
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

  // Update step progress bar (3 steps: Collect, Analyze, Done)
  const stepsEl = document.getElementById('job-steps-' + jobId);
  if (stepsEl && status !== 'failed') {
    let doneUpTo = -1;
    let activeIdx = -1;
    if (status === 'collecting') {
      activeIdx = 0;
    } else if (status === 'collected') {
      doneUpTo = 0;
    } else if (status === 'analyzing') {
      doneUpTo = 0;
      activeIdx = 1;
    } else if (status === 'complete') {
      doneUpTo = currentJobAnalyze ? 2 : 0;
    }
    stepsEl.querySelectorAll('.step').forEach((step, i) => {
      step.classList.toggle('step-done', i <= doneUpTo);
      step.classList.toggle('step-active', i === activeIdx);
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

// ── Shared tab rendering ────────────────────────────────────────────────────

/**
 * Fetch and render a report tab. Uses tabCache when cacheKey is provided.
 */
async function loadReportTab(container, url, cacheKey) {
  if (cacheKey && tabCache[cacheKey]) {
    container.innerHTML = '';
    const body = document.createElement('div');
    body.className = 'markdown-body';
    body.innerHTML = tabCache[cacheKey];
    container.appendChild(body);
    return;
  }

  container.innerHTML = '<div class="loading"><span class="spinner"></span> Loading...</div>';
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.error) {
      container.innerHTML = '<div class="empty-state"><p>' + esc(data.error) + '</p></div>';
      return;
    }
    if (cacheKey) tabCache[cacheKey] = data.html;
    container.innerHTML = '';
    const body = document.createElement('div');
    body.className = 'markdown-body';
    body.innerHTML = data.html;
    container.appendChild(body);
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><p>Failed to load: ' + esc(err.message) + '</p></div>';
  }
}

/**
 * Build a tab bar (Value Picks / Full Analysis / Data Report) and wire up
 * clicks to loadFn(container, tabKey). Returns a promise from loading the first tab.
 */
function renderResultTabs(targetEl, hasAnalysis, loadFn, opts) {
  targetEl.innerHTML = '';
  const tabs = document.createElement('div');
  tabs.className = 'tabs';

  const tabDefs = hasAnalysis
    ? [
        { key: 'concise', label: 'Value Picks' },
        { key: 'analysis', label: 'Full Analysis' },
        { key: 'raw', label: 'Data Report' },
      ]
    : [{ key: 'raw', label: 'Data Report' }];

  const content = document.createElement('div');
  if (opts && opts.contentClass) content.className = opts.contentClass;

  tabDefs.forEach((t, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (i === 0 ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', (e) => {
      if (opts && opts.stopPropagation) e.stopPropagation();
      tabs.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadFn(content, t.key);
    });
    tabs.appendChild(btn);
  });

  targetEl.append(tabs, content);
  return loadFn(content, tabDefs[0].key);
}

// ── History ─────────────────────────────────────────────────────────────────

async function loadHistory() {
  const container = document.getElementById('history-container');
  container.innerHTML = '<div class="loading"><span class="spinner"></span> Loading...</div>';

  try {
    const resp = await fetch('/api/history');
    const data = await resp.json();
    const matches = data.matches || [];

    if (matches.length === 0) {
      container.innerHTML = '<div class="empty-state"><h3>No analyses yet</h3><p>Run your first analysis from a match page.</p></div>';
      return;
    }

    container.innerHTML = '';

    // Split into upcoming (today+future) and past
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = matches.filter((m) => m.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    const past = matches.filter((m) => m.date < today);

    if (upcoming.length > 0) {
      const header = document.createElement('h3');
      header.className = 'history-section-header';
      header.textContent = 'Upcoming';
      container.appendChild(header);
      upcoming.forEach((match) => container.appendChild(renderHistoryCard(match)));
    }

    if (past.length > 0) {
      const header = document.createElement('h3');
      header.className = 'history-section-header history-section-past';
      header.textContent = 'Past';
      container.appendChild(header);
      past.forEach((match) => container.appendChild(renderHistoryCard(match)));
    }
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><p>Failed to load: ' + esc(err.message) + '</p></div>';
  }
}

function renderHistoryCard(match) {
  const item = document.createElement('div');
  item.className = 'history-card';

  // Top row: teams
  const topRow = document.createElement('div');
  topRow.className = 'history-top-row';
  topRow.style.cursor = 'pointer';
  topRow.addEventListener('click', () => {
    openMatchPage({
      home_team: match.homeTeam,
      away_team: match.awayTeam,
      commence_time: match.date + 'T00:00:00Z',
      league_key: match.leagueKey || '',
      league_label: match.leagueLabel || '',
    });
  });

  const teams = document.createElement('div');
  teams.className = 'history-teams';
  teams.textContent = match.homeTeam + ' vs ' + match.awayTeam;

  topRow.appendChild(teams);
  item.appendChild(topRow);

  // Info row: date + market badges
  const infoRow = document.createElement('div');
  infoRow.className = 'history-info-row';

  const dateSpan = document.createElement('span');
  dateSpan.className = 'history-detail';
  dateSpan.textContent = match.date;
  infoRow.appendChild(dateSpan);

  // Market badges with report/analysis status
  const marketNames = ['goals', 'corners', 'cards'];
  marketNames.forEach((mk) => {
    const info = match.markets[mk];
    if (!info) return;

    const badge = document.createElement('span');
    badge.className = 'history-market' + (info.hasAnalysis ? ' has-analysis' : '');
    badge.textContent = mk.charAt(0).toUpperCase() + mk.slice(1);
    badge.title = mk + ': ' + (info.hasAnalysis ? 'report + analysis' : 'report only');
    badge.style.cursor = 'pointer';
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      openHistoryReport(match, mk, item);
    });
    infoRow.appendChild(badge);
  });

  item.appendChild(infoRow);

  // Timestamp row
  const timeRow = document.createElement('div');
  timeRow.className = 'history-time-row';
  const modDate = new Date(match.lastModified).toLocaleString('en-GB', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  timeRow.textContent = 'Last updated ' + modDate;
  item.appendChild(timeRow);

  // Expandable report viewer area
  const viewerArea = document.createElement('div');
  viewerArea.className = 'history-viewer';
  viewerArea.id = 'history-viewer-' + match.homeTeam + '-' + match.awayTeam + '-' + match.date;
  item.appendChild(viewerArea);

  return item;
}

async function openHistoryReport(match, market, cardEl) {
  const viewerId = 'history-viewer-' + match.homeTeam + '-' + match.awayTeam + '-' + match.date;
  const viewer = document.getElementById(viewerId);
  if (!viewer) return;

  // Toggle off if clicking the same market again
  if (viewer.dataset.market === market && viewer.innerHTML) {
    viewer.innerHTML = '';
    viewer.dataset.market = '';
    return;
  }

  viewer.dataset.market = market;
  const marketInfo = match.markets[market];
  const hasAnalysis = marketInfo && marketInfo.hasAnalysis;

  const params = new URLSearchParams({
    homeTeam: match.homeTeam, awayTeam: match.awayTeam,
    date: match.date, market: market,
  });
  await renderResultTabs(viewer, hasAnalysis, (container, tab) => {
    return loadReportTab(container, '/api/match-report/' + tab + '?' + params);
  }, { stopPropagation: true, contentClass: 'history-tab-content' });
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

  document.getElementById('date-prev').addEventListener('click', function () { flipDate(-1); });
  document.getElementById('date-next').addEventListener('click', function () { flipDate(1); });

  loadEvents();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const matchPage = document.getElementById('page-match');
      if (matchPage && matchPage.classList.contains('active')) {
        showPage('matches');
      }
    }
    // Arrow keys for date flipping (only on matches page, not in inputs)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const matchesPage = document.getElementById('page-matches');
    if (matchesPage && matchesPage.classList.contains('active')) {
      if (e.key === 'ArrowLeft') flipDate(-1);
      if (e.key === 'ArrowRight') flipDate(1);
    }
  });
});
