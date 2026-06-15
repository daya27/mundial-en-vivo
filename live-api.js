const LIVE_STATUS_MAP = {
  TIMED: 'upcoming',
  SCHEDULED: 'upcoming',
  IN_PLAY: 'live',
  PAUSED: 'live',
  FINISHED: 'final',
};

const TEAM_FLAGS = {
  Algeria: '🇩🇿',
  Argentina: '🇦🇷',
  Australia: '🇦🇺',
  Austria: '🇦🇹',
  Belgium: '🇧🇪',
  Bosnia: '🇧🇦',
  Brazil: '🇧🇷',
  'Cape Verde': '🇨🇻',
  Canada: '🇨🇦',
  Colombia: '🇨🇴',
  'Costa Rica': '🇨🇷',
  Croatia: '🇭🇷',
  Czechia: '🇨🇿',
  Curaçao: '🇨🇼',
  Curacao: '🇨🇼',
  Ecuador: '🇪🇨',
  Egypt: '🇪🇬',
  England: '🏴',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Ghana: '🇬🇭',
  Haiti: '🇭🇹',
  Honduras: '🇭🇳',
  'Ivory Coast': '🇨🇮',
  Iran: '🇮🇷',
  Iraq: '🇮🇶',
  Japan: '🇯🇵',
  Jordan: '🇯🇴',
  'Korea Republic': '🇰🇷',
  Mexico: '🇲🇽',
  Morocco: '🇲🇦',
  'New Zealand': '🇳🇿',
  Nigeria: '🇳🇬',
  Norway: '🇳🇴',
  Netherlands: '🇳🇱',
  Panama: '🇵🇦',
  Paraguay: '🇵🇾',
  Portugal: '🇵🇹',
  Qatar: '🇶🇦',
  'Saudi Arabia': '🇸🇦',
  Scotland: '🏴',
  Senegal: '🇸🇳',
  'South Africa': '🇿🇦',
  Spain: '🇪🇸',
  Sweden: '🇸🇪',
  Switzerland: '🇨🇭',
  Tunisia: '🇹🇳',
  Turkey: '🇹🇷',
  Uruguay: '🇺🇾',
  Uzbekistan: '🇺🇿',
  'United States': '🇺🇸',
};


const TEAM_NAMES_ES = {
  Algeria: 'Argelia',
  Argentina: 'Argentina',
  Australia: 'Australia',
  Austria: 'Austria',
  Belgium: 'Bélgica',
  Bosnia: 'Bosnia y Herzegovina',
  Brazil: 'Brasil',
  Canada: 'Canadá',
  'Cape Verde': 'Cabo Verde',
  'Cape Verde Islands': 'Cabo Verde',
  Colombia: 'Colombia',
  'Costa Rica': 'Costa Rica',
  Croatia: 'Croacia',
  Curaçao: 'Curazao',
  Curacao: 'Curazao',
  Czechia: 'República Checa',
  Ecuador: 'Ecuador',
  Egypt: 'Egipto',
  England: 'Inglaterra',
  France: 'Francia',
  Germany: 'Alemania',
  Ghana: 'Ghana',
  Haiti: 'Haití',
  Honduras: 'Honduras',
  'Ivory Coast': 'Costa de Marfil',
  Iran: 'Irán',
  Iraq: 'Irak',
  Japan: 'Japón',
  Jordan: 'Jordania',
  'Korea Republic': 'Corea del Sur',
  Mexico: 'México',
  Morocco: 'Marruecos',
  Netherlands: 'Países Bajos',
  'New Zealand': 'Nueva Zelanda',
  Nigeria: 'Nigeria',
  Norway: 'Noruega',
  Panama: 'Panamá',
  Paraguay: 'Paraguay',
  Portugal: 'Portugal',
  Qatar: 'Qatar',
  'Saudi Arabia': 'Arabia Saudita',
  Scotland: 'Escocia',
  Senegal: 'Senegal',
  'South Africa': 'Sudáfrica',
  Spain: 'España',
  Sweden: 'Suecia',
  Switzerland: 'Suiza',
  Tunisia: 'Túnez',
  Turkey: 'Turquía',
  Uruguay: 'Uruguay',
  'United States': 'Estados Unidos',
  USA: 'Estados Unidos',
  Uzbekistan: 'Uzbekistán',
};

function shortCode(team) {
  return (team?.tla || team?.shortName || team?.name || 'TBD')
    .slice(0, 3)
    .toUpperCase();
}

function flagFor(team) {
  return TEAM_FLAGS[team?.name] || TEAM_FLAGS[team?.shortName] || '⚽';
}

function displayNameFor(team) {
  return TEAM_NAMES_ES[team?.name] || TEAM_NAMES_ES[team?.shortName] || team?.shortName || team?.name || 'Por definir';
}

function scoreFor(match, side) {
  const current = match.score?.fullTime?.[side];
  if (typeof current === 'number') return current;
  const regular = match.score?.regularTime?.[side];
  if (typeof regular === 'number') return regular;
  return null;
}

function localDateKey(date) {
  const target = new Date(date);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
}

function relativeDateKey(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return localDateKey(date);
}

function dateLabelFor(date) {
  const target = new Date(date);
  const targetKey = localDateKey(target);

  if (targetKey === relativeDateKey(-1)) return 'Ayer';
  if (targetKey === relativeDateKey(0)) return 'Hoy';
  if (targetKey === relativeDateKey(1)) return 'Mañana';

  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' }).format(target);
}

function timeFor(date) {
  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}


