const appData = window.APP_DATA;
let liveSource = 'demo';

const sourceStatus = document.querySelector('#sourceStatus');
const lastUpdated = document.querySelector('#lastUpdated');
const fixturesList = document.querySelector('#fixturesList');
const liveFixturesList = document.querySelector('#liveFixturesList');
const standingsList = document.querySelector('#standingsList');
const newsList = document.querySelector('#newsList');
const filters = document.querySelectorAll('.filter');
const liveCount = document.querySelector('#liveCount');
const upcomingCount = document.querySelector('#upcomingCount');
const matchCount = document.querySelector('#matchCount');
const toggleStandings = document.querySelector('#toggleStandings');
const scrollControls = document.querySelector('#scrollControls');
const scrollTopButton = document.querySelector('#scrollTopButton');
const scrollBottomButton = document.querySelector('#scrollBottomButton');
const groupModal = document.querySelector('#groupModal');
const closeGroupModal = document.querySelector('#closeGroupModal');
const groupModalTitle = document.querySelector('#groupModalTitle');
const groupModalBody = document.querySelector('#groupModalBody');

let activeFilter = 'today';
let standingsExpanded = false;

function sourceLabel() {
  return liveSource === 'football-data.org' ? 'datos reales' : 'datos demo';
}

function formatUpdated(value) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function matchTime(match) {
  if (match.status === 'live') return `${match.minute || 'LIVE'}'`;
  if (match.status === 'final') return 'FT';
  if (match.status === 'updating') return 'Act.';
  return match.time;
}

function scoreValue(team) {
  return team.score === null ? '-' : team.score;
}

function isTodayMatch(match) {
  return match.dateLabel.toLowerCase().startsWith('hoy') || match.status === 'live';
}

function filteredFixtures() {
  if (activeFilter === 'today') {
    const todayMatches = appData.fixtures.filter(isTodayMatch);
    if (todayMatches.length) return todayMatches;
    return appData.fixtures.filter((match) => match.status === 'upcoming').slice(0, 6);
  }

  if (activeFilter === 'upcoming') {
    return appData.fixtures.filter((match) => match.status === 'upcoming' || match.status === 'updating');
  }

  if (activeFilter === 'final') {
    return appData.fixtures.filter((match) => match.status === 'final');
  }

  return appData.fixtures;
}

function emptyFixtureMessage() {
  if (activeFilter === 'today') return 'No hay partidos hoy. Revisa los próximos encuentros.';
  if (activeFilter === 'upcoming') return 'No hay próximos partidos cargados.';
  if (activeFilter === 'final') return 'Todavía no hay resultados para mostrar.';
  return 'No hay partidos para este filtro.';
}

function groupedFixtures() {
  return filteredFixtures().reduce((groups, match) => {
    groups[match.dateLabel] = groups[match.dateLabel] || [];
    groups[match.dateLabel].push(match);
    return groups;
  }, {});
}

function matchSummary(match) {
  return `${match.home.flag} ${match.home.name} vs ${match.away.name} ${match.away.flag}`;
}

function matchScoreSummary(match) {
  return `${match.home.flag} ${match.home.name} ${scoreValue(match.home)} - ${scoreValue(match.away)} ${match.away.name} ${match.away.flag}`;
}

function byTimeAsc(a, b) {
  const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
  const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
  return timeA - timeB;
}

function byTimeDesc(a, b) {
  return byTimeAsc(b, a);
}

function topGroupStory() {
  const group = appData.standings.find((standing) => standing.rows.some((row) => row.pj > 0));
  if (!group) return null;

  const leader = group.rows[0];
  const second = group.rows[1];
  const chase = second ? `, seguido por ${second.flag} ${second.team} con ${second.pts} pts` : '';

  return {
    tag: group.group || 'Clasificación',
    title: `${leader.flag} ${leader.team} manda en su grupo`,
    summary: `${leader.team} lidera con ${leader.pts} pts${chase}. Revisa la tabla para ver diferencia de goles y puestos.`,
  };
}

