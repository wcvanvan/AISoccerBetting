/**
 * Soccer Betting Analyzer — Frontend App
 */

// State
let activeLeagues = new Set([
  'soccer_epl',
  'soccer_fa_cup',
  'soccer_uefa_champs_league',
  'soccer_germany_bundesliga',
  'soccer_spain_la_liga',
  'soccer_france_ligue_one',
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

async function loadEvents() {
  const container = document.getElementById('events-container');
  container.innerHTML = '<div class="loading"><span class="spinner"></span> Loading matches...</div>';

  // Reader accounts: load all matches from history (reports), grouped by date
  if (currentUser && currentUser.role === 'reader') {
    await loadReaderMatches(container);
    return;
  }

  try {
    const resp = await fetch('/api/events');
    const data = await resp.json();

    if (data.error) {
      await loadEventsFromHistory(container);
      return;
    }

    eventsData = data.events || [];
    renderLeagueFilters(data.leagues || []);
    renderEvents(eventsData);
  } catch (err) {
    await loadEventsFromHistory(container);
  }
}

async function loadReaderMatches(container) {
  try {
    const resp = await fetch('/api/history');
    const data = await resp.json();
    const matches = data.matches || [];

    if (matches.length === 0) {
      container.innerHTML = '<div class="empty-state"><h3>No matches available</h3><p>No analyzed matches yet.</p></div>';
      return;
    }

    eventsData = matches.map(function (m) {
      return {
        home_team: m.homeTeam,
        away_team: m.awayTeam,
        commence_time: m.date + 'T00:00:00Z',
        league_key: m.leagueKey || '',
        league_label: m.leagueLabel || '',
        markets: m.markets || {},
      };
    });

    // Build league filters from discovered leagues
    var leagueMap = {};
    eventsData.forEach(function (e) {
      if (e.league_key && e.league_label) {
        leagueMap[e.league_key] = e.league_label;
      }
    });
    var leagues = Object.keys(leagueMap).map(function (k) {
      return { key: k, label: leagueMap[k] };
    });
    if (leagues.length > 0) {
      leagues.forEach(function (l) { activeLeagues.add(l.key); });
      renderLeagueFilters(leagues);
    } else {
      document.getElementById('league-filters').innerHTML = '';
    }

    var heading = document.querySelector('#page-matches .section-title');
    if (heading) {
      heading.innerHTML = 'Matches <span class="match-count">(' + eventsData.length + ')</span>';
    }

    renderGroupedEvents(eventsData);
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><h3>Failed to load</h3><p>' + esc(err.message) + '</p></div>';
  }
}

async function loadEventsFromHistory(container) {
  try {
    const resp = await fetch('/api/history');
    const data = await resp.json();
    const matches = data.matches || [];

    if (matches.length === 0) {
      container.innerHTML = '<div class="empty-state"><h3>No matches found</h3><p>No event data or cached reports available.</p></div>';
      return;
    }

    eventsData = matches.map(function (m) {
      return {
        home_team: m.homeTeam,
        away_team: m.awayTeam,
        commence_time: m.date + 'T00:00:00Z',
        league_key: m.leagueKey || '',
        league_label: m.leagueLabel || '',
      };
    });

    // Build league filters from discovered leagues
    var leagueMap = {};
    eventsData.forEach(function (e) {
      if (e.league_key && e.league_label) {
        leagueMap[e.league_key] = e.league_label;
      }
    });
    var leagues = Object.keys(leagueMap).map(function (k) {
      return { key: k, label: leagueMap[k] };
    });
    if (leagues.length > 0) {
      // Ensure discovered leagues are active by default
      leagues.forEach(function (l) { activeLeagues.add(l.key); });
      renderLeagueFilters(leagues);
    } else {
      document.getElementById('league-filters').innerHTML = '';
    }

    renderEvents(eventsData);

    var heading = document.querySelector('#page-matches .section-title');
    if (heading) {
      heading.innerHTML = 'Matches <span class="match-count">(' + eventsData.length + ' from reports)</span>';
    }
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
  // Use correct filter function depending on which view is active
  if (document.querySelector('.date-group')) {
    applyGroupedFilters();
  } else {
    applyAllFilters();
  }
}

function fuzzyMatch(query, text) {
  if (!query) return true;
  var lowerText = text.toLowerCase();
  var words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every(function (w) { return lowerText.indexOf(w) !== -1; });
}

function applyAllFilters() {
  var homeEl = document.getElementById('filter-home');
  var awayEl = document.getElementById('filter-away');
  var home = (homeEl ? homeEl.value : '').trim();
  var away = (awayEl ? awayEl.value : '').trim();
  var tbody = document.querySelector('.events-table tbody');
  if (!tbody) return;
  var rows = tbody.querySelectorAll('tr');
  eventsData.forEach(function (e, idx) {
    if (!rows[idx]) return;
    var leagueOk = !e.league_key || activeLeagues.has(e.league_key);
    var homeOk = fuzzyMatch(home, e.home_team);
    var awayOk = fuzzyMatch(away, e.away_team);
    rows[idx].style.display = (leagueOk && homeOk && awayOk) ? '' : 'none';
  });
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

  // Team search filter
  const filterForm = document.createElement('div');
  filterForm.className = 'card';
  filterForm.style.marginBottom = '16px';
  filterForm.innerHTML =
    '<div class="section-title" style="margin-bottom: 12px">Search</div>' +
    '<div style="display: flex; gap: 10px; align-items: end; flex-wrap: wrap">' +
    '  <div><label style="font-size: 12px; color: var(--text-dim); display: block; margin-bottom: 4px">Home Team</label>' +
    '  <input type="text" id="filter-home" class="market-select" style="width: 180px" placeholder="e.g. Arsenal"></div>' +
    '  <div><label style="font-size: 12px; color: var(--text-dim); display: block; margin-bottom: 4px">Away Team</label>' +
    '  <input type="text" id="filter-away" class="market-select" style="width: 180px" placeholder="e.g. Chelsea"></div>' +
    '</div>';
  container.appendChild(filterForm);

  document.getElementById('filter-home').addEventListener('input', applyAllFilters);
  document.getElementById('filter-away').addEventListener('input', applyAllFilters);

  // Events table
  const table = document.createElement('table');
  table.className = 'events-table';

  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Date</th><th>Match</th><th>League</th><th>Analyzed by AI</th></tr>';
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

  // Apply active filters to newly rendered rows
  applyAllFilters();

  // Fetch cache status for each event (batched, non-blocking)
  loadCacheStatuses(events);
}

function renderGroupedEvents(events) {
  var container = document.getElementById('events-container');

  if (events.length === 0) {
    container.innerHTML = '<div class="empty-state"><h3>No matches found</h3><p>Try enabling more leagues.</p></div>';
    return;
  }

  container.innerHTML = '';

  // Team search filter
  var filterForm = document.createElement('div');
  filterForm.className = 'card';
  filterForm.style.marginBottom = '16px';
  filterForm.innerHTML =
    '<div class="section-title" style="margin-bottom: 12px">Search</div>' +
    '<div style="display: flex; gap: 10px; align-items: end; flex-wrap: wrap">' +
    '  <div><label style="font-size: 12px; color: var(--text-dim); display: block; margin-bottom: 4px">Home Team</label>' +
    '  <input type="text" id="filter-home" class="market-select" style="width: 180px" placeholder="e.g. Arsenal"></div>' +
    '  <div><label style="font-size: 12px; color: var(--text-dim); display: block; margin-bottom: 4px">Away Team</label>' +
    '  <input type="text" id="filter-away" class="market-select" style="width: 180px" placeholder="e.g. Chelsea"></div>' +
    '</div>';
  container.appendChild(filterForm);

  document.getElementById('filter-home').addEventListener('input', applyGroupedFilters);
  document.getElementById('filter-away').addEventListener('input', applyGroupedFilters);

  // Sort events by date ascending (oldest first)
  var sorted = events.slice().sort(function (a, b) {
    return a.commence_time.localeCompare(b.commence_time);
  });

  // Group by date
  var groups = [];
  var groupMap = {};
  sorted.forEach(function (e) {
    var dateKey = e.commence_time.slice(0, 10);
    if (!groupMap[dateKey]) {
      groupMap[dateKey] = { date: dateKey, events: [] };
      groups.push(groupMap[dateKey]);
    }
    groupMap[dateKey].events.push(e);
  });

  var todayStr = new Date().toISOString().slice(0, 10);
  var todayEl = null;

  // Render each date group
  groups.forEach(function (group) {
    var section = document.createElement('div');
    section.className = 'date-group';
    section.dataset.date = group.date;

    // Date separator header
    var header = document.createElement('div');
    header.className = 'date-group-header';
    var d = new Date(group.date + 'T12:00:00Z');
    var label = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (group.date === todayStr) {
      label += ' — Today';
      header.classList.add('date-group-today');
      todayEl = section;
    }
    header.textContent = label;
    section.appendChild(header);

    // Table for this group
    var table = document.createElement('table');
    table.className = 'events-table grouped-table';

    var thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Match</th><th>League</th><th>Analyzed by AI</th></tr>';
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    group.events.forEach(function (e) {
      var tr = document.createElement('tr');
      tr.className = 'grouped-row';
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', function () { openMatchPage(e); });

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

      // League cell
      var tdLeague = document.createElement('td');
      var badge = document.createElement('span');
      badge.className = 'league-badge';
      badge.dataset.league = e.league_key;
      badge.textContent = e.league_label;
      tdLeague.appendChild(badge);
      tr.appendChild(tdLeague);

      // Analyzed status cell — use inline markets data from history
      var tdCache = document.createElement('td');
      tdCache.className = 'cache-cell';
      if (e.markets && Object.keys(e.markets).length > 0) {
        renderInlineMarketBadges(tdCache, e.markets);
      } else {
        tdCache.innerHTML = '<span class="cache-none">&mdash;</span>';
      }
      tr.appendChild(tdCache);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    section.appendChild(table);
    container.appendChild(section);
  });

  applyGroupedFilters();

  // Scroll to today's matches (or nearest future date)
  var scrollTarget = todayEl;
  if (!scrollTarget) {
    // Find first future date group
    var futureGroups = document.querySelectorAll('.date-group');
    for (var i = 0; i < futureGroups.length; i++) {
      if (futureGroups[i].dataset.date >= todayStr) {
        scrollTarget = futureGroups[i];
        break;
      }
    }
  }
  if (scrollTarget) {
    setTimeout(function () {
      var headerHeight = 52;
      var y = scrollTarget.getBoundingClientRect().top + window.scrollY - headerHeight - 10;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }, 100);
  }
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

function applyGroupedFilters() {
  var homeEl = document.getElementById('filter-home');
  var awayEl = document.getElementById('filter-away');
  var home = (homeEl ? homeEl.value : '').trim();
  var away = (awayEl ? awayEl.value : '').trim();

  var groups = document.querySelectorAll('.date-group');
  groups.forEach(function (group) {
    var rows = group.querySelectorAll('.grouped-row');
    var anyVisible = false;

    rows.forEach(function (row) {
      var homeTeam = row.querySelectorAll('.team-name')[0]?.textContent || '';
      var awayTeam = row.querySelectorAll('.team-name')[1]?.textContent || '';
      var leagueKey = row.querySelector('.league-badge')?.dataset?.league || '';

      var leagueOk = !leagueKey || activeLeagues.has(leagueKey);
      var homeOk = fuzzyMatch(home, homeTeam);
      var awayOk = fuzzyMatch(away, awayTeam);
      var visible = leagueOk && homeOk && awayOk;
      row.style.display = visible ? '' : 'none';
      if (visible) anyVisible = true;
    });

    // Hide entire date group if no matches visible
    group.style.display = anyVisible ? '' : 'none';
  });
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
      badge.textContent = m.charAt(0).toUpperCase() + m.slice(1);
      cell.appendChild(badge);
    }
  });
  if (!hasSome) {
    cell.innerHTML = '<span class="cache-none">&mdash;</span>';
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
      body: JSON.stringify({
        homeTeam, awayTeam, date, market, analyze,
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
