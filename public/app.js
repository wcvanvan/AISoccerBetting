/**
 * Soccer Betting Analyzer — Frontend
 */

// State
let eventsData = [];
let currentMatch = null; // { home_team, away_team, date, league_key, league_label, commence_time, markets }
let currentMarket = 'goals';
let tabCache = {};
let currentLeagueFilter = 'all';

// ── Page navigation ─────────────────────────────────────────────────────────

function showPage(page) {
  document.querySelectorAll('.page').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('nav a').forEach((el) => el.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const navLink = document.querySelector('nav a[data-page="' + page + '"]');
  if (navLink) navLink.classList.add('active');
}

// ── Events / Matches ────────────────────────────────────────────────────────

var datePages = [];
var currentDateIdx = 0;

async function loadEvents() {
  var container = document.getElementById('events-container');
  container.innerHTML = '<div class="loading"><span class="spinner"></span> Loading matches...</div>';

  try {
    var resp = await fetch('data/manifest.json');
    if (!resp.ok) throw new Error('Failed to load matches');
    var manifest = await resp.json();

    var merged = manifest.map(function (m) {
      return {
        home_team: m.homeTeam,
        away_team: m.awayTeam,
        commence_time: m.date + 'T00:00:00Z',
        league_key: m.leagueKey || '',
        league_label: m.leagueLabel || '',
        markets: m.markets || {},
        matchId: m.matchId,
      };
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

    // Ensure today always exists in datePages
    var now = new Date(); var todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    if (!groupMap[todayStr]) {
      var todayPage = { date: todayStr, events: [] };
      // Insert in sorted position
      var inserted = false;
      for (var j = 0; j < datePages.length; j++) {
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
    for (var i = 0; i < datePages.length; i++) {
      if (datePages[i].date >= todayStr) {
        currentDateIdx = i;
        break;
      }
    }

    document.getElementById('date-nav').style.display = '';
    renderDatePills();
    renderDatePage();
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><h3>Failed to load</h3><p>' + esc(err.message) + '</p></div>';
  }
}

function renderDatePills() {
  var container = document.getElementById('date-pills');
  container.innerHTML = '';
  var now = new Date(); var todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

  datePages.forEach(function (page, idx) {
    var pill = document.createElement('button');
    pill.className = 'date-pill' + (idx === currentDateIdx ? ' active' : '');
    var d = new Date(page.date + 'T12:00:00Z');
    var dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
    var dayNum = d.getUTCDate();
    if (page.date === todayStr) {
      pill.classList.add('today');
      var todayLabel = document.createElement('span');
      todayLabel.className = 'date-pill-today';
      todayLabel.textContent = 'Today';
      pill.appendChild(todayLabel);
    } else {
      var daySpan = document.createElement('span');
      daySpan.className = 'date-pill-day';
      daySpan.textContent = dayName;
      pill.appendChild(daySpan);
    }
    var numSpan = document.createElement('span');
    numSpan.className = 'date-pill-num';
    numSpan.textContent = dayNum;
    pill.appendChild(numSpan);
    pill.addEventListener('click', function () { goToDate(idx); });
    container.appendChild(pill);
  });

  document.getElementById('date-prev').disabled = currentDateIdx === 0;
  document.getElementById('date-next').disabled = currentDateIdx === datePages.length - 1;

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
  currentLeagueFilter = 'all';
  renderDatePills();
  renderDatePage();
}

// ── League filter bar ───────────────────────────────────────────────────────

function renderLeagueFilterBar(leagueGroups) {
  var filterBar = document.getElementById('league-filter');
  filterBar.innerHTML = '';

  if (leagueGroups.length <= 1) {
    filterBar.style.display = 'none';
    return;
  }

  filterBar.style.display = '';

  // "All" pill
  var allPill = document.createElement('button');
  allPill.className = 'league-filter-pill' + (currentLeagueFilter === 'all' ? ' active' : '');
  allPill.textContent = 'All';
  allPill.addEventListener('click', function () {
    currentLeagueFilter = 'all';
    renderDatePage();
  });
  filterBar.appendChild(allPill);

  leagueGroups.forEach(function (lg) {
    var pill = document.createElement('button');
    pill.className = 'league-filter-pill' + (currentLeagueFilter === lg.key ? ' active' : '');
    pill.textContent = lg.label;
    pill.addEventListener('click', function () {
      currentLeagueFilter = lg.key;
      renderDatePage();
    });
    filterBar.appendChild(pill);
  });
}

// ── Date page rendering ─────────────────────────────────────────────────────

function renderDatePage() {
  var container = document.getElementById('events-container');
  var page = datePages[currentDateIdx];
  if (!page) {
    container.innerHTML = '<div class="empty-state"><h3>No matches</h3></div>';
    return;
  }

  container.innerHTML = '';

  var now = new Date(); var todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  var d = new Date(page.date + 'T12:00:00Z');
  var isToday = page.date === todayStr;

  // Date heading
  var heading = document.createElement('div');
  heading.className = 'date-page-heading';
  var label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  if (isToday) label += ' — Today';

  var labelSpan = document.createElement('span');
  labelSpan.className = 'date-page-label';
  labelSpan.textContent = label;
  heading.appendChild(labelSpan);

  // Empty day — only today gets an empty state card
  if (page.events.length === 0 && isToday) {
    container.appendChild(heading);
    var emptyCard = document.createElement('div');
    emptyCard.className = 'empty-day-card';
    var emptyIcon = document.createElement('div');
    emptyIcon.className = 'empty-day-icon';
    emptyIcon.textContent = '\u26BD';
    emptyCard.appendChild(emptyIcon);
    var emptyTitle = document.createElement('h3');
    emptyTitle.textContent = 'No analysis scheduled today';
    emptyCard.appendChild(emptyTitle);
    container.appendChild(emptyCard);
    document.getElementById('league-filter').style.display = 'none';
    return;
  }

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

  // Render league filter bar
  renderLeagueFilterBar(leagueGroups);

  var totalEvents = page.events.length;
  if (currentLeagueFilter !== 'all') {
    var filtered = leagueGroups.filter(function (lg) { return lg.key === currentLeagueFilter; });
    totalEvents = filtered.reduce(function (sum, lg) { return sum + lg.events.length; }, 0);
  }

  var countSpan = document.createElement('span');
  countSpan.className = 'date-page-count';
  countSpan.textContent = totalEvents + ' match' + (totalEvents !== 1 ? 'es' : '');
  heading.appendChild(countSpan);
  container.appendChild(heading);

  // Apply league filter
  var filteredGroups = leagueGroups;
  var filteredNoLeague = noLeague;
  if (currentLeagueFilter !== 'all') {
    filteredGroups = leagueGroups.filter(function (lg) { return lg.key === currentLeagueFilter; });
    filteredNoLeague = [];
  }

  filteredGroups.forEach(function (lg) { renderLeagueSection(container, lg.key, lg.label, lg.events); });
  if (filteredNoLeague.length > 0) renderLeagueSection(container, '', 'Other', filteredNoLeague);
}

// ── League section with table rows ──────────────────────────────────────────

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

    // Market badges cell
    var tdCache = document.createElement('td');
    tdCache.className = 'cache-cell col-right';
    renderInlineMarketBadges(tdCache, e.markets);
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
    var dash = document.createElement('span');
    dash.className = 'cache-none';
    dash.textContent = '\u2014';
    cell.appendChild(dash);
  }
}

// ── Match Info Page ─────────────────────────────────────────────────────────

function openMatchPage(event) {
  const isSameMatch = currentMatch &&
    currentMatch.home_team === event.home_team &&
    currentMatch.away_team === event.away_team &&
    currentMatch.date === event.commence_time.slice(0, 10);

  if (!isSameMatch) {
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
    markets: event.markets || {},
    matchId: event.matchId,
  };
  showPage('match');
  renderMatchPage();
}

function renderMatchPage() {
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

  const teamsRow = document.createElement('div');
  teamsRow.className = 'match-info-teams';
  var homeTeam = document.createElement('span');
  homeTeam.className = 'match-info-team';
  homeTeam.textContent = m.home_team;
  var vsEl = document.createElement('span');
  vsEl.className = 'match-info-vs';
  vsEl.textContent = 'vs';
  var awayTeam = document.createElement('span');
  awayTeam.className = 'match-info-team';
  awayTeam.textContent = m.away_team;
  teamsRow.append(homeTeam, vsEl, awayTeam);
  infoCard.appendChild(teamsRow);

  const detailsRow = document.createElement('div');
  detailsRow.className = 'match-info-details';
  var dateSpan = document.createElement('span');
  dateSpan.textContent = dateStr + (timeStr !== '00:00' ? ' \u00b7 ' + timeStr : '');
  detailsRow.appendChild(dateSpan);
  if (m.league_label) {
    var leagueBadge = document.createElement('span');
    leagueBadge.className = 'league-badge';
    leagueBadge.dataset.league = m.league_key;
    leagueBadge.textContent = m.league_label;
    detailsRow.appendChild(leagueBadge);
  }
  infoCard.appendChild(detailsRow);
  container.appendChild(infoCard);

  // Market tabs
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

  document.getElementById('match-results').innerHTML = '';
  loadMarketData();
}

function loadMarketData() {
  const resultsArea = document.getElementById('match-results');
  if (!currentMatch) return;

  const marketInfo = (currentMatch.markets || {})[currentMarket];
  if (marketInfo && (marketInfo.hasReport || marketInfo.hasAnalysis)) {
    renderMatchCachedResults(currentMatch, currentMarket, marketInfo.hasAnalysis);
    return;
  }

  var emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state';
  var emptyP = document.createElement('p');
  emptyP.textContent = 'No data collected yet for ' + currentMarket + ' market.';
  emptyDiv.appendChild(emptyP);
  resultsArea.innerHTML = '';
  resultsArea.appendChild(emptyDiv);
}

function renderMatchCachedResults(match, market, hasAnalysis) {
  const resultsArea = document.getElementById('match-results');
  const mid = match.matchId;
  const contentKey = mid + '|' + market;
  renderResultTabs(resultsArea, hasAnalysis, function (container, tab) {
    var url = 'data/reports/' + mid + '/' + market + '-' + tab + '.html';
    return loadReportTab(container, url, contentKey + ':' + tab);
  });
}

// ── Shared tab rendering ────────────────────────────────────────────────────

async function loadReportTab(container, url, cacheKey) {
  if (cacheKey && tabCache[cacheKey]) {
    container.innerHTML = '';
    const body = document.createElement('div');
    body.className = 'markdown-body';
    body.innerHTML = tabCache[cacheKey];
    container.appendChild(body);
    return;
  }

  container.innerHTML = '';
  var loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading';
  var spinner = document.createElement('span');
  spinner.className = 'spinner';
  loadingDiv.appendChild(spinner);
  loadingDiv.appendChild(document.createTextNode(' Loading...'));
  container.appendChild(loadingDiv);

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      container.innerHTML = '';
      var errDiv = document.createElement('div');
      errDiv.className = 'empty-state';
      var errP = document.createElement('p');
      errP.textContent = 'Report not found';
      errDiv.appendChild(errP);
      container.appendChild(errDiv);
      return;
    }
    const html = await resp.text();
    if (cacheKey) tabCache[cacheKey] = html;
    container.innerHTML = '';
    const body = document.createElement('div');
    body.className = 'markdown-body';
    body.innerHTML = html;
    container.appendChild(body);
  } catch (err) {
    container.innerHTML = '';
    var failDiv = document.createElement('div');
    failDiv.className = 'empty-state';
    var failP = document.createElement('p');
    failP.textContent = 'Failed to load: ' + err.message;
    failDiv.appendChild(failP);
    container.appendChild(failDiv);
  }
}

function renderResultTabs(targetEl, hasAnalysis, loadFn) {
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

  tabDefs.forEach((t, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (i === 0 ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', () => {
      tabs.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadFn(content, t.key);
    });
    tabs.appendChild(btn);
  });

  targetEl.append(tabs, content);
  return loadFn(content, tabDefs[0].key);
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
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const matchesPage = document.getElementById('page-matches');
    if (matchesPage && matchesPage.classList.contains('active')) {
      if (e.key === 'ArrowLeft') flipDate(-1);
      if (e.key === 'ArrowRight') flipDate(1);
    }
  });
});