function buildNewsItems() {
  const liveMatches = appData.fixtures.filter((match) => match.status === 'live');
  const todayUpcoming = appData.fixtures.filter((match) => isTodayMatch(match) && match.status === 'upcoming').sort(byTimeAsc);
  const upcoming = appData.fixtures.filter((match) => match.status === 'upcoming' || match.status === 'updating').sort(byTimeAsc);
  const finals = appData.fixtures.filter((match) => match.status === 'final').sort(byTimeDesc);
  const items = [];

  if (liveMatches.length) {
    const match = liveMatches[0];
    items.push({
      tag: 'En vivo',
      title: `${matchSummary(match)} se juega ahora`,
      summary: `Marcador actual: ${matchScoreSummary(match)}. Sigue el avance desde la sección En vivo.`,
    });
  } else if (todayUpcoming.length) {
    const match = todayUpcoming[0];
    items.push({
      tag: 'Hoy',
      title: `Próximo partido: ${matchSummary(match)}`,
      summary: `Está programado para las ${match.time}. Puedes revisar su grupo desde la agenda.`,
    });
  } else if (upcoming.length) {
    const match = upcoming[0];
    items.push({
      tag: 'Próximo',
      title: `${matchSummary(match)} abre lo que viene`,
      summary: `El encuentro figura para ${match.dateLabel} a las ${match.time}.`,
    });
  }

  if (finals.length) {
    const match = finals[0];
    items.push({
      tag: 'Resultado',
      title: `Último final: ${matchScoreSummary(match)}`,
      summary: `Resultado cerrado en ${groupTitle(match.group)}. La tabla se recalcula con los partidos finalizados.`,
    });
  }

  const groupStory = topGroupStory();
  if (groupStory) items.push(groupStory);

  if (upcoming.length > 1) {
    const nextNames = upcoming.slice(0, 3).map((match) => matchSummary(match)).join(' · ');
    items.push({
      tag: 'Agenda',
      title: 'Partidos que vienen',
      summary: nextNames,
    });
  }

  return items.slice(0, 4);
}


function renderLiveFixtures() {
  const liveMatches = appData.fixtures.filter((match) => match.status === 'live');
  const nextMatch = appData.fixtures.find((match) => match.status === 'upcoming');

  if (liveMatches.length) {
    liveFixturesList.innerHTML = liveMatches.map(renderLiveCard).join('');
    return;
  }

  liveFixturesList.innerHTML = `
    <article class="no-live-card">
      <div>
        <span class="live-kicker">Sin partidos en vivo</span>
        <h3>No hay encuentros jugándose ahora</h3>
        <p>${nextMatch ? `Próximo: ${nextMatch.home.flag} ${nextMatch.home.name} vs ${nextMatch.away.name} ${nextMatch.away.flag} · ${nextMatch.dateLabel} ${nextMatch.time}` : 'Vuelve más tarde para ver marcadores en directo.'}</p>
      </div>
      <a class="mini-action" href="#partidos">Ver calendario</a>
    </article>
  `;
}

function renderLiveCard(match) {
  return `
    <article class="live-match-card">
      <div class="live-match-top">
        <span class="pulse"></span>
        <strong>${matchTime(match)} En vivo</strong>
        <small>${match.group || 'Mundial'}</small>
      </div>
      <div class="live-match-score">
        <span>${match.home.flag} ${match.home.name}</span>
        <strong>${scoreValue(match.home)} - ${scoreValue(match.away)}</strong>
        <span>${match.away.name} ${match.away.flag}</span>
      </div>
    </article>
  `;
}

function renderFixtures() {
  const groups = groupedFixtures();
  fixturesList.innerHTML = Object.entries(groups)
    .map(([date, matches]) => `
      <div class="date-group">
        <div class="date-title">${date} <span>${matches.length} partido${matches.length === 1 ? '' : 's'}</span></div>
        ${matches.map(renderMatchRow).join('')}
      </div>
    `)
    .join('') || `<p class="empty-state">${emptyFixtureMessage()}</p>`;
}

function statusText(match) {
  if (match.status === 'live') return 'En vivo';
  if (match.status === 'final') return 'Final';
  if (match.status === 'updating') return 'Actualizando';
  return 'Próximo';
}

function renderMatchRow(match) {
  return `
    <div class="match-row">
      <span class="match-time ${match.status === 'live' ? 'live' : ''}">${matchTime(match)}</span>
      <span class="team-name">${match.home.flag} ${match.home.name}</span>
      <span class="score-box">${scoreValue(match.home)} - ${scoreValue(match.away)}</span>
      <span class="team-name away">${match.away.name} ${match.away.flag}</span>
      <span class="match-state ${match.status}">${statusText(match)}</span>
      <button class="group-button" type="button" data-group="${match.group}">Grupo</button>
    </div>
  `;
}


