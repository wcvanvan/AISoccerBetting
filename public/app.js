/**
 * Soccer Betting Analyzer — Frontend
 *
 * Consumes manifest.json (built by build-web.ts) using its native
 * camelCase property names — no mapping layer.
 */

// State
let eventsData = [];
let currentMatch = null;
let currentMarket = 'goals';
let tabCache = {};
let currentLeagueFilter = 'all';
let datePages = [];
let currentDateIdx = 0;


/** Local today as YYYY-MM-DD (avoids UTC drift near midnight) */
function todayDateStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/** Format a UTC ISO string as local time, e.g. "5:30 PM". */
function formatKickoff(commenceTime) {
  if (!commenceTime) return '';
  return new Date(commenceTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ── Page navigation ─────────────────────────────────────────────────────────

function showPage(page) {
  document.querySelectorAll('.page').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('nav a').forEach((el) => el.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const navLink = document.querySelector('nav a[data-page="' + page + '"]');
  if (navLink) navLink.classList.add('active');
}

// ── Events / Matches ────────────────────────────────────────────────────────

async function loadEvents() {
  const container = document.getElementById('events-container');
  container.textContent = '';
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading';
  const spinnerEl = document.createElement('span');
  spinnerEl.className = 'spinner';
  loadingDiv.appendChild(spinnerEl);
  loadingDiv.appendChild(document.createTextNode(' Loading matches...'));
  container.appendChild(loadingDiv);

  try {
    const resp = await fetch('data/manifest.json');
    if (!resp.ok) throw new Error('Failed to load matches');
    const manifest = await resp.json();

    if (manifest.length === 0) {
      container.textContent = '';
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      const h3 = document.createElement('h3');
      h3.textContent = 'No matches found';
      const p = document.createElement('p');
      p.textContent = 'No event data or cached reports available.';
      emptyDiv.append(h3, p);
      container.appendChild(emptyDiv);
      return;
    }

    eventsData = manifest;

    // Sort by date ascending, then group into date pages
    const sorted = manifest.slice().sort((a, b) => a.date.localeCompare(b.date));
    const groupMap = {};
    datePages = [];
    sorted.forEach((e) => {
      if (!groupMap[e.date]) {
        groupMap[e.date] = { date: e.date, events: [] };
        datePages.push(groupMap[e.date]);
      }
      groupMap[e.date].events.push(e);
    });

    // Ensure today always exists in datePages
    const todayStr = todayDateStr();
    if (!groupMap[todayStr]) {
      const todayPage = { date: todayStr, events: [] };
      let inserted = false;
      for (let j = 0; j < datePages.length; j++) {
        if (datePages[j].date > todayStr) {
          datePages.splice(j, 0, todayPage);
          inserted = true;
          break;
        }
      }
      if (!inserted) datePages.push(todayPage);
    }

    // Find today's page
    currentDateIdx = datePages.length - 1;
    for (let i = 0; i < datePages.length; i++) {
      if (datePages[i].date >= todayStr) {
        currentDateIdx = i;
        break;
      }
    }

    document.getElementById('date-nav').style.display = '';
    renderDatePills();
    renderDatePage();
  } catch (err) {
    container.textContent = '';
    const errDiv = document.createElement('div');
    errDiv.className = 'empty-state';
    const h3 = document.createElement('h3');
    h3.textContent = 'Failed to load';
    const p = document.createElement('p');
    p.textContent = err.message;
    errDiv.append(h3, p);
    container.appendChild(errDiv);
  }
}

function renderDatePills() {
  const container = document.getElementById('date-pills');
  container.textContent = '';
  const todayStr = todayDateStr();

  datePages.forEach((page, idx) => {
    const pill = document.createElement('button');
    pill.className = 'date-pill' + (idx === currentDateIdx ? ' active' : '');
    const d = new Date(page.date + 'T12:00:00Z');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getUTCDate();
    if (page.date === todayStr) {
      pill.classList.add('today');
      const todayLabel = document.createElement('span');
      todayLabel.className = 'date-pill-today';
      todayLabel.textContent = 'Today';
      pill.appendChild(todayLabel);
    } else {
      const daySpan = document.createElement('span');
      daySpan.className = 'date-pill-day';
      daySpan.textContent = dayName;
      pill.appendChild(daySpan);
    }
    const numSpan = document.createElement('span');
    numSpan.className = 'date-pill-num';
    numSpan.textContent = dayNum;
    pill.appendChild(numSpan);
    pill.addEventListener('click', () => goToDate(idx));
    container.appendChild(pill);
  });

  document.getElementById('date-prev').disabled = currentDateIdx === 0;
  document.getElementById('date-next').disabled = currentDateIdx === datePages.length - 1;

  const activePill = container.querySelector('.date-pill.active');
  if (activePill) {
    activePill.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }
}

function flipDate(dir) {
  const next = currentDateIdx + dir;
  if (next < 0 || next >= datePages.length) return;
  goToDate(next);
}

function goToDate(idx) {
  currentDateIdx = idx;
  currentLeagueFilter = 'all';
  renderDatePills();
  renderDatePage();
}

// ── League filter bar ───────────────────────────────────────────────────────

function renderLeagueFilterBar(leagueGroups) {
  const filterBar = document.getElementById('league-filter');
  filterBar.textContent = '';

  if (leagueGroups.length <= 1) {
    filterBar.style.display = 'none';
    return;
  }

  filterBar.style.display = '';

  const allPill = document.createElement('button');
  allPill.className = 'league-filter-pill' + (currentLeagueFilter === 'all' ? ' active' : '');
  allPill.textContent = 'All';
  allPill.addEventListener('click', () => {
    currentLeagueFilter = 'all';
    renderDatePage();
  });
  filterBar.appendChild(allPill);

  leagueGroups.forEach((lg) => {
    const pill = document.createElement('button');
    pill.className = 'league-filter-pill' + (currentLeagueFilter === lg.key ? ' active' : '');
    pill.textContent = lg.label;
    pill.addEventListener('click', () => {
      currentLeagueFilter = lg.key;
      renderDatePage();
    });
    filterBar.appendChild(pill);
  });
}

// ── Date page rendering ─────────────────────────────────────────────────────

function renderDatePage() {
  const container = document.getElementById('events-container');
  const page = datePages[currentDateIdx];
  if (!page) {
    container.textContent = '';
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    const h3 = document.createElement('h3');
    h3.textContent = 'No matches';
    emptyDiv.appendChild(h3);
    container.appendChild(emptyDiv);
    return;
  }

  container.textContent = '';

  const todayStr = todayDateStr();
  const d = new Date(page.date + 'T12:00:00Z');
  const isToday = page.date === todayStr;

  // Date heading
  const heading = document.createElement('div');
  heading.className = 'date-page-heading';
  let label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  if (isToday) label += ' \u2014 Today';

  const labelSpan = document.createElement('span');
  labelSpan.className = 'date-page-label';
  labelSpan.textContent = label;
  heading.appendChild(labelSpan);

  // Empty day
  if (page.events.length === 0) {
    container.appendChild(heading);
    const emptyCard = document.createElement('div');
    emptyCard.className = 'empty-day-card';
    const emptyIcon = document.createElement('div');
    emptyIcon.className = 'empty-day-icon';
    emptyIcon.textContent = '\u26BD';
    emptyCard.appendChild(emptyIcon);
    const emptyTitle = document.createElement('h3');
    emptyTitle.textContent = isToday ? 'No analysis scheduled today' : 'No matches on this date';
    emptyCard.appendChild(emptyTitle);
    container.appendChild(emptyCard);
    document.getElementById('league-filter').style.display = 'none';
    return;
  }

  // Group events by league
  const leagueGroups = [];
  const leagueMap = {};
  const noLeague = [];
  page.events.forEach((e) => {
    if (e.leagueKey && e.leagueLabel) {
      if (!leagueMap[e.leagueKey]) {
        leagueMap[e.leagueKey] = { key: e.leagueKey, label: e.leagueLabel, events: [] };
        leagueGroups.push(leagueMap[e.leagueKey]);
      }
      leagueMap[e.leagueKey].events.push(e);
    } else {
      noLeague.push(e);
    }
  });

  // Sort events within each league by kickoff time
  const byKickoff = (a, b) => (a.commenceTime || '').localeCompare(b.commenceTime || '');
  leagueGroups.forEach((lg) => lg.events.sort(byKickoff));
  noLeague.sort(byKickoff);

  renderLeagueFilterBar(leagueGroups);

  let totalEvents = page.events.length;
  if (currentLeagueFilter !== 'all') {
    const filtered = leagueGroups.filter((lg) => lg.key === currentLeagueFilter);
    totalEvents = filtered.reduce((sum, lg) => sum + lg.events.length, 0);
  }

  const countSpan = document.createElement('span');
  countSpan.className = 'date-page-count';
  countSpan.textContent = totalEvents + ' match' + (totalEvents !== 1 ? 'es' : '');
  heading.appendChild(countSpan);
  container.appendChild(heading);

  // Apply league filter
  let filteredGroups = leagueGroups;
  let filteredNoLeague = noLeague;
  if (currentLeagueFilter !== 'all') {
    filteredGroups = leagueGroups.filter((lg) => lg.key === currentLeagueFilter);
    filteredNoLeague = [];
  }

  // Single table for all leagues — ensures columns align across sections
  const table = document.createElement('table');
  table.className = 'events-table';
  const tbody = document.createElement('tbody');

  const sections = filteredGroups.map((lg) => ({ key: lg.key, label: lg.label, events: lg.events }));
  if (filteredNoLeague.length > 0) sections.push({ key: '', label: 'Other', events: filteredNoLeague });

  sections.forEach((lg) => {
    // League header row
    const headerTr = document.createElement('tr');
    headerTr.className = 'league-header-row';
    const headerTd = document.createElement('td');
    headerTd.colSpan = 3;
    const badge = document.createElement('span');
    badge.className = 'league-badge league-badge-lg';
    if (lg.key) badge.dataset.league = lg.key;
    badge.textContent = lg.label;
    headerTd.appendChild(badge);
    headerTr.appendChild(headerTd);
    tbody.appendChild(headerTr);

    lg.events.forEach((e) => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => openMatchPage(e));

      // Time cell
      const tdTime = document.createElement('td');
      tdTime.className = 'time-cell';
      tdTime.textContent = formatKickoff(e.commenceTime);
      tr.appendChild(tdTime);

      // Teams cell
      const tdMatch = document.createElement('td');
      const homeSpan = document.createElement('span');
      homeSpan.className = 'team-name';
      homeSpan.textContent = e.homeTeam;
      const vsSpan = document.createElement('span');
      vsSpan.className = 'vs';
      vsSpan.textContent = 'vs';
      const awaySpan = document.createElement('span');
      awaySpan.className = 'team-name';
      awaySpan.textContent = e.awayTeam;
      tdMatch.append(homeSpan, vsSpan, awaySpan);
      tr.appendChild(tdMatch);

      // Market badges cell
      const tdCache = document.createElement('td');
      tdCache.className = 'cache-cell col-right';
      renderInlineMarketBadges(tdCache, e.markets);
      tr.appendChild(tdCache);

      tbody.appendChild(tr);
    });
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

function renderInlineMarketBadges(cell, markets) {
  const marketNames = ['goals', 'corners', 'cards'];
  let hasSome = false;
  marketNames.forEach((m) => {
    const info = markets[m];
    if (info && (info.hasPrediction || info.hasReview)) {
      hasSome = true;
      const badge = document.createElement('span');
      let badgeClass = ' cache-full';
      let title = m + ': prediction';
      if (info.hasReview) {
        badgeClass = ' cache-reviewed';
        title = m + ': reviewed';
      }
      badge.className = 'cache-badge' + badgeClass;
      badge.title = title;
      badge.textContent = m.charAt(0).toUpperCase() + m.slice(1);
      cell.appendChild(badge);
    }
  });
  if (!hasSome) {
    const dash = document.createElement('span');
    dash.className = 'cache-none';
    dash.textContent = '\u2014';
    cell.appendChild(dash);
  }
}

// ── Match Info Page ─────────────────────────────────────────────────────────

function openMatchPage(matchData) {
  const isSameMatch = currentMatch && currentMatch.matchId === matchData.matchId;

  if (!isSameMatch) {
    tabCache = {};
    // Default to first market that has data
    const markets = matchData.markets || {};
    const firstAvailable = ['goals', 'corners', 'cards'].find((mk) => {
      const info = markets[mk];
      return info && (info.hasPrediction || info.hasReview);
    });
    currentMarket = firstAvailable || 'goals';
  }

  currentMatch = matchData;
  showPage('match');
  renderMatchPage();
}

function renderMatchPage() {
  const container = document.getElementById('match-container');
  container.textContent = '';

  const m = currentMatch;
  const d = new Date(m.date + 'T12:00:00Z');
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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

  const teamsRow = document.createElement('div');
  teamsRow.className = 'match-info-teams';
  const homeEl = document.createElement('span');
  homeEl.className = 'match-info-team';
  homeEl.textContent = m.homeTeam;
  const vsEl = document.createElement('span');
  vsEl.className = 'match-info-vs';
  vsEl.textContent = 'vs';
  const awayEl = document.createElement('span');
  awayEl.className = 'match-info-team';
  awayEl.textContent = m.awayTeam;
  teamsRow.append(homeEl, vsEl, awayEl);
  infoCard.appendChild(teamsRow);

  const detailsRow = document.createElement('div');
  detailsRow.className = 'match-info-details';
  const dateSpan = document.createElement('span');
  if (m.commenceTime) {
    dateSpan.textContent = dateStr + ' \u2014 ' + formatKickoff(m.commenceTime);
  } else {
    dateSpan.textContent = dateStr;
  }
  detailsRow.appendChild(dateSpan);
  if (m.leagueLabel) {
    const leagueBadge = document.createElement('span');
    leagueBadge.className = 'league-badge';
    leagueBadge.dataset.league = m.leagueKey;
    leagueBadge.textContent = m.leagueLabel;
    detailsRow.appendChild(leagueBadge);
  }
  infoCard.appendChild(detailsRow);
  container.appendChild(infoCard);

  // Market tabs
  const toolbar = document.createElement('div');
  toolbar.className = 'match-toolbar';

  const marketTabs = document.createElement('div');
  marketTabs.className = 'market-tabs';
  const allMarkets = currentMatch.markets || {};
  ['goals', 'corners', 'cards'].forEach((mk) => {
    const info = allMarkets[mk];
    if (!info || (!info.hasPrediction && !info.hasReview)) return; // hide empty markets
    const tab = document.createElement('button');
    tab.className = 'market-tab' + (mk === currentMarket ? ' active' : '');
    tab.textContent = mk.charAt(0).toUpperCase() + mk.slice(1);
    tab.addEventListener('click', () => switchMarket(mk));
    marketTabs.appendChild(tab);
  });
  toolbar.appendChild(marketTabs);
  container.appendChild(toolbar);

  // Results area
  const resultsArea = document.createElement('div');
  resultsArea.id = 'match-results';
  container.appendChild(resultsArea);

  loadMarketData();
}

function switchMarket(market) {
  currentMarket = market;

  document.querySelectorAll('.market-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.textContent.toLowerCase() === market);
  });

  document.getElementById('match-results').textContent = '';
  loadMarketData();
}

function loadMarketData() {
  const resultsArea = document.getElementById('match-results');
  if (!currentMatch) return;

  const marketInfo = (currentMatch.markets || {})[currentMarket];
  if (marketInfo && (marketInfo.hasPrediction || marketInfo.hasReview)) {
    renderMatchCachedResults(currentMatch, currentMarket, marketInfo);
    return;
  }

  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state';
  const emptyP = document.createElement('p');
  emptyP.textContent = 'No data collected yet for ' + currentMarket + ' market.';
  emptyDiv.appendChild(emptyP);
  resultsArea.textContent = '';
  resultsArea.appendChild(emptyDiv);
  // Still show comment section even when no market data exists
  if (typeof renderCommentSection === 'function') {
    renderCommentSection(resultsArea, currentMatch.matchId, currentMarket);
  }
}

function renderMatchCachedResults(match, market, marketInfo) {
  const resultsArea = document.getElementById('match-results');
  const mid = match.matchId;
  const contentKey = mid + '|' + market;
  renderResultTabs(resultsArea, marketInfo, (container, tab) => {
    const url = 'data/reports/' + mid + '/' + market + '-' + tab + '.html';
    return loadReportTab(container, url, contentKey + ':' + tab);
  });
  // Append comment section below tabs
  if (typeof renderCommentSection === 'function') {
    renderCommentSection(resultsArea, mid, market);
  }
}

// ── Shared tab rendering ────────────────────────────────────────────────────

async function loadReportTab(container, url, cacheKey) {
  if (cacheKey && tabCache[cacheKey]) {
    container.textContent = '';
    const body = document.createElement('div');
    body.className = 'markdown-body';
    body.innerHTML = tabCache[cacheKey]; // trusted: pre-built HTML from build script
    container.appendChild(body);
    return;
  }

  container.textContent = '';
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading';
  const spinner = document.createElement('span');
  spinner.className = 'spinner';
  loadingDiv.appendChild(spinner);
  loadingDiv.appendChild(document.createTextNode(' Loading...'));
  container.appendChild(loadingDiv);

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      container.textContent = '';
      const errDiv = document.createElement('div');
      errDiv.className = 'empty-state';
      const errP = document.createElement('p');
      errP.textContent = 'Report not found';
      errDiv.appendChild(errP);
      container.appendChild(errDiv);
      return;
    }
    const html = await resp.text();
    if (cacheKey) tabCache[cacheKey] = html;
    container.textContent = '';
    const body = document.createElement('div');
    body.className = 'markdown-body';
    body.innerHTML = html; // trusted: pre-built HTML from build script
    container.appendChild(body);
  } catch (err) {
    container.textContent = '';
    const failDiv = document.createElement('div');
    failDiv.className = 'empty-state';
    const failP = document.createElement('p');
    failP.textContent = 'Failed to load: ' + err.message;
    failDiv.appendChild(failP);
    container.appendChild(failDiv);
  }
}

function renderResultTabs(targetEl, marketInfo, loadFn) {
  targetEl.textContent = '';
  const tabs = document.createElement('div');
  tabs.className = 'tabs';

  // User-facing tabs: Prediction + Review
  const tabDefs = [];
  if (marketInfo.hasPrediction) {
    tabDefs.push({ key: 'prediction-presentation', label: 'Prediction' });
  }
  tabDefs.push({ key: 'review-presentation', label: 'Review', placeholder: !marketInfo.hasReview });

  const content = document.createElement('div');

  function showTab(t) {
    if (t.placeholder) {
      content.textContent = '';
      const msg = document.createElement('div');
      msg.className = 'empty-state';
      const p = document.createElement('p');
      p.textContent = 'The post-match review will be available after the game is played.';
      msg.appendChild(p);
      content.appendChild(msg);
    } else {
      loadFn(content, t.key);
    }
  }

  tabDefs.forEach((t, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (i === 0 ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', () => {
      tabs.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      showTab(t);
    });
    tabs.appendChild(btn);
  });

  targetEl.append(tabs, content);
  showTab(tabDefs[0]);
}

// ── Utilities ───────────────────────────────────────────────────────────────


// ── Init ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('date-prev').addEventListener('click', () => flipDate(-1));
  document.getElementById('date-next').addEventListener('click', () => flipDate(1));

  loadEvents();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'Escape') {
      const matchPage = document.getElementById('page-match');
      if (matchPage && matchPage.classList.contains('active')) {
        showPage('matches');
      }
    }
    const matchesPage = document.getElementById('page-matches');
    if (matchesPage && matchesPage.classList.contains('active')) {
      if (e.key === 'ArrowLeft') flipDate(-1);
      if (e.key === 'ArrowRight') flipDate(1);
    }
  });
});