function inferStatusByClock(match, mappedStatus) {
  if (mappedStatus !== 'upcoming' || !match.utcDate) return mappedStatus;

  const kickoff = new Date(match.utcDate).getTime();
  const now = Date.now();
  const elapsedMinutes = (now - kickoff) / 60000;

  // football-data can keep matches as TIMED during kickoff; this keeps the UI useful.
  if (elapsedMinutes >= 0 && elapsedMinutes <= 140) return 'live';
  if (elapsedMinutes > 140) return 'final';

  return mappedStatus;
}

function normalizeMatch(match) {
  const mappedStatus = LIVE_STATUS_MAP[match.status] || 'upcoming';
  const hasLiveMinute = Number.isFinite(match.minute) && match.minute > 0;
  const status = inferStatusByClock(match, mappedStatus);
  return {
    id: String(match.id),
    timestamp: match.utcDate,
    dateLabel: dateLabelFor(match.utcDate),
    status,
    minute: hasLiveMinute ? match.minute : undefined,
    time: status === 'live' ? (hasLiveMinute ? `${match.minute}'` : 'En vivo') : timeFor(match.utcDate),
    group: match.group || match.stage || 'Mundial',
    home: {
      name: displayNameFor(match.homeTeam),
      code: shortCode(match.homeTeam),
      flag: flagFor(match.homeTeam),
      score: scoreFor(match, 'home'),
    },
    away: {
      name: displayNameFor(match.awayTeam),
      code: shortCode(match.awayTeam),
      flag: flagFor(match.awayTeam),
      score: scoreFor(match, 'away'),
    },
  };
}


function groupLabel(group) {
  if (!group) return 'Grupo';
  return group
    .replace('GROUP_', 'Grupo ')
    .replace('_', ' ')
    .toLowerCase()
    .replace(/^grupo\s+([a-z])/, (_, letter) => `Grupo ${letter.toUpperCase()}`)
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function emptyRow(team) {
  return {
    team: team.name,
    flag: team.flag,
    pj: 0,
    g: 0,
    e: 0,
    p: 0,
    gf: 0,
    gc: 0,
    pts: 0,
  };
}

function ensureTeam(table, team) {
  if (!table.has(team.code)) table.set(team.code, emptyRow(team));
  return table.get(team.code);
}

function applyFinishedMatch(table, match) {
  if (match.status !== 'final') return;
  if (typeof match.home.score !== 'number' || typeof match.away.score !== 'number') return;

  const home = ensureTeam(table, match.home);
  const away = ensureTeam(table, match.away);
  home.pj += 1;
  away.pj += 1;
  home.gf += match.home.score;
  home.gc += match.away.score;
  away.gf += match.away.score;
  away.gc += match.home.score;

  if (match.home.score > match.away.score) {
    home.g += 1;
    home.pts += 3;
    away.p += 1;
  } else if (match.home.score < match.away.score) {
    away.g += 1;
    away.pts += 3;
    home.p += 1;
  } else {
    home.e += 1;
    away.e += 1;
    home.pts += 1;
    away.pts += 1;
  }
}

function buildStandingsFromMatches(matches) {
  const groups = new Map();
  for (const match of matches) {
    const group = groupLabel(match.group);
    if (!groups.has(group)) groups.set(group, new Map());
    const table = groups.get(group);
    ensureTeam(table, match.home);
    ensureTeam(table, match.away);
    applyFinishedMatch(table, match);
  }

  return [...groups.entries()].map(([group, table]) => ({
    group,
    rows: [...table.values()].sort((a, b) => {
      const gdA = a.gf - a.gc;
      const gdB = b.gf - b.gc;
      return b.pts - a.pts || gdB - gdA || b.gf - a.gf || a.team.localeCompare(b.team);
    }),
  }));
}

function normalizeStandings(payload) {
  return (payload.standings || [])
    .filter((standing) => standing.type === 'TOTAL')
    .map((standing) => ({
      group: standing.group || 'Clasificación',
      rows: (standing.table || []).map((row) => ({
        team: displayNameFor(row.team),
        flag: flagFor(row.team),
        pj: row.playedGames ?? 0,
        g: row.won ?? 0,
        e: row.draw ?? 0,
        p: row.lost ?? 0,
        gf: row.goalsFor ?? 0,
        gc: row.goalsAgainst ?? 0,
        pts: row.points ?? 0,
      })),
    }));
}

async function footballDataRequest(path) {
  const config = window.LIVE_CONFIG;
  const baseUrl = config.proxyBaseUrl || 'https://api.football-data.org/v4';
  const headers = config.proxyBaseUrl ? {} : { 'X-Auth-Token': config.token };
  const response = await fetch(`${baseUrl}${path}`, { headers });

  if (!response.ok) {
    throw new Error(`football-data.org respondio ${response.status}`);
  }

  return response.json();
}

async function loadFootballData() {
  const config = window.LIVE_CONFIG;
  const competition = config.competition || 'WC';
  const season = config.season || 2026;
  const [matchesPayload, standingsPayload] = await Promise.all([
    footballDataRequest(`/competitions/${competition}/matches?season=${season}`),
    footballDataRequest(`/competitions/${competition}/standings?season=${season}`),
  ]);

  return {
    fixtures: (matchesPayload.matches || []).map(normalizeMatch),
    standings: buildStandingsFromMatches((matchesPayload.matches || []).map(normalizeMatch)),
    updatedAt: new Date().toISOString(),
    source: 'football-data.org',
  };
}

window.loadLiveData = async function loadLiveData() {
  const config = window.LIVE_CONFIG || {};
  const usesProxy = Boolean(config.proxyBaseUrl);

  if (!config.enabled || (!usesProxy && !config.token)) {
    return { source: 'demo', reason: 'API desactivada o sin token' };
  }

  if (config.provider !== 'football-data') {
    return { source: 'demo', reason: 'Proveedor no configurado' };
  }

  return loadFootballData();
};