function groupTitle(group) {
  return group
    .replace('GROUP_', 'Grupo ')
    .replace('_', ' ')
    .toLowerCase()
    .replace(/^grupo\s+([a-z])/, (_, letter) => `Grupo ${letter.toUpperCase()}`)
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function findGroupStanding(rawGroup) {
  const title = groupTitle(rawGroup || '');
  return appData.standings.find((standing) => standing.group === title || standing.group === rawGroup) || null;
}

function openGroupModal(rawGroup) {
  const standing = findGroupStanding(rawGroup);
  const title = standing?.group || groupTitle(rawGroup || 'Grupo');
  groupModalTitle.textContent = title;

  if (!standing) {
    groupModalBody.innerHTML = '<p class="empty-state">Aún no hay tabla para este grupo.</p>';
  } else {
    groupModalBody.innerHTML = renderGroupTable(standing, true);
  }

  groupModal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeModal() {
  groupModal.hidden = true;
  document.body.classList.remove('modal-open');
}

function renderGroupTable(group, compact = false) {
  return `
    <div class="group-table ${compact ? 'compact-table' : ''}">
      ${compact ? '' : `<h3>${group.group || 'Clasificación'}</h3>`}
      <table>
        <thead>
          <tr>
            <th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          ${group.rows.map((row) => `
            <tr>
              <td><span class="team-cell">${row.flag} ${row.team}</span></td>
              <td>${row.pj}</td><td>${row.g}</td><td>${row.e}</td><td>${row.p}</td>
              <td>${row.gf}</td><td>${row.gc}</td><td><strong>${row.pts}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderStandings() {
  const groups = standingsExpanded ? appData.standings : appData.standings.slice(0, 2);
  standingsList.innerHTML = groups.map((group) => renderGroupTable(group)).join('');
  toggleStandings.hidden = appData.standings.length <= 2;
  toggleStandings.textContent = standingsExpanded ? 'Ver menos grupos' : `Ver todos los grupos (${appData.standings.length})`;
}

function renderNews() {
  const items = buildNewsItems();
  newsList.innerHTML = (items.length ? items : appData.news)
    .map((item) => `
      <article class="news-card">
        <span>${item.tag}</span>
        <h3>${item.title}</h3>
        <p>${item.summary}</p>
      </article>
    `)
    .join('');
}

function updateSummary() {
  liveCount.textContent = appData.fixtures.filter((match) => match.status === 'live').length;
  upcomingCount.textContent = appData.fixtures.filter((match) => match.status === 'upcoming').length;
  matchCount.textContent = appData.fixtures.length;
}


function updateScrollControls() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  scrollControls.classList.toggle('is-visible', maxScroll > 500);
  scrollTopButton.disabled = scrollTop < 80;
  scrollBottomButton.disabled = scrollTop > maxScroll - 80;
}

function bindEvents() {
  fixturesList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-group]');
    if (!button) return;
    openGroupModal(button.dataset.group);
  });

  closeGroupModal.addEventListener('click', closeModal);
  groupModal.addEventListener('click', (event) => {
    if (event.target === groupModal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !groupModal.hidden) closeModal();
  });

  toggleStandings.addEventListener('click', () => {
    standingsExpanded = !standingsExpanded;
    renderStandings();
  });

  scrollTopButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  scrollBottomButton.addEventListener('click', () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }));
  window.addEventListener('scroll', updateScrollControls, { passive: true });
  window.addEventListener('resize', updateScrollControls);

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      activeFilter = filter.dataset.filter;
      filters.forEach((item) => item.classList.toggle('active', item === filter));
      renderFixtures();
    });
  });
}

async function hydrateLiveData() {
  if (!window.loadLiveData) return;

  try {
    const live = await window.loadLiveData();
    liveSource = live.source || 'demo';
    if (live.fixtures?.length) appData.fixtures = live.fixtures;
    if (live.standings?.length) appData.standings = live.standings;
    if (live.updatedAt) appData.updatedAt = live.updatedAt;
  } catch (error) {
    liveSource = 'demo';
    console.warn('No se pudo cargar data en vivo, usando demo:', error);
  }
}

async function init() {
  await hydrateLiveData();
  lastUpdated.textContent = formatUpdated(appData.updatedAt);
  sourceStatus.textContent = sourceLabel();
  renderLiveFixtures();
  renderFixtures();
  renderStandings();
  renderNews();
  updateSummary();
  bindEvents();
  updateScrollControls();
}

init();
