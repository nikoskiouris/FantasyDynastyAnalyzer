const API_BASE = "https://api.sleeper.app/v1";
const SAMPLE_VALUES_PATH = "./data/ktc_values_sample.csv";
const PLAYERS_CACHE_KEY = "fda_players_nfl_cache_v1";
const PLAYERS_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const DEFAULT_FAIRNESS_PCT = 20;
const OUTGOING_POOL_LIMIT = 18;
const DEFAULT_MAX_OUTGOING_PACKAGE_SIZE = 5;
const ELITE_MAX_OUTGOING_PACKAGE_SIZE = 6;
const ELITE_TARGET_VALUE_THRESHOLD = 7000;
const STAR_TARGET_VALUE_THRESHOLD = 5000;
const MIN_OUTGOING_ASSET_VALUE = 450;
const LINEUP_EXACT_SOLVER_CANDIDATE_LIMIT = 14;
const LINEUP_EXACT_SOLVER_SLOT_LIMIT = 11;
const LINEUP_CANDIDATE_FLOOR = 6;
const LINEUP_CANDIDATE_BUFFER = 2;
const ELITE_TARGET_ANCHOR_SHARE_BASE = 0.48;
const STAR_TARGET_ANCHOR_SHARE_BASE = 0.4;
const ANCHOR_SHARE_STEP_PER_EXTRA_ASSET = 0.02;
const MAX_TARGET_ANCHOR_SHARE = 0.64;
const ELITE_FRAGMENTATION_TAX_PER_EXTRA_ASSET = 180;
const STAR_FRAGMENTATION_TAX_PER_EXTRA_ASSET = 120;
const BASE_FRAGMENTATION_TAX_PER_EXTRA_ASSET = 70;
const PACKAGE_DIVERSITY_OVERLAP_RATIO = 0.55;
const PACKAGE_DIVERSITY_VALUE_OVERLAP_RATIO = 0.72;
const KTC_RAW_BASE = 0.10;
const KTC_RAW_ELITE_WEIGHT = 0.04;
const KTC_RAW_TRADE_WEIGHT = 0.09;
const KTC_RAW_DEPTH_WEIGHT = 0.24;
const KTC_GLOBAL_MAX_FALLBACK = 9999;
const AUTOSELECT_MANAGER_BY_LEAGUE = {
  "1315165104303513600": "NikoSkiouris",
};

const state = {
  leagueId: "",
  leagueName: "",
  league: null,
  users: [],
  rosters: [],
  players: {},
  previousLeague: null,
  previousUsers: [],
  previousRosters: [],
  normalizedRosters: [],
  meRosterId: null,
  targetAsset: null,
  valuationsPromise: null,
  values: {},
  valueNameMap: {},
  playerPositionRankByAssetId: {},
  pickValueCatalog: [],
  globalMaxPlayerValue: KTC_GLOBAL_MAX_FALLBACK,
  tradedPicks: [],
  targetFilters: {
    players: true,
    picks: false,
  },
  outgoingFilters: {
    players: true,
    picks: true,
  },
  selectedOutgoingAssetIds: new Set(),
  excludedOutgoingAssetIds: new Set(),
};

const el = {
  leagueId: document.querySelector("#league-id"),
  loadLeagueBtn: document.querySelector("#load-league-btn"),
  copyLeagueIdBtn: document.querySelector("#copy-league-id-btn"),
  copyLeagueIdFeedback: document.querySelector("#copy-league-id-feedback"),
  leagueStatus: document.querySelector("#league-status"),
  leagueStatusText: document.querySelector("#league-status-text"),
  leagueStatusLoader: document.querySelector("#league-status-loader"),
  identitySection: document.querySelector("#identity-section"),
  meSelect: document.querySelector("#me-select"),
  playerSection: document.querySelector("#player-section"),
  targetSearchShell: document.querySelector("#target-search-shell"),
  targetChip: document.querySelector("#target-chip"),
  targetChipLabel: document.querySelector("#target-chip-label"),
  clearTargetBtn: document.querySelector("#clear-target-btn"),
  playerSearch: document.querySelector("#player-search"),
  playerResults: document.querySelector("#player-results"),
  builderSection: document.querySelector("#builder-section"),
  includeAssetsToggle: document.querySelector("#include-assets-toggle"),
  includeAssetsPanel: document.querySelector("#include-assets-panel"),
  includeAssetsDetails: document.querySelector("#include-assets-details"),
  includeAssetsSummaryLabel: document.querySelector("#include-assets-summary-label"),
  includeAssetSearch: document.querySelector("#include-asset-search"),
  myAssetResults: document.querySelector("#my-asset-results"),
  selectedAssetsSummary: document.querySelector("#selected-assets-summary"),
  selectedAssetsList: document.querySelector("#selected-assets-list"),
  excludeAssetsToggle: document.querySelector("#exclude-assets-toggle"),
  excludeAssetsPanel: document.querySelector("#exclude-assets-panel"),
  excludeAssetsDetails: document.querySelector("#exclude-assets-details"),
  excludeAssetsSummaryLabel: document.querySelector("#exclude-assets-summary-label"),
  excludeAssetSearch: document.querySelector("#exclude-asset-search"),
  excludeAssetResults: document.querySelector("#exclude-asset-results"),
  excludedAssetsSummary: document.querySelector("#excluded-assets-summary"),
  excludedAssetsList: document.querySelector("#excluded-assets-list"),
  marketSection: document.querySelector("#market-section"),
  positionPremiumSelect: document.querySelector("#position-premium-select"),
  tradeVibeSelect: document.querySelector("#trade-vibe-select"),
  teamStateSelect: document.querySelector("#team-state-select"),
  settingsSection: document.querySelector("#settings-section"),
  maxResultsInput: document.querySelector("#max-results-input"),
  generateBtn: document.querySelector("#generate-btn"),
  resultsSection: document.querySelector("#results-section"),
  resultsSubtitle: document.querySelector("#results-subtitle"),
  resultsList: document.querySelector("#results-list"),
};

el.loadLeagueBtn.addEventListener("click", loadLeague);
el.leagueId?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    loadLeague();
  }
});
el.copyLeagueIdBtn?.addEventListener("click", copyHelperLeagueId);
el.playerSearch.addEventListener("input", () => {
  invalidateResults();
  renderPlayerSearch();
});
el.clearTargetBtn?.addEventListener("click", clearTargetAsset);
el.includeAssetSearch?.addEventListener("input", () => {
  invalidateResults();
  renderOutgoingAssetSearch();
});
el.excludeAssetSearch?.addEventListener("input", () => {
  invalidateResults();
  renderOutgoingAssetSearch();
});
el.includeAssetsToggle?.addEventListener("change", handleIncludeToggleChange);
el.excludeAssetsToggle?.addEventListener("change", handleExcludeToggleChange);
[
  el.positionPremiumSelect,
  el.tradeVibeSelect,
  el.teamStateSelect,
  el.maxResultsInput,
].forEach((input) => {
  input?.addEventListener("change", () => {
    invalidateResults();
    renderOutgoingAssetSearch();
  });
});
el.meSelect.addEventListener("change", () => {
  invalidateResults();
  state.meRosterId = Number(el.meSelect.value);
  renderPlayerSearch();
  pruneSelectedOutgoingAssets();
  pruneExcludedOutgoingAssets();
  renderOutgoingAssetSearch();
});
el.generateBtn.addEventListener("click", generateTradeIdeas);

renderSessionSnapshot();

let leagueLoadAnimationTimer = null;
let leagueLoadStartedAt = 0;
let copyFeedbackTimer = null;

function invalidateResults() {
  el.resultsSection.classList.add("hidden");
}

function clearTargetAsset() {
  invalidateResults();
  state.targetAsset = null;
  if (el.playerSearch) el.playerSearch.value = "";
  renderPlayerSearch();
}

function syncTargetSearchUi() {
  const hasTarget = Boolean(state.targetAsset);

  if (el.targetChip) {
    el.targetChip.classList.toggle("hidden", !hasTarget);
  }
  if (el.targetChipLabel) {
    el.targetChipLabel.textContent = state.targetAsset?.name || "";
  }
  if (el.targetSearchShell) {
    el.targetSearchShell.classList.toggle("has-token", hasTarget);
  }
  if (el.playerSearch) {
    el.playerSearch.placeholder = hasTarget ? "" : "Search player or pick";
  }
}

function renderSessionSnapshot() {
  // Session snapshot UI was intentionally removed in the simplified layout.
}

async function loadLeague() {
  const leagueId = el.leagueId.value.trim();
  if (!leagueId) {
    setStatus("Please enter a league ID.");
    return;
  }

  startLeagueLoadingUi();
  state.targetAsset = null;
  state.selectedOutgoingAssetIds.clear();
  state.excludedOutgoingAssetIds.clear();
  state.tradedPicks = [];
  if (el.includeAssetsToggle) el.includeAssetsToggle.checked = false;
  if (el.excludeAssetsToggle) el.excludeAssetsToggle.checked = false;
  if (el.includeAssetSearch) el.includeAssetSearch.value = "";
  if (el.excludeAssetSearch) el.excludeAssetSearch.value = "";
  if (el.includeAssetsDetails) el.includeAssetsDetails.open = false;
  if (el.excludeAssetsDetails) el.excludeAssetsDetails.open = false;
  renderSessionSnapshot();
  el.resultsList.innerHTML = "";
  el.resultsSection.classList.add("hidden");

  try {
    const { league, users, rosters, tradedPicks } = await loadLeagueCoreData(leagueId);
    const previousContext = await loadPreviousLeagueContext(league);

    state.leagueId = leagueId;
    state.leagueName = league?.name || `League ${leagueId}`;
    state.league = league;
    state.users = users;
    state.rosters = rosters;
    state.tradedPicks = tradedPicks;
    state.players = {};
    state.previousLeague = previousContext.league;
    state.previousUsers = previousContext.users;
    state.previousRosters = previousContext.rosters;
    state.normalizedRosters = normalizeRosters(league, rosters, users, state.players, previousContext, tradedPicks);

    hydrateManagerSelector();
    renderSessionSnapshot();
    el.identitySection.classList.remove("hidden");
    el.playerSection.classList.remove("hidden");
    el.builderSection.classList.remove("hidden");
    el.marketSection.classList.remove("hidden");
    el.settingsSection.classList.remove("hidden");
    setStatus(`Loaded ${state.leagueName}. Player names are still syncing...`, { loading: true });
    primeValuationData();

    loadPlayersWithCache()
      .then((players) => {
        state.players = players;
        refreshPlayerPositionRanks();
        state.normalizedRosters = normalizeRosters(state.league, state.rosters, state.users, players, {
          league: state.previousLeague,
          users: state.previousUsers,
          rosters: state.previousRosters,
        }, state.tradedPicks);
        hydrateManagerSelector();
        renderOutgoingAssetSearch();
        setStatus(`Loaded ${state.leagueName}. Choose your team to continue.`, { ok: true });
      })
      .catch((err) => {
        renderOutgoingAssetSearch();
        setStatus(
          `Loaded ${state.leagueName}, but could not pull full NFL names (${err.message}). You can still use the app.`,
          { ok: true }
        );
      });
  } catch (err) {
    setStatus(`Could not load league data. ${err.message}`);
  } finally {
    stopLeagueLoadingUi();
  }
}

async function copyHelperLeagueId() {
  const leagueId = el.copyLeagueIdBtn?.textContent?.trim();
  if (!leagueId) return;

  let copied = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(leagueId);
      copied = true;
    }
  } catch {
    copied = false;
  }

  if (!copied) {
    try {
      const tempInput = document.createElement("input");
      tempInput.value = leagueId;
      tempInput.style.position = "absolute";
      tempInput.style.left = "-9999px";
      document.body.appendChild(tempInput);
      tempInput.select();
      copied = document.execCommand("copy");
      document.body.removeChild(tempInput);
    } catch {
      copied = false;
    }
  }

  showCopyFeedback(copied ? "Copied!" : "Copy failed");
}

function showCopyFeedback(text) {
  if (!el.copyLeagueIdFeedback) return;
  el.copyLeagueIdFeedback.textContent = text;
  el.copyLeagueIdFeedback.classList.remove("hidden");

  clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = setTimeout(() => {
    el.copyLeagueIdFeedback.classList.add("hidden");
  }, 1500);
}

async function loadLeagueCoreData(leagueId) {
  const endpointPlan = [
    { key: "league", label: "league profile", path: `/league/${leagueId}` },
    { key: "users", label: "league managers", path: `/league/${leagueId}/users` },
    { key: "rosters", label: "league rosters", path: `/league/${leagueId}/rosters` },
    { key: "tradedPicks", label: "traded picks", path: `/league/${leagueId}/traded_picks`, optional: true },
  ];

  const tasks = endpointPlan.map(async (endpoint) => {
    setStatus(`Loading ${endpoint.label}...`, { loading: true });
    const payload = await apiGetWithRetry(endpoint.path, { timeoutMs: 12000, retries: 1 });
    return { key: endpoint.key, payload };
  });

  const settled = await Promise.allSettled(tasks);
  const byKey = {};
  const failures = [];

  settled.forEach((result, idx) => {
    const endpoint = endpointPlan[idx];
    if (result.status === "fulfilled") {
      byKey[result.value.key] = result.value.payload;
    } else if (!endpoint.optional) {
      failures.push(`${endpoint.label} (${result.reason?.message || "unknown error"})`);
    }
  });

  if (failures.length > 0) {
    throw new Error(`Failed to load: ${failures.join("; ")}`);
  }

  return {
    league: byKey.league,
    users: byKey.users,
    rosters: byKey.rosters,
    tradedPicks: Array.isArray(byKey.tradedPicks) ? byKey.tradedPicks : [],
  };
}

async function loadPreviousLeagueContext(league) {
  const previousLeagueId = league?.previous_league_id;
  if (!previousLeagueId) {
    return { league: null, users: [], rosters: [] };
  }

  try {
    setStatus("Loading previous league context for pick labels...", { loading: true });
    return await loadLeagueCoreData(previousLeagueId);
  } catch (err) {
    console.warn("Could not load previous league context", err);
    return { league: null, users: [], rosters: [] };
  }
}

async function loadPlayersWithCache() {
  const now = Date.now();
  const fromCache = getPlayersCache();
  let stateKey = null;

  try {
    const nflState = await apiGetWithRetry(`/state/nfl`, { timeoutMs: 8000, retries: 1 });
    stateKey = `${nflState?.season || "na"}-${nflState?.league_season || "na"}-${nflState?.week || "na"}`;
    if (fromCache?.players && fromCache?.stateKey === stateKey) return fromCache.players;
  } catch {
    if (fromCache && now - fromCache.savedAt < PLAYERS_CACHE_TTL_MS) {
      return fromCache.players;
    }
  }

  const players = await apiGet(`/players/nfl`, { timeoutMs: 30000 });
  savePlayersCache(players, now, stateKey);
  return players;
}

async function apiGetWithRetry(path, { timeoutMs = 25000, retries = 0 } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await apiGet(path, { timeoutMs });
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(250 * (attempt + 1));
      }
    }
  }
  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== "function") {
      setTimeout(resolve, 0);
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

function getPlayersCache() {
  try {
    const raw = localStorage.getItem(PLAYERS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.players || !parsed?.savedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePlayersCache(players, savedAt, stateKey = null) {
  try {
    localStorage.setItem(
      PLAYERS_CACHE_KEY,
      JSON.stringify({
        savedAt,
        stateKey,
        players,
      })
    );
  } catch {
    // Cache write failure is non-fatal (private mode/storage quota).
  }
}

function hydrateManagerSelector() {
  const selectedRosterId = Number(el.meSelect.value || state.meRosterId);
  el.meSelect.innerHTML = "";
  state.normalizedRosters
    .slice()
    .sort((a, b) => a.manager.displayName.localeCompare(b.manager.displayName))
    .forEach((roster) => {
      const option = document.createElement("option");
      option.value = String(roster.rosterId);
      option.textContent = roster.manager.displayName;
      el.meSelect.appendChild(option);
    });

  const preferredManager = AUTOSELECT_MANAGER_BY_LEAGUE[state.leagueId];
  const preferredRoster = preferredManager
    ? state.normalizedRosters.find((roster) => roster.manager.displayName === preferredManager)
    : null;
  const preservedRoster = state.normalizedRosters.find((roster) => roster.rosterId === selectedRosterId);

  if (!preservedRoster && preferredRoster) {
    state.meRosterId = preferredRoster.rosterId;
    el.meSelect.value = String(preferredRoster.rosterId);
  } else if (preservedRoster) {
    state.meRosterId = preservedRoster.rosterId;
    el.meSelect.value = String(preservedRoster.rosterId);
  } else if (state.normalizedRosters.length > 0) {
    state.meRosterId = state.normalizedRosters[0].rosterId;
    el.meSelect.value = String(state.normalizedRosters[0].rosterId);
  }
  pruneSelectedOutgoingAssets();
  renderPlayerSearch();
  renderOutgoingAssetSearch();
  renderSessionSnapshot();
}

function updateAssetTypeFilter(scope, key, checked) {
  invalidateResults();
  const filters = scope === "target" ? state.targetFilters : state.outgoingFilters;
  const otherKey = key === "players" ? "picks" : "players";

  if (!checked && !filters[otherKey]) {
    filters[key] = true;
  } else {
    filters[key] = checked;
  }

  syncAssetTypeToggles();
  if (scope === "target") {
    renderPlayerSearch();
    return;
  }
  pruneSelectedOutgoingAssetsByFilters();
  renderOutgoingAssetSearch();
}

function syncAssetTypeToggles() {
  if (el.targetPlayersToggle) el.targetPlayersToggle.checked = state.targetFilters.players;
  if (el.targetPicksToggle) el.targetPicksToggle.checked = state.targetFilters.picks;
  if (el.givePlayersToggle) el.givePlayersToggle.checked = state.outgoingFilters.players;
  if (el.givePicksToggle) el.givePicksToggle.checked = state.outgoingFilters.picks;
}

function getMyRoster() {
  if (!state.meRosterId) return null;
  const meRosterId = Number(el.meSelect.value || state.meRosterId);
  state.meRosterId = meRosterId;
  return state.normalizedRosters.find((roster) => roster.rosterId === meRosterId) || null;
}

function assetTypeAllowed(asset, filters) {
  return (asset.assetType === "player" && filters.players) || (asset.assetType === "pick" && filters.picks);
}

function assetMatchesQuery(asset, query) {
  if (!query) return true;
  const pickSeason = asset.raw?.season != null ? String(asset.raw.season) : "";
  const pickRound = asset.raw?.round != null ? `round ${asset.raw.round}` : "";
  const pickBucket = asset.assetType === "pick" ? formatPickBucketLabel(getAssetPickBucket(asset)) : "";
  const position = playerPositionForAsset(asset);
  const haystack = [asset.name, pickSeason, pickRound, pickBucket, position, asset.assetType].join(" ").toLowerCase();
  return haystack.includes(query);
}

function sortAssetsByValueDesc(a, b, values = state.values) {
  const valueDiff = getAssetValue(b, values) - getAssetValue(a, values);
  if (valueDiff !== 0) return valueDiff;
  if (a.assetType !== b.assetType) return a.assetType === "player" ? -1 : 1;
  return a.name.localeCompare(b.name);
}

function sortAssetPickerOptions(a, b, values = state.values) {
  if (a.assetType !== b.assetType) return a.assetType === "player" ? -1 : 1;
  return sortAssetsByValueDesc(a, b, values);
}

function renderPlayerSearch() {
  if (!state.meRosterId) return;
  const meRosterId = Number(el.meSelect.value || state.meRosterId);
  state.meRosterId = meRosterId;
  const query = el.playerSearch.value.trim().toLowerCase();

  if (
    state.targetAsset &&
    (state.targetAsset.managerRosterId === meRosterId || !assetTypeAllowed(state.targetAsset, state.targetFilters))
  ) {
    state.targetAsset = null;
    if (el.playerSearch) el.playerSearch.value = "";
  }

  syncTargetSearchUi();

  if (state.targetAsset && !query) {
    el.playerResults.classList.add("hidden");
    el.playerResults.innerHTML = "";
    return;
  }

  el.playerResults.classList.remove("hidden");

  const candidates = state.normalizedRosters
    .filter((roster) => roster.rosterId !== meRosterId)
    .flatMap((roster) =>
      roster.assets
        .filter((asset) => assetTypeAllowed(asset, state.targetFilters))
        .map((asset) => ({
          ...asset,
          managerName: roster.manager.displayName,
          managerRosterId: roster.rosterId,
        }))
    )
    .filter((asset) => assetMatchesQuery(asset, query))
    .sort((a, b) => sortAssetsByValueDesc(a, b, state.values))
    .slice(0, 150);

  el.playerResults.innerHTML = "";

  if (candidates.length === 0) {
    el.playerResults.innerHTML = `<div class="player-item muted">No matching players or picks found.</div>`;
    return;
  }

  for (const asset of candidates) {
    const row = document.createElement("div");
    row.className = "player-item";
    row.innerHTML = buildAssetPickerMarkup(asset, {
      values: state.values,
      contextLabel: asset.managerName,
    });
    row.addEventListener("click", () => {
      state.targetAsset = asset;
      el.playerSearch.value = "";
      el.resultsSection.classList.add("hidden");
      renderPlayerSearch();
    });
    el.playerResults.appendChild(row);
  }
}

function pruneSelectedOutgoingAssets() {
  const meRoster = getMyRoster();
  if (!meRoster) {
    state.selectedOutgoingAssetIds.clear();
    return;
  }

  const validAssetIds = new Set(meRoster.assets.map((asset) => asset.assetId));
  state.selectedOutgoingAssetIds = new Set(
    [...state.selectedOutgoingAssetIds].filter(
      (assetId) => validAssetIds.has(assetId) && !state.excludedOutgoingAssetIds.has(assetId)
    )
  );
}

function pruneExcludedOutgoingAssets() {
  const meRoster = getMyRoster();
  if (!meRoster) {
    state.excludedOutgoingAssetIds.clear();
    return;
  }

  const validAssetIds = new Set(meRoster.assets.map((asset) => asset.assetId));
  state.excludedOutgoingAssetIds = new Set(
    [...state.excludedOutgoingAssetIds].filter((assetId) => validAssetIds.has(assetId))
  );
}

function pruneSelectedOutgoingAssetsByFilters() {
  const meRoster = getMyRoster();
  if (!meRoster) return;

  const allowedAssetIds = new Set(
    meRoster.assets
      .filter((asset) => assetTypeAllowed(asset, state.outgoingFilters))
      .map((asset) => asset.assetId)
  );
  state.selectedOutgoingAssetIds = new Set(
    [...state.selectedOutgoingAssetIds].filter((assetId) => allowedAssetIds.has(assetId))
  );
}

function handleIncludeToggleChange() {
  invalidateResults();
  if (!el.includeAssetsToggle?.checked) {
    state.selectedOutgoingAssetIds.clear();
    if (el.includeAssetSearch) el.includeAssetSearch.value = "";
    if (el.includeAssetsDetails) el.includeAssetsDetails.open = false;
  }
  renderOutgoingAssetSearch();
}

function handleExcludeToggleChange() {
  invalidateResults();
  if (!el.excludeAssetsToggle?.checked) {
    state.excludedOutgoingAssetIds.clear();
    if (el.excludeAssetSearch) el.excludeAssetSearch.value = "";
    if (el.excludeAssetsDetails) el.excludeAssetsDetails.open = false;
  }
  renderOutgoingAssetSearch();
}

function addExcludedOutgoingAsset(assetId) {
  invalidateResults();
  state.selectedOutgoingAssetIds.delete(assetId);
  state.excludedOutgoingAssetIds.add(assetId);
  renderOutgoingAssetSearch();
}

function removeExcludedOutgoingAsset(assetId) {
  invalidateResults();
  state.excludedOutgoingAssetIds.delete(assetId);
  renderOutgoingAssetSearch();
}

function clearExcludedOutgoingAssets() {
  invalidateResults();
  state.excludedOutgoingAssetIds.clear();
  renderOutgoingAssetSearch();
}

function getVisibleOutgoingAssets() {
  const meRoster = getMyRoster();
  if (!meRoster) return [];

  const query = el.includeAssetSearch?.value.trim().toLowerCase() || "";
  return meRoster.assets
    .filter((asset) => assetTypeAllowed(asset, state.outgoingFilters))
    .filter((asset) => !state.excludedOutgoingAssetIds.has(asset.assetId))
    .filter((asset) => assetMatchesQuery(asset, query))
    .sort((a, b) => sortAssetPickerOptions(a, b, state.values))
    .slice(0, 150);
}

function getVisibleExcludedOutgoingAssets() {
  const meRoster = getMyRoster();
  if (!meRoster) return [];

  const query = el.excludeAssetSearch?.value.trim().toLowerCase() || "";
  return meRoster.assets
    .filter((asset) => assetTypeAllowed(asset, state.outgoingFilters))
    .filter((asset) => assetMatchesQuery(asset, query))
    .sort((a, b) => sortAssetPickerOptions(a, b, state.values))
    .slice(0, 150);
}

function clearSelectedOutgoingAssets() {
  invalidateResults();
  state.selectedOutgoingAssetIds.clear();
  renderOutgoingAssetSearch();
}

function toggleOutgoingAsset(assetId) {
  invalidateResults();
  state.excludedOutgoingAssetIds.delete(assetId);
  if (state.selectedOutgoingAssetIds.has(assetId)) {
    state.selectedOutgoingAssetIds.delete(assetId);
  } else {
    state.selectedOutgoingAssetIds.add(assetId);
  }
  renderOutgoingAssetSearch();
}

function toggleExcludedOutgoingAsset(assetId) {
  invalidateResults();
  state.selectedOutgoingAssetIds.delete(assetId);
  if (state.excludedOutgoingAssetIds.has(assetId)) {
    state.excludedOutgoingAssetIds.delete(assetId);
  } else {
    state.excludedOutgoingAssetIds.add(assetId);
  }
  renderOutgoingAssetSearch();
}

function renderOutgoingAssetSearch() {
  if (!el.myAssetResults || !el.excludeAssetResults) return;
  const meRoster = getMyRoster();
  syncBuilderPanels();
  renderSelectedOutgoingAssets(meRoster);
  renderExcludedOutgoingAssets(meRoster);
  updateSelectedAssetsSummary();
  updateExcludedAssetsSummary();

  if (!meRoster) {
    el.myAssetResults.innerHTML = `<div class="player-item muted">Choose your team first.</div>`;
    el.excludeAssetResults.innerHTML = `<div class="player-item muted">Choose your team first.</div>`;
    return;
  }

  renderIncludedAssetPicker();
  renderExcludedAssetPicker();
}

function syncBuilderPanels() {
  const includeEnabled = Boolean(el.includeAssetsToggle?.checked);
  const excludeEnabled = Boolean(el.excludeAssetsToggle?.checked);

  el.includeAssetsPanel?.classList.toggle("hidden", !includeEnabled);
  el.excludeAssetsPanel?.classList.toggle("hidden", !excludeEnabled);
}

function renderIncludedAssetPicker() {
  const visibleAssets = getVisibleOutgoingAssets();
  el.myAssetResults.innerHTML = "";

  if (visibleAssets.length === 0) {
    const emptyState = state.excludedOutgoingAssetIds.size > 0
      ? "No matching assets found outside your excluded list."
      : "No matching assets found on your roster.";
    el.myAssetResults.innerHTML = `<div class="player-item muted">${emptyState}</div>`;
    return;
  }

  for (const asset of visibleAssets) {
    const row = document.createElement("div");
    const selected = state.selectedOutgoingAssetIds.has(asset.assetId);
    row.className = `player-item ${selected ? "selected" : ""}`;
    row.innerHTML = buildAssetPickerMarkup(asset, {
      values: state.values,
      contextLabel: selected ? "Included" : "",
    });
    row.addEventListener("click", () => toggleOutgoingAsset(asset.assetId));
    el.myAssetResults.appendChild(row);
  }
}

function renderExcludedAssetPicker() {
  const visibleAssets = getVisibleExcludedOutgoingAssets();
  el.excludeAssetResults.innerHTML = "";

  if (visibleAssets.length === 0) {
    el.excludeAssetResults.innerHTML = `<div class="player-item muted">No matching assets found on your roster.</div>`;
    return;
  }

  for (const asset of visibleAssets) {
    const row = document.createElement("div");
    const selected = state.excludedOutgoingAssetIds.has(asset.assetId);
    row.className = `player-item ${selected ? "selected" : ""}`;
    row.innerHTML = buildAssetPickerMarkup(asset, {
      values: state.values,
      contextLabel: selected ? "Excluded" : "",
    });
    row.addEventListener("click", () => toggleExcludedOutgoingAsset(asset.assetId));
    el.excludeAssetResults.appendChild(row);
  }
}

function renderSelectedOutgoingAssets(meRoster = getMyRoster()) {
  if (!el.selectedAssetsList) return;

  el.selectedAssetsList.innerHTML = "";

  if (!meRoster) {
    el.selectedAssetsList.innerHTML = `<p class="muted small">Choose your team first.</p>`;
    return;
  }

  const includedAssets = meRoster.assets
    .filter((asset) => state.selectedOutgoingAssetIds.has(asset.assetId))
    .sort((a, b) => sortAssetsByValueDesc(a, b, state.values));

  if (includedAssets.length === 0) {
    el.selectedAssetsList.innerHTML = `<p class="muted small">No included assets selected yet.</p>`;
    return;
  }

  const chipRow = document.createElement("div");
  chipRow.className = "selection-chip-row";

  for (const asset of includedAssets) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "selection-chip";
    chip.innerHTML = `
      <span class="selection-chip-label">${asset.name}</span>
      <span class="selection-chip-action">Remove</span>
    `;
    chip.addEventListener("click", () => toggleOutgoingAsset(asset.assetId));
    chipRow.appendChild(chip);
  }

  el.selectedAssetsList.appendChild(chipRow);
}

function renderExcludedOutgoingAssets(meRoster = getMyRoster()) {
  if (!el.excludedAssetsList) return;

  el.excludedAssetsList.innerHTML = "";

  if (!meRoster) {
    el.excludedAssetsList.innerHTML = `<p class="muted small">Choose your team first.</p>`;
    return;
  }

  const protectedAssets = meRoster.assets
    .filter((asset) => state.excludedOutgoingAssetIds.has(asset.assetId))
    .sort((a, b) => sortAssetsByValueDesc(a, b, state.values));

  if (protectedAssets.length === 0) {
    el.excludedAssetsList.innerHTML = `<p class="muted small">No excluded assets selected yet.</p>`;
    return;
  }

  const chipRow = document.createElement("div");
  chipRow.className = "selection-chip-row";

  for (const asset of protectedAssets) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "selection-chip";
    chip.innerHTML = `
      <span class="selection-chip-label">${asset.name}</span>
      <span class="selection-chip-action">Remove</span>
    `;
    chip.addEventListener("click", () => removeExcludedOutgoingAsset(asset.assetId));
    chipRow.appendChild(chip);
  }

  el.excludedAssetsList.appendChild(chipRow);
}

function updateSelectedAssetsSummary() {
  if (!el.selectedAssetsSummary) return;

  const count = state.selectedOutgoingAssetIds.size;
  const includeEnabled = Boolean(el.includeAssetsToggle?.checked);
  el.selectedAssetsSummary.textContent = !includeEnabled
    ? "Leave this off unless you want to force the generator to use exact assets."
    : count > 0
      ? `The generator will only use these ${count} selected asset${count === 1 ? "" : "s"}.`
      : "Turn this on only if you want to force exact assets into every offer.";
  if (el.includeAssetsSummaryLabel) {
    el.includeAssetsSummaryLabel.textContent = count > 0
      ? `${count} asset${count === 1 ? "" : "s"} selected`
      : "Select players or picks";
  }
  renderSessionSnapshot();
}

function updateExcludedAssetsSummary() {
  if (!el.excludedAssetsSummary) return;

  const count = state.excludedOutgoingAssetIds.size;
  const excludeEnabled = Boolean(el.excludeAssetsToggle?.checked);
  el.excludedAssetsSummary.textContent = !excludeEnabled
    ? "Leave this off unless you want to keep specific assets out of every offer."
    : count > 0
      ? `${count} asset${count === 1 ? "" : "s"} will stay out of every generated idea.`
      : "Choose any players or picks you do not want to move.";
  if (el.excludeAssetsSummaryLabel) {
    el.excludeAssetsSummaryLabel.textContent = count > 0
      ? `${count} asset${count === 1 ? "" : "s"} excluded`
      : "Select players or picks";
  }
  renderSessionSnapshot();
}

function buildAssetSelectLabel(asset) {
  const details = [];
  if (asset.assetType === "player") {
    const position = formatPlayerPositionLabel(asset);
    if (position) details.push(position);
    if (asset.raw?.team) details.push(asset.raw.team);
  }
  if (asset.assetType === "pick") {
    if (asset.raw?.season) details.push(String(asset.raw.season));
    if (asset.raw?.round) details.push(`R${asset.raw.round}`);
  }
  return details.length > 0 ? `${asset.name} - ${details.join(" - ")}` : asset.name;
}

function buildAssetPickerMarkup(asset, { values, contextLabel } = {}) {
  const pills = [];
  pills.push(`<span class="asset-pill ${asset.assetType === "pick" ? "gold" : ""}">${asset.assetType === "pick" ? "Pick" : formatPlayerPositionLabel(asset)}</span>`);

  if (asset.assetType === "player" && asset.raw?.age) {
    pills.push(`<span class="asset-pill">${asset.raw.age} yrs</span>`);
  }

  if (asset.assetType === "pick") {
    const pickBucket = getAssetPickBucket(asset);
    if (Number(asset.raw?.round) === 1 && pickBucket !== "any") {
      pills.push(`<span class="asset-pill gold">${formatPickBucketLabel(pickBucket)}</span>`);
    }
    if (asset.raw?.season) pills.push(`<span class="asset-pill">${asset.raw.season}</span>`);
    if (asset.raw?.round) pills.push(`<span class="asset-pill">R${asset.raw.round}</span>`);
  }

  return `
    <div class="asset-row-top">
      <div class="asset-name-stack">
        <strong>${asset.name}</strong>
        <div class="asset-meta">
          ${pills.join("")}
          ${contextLabel ? `<span class="asset-context">${contextLabel}</span>` : ""}
        </div>
      </div>
      <span class="asset-value-badge">${formatNumber(getAssetValue(asset, values))}</span>
    </div>
  `;
}

async function generateTradeIdeas() {
  if (!state.meRosterId) {
    alert("Load a league first.");
    return;
  }
  if (!state.targetAsset) {
    alert("Select a target asset first.");
    return;
  }

  const meRoster = getMyRoster();
  const theirRoster = state.normalizedRosters.find((roster) => roster.rosterId === state.targetAsset.managerRosterId);
  if (!meRoster || !theirRoster) {
    alert("Could not resolve rosters.");
    return;
  }
  if (el.includeAssetsToggle?.checked && state.selectedOutgoingAssetIds.size === 0) {
    alert("Choose at least one player or pick to throw in, or turn that option off.");
    return;
  }

  const fairnessPct = DEFAULT_FAIRNESS_PCT;
  const maxResults = clamp(Number(el.maxResultsInput?.value || 3), 1, 6);
  const tradeLab = getTradeLabSettings();

  try {
    setButtonLoading(el.generateBtn, true, "Building trade ideas...");
    await ensureValuesLoaded("");
    await waitForNextPaint();
    const tradeSearchContext = buildTradeSearchContext({
      myRoster: meRoster,
      targetAsset: state.targetAsset,
      values: state.values,
      fairnessPct,
      tradeLab,
    });

    const directIdeas = suggestTrades({
      myRoster: meRoster,
      theirRoster,
      targetAsset: state.targetAsset,
      values: state.values,
      fairnessPct,
      maxResults,
      allowExtraTargetAssets: false,
      requireExtraTargetAsset: false,
      tradeLab,
      searchContext: tradeSearchContext,
    });
    const throwInIdeas = suggestTrades({
      myRoster: meRoster,
      theirRoster,
      targetAsset: state.targetAsset,
      values: state.values,
      fairnessPct,
      maxResults,
      allowExtraTargetAssets: true,
      requireExtraTargetAsset: true,
      tradeLab,
      searchContext: tradeSearchContext,
    });
    const totalIdeaCount = directIdeas.length + throwInIdeas.length;

    el.resultsSection.classList.remove("hidden");
    el.resultsSubtitle.textContent = buildResultsSubtitle({
      meRoster,
      theirRoster,
      targetAsset: state.targetAsset,
      tradeLab,
    });

    if (totalIdeaCount === 0) {
      el.resultsList.innerHTML = `<p class="muted">${buildNoIdeasMessage(tradeLab)}</p>`;
      el.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    await waitForNextPaint();
    const leagueStrengthBaseline = buildLeagueStrengthBaseline({
      league: state.league,
      rosters: state.normalizedRosters,
      values: state.values,
    });
    const enrichedDirectIdeas = directIdeas.map((idea) => enrichTradeIdea({
      idea,
      myRoster: meRoster,
      theirRoster,
      values: state.values,
      leagueStrengthBaseline,
    }));
    const enrichedThrowInIdeas = throwInIdeas.map((idea) => enrichTradeIdea({
      idea,
      myRoster: meRoster,
      theirRoster,
      values: state.values,
      leagueStrengthBaseline,
    }));

    el.resultsList.innerHTML = [
      renderTradeIdeaGroup({
        title: "Direct offers",
        subtitle: `Offers for ${state.targetAsset.name} only.`,
        emptyText: "No direct offers fit the current filters.",
        ideas: enrichedDirectIdeas,
        values: state.values,
      }),
      renderTradeIdeaGroup({
        title: "Offers with a small add-on",
        subtitle: `${state.targetAsset.name} plus one smaller piece from their side.`,
        emptyText: "No add-on variations fit the current setup.",
        ideas: enrichedThrowInIdeas,
        values: state.values,
      }),
    ].join("");
    el.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    alert(`Could not load valuation source. ${err.message}`);
  } finally {
    setButtonLoading(el.generateBtn, false);
  }
}

function enrichTradeIdea({ idea, myRoster, theirRoster, values, leagueStrengthBaseline }) {
  return {
    ...idea,
    closestEvenPick: findClosestValuationPick(
      idea.evenValue,
      values,
      state.valueNameMap
    ),
    impactAnalysis: buildTradeImpactAnalysis({
      baseline: leagueStrengthBaseline,
      league: state.league,
      rosters: state.normalizedRosters,
      myRoster,
      theirRoster,
      myAssets: idea.myAssets,
      theirAssets: idea.theirAssets,
      values,
    }),
  };
}

function getTradeLabSettings() {
  return {
    allowPlayers: true,
    allowPicks: true,
    selectedOutgoingAssetIds: new Set(state.selectedOutgoingAssetIds),
    excludedOutgoingAssetIds: new Set(state.excludedOutgoingAssetIds),
    positionPremium: el.positionPremiumSelect?.value || "none",
    tradeVibe: el.tradeVibeSelect?.value || "balanced",
    teamState: el.teamStateSelect?.value || "middle",
  };
}

function buildResultsSubtitle({ meRoster, theirRoster, targetAsset, tradeLab }) {
  const notes = [];
  notes.push(`${getTeamStateLabel(tradeLab.teamState)} lens`);
  if (tradeLab.positionPremium !== "none") notes.push(`${tradeLab.positionPremium} premium`);
  if (tradeLab.selectedOutgoingAssetIds.size > 0) {
    notes.push(`${tradeLab.selectedOutgoingAssetIds.size} included`);
  }
  if (tradeLab.excludedOutgoingAssetIds.size > 0) {
    notes.push(`${tradeLab.excludedOutgoingAssetIds.size} protected`);
  }
  return `${meRoster.manager.displayName} targeting ${targetAsset.name} from ${theirRoster.manager.displayName} • ${notes.join(" • ")}`;
}

function buildNoIdeasMessage(tradeLab) {
  const advice = [];
  if (tradeLab.selectedOutgoingAssetIds.size > 0) advice.push("broaden the included asset pool");
  if (tradeLab.excludedOutgoingAssetIds.size > 0) advice.push("exclude fewer assets");
  advice.push("change the target");
  advice.push("adjust the team direction");
  return `No offers cleared the value and roster-fit filters. Try to ${advice.join(", ")}.`;
}

function renderTradeIdeaGroup({ title, subtitle, emptyText, ideas, values }) {
  return `
    <section class="idea-group">
      <div class="idea-group-heading">
        <h3>${title}</h3>
        <p class="muted small">${subtitle}</p>
      </div>
      ${
        ideas.length > 0
          ? ideas.map((idea, idx) => renderTradeCard(idea, idx, values)).join("")
          : `<p class="muted small idea-group-empty">${emptyText}</p>`
      }
    </section>
  `;
}

function renderTradeCard(idea, index, values) {
  const evenValueLabel = formatEvenValueDisplay(idea);
  const isInitiallyOpen = index === 0;
  return `
    <details class="trade-card" ${isInitiallyOpen ? "open" : ""}>
      <summary class="trade-card-summary">
        <div>
          <h3>Idea ${index + 1}</h3>
          <p class="trade-card-preview">
            ${idea.myAssets.length} send • ${idea.theirAssets.length} receive • even-up ${evenValueLabel}
          </p>
        </div>
        <span class="trade-card-toggle" aria-hidden="true"></span>
      </summary>
      <div class="trade-card-body">
        <div class="trade-body-grid">
          <section class="trade-side team-a">
            <div class="trade-side-heading">
              <span class="trade-side-kicker">Outgoing</span>
              <h4>You send</h4>
            </div>
            ${renderAssetList(idea.myAssets, values, "team-a")}
          </section>
          <section class="trade-side team-b">
            <div class="trade-side-heading">
              <span class="trade-side-kicker">Incoming</span>
              <h4>You receive</h4>
            </div>
            ${renderAssetList(idea.theirAssets, values, "team-b")}
          </section>
        </div>
        <div class="trade-metrics">
          <div class="trade-metric">
            <strong>KTC balance</strong>
            you ${formatNumber(idea.myAdjustedValue)} vs them ${formatNumber(idea.theirAdjustedValue)} (${idea.pctDiff}% diff)
          </div>
          <div class="trade-metric">
            <strong>Market fit</strong>
            you ${formatNumber(idea.marketMyValue)} vs them ${formatNumber(idea.marketTheirValue)} (${idea.marketDelta >= 0 ? "+" : ""}${formatNumber(idea.marketDelta)})
          </div>
          <div class="trade-metric">
            <strong>Package adjustment</strong>
            ${formatPackageAdjustment(idea)}
          </div>
          <div class="trade-metric">
            <strong>Even-up value</strong>
            ${evenValueLabel}
          </div>
        </div>
        ${idea.impactAnalysis ? renderImpactAnalysis(idea.impactAnalysis, values) : ""}
      </div>
    </details>
  `;
}

function formatEvenValueDisplay(idea) {
  if (!idea.closestEvenPick) return formatNumber(idea.evenValue);
  return `${idea.closestEvenPick.name} (${formatNumber(idea.closestEvenPick.value)})`;
}

function renderImpactAnalysis(impactAnalysis, values) {
  return `
    <div class="impact-overview">
      ${renderImpactCard(impactAnalysis.mySide, "team-a")}
      ${renderImpactCard(impactAnalysis.theirSide, "team-b")}
    </div>
    <p class="muted small">${impactAnalysis.overallSummary}</p>
    <details class="lineup-details">
      <summary>View lineup impact</summary>
      <div class="lineup-details-body">
        <div class="lineup-comparison-grid">
          ${renderLineupStateCard("You After", impactAnalysis.mySide.after, values, "team-a")}
          ${renderLineupStateCard("Them After", impactAnalysis.theirSide.after, values, "team-b")}
          ${renderLineupStateCard("You Before", impactAnalysis.mySide.before, values, "team-a")}
          ${renderLineupStateCard("Them Before", impactAnalysis.theirSide.before, values, "team-b")}
        </div>
      </div>
    </details>
  `;
}

function renderImpactCard(side, teamClass = "") {
  return `
    <section class="impact-card ${teamClass}">
      <h4>${side.title}</h4>
      <span class="impact-verdict ${side.verdictClass}">${side.verdictLabel}</span>
      <p class="impact-summary">${side.summary}</p>
      <div class="impact-metric-list">
        <div class="impact-metric-row">
          <strong>Starter rank</strong>
          <span>${formatStarterRank(side.before.rank, side.before.totalTeams)} to ${formatStarterRank(side.after.rank, side.after.totalTeams)}</span>
        </div>
        <div class="impact-metric-row">
          <strong>Starter value</strong>
          <span>${formatDeltaPair(side.before.starterValue, side.after.starterValue)}</span>
        </div>
        <div class="impact-metric-row">
          <strong>Bench value</strong>
          <span>${formatDeltaPair(side.before.benchValue, side.after.benchValue)}</span>
        </div>
        <div class="impact-metric-row">
          <strong>Total roster value</strong>
          <span>${formatDeltaPair(side.before.totalValue, side.after.totalValue)}</span>
        </div>
      </div>
    </section>
  `;
}

function renderLineupStateCard(label, snapshot, values, teamClass = "") {
  return `
    <section class="lineup-state ${teamClass}">
      <h5>${label}</h5>
      <p>${formatStarterRank(snapshot.rank, snapshot.totalTeams)} lineup • ${formatNumber(snapshot.starterValue)} starters • ${formatNumber(snapshot.benchValue)} bench</p>
      <ul class="lineup-slot-list">
        ${snapshot.lineup
          .map((slotEntry) => `
            <li class="lineup-slot-item">
              <span class="lineup-slot-label">${formatRosterSlotLabel(slotEntry.slot)}</span>
              <span class="lineup-slot-player">${slotEntry.asset ? slotEntry.asset.name : "Open spot"}</span>
              <span class="lineup-slot-value">${slotEntry.asset ? formatNumber(getAssetValue(slotEntry.asset, values)) : "0"}</span>
            </li>
          `)
          .join("")}
      </ul>
      <p class="muted small">Bench headliners</p>
      <ul class="bench-list">
        ${snapshot.benchHighlights.length > 0
          ? snapshot.benchHighlights
            .map((asset) => `
              <li class="bench-item">
                <span class="lineup-slot-player">${asset.name}</span>
                <span class="lineup-slot-value">${formatNumber(getAssetValue(asset, values))}</span>
              </li>
            `)
            .join("")
          : `<li class="bench-item"><span class="lineup-slot-player muted">No bench players</span><span class="lineup-slot-value">0</span></li>`}
      </ul>
    </section>
  `;
}

function formatDeltaPair(before, after) {
  const delta = after - before;
  return `${formatNumber(before)} to ${formatNumber(after)} (${delta >= 0 ? "+" : ""}${formatNumber(delta)})`;
}

function buildLeagueStrengthBaseline({ league, rosters, values }) {
  const metricsByRosterId = new Map();
  rosters.forEach((roster) => {
    metricsByRosterId.set(roster.rosterId, evaluateRosterStrength(roster, values, league));
  });

  return {
    metricsByRosterId,
    ranks: rankRosterMetrics(metricsByRosterId),
  };
}

function buildTradeImpactAnalysis({ baseline, league, rosters, myRoster, theirRoster, myAssets, theirAssets, values }) {
  const totalTeams = rosters.length || state.normalizedRosters.length || 0;
  const myBeforeMetrics = baseline.metricsByRosterId.get(myRoster.rosterId);
  const theirBeforeMetrics = baseline.metricsByRosterId.get(theirRoster.rosterId);
  const myAfterRoster = buildRosterAfterTrade(myRoster, theirAssets, myAssets);
  const theirAfterRoster = buildRosterAfterTrade(theirRoster, myAssets, theirAssets);
  const myAfterMetrics = evaluateRosterStrength(myAfterRoster, values, league);
  const theirAfterMetrics = evaluateRosterStrength(theirAfterRoster, values, league);

  const afterMetricsByRosterId = new Map(baseline.metricsByRosterId);
  afterMetricsByRosterId.set(myRoster.rosterId, myAfterMetrics);
  afterMetricsByRosterId.set(theirRoster.rosterId, theirAfterMetrics);

  const afterRanks = rankRosterMetrics(afterMetricsByRosterId);
  const mySide = buildTradeImpactSide({
    title: "You",
    managerName: myRoster.manager.displayName,
    beforeMetrics: myBeforeMetrics,
    afterMetrics: myAfterMetrics,
    beforeRank: baseline.ranks.get(myRoster.rosterId) || state.normalizedRosters.length,
    afterRank: afterRanks.get(myRoster.rosterId) || state.normalizedRosters.length,
    totalTeams,
  });
  const theirSide = buildTradeImpactSide({
    title: "Them",
    managerName: theirRoster.manager.displayName,
    beforeMetrics: theirBeforeMetrics,
    afterMetrics: theirAfterMetrics,
    beforeRank: baseline.ranks.get(theirRoster.rosterId) || state.normalizedRosters.length,
    afterRank: afterRanks.get(theirRoster.rosterId) || state.normalizedRosters.length,
    totalTeams,
  });

  return {
    mySide,
    theirSide,
    overallSummary: buildOverallTradeImpactSummary(mySide, theirSide),
  };
}

function buildTradeImpactSide({ title, managerName, beforeMetrics, afterMetrics, beforeRank, afterRank, totalTeams }) {
  const starterDelta = afterMetrics.starterValue - beforeMetrics.starterValue;
  const benchDelta = afterMetrics.benchValue - beforeMetrics.benchValue;
  const totalDelta = afterMetrics.totalValue - beforeMetrics.totalValue;
  const verdict = classifyTradeImpact({ starterDelta, beforeRank, afterRank, totalDelta });

  return {
    title,
    managerName,
    verdictLabel: verdict.label,
    verdictClass: verdict.className,
    summary: buildTradeImpactSummary({ beforeRank, afterRank, starterDelta, benchDelta, totalDelta }),
    detailSummary: `${managerName} • ${formatStarterRank(beforeRank, totalTeams)} to ${formatStarterRank(afterRank, totalTeams)} starting lineup`,
    before: {
      ...beforeMetrics,
      rank: beforeRank,
      totalTeams,
    },
    after: {
      ...afterMetrics,
      rank: afterRank,
      totalTeams,
    },
  };
}

function formatStarterRank(rank, totalTeams) {
  if (!Number.isFinite(rank)) return "";
  if (!Number.isFinite(totalTeams) || totalTeams <= 0) return ordinal(rank);
  return `${ordinal(rank)}/${totalTeams}`;
}

function classifyTradeImpact({ starterDelta, beforeRank, afterRank, totalDelta }) {
  if (afterRank < beforeRank || starterDelta >= 350) {
    return { label: "Better weekly lineup", className: "good" };
  }
  if (afterRank > beforeRank || starterDelta <= -350) {
    return { label: "Worse weekly lineup", className: "bad" };
  }
  if (totalDelta >= 350) {
    return { label: "More total value", className: "good" };
  }
  if (totalDelta <= -350) {
    return { label: "Paying a premium", className: "bad" };
  }
  return { label: "Mostly neutral", className: "" };
}

function buildTradeImpactSummary({ beforeRank, afterRank, starterDelta, benchDelta, totalDelta }) {
  const notes = [];

  if (afterRank < beforeRank) {
    notes.push(`starting lineup climbs from ${ordinal(beforeRank)} to ${ordinal(afterRank)}`);
  } else if (afterRank > beforeRank) {
    notes.push(`starting lineup falls from ${ordinal(beforeRank)} to ${ordinal(afterRank)}`);
  } else {
    notes.push(`starting lineup stays ${ordinal(afterRank)}`);
  }

  notes.push(buildDeltaPhrase("starters", starterDelta));
  notes.push(buildDeltaPhrase("bench", benchDelta));
  notes.push(buildDeltaPhrase("total value", totalDelta));

  return `${notes.slice(0, 3).join(", ")}.`;
}

function buildDeltaPhrase(label, delta) {
  if (delta === 0) return `${label} flat`;
  return `${label} ${delta > 0 ? "up" : "down"} ${formatNumber(Math.abs(delta))}`;
}

function buildOverallTradeImpactSummary(mySide, theirSide) {
  const myImproved = mySide.after.rank < mySide.before.rank || mySide.after.starterValue > mySide.before.starterValue;
  const theirImproved = theirSide.after.rank < theirSide.before.rank || theirSide.after.starterValue > theirSide.before.starterValue;

  if (myImproved && !theirImproved) {
    return `This trade improves your weekly lineup while making theirs weaker or thinner.`;
  }
  if (!myImproved && theirImproved) {
    return `This trade helps their weekly lineup more than yours, even if the value stays close.`;
  }
  if (myImproved && theirImproved) {
    return `This trade improves both starting lineups, so the deal is more about which team values the target archetype most.`;
  }
  return `This trade looks more like a value shuffle than a weekly-lineup upgrade for either side.`;
}

function buildRosterAfterTrade(roster, incomingAssets, outgoingAssets) {
  const outgoingIds = new Set(outgoingAssets.map((asset) => asset.assetId));
  return {
    ...roster,
    assets: [
      ...roster.assets.filter((asset) => !outgoingIds.has(asset.assetId)),
      ...incomingAssets,
    ],
  };
}

function evaluateRosterStrength(roster, values, league) {
  const starterSlots = getStarterRosterSlots(league);
  const lineupResult = buildOptimalStartingLineup(roster.assets, starterSlots, values);

  return {
    lineup: lineupResult.starters,
    starterValue: lineupResult.starterValue,
    benchValue: lineupResult.benchValue,
    benchHighlights: lineupResult.benchAssets.slice(0, 5),
    totalValue: Math.round(roster.assets.reduce((sum, asset) => sum + getAssetValue(asset, values), 0)),
  };
}

function rankRosterMetrics(metricsByRosterId) {
  const ranked = [...metricsByRosterId.entries()].sort((left, right) => {
    const strengthComparison = compareRosterStrength(left[1], right[1]);
    if (strengthComparison !== 0) return strengthComparison;
    return Number(left[0]) - Number(right[0]);
  });

  return ranked.reduce((acc, [rosterId], index) => {
    acc.set(rosterId, index + 1);
    return acc;
  }, new Map());
}

function compareRosterStrength(left, right) {
  if (right.starterValue !== left.starterValue) return right.starterValue - left.starterValue;
  if (right.benchValue !== left.benchValue) return right.benchValue - left.benchValue;
  return right.totalValue - left.totalValue;
}

function buildOptimalStartingLineup(assets, starterSlots, values) {
  const playerEntries = assets
    .filter((asset) => asset.assetType === "player")
    .map((asset) => ({ asset, value: getAssetValue(asset, values) }))
    .sort((a, b) => b.value - a.value);

  const candidates = buildLineupCandidatePool(playerEntries, starterSlots);
  const slotEntries = starterSlots
    .map((slot, index) => ({ slot, index }))
    .sort((left, right) => {
      const eligibleDiff = countEligibleCandidates(candidates, left.slot) - countEligibleCandidates(candidates, right.slot);
      if (eligibleDiff !== 0) return eligibleDiff;
      return getSlotFlexWeight(left.slot) - getSlotFlexWeight(right.slot);
    });

  const bestPlan = shouldUseExactLineupSolver(slotEntries, candidates)
    ? chooseBestLineup(slotEntries, candidates, 0, 0n, new Map())
    : chooseGreedyLineup(slotEntries, candidates);
  const starters = bestPlan.picks
    .map((candidateIndex, slotIndex) => ({
      slot: slotEntries[slotIndex].slot,
      originalIndex: slotEntries[slotIndex].index,
      asset: candidateIndex == null ? null : candidates[candidateIndex].asset,
    }))
    .sort((left, right) => left.originalIndex - right.originalIndex)
    .map(({ slot, asset }) => ({ slot, asset }));

  const starterIds = new Set(starters.filter((entry) => entry.asset).map((entry) => entry.asset.assetId));
  const benchAssets = playerEntries
    .filter((entry) => !starterIds.has(entry.asset.assetId))
    .map((entry) => entry.asset);

  return {
    starters,
    starterValue: Math.round(starters.reduce((sum, entry) => sum + (entry.asset ? getAssetValue(entry.asset, values) : 0), 0)),
    benchAssets,
    benchValue: Math.round(benchAssets.reduce((sum, asset) => sum + getAssetValue(asset, values), 0)),
  };
}

function shouldUseExactLineupSolver(slotEntries, candidates) {
  return slotEntries.length <= LINEUP_EXACT_SOLVER_SLOT_LIMIT
    && candidates.length <= LINEUP_EXACT_SOLVER_CANDIDATE_LIMIT;
}

function chooseBestLineup(slotEntries, candidates, slotIndex, usedMask, memo) {
  const memoKey = `${slotIndex}:${usedMask.toString()}`;
  if (memo.has(memoKey)) return memo.get(memoKey);
  if (slotIndex >= slotEntries.length) {
    const emptyResult = { score: 0, picks: [] };
    memo.set(memoKey, emptyResult);
    return emptyResult;
  }

  let bestResult = {
    score: Number.NEGATIVE_INFINITY,
    picks: [],
  };
  const slot = slotEntries[slotIndex].slot;

  for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
    const candidateBit = 1n << BigInt(candidateIndex);
    if ((usedMask & candidateBit) !== 0n) continue;
    if (!assetCanFillRosterSlot(candidates[candidateIndex].asset, slot)) continue;

    const child = chooseBestLineup(slotEntries, candidates, slotIndex + 1, usedMask | candidateBit, memo);
    const totalScore = candidates[candidateIndex].value + child.score;
    if (totalScore > bestResult.score) {
      bestResult = {
        score: totalScore,
        picks: [candidateIndex, ...child.picks],
      };
    }
  }

  const skipChild = chooseBestLineup(slotEntries, candidates, slotIndex + 1, usedMask, memo);
  if (skipChild.score > bestResult.score) {
    bestResult = {
      score: skipChild.score,
      picks: [null, ...skipChild.picks],
    };
  }

  memo.set(memoKey, bestResult);
  return bestResult;
}

function chooseGreedyLineup(slotEntries, candidates) {
  const usedCandidateIndexes = new Set();
  const picks = [];
  let score = 0;

  for (const slotEntry of slotEntries) {
    let bestCandidateIndex = null;
    for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
      if (usedCandidateIndexes.has(candidateIndex)) continue;
      if (!assetCanFillRosterSlot(candidates[candidateIndex].asset, slotEntry.slot)) continue;
      if (bestCandidateIndex == null || candidates[candidateIndex].value > candidates[bestCandidateIndex].value) {
        bestCandidateIndex = candidateIndex;
      }
    }

    if (bestCandidateIndex == null) {
      picks.push(null);
      continue;
    }

    usedCandidateIndexes.add(bestCandidateIndex);
    picks.push(bestCandidateIndex);
    score += candidates[bestCandidateIndex].value;
  }

  return { score, picks };
}

function buildLineupCandidatePool(playerEntries, starterSlots) {
  const candidateMap = new Map();
  const maxPerSlot = Math.min(
    playerEntries.length,
    Math.max(LINEUP_CANDIDATE_FLOOR, starterSlots.length + LINEUP_CANDIDATE_BUFFER)
  );

  starterSlots.forEach((slot) => {
    playerEntries
      .filter((entry) => assetCanFillRosterSlot(entry.asset, slot))
      .slice(0, maxPerSlot)
      .forEach((entry) => {
        candidateMap.set(entry.asset.assetId, entry);
      });
  });

  return [...candidateMap.values()].sort((a, b) => b.value - a.value);
}

function countEligibleCandidates(candidates, slot) {
  return candidates.reduce((count, candidate) => count + (assetCanFillRosterSlot(candidate.asset, slot) ? 1 : 0), 0);
}

function getStarterRosterSlots(league) {
  const defaultSlots = ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "SUPER_FLEX"];
  const starterlessSlots = new Set(["BN", "BENCH", "IR", "TAXI", "RESERVE", "PUP", "NA"]);
  const rosterPositions = Array.isArray(league?.roster_positions) && league.roster_positions.length > 0
    ? league.roster_positions
    : defaultSlots;

  return rosterPositions
    .map(normalizeRosterSlot)
    .filter((slot) => slot && !starterlessSlots.has(slot));
}

function normalizeRosterSlot(slot) {
  return String(slot || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function getSlotFlexWeight(slot) {
  return getAllowedPositionsForSlot(slot).size;
}

function getAllowedPositionsForSlot(slot) {
  const normalizedSlot = normalizeRosterSlot(slot);
  const explicitSlotMap = {
    FLEX: ["RB", "WR", "TE"],
    WRT: ["RB", "WR", "TE"],
    WRRB_FLEX: ["RB", "WR"],
    WRRB: ["RB", "WR"],
    RBWR_FLEX: ["RB", "WR"],
    REC_FLEX: ["WR", "TE"],
    WRTE_FLEX: ["WR", "TE"],
    SUPER_FLEX: ["QB", "RB", "WR", "TE"],
    OP: ["QB", "RB", "WR", "TE"],
    IDP_FLEX: ["DL", "DE", "DT", "LB", "DB", "CB", "S"],
    DL_LB_FLEX: ["DL", "DE", "DT", "LB"],
    DB_FLEX: ["DB", "CB", "S"],
    DL_DB_FLEX: ["DL", "DE", "DT", "DB", "CB", "S"],
  };

  if (explicitSlotMap[normalizedSlot]) return new Set(explicitSlotMap[normalizedSlot]);
  if (normalizedSlot.includes("/")) {
    return new Set(
      normalizedSlot
        .split("/")
        .flatMap((part) => [...getAllowedPositionsForSlot(part)])
    );
  }

  return new Set([normalizedSlot]);
}

function playerPositionsForAsset(asset) {
  const fantasyPositions = Array.isArray(asset?.raw?.fantasy_positions) ? asset.raw.fantasy_positions : [];
  const rawPositions = fantasyPositions.length > 0 ? fantasyPositions : [asset?.raw?.position].filter(Boolean);
  return rawPositions.map((position) => normalizePlayerPosition(position));
}

function normalizePlayerPosition(position) {
  const normalized = String(position || "").trim().toUpperCase();
  if (normalized === "D/ST" || normalized === "DST") return "DEF";
  return normalized;
}

function assetCanFillRosterSlot(asset, slot) {
  if (asset.assetType !== "player") return false;
  const playerPositions = playerPositionsForAsset(asset);
  const allowedPositions = getAllowedPositionsForSlot(slot);
  return playerPositions.some((position) => allowedPositions.has(position));
}

function formatRosterSlotLabel(slot) {
  const labels = {
    SUPER_FLEX: "SFlex",
    REC_FLEX: "Rec Flex",
    WRRB_FLEX: "RB/WR",
    RBWR_FLEX: "RB/WR",
    WRTE_FLEX: "WR/TE",
    FLEX: "Flex",
  };
  return labels[slot] || slot.replace(/_/g, " ");
}

function findClosestValuationPick(targetValue, values, valueNameMap) {
  if (!Number.isFinite(targetValue) || targetValue <= 0) return null;

  const catalog = state.pickValueCatalog.length > 0
    ? state.pickValueCatalog
    : buildPickValuationCatalog(values, valueNameMap);
  let closestPick = null;

  catalog.forEach((pick) => {
    const gap = Math.abs(pick.value - targetValue);
    if (!closestPick || gap < closestPick.gap || (gap === closestPick.gap && pick.value > closestPick.value)) {
      closestPick = {
        ...pick,
        gap,
      };
    }
  });

  return closestPick;
}

function buildPickValuationCatalog(values, valueNameMap) {
  const catalog = [];
  Object.entries(values).forEach(([assetId, value]) => {
    if (!Number.isFinite(value)) return;
    const pickMeta = parsePickAssetId(assetId) || parsePickDescriptor(valueNameMap[assetId] || assetId);
    if (!pickMeta) return;
    catalog.push({
      assetId,
      name: resolvePickNameForCatalog(assetId, valueNameMap),
      value,
      season: pickMeta.season,
      round: pickMeta.round,
      bucket: normalizePickBucket(pickMeta.bucket),
    });
  });

  return catalog;
}

function resolvePickNameForCatalog(assetId, valueNameMap) {
  if (valueNameMap[assetId]) return valueNameMap[assetId];
  return formatGenericPickAssetLabel(assetId);
}

function formatGenericPickAssetLabel(assetId) {
  const pickMeta = parsePickAssetId(assetId);
  if (!pickMeta) return assetId;

  const bucketLabel = pickMeta.bucket && pickMeta.bucket !== "any" ? ` ${formatPickBucketLabel(pickMeta.bucket)}` : "";
  if (Number.isFinite(pickMeta.round)) return `${pickMeta.season}${bucketLabel} ${ordinal(pickMeta.round)}`;
  return assetId;
}

function parsePickAssetId(assetId) {
  if (!String(assetId || "").startsWith("pick:")) return null;

  const [, season, ...rest] = assetId.split(":");
  const roundToken = rest.find((part) => /^r\d+$/i.test(part) || /^\d+$/i.test(part) || /^(?:\d+)(?:st|nd|rd|th)$/i.test(part));
  const bucketToken = rest.find((part) => /^(any|early|mid|middle|late)$/i.test(part));
  const round = parsePickRoundToken(roundToken);

  if (!season || !Number.isFinite(round)) return null;

  return {
    season,
    round,
    bucket: normalizePickBucket(bucketToken || "any"),
  };
}

function normalizePickBucket(bucket) {
  const normalized = String(bucket || "any").trim().toLowerCase();
  if (normalized === "middle") return "mid";
  return normalized;
}

function getPickBucketAliases(bucket) {
  const normalized = normalizePickBucket(bucket);
  if (normalized === "mid") return ["mid", "middle"];
  return [normalized];
}

function formatPickBucketLabel(bucket) {
  return {
    early: "Early",
    mid: "Middle",
    late: "Late",
  }[normalizePickBucket(bucket)] || "";
}

function parsePickRoundToken(token) {
  const normalized = String(token || "").trim().toLowerCase();
  if (!normalized) return null;
  if (/^r\d+$/.test(normalized)) return Number(normalized.slice(1));
  if (/^\d+$/.test(normalized)) return Number(normalized);
  if (/^\d+(st|nd|rd|th)$/.test(normalized)) return Number.parseInt(normalized, 10);
  return null;
}

function parsePickDescriptor(input) {
  const source = String(input || "").trim();
  if (!source) return null;

  const seasonMatch = source.match(/\b(20\d{2})\b/);
  const bucketMatch = source.match(/\b(early|mid|middle|late)\b/i);
  const roundMatch = source.match(/\b(\d+)(?:st|nd|rd|th)\b/i) || source.match(/\br(?:ound)?\s*(\d+)\b/i);

  const season = seasonMatch?.[1];
  const round = roundMatch ? Number(roundMatch[1]) : null;
  if (!season || !Number.isFinite(round)) return null;

  return {
    season,
    round,
    bucket: normalizePickBucket(bucketMatch?.[1] || "any"),
  };
}

function getAssetPickBucket(asset) {
  if (asset?.assetType !== "pick") return "any";
  return normalizePickBucket(asset?.raw?.ktcBucket || asset?.valueBucket || "any");
}

function buildPickLookupMeta(asset) {
  if (asset?.assetType !== "pick") return null;

  const valueMeta = parsePickAssetId(asset.valueAssetId || "");
  if (valueMeta) return valueMeta;

  const assetMeta = parsePickAssetId(asset.assetId || "");
  if (assetMeta) {
    return {
      ...assetMeta,
      bucket: assetMeta.round === 1 ? getAssetPickBucket(asset) : assetMeta.bucket,
    };
  }

  const season = asset?.raw?.season != null ? String(asset.raw.season) : "";
  const round = Number(asset?.raw?.round);
  if (!season || !Number.isFinite(round)) return null;

  return {
    season,
    round,
    bucket: round === 1 ? getAssetPickBucket(asset) : "any",
  };
}

function buildPickValueLookupIds(asset) {
  const meta = buildPickLookupMeta(asset);
  if (!meta) return [];

  const ids = [];
  const seen = new Set();
  const push = (id) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };

  if (asset.valueAssetId) push(asset.valueAssetId);

  if (meta.round === 1) {
    getPickBucketAliases(meta.bucket).forEach((bucket) => push(`pick:${meta.season}:r${meta.round}:${bucket}`));
  }
  push(`pick:${meta.season}:r${meta.round}:any`);

  return ids;
}

function findPickCatalogValue(meta, values, valueNameMap) {
  if (!meta) return null;
  const catalog = state.pickValueCatalog.length > 0
    ? state.pickValueCatalog
    : buildPickValuationCatalog(values, valueNameMap);
  const desiredBuckets = meta.round === 1
    ? [...getPickBucketAliases(meta.bucket), "any"]
    : ["any"];

  for (const bucket of desiredBuckets) {
    const exact = catalog.find((pick) =>
      pick.season === meta.season
      && pick.round === meta.round
      && pick.bucket === normalizePickBucket(bucket)
    );
    if (exact) return exact.value;
  }

  const numericSeason = Number(meta.season);
  if (!Number.isFinite(numericSeason)) return null;

  const nearest = catalog
    .filter((pick) => pick.round === meta.round && desiredBuckets.includes(pick.bucket))
    .sort((a, b) => Math.abs(Number(a.season) - numericSeason) - Math.abs(Number(b.season) - numericSeason))[0];

  return nearest?.value ?? null;
}

function resolvePickAssetValue(asset, values, valueNameMap = state.valueNameMap) {
  for (const candidateId of buildPickValueLookupIds(asset)) {
    if (Number.isFinite(values[candidateId])) return values[candidateId];
  }
  return findPickCatalogValue(buildPickLookupMeta(asset), values, valueNameMap);
}

function suggestTrades({
  myRoster,
  theirRoster,
  targetAsset,
  values,
  fairnessPct,
  maxResults,
  allowExtraTargetAssets,
  requireExtraTargetAsset = false,
  tradeLab,
  searchContext = null,
}) {
  const targetValue = searchContext?.targetValue ?? getAssetValue(targetAsset, values);
  if (!Number.isFinite(targetValue)) return [];

  const coreAssetIds = searchContext?.coreAssetIds || getCoreAssetIdSet(myRoster, values);
  const myAssetPool = searchContext?.myAssetPool
    || resolveOutgoingAssetPool({ myRoster, values, tradeLab, targetValue, coreAssetIds });
  if (myAssetPool.length === 0) return [];

  const globalMaxValue = searchContext?.globalMaxValue ?? getGlobalMaxPlayerValue(values, targetValue);
  const maxOutgoingAssets = searchContext?.maxOutgoingAssets ?? getMaxOutgoingPackageSize(targetValue);
  const myPackages = searchContext?.myPackages || buildPackages(myAssetPool, values, maxOutgoingAssets);
  const theirPackages = buildTargetPackages({ theirRoster, targetAsset, values, allowExtraTargetAssets, maxExtraAssets: 1 }).filter(
    (pkg) => (requireExtraTargetAsset ? pkg.assets.length > 1 : pkg.assets.length === 1)
  );
  const effectiveFairnessPct = searchContext?.effectiveFairnessPct ?? getEffectiveFairnessPct(fairnessPct, tradeLab.tradeVibe);
  const ideaStyle = requireExtraTargetAsset ? "throw-in-back" : "direct";

  const rawIdeas = [];
  for (const myPackage of myPackages) {
    for (const theirPackage of theirPackages) {
      const packageResult = calculatePackageAdjustment({
        myValues: myPackage.values,
        theirValues: theirPackage.values,
        globalMaxValue,
      });
      const pctDiff = calculatePctDiff(packageResult.myAdjustedValue, packageResult.theirAdjustedValue);
      if (pctDiff <= effectiveFairnessPct) {
        const labDetails = scoreTradeIdea({
          myRoster,
          theirRoster,
          targetAsset,
          myAssets: myPackage.assets,
          theirAssets: theirPackage.assets,
          values,
          pctDiff,
          tradeLab,
          ideaStyle,
          coreAssetIds,
        });
        if (!labDetails.viable) continue;

        rawIdeas.push({
          myAssets: myPackage.assets,
          theirAssets: theirPackage.assets,
          ...packageResult,
          pctDiff: Number(pctDiff.toFixed(2)),
          ...labDetails,
        });
      }
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const idea of rawIdeas) {
    const key = `${idea.myAssets.map((a) => a.assetId).sort().join("|")}=>${idea.theirAssets.map((a) => a.assetId).sort().join("|")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(idea);
  }

  deduped.sort((a, b) => compareTradeIdeas(a, b));

  return selectDiverseTradeIdeas(
    deduped,
    maxResults,
    values,
    tradeLab.selectedOutgoingAssetIds
  );
}

function buildTradeSearchContext({ myRoster, targetAsset, values, fairnessPct, tradeLab }) {
  const targetValue = getAssetValue(targetAsset, values);
  if (!Number.isFinite(targetValue)) return null;

  const coreAssetIds = getCoreAssetIdSet(myRoster, values);
  const myAssetPool = resolveOutgoingAssetPool({ myRoster, values, tradeLab, targetValue, coreAssetIds });
  if (myAssetPool.length === 0) return null;

  return {
    targetValue,
    coreAssetIds,
    myAssetPool,
    maxOutgoingAssets: getMaxOutgoingPackageSize(targetValue),
    myPackages: buildPackages(myAssetPool, values, getMaxOutgoingPackageSize(targetValue)),
    globalMaxValue: Math.max(state.globalMaxPlayerValue || KTC_GLOBAL_MAX_FALLBACK, targetValue),
    effectiveFairnessPct: getEffectiveFairnessPct(fairnessPct, tradeLab.tradeVibe),
  };
}

function resolveOutgoingAssetPool({ myRoster, values, tradeLab, targetValue = 0, coreAssetIds = null }) {
  const pool = myRoster.assets.filter((asset) =>
    !tradeLab.excludedOutgoingAssetIds.has(asset.assetId)
    && (
      (asset.assetType === "player" && tradeLab.allowPlayers)
      || (asset.assetType === "pick" && tradeLab.allowPicks)
    )
  );

  if (tradeLab.selectedOutgoingAssetIds.size > 0) {
    return pool.filter((asset) => tradeLab.selectedOutgoingAssetIds.has(asset.assetId));
  }

  const resolvedCoreAssetIds = coreAssetIds || getCoreAssetIdSet(myRoster, values);
  return limitOutgoingAssetPool(pool, values, targetValue, {
    coreAssetIds: resolvedCoreAssetIds,
    teamState: tradeLab.teamState,
  });
}

function limitOutgoingAssetPool(pool, values, targetValue, { coreAssetIds = new Set(), teamState = "middle" } = {}) {
  if (pool.length <= OUTGOING_POOL_LIMIT) return pool;

  const usefulValueFloor = Math.max(MIN_OUTGOING_ASSET_VALUE, Math.round(targetValue * 0.14));
  const eliteTarget = targetValue >= ELITE_TARGET_VALUE_THRESHOLD;
  const prioritized = pool
    .map((asset) => {
      const value = getAssetValue(asset, values);
      const relativeGap = targetValue > 0 ? Math.abs(value - targetValue) / targetValue : 0;
      let score = Math.max(0, 1.35 - Math.min(relativeGap, 1.35)) * 1000;
      score += Math.min(value, targetValue || value) * 0.02;
      if (value >= usefulValueFloor) score += 200;
      if (asset.assetType === "pick") score += isFirstRoundPick(asset) ? 220 : 60;
      if (coreAssetIds.has(asset.assetId)) score -= eliteTarget ? 120 : 260;
      if (teamState === "rebuilding" && isFirstRoundPick(asset)) score -= 90;
      if (teamState === "contending" && isFirstRoundPick(asset)) score += 40;
      return { asset, value, score };
    })
    .sort((a, b) => b.score - a.score || b.value - a.value || a.asset.name.localeCompare(b.asset.name));

  const kept = [];
  const seenAssetIds = new Set();
  const keepEntry = (entry) => {
    if (!entry || seenAssetIds.has(entry.asset.assetId)) return;
    kept.push(entry.asset);
    seenAssetIds.add(entry.asset.assetId);
  };

  prioritized
    .filter((entry) =>
      entry.value >= usefulValueFloor
      || isFirstRoundPick(entry.asset)
      || (eliteTarget && coreAssetIds.has(entry.asset.assetId))
    )
    .slice(0, OUTGOING_POOL_LIMIT)
    .forEach(keepEntry);

  for (const entry of prioritized) {
    if (kept.length >= OUTGOING_POOL_LIMIT) break;
    keepEntry(entry);
  }

  return kept;
}

function getMaxOutgoingPackageSize(targetValue) {
  if (!Number.isFinite(targetValue)) return DEFAULT_MAX_OUTGOING_PACKAGE_SIZE;
  if (targetValue >= ELITE_TARGET_VALUE_THRESHOLD) return ELITE_MAX_OUTGOING_PACKAGE_SIZE;
  if (targetValue >= 5000) return DEFAULT_MAX_OUTGOING_PACKAGE_SIZE;
  return 4;
}

function getEffectiveFairnessPct(fairnessPct, tradeVibe) {
  const vibeBuffer = {
    balanced: 0,
    aggressive: 4,
    chaos: 8,
  };
  return fairnessPct + (vibeBuffer[tradeVibe] || 0);
}

function buildPackageProfile(assets, values) {
  const entries = assets
    .map((asset) => ({ asset, value: getAssetValue(asset, values) }))
    .filter((entry) => Number.isFinite(entry.value))
    .sort((a, b) => b.value - a.value || a.asset.name.localeCompare(b.asset.name));

  const totalValue = entries.reduce((sum, entry) => sum + entry.value, 0);
  const topValue = entries[0]?.value || 0;
  const secondValue = entries[1]?.value || 0;

  return {
    entries,
    totalValue,
    topValue,
    secondValue,
    topTwoValue: topValue + secondValue,
    packageSize: entries.length,
    leadAssetId: entries[0]?.asset.assetId || "",
    leadAssetValue: topValue,
    topAssetIds: entries.slice(0, 2).map((entry) => entry.asset.assetId),
  };
}

function getRequiredAnchorShare(targetValue, packageSize) {
  if (!Number.isFinite(targetValue) || targetValue <= 0) return 0;

  const baseShare = targetValue >= ELITE_TARGET_VALUE_THRESHOLD
    ? ELITE_TARGET_ANCHOR_SHARE_BASE
    : targetValue >= STAR_TARGET_VALUE_THRESHOLD
      ? STAR_TARGET_ANCHOR_SHARE_BASE
      : 0.34;

  return Math.min(
    MAX_TARGET_ANCHOR_SHARE,
    baseShare + Math.max(0, packageSize - 2) * ANCHOR_SHARE_STEP_PER_EXTRA_ASSET
  );
}

function calculateFragmentationTax(targetValue, packageProfile) {
  const extraAssets = Math.max(0, packageProfile.packageSize - 1);
  if (!extraAssets || !Number.isFinite(targetValue) || targetValue <= 0) return 0;

  const perAssetTax = targetValue >= ELITE_TARGET_VALUE_THRESHOLD
    ? ELITE_FRAGMENTATION_TAX_PER_EXTRA_ASSET
    : targetValue >= STAR_TARGET_VALUE_THRESHOLD
      ? STAR_FRAGMENTATION_TAX_PER_EXTRA_ASSET
      : BASE_FRAGMENTATION_TAX_PER_EXTRA_ASSET;
  const requiredAnchorShare = getRequiredAnchorShare(targetValue, packageProfile.packageSize);
  const actualAnchorShare = packageProfile.topValue / targetValue;
  const anchorGap = Math.max(0, requiredAnchorShare - actualAnchorShare);
  const fillerFloor = Math.max(900, Math.round(targetValue * 0.14));
  const fillerCount = packageProfile.entries.filter((entry, index) => index >= 2 && entry.value < fillerFloor).length;

  return Math.round(
    extraAssets * perAssetTax
    + anchorGap * targetValue * 0.22
    + fillerCount * 90
  );
}

function evaluateTradeIdeaRealism({ targetAsset, myAssets, values }) {
  const packageProfile = buildPackageProfile(myAssets, values);
  const targetValue = getAssetValue(targetAsset, values);
  const targetIsPlayer = targetAsset?.assetType === "player";

  if (packageProfile.packageSize === 0) {
    return { viable: false, packageProfile, packageTax: 0, scoreAdjustment: 0 };
  }

  if (!targetIsPlayer || !Number.isFinite(targetValue)) {
    return { viable: true, packageProfile, packageTax: 0, scoreAdjustment: 0 };
  }

  const anchorShare = packageProfile.topValue / targetValue;
  const secondShare = packageProfile.secondValue / targetValue;
  const topTwoShare = packageProfile.topTwoValue / targetValue;
  const requiredAnchorShare = getRequiredAnchorShare(targetValue, packageProfile.packageSize);
  const strongAnchor = anchorShare >= requiredAnchorShare;
  const premiumTwoForOne = packageProfile.packageSize <= 2 && topTwoShare >= 0.94 && secondShare >= 0.4;

  if (targetValue >= ELITE_TARGET_VALUE_THRESHOLD && !strongAnchor && !premiumTwoForOne) {
    return { viable: false, packageProfile, packageTax: 0, scoreAdjustment: 0 };
  }

  if (targetValue >= STAR_TARGET_VALUE_THRESHOLD && packageProfile.packageSize >= 4 && !strongAnchor) {
    return { viable: false, packageProfile, packageTax: 0, scoreAdjustment: 0 };
  }

  let scoreAdjustment = 0;
  if (strongAnchor) scoreAdjustment += 8;
  if (premiumTwoForOne) scoreAdjustment += 6;
  if (packageProfile.packageSize <= 2) scoreAdjustment += 4;
  if (packageProfile.packageSize >= 4) scoreAdjustment -= (packageProfile.packageSize - 3) * 5;

  return {
    viable: true,
    packageProfile,
    packageTax: calculateFragmentationTax(targetValue, packageProfile),
    scoreAdjustment,
  };
}

function getComparableAssetIds(idea, lockedAssetIds = new Set()) {
  return idea.myAssets
    .map((asset) => asset.assetId)
    .filter((assetId) => !lockedAssetIds.has(assetId));
}

function getDiversityLeadAssetId(idea, values, lockedAssetIds = new Set()) {
  const unlockedProfile = buildPackageProfile(
    idea.myAssets.filter((asset) => !lockedAssetIds.has(asset.assetId)),
    values
  );
  return unlockedProfile.leadAssetId || idea.primaryAssetId || "";
}

function areTradeIdeasTooSimilar(candidate, picked, values, lockedAssetIds = new Set()) {
  const candidateIds = getComparableAssetIds(candidate, lockedAssetIds);
  const pickedIds = getComparableAssetIds(picked, lockedAssetIds);
  if (candidateIds.length === 0 || pickedIds.length === 0) return false;

  const pickedIdSet = new Set(pickedIds);
  const sharedIds = candidateIds.filter((assetId) => pickedIdSet.has(assetId));
  const overlapRatio = sharedIds.length / Math.min(candidateIds.length, pickedIds.length);

  const candidateProfile = buildPackageProfile(
    candidate.myAssets.filter((asset) => !lockedAssetIds.has(asset.assetId)),
    values
  );
  const pickedProfile = buildPackageProfile(
    picked.myAssets.filter((asset) => !lockedAssetIds.has(asset.assetId)),
    values
  );
  const sharedValue = sharedIds.reduce((sum, assetId) => {
    const match = candidateProfile.entries.find((entry) => entry.asset.assetId === assetId);
    return sum + (match?.value || 0);
  }, 0);
  const overlapValueRatio = sharedValue / Math.max(1, Math.min(candidateProfile.totalValue, pickedProfile.totalValue));

  const candidateLeadAssetId = getDiversityLeadAssetId(candidate, values, lockedAssetIds);
  const pickedLeadAssetId = getDiversityLeadAssetId(picked, values, lockedAssetIds);
  const sharedTopIds = candidateProfile.topAssetIds.filter((assetId) => pickedProfile.topAssetIds.includes(assetId));

  if (candidateLeadAssetId && candidateLeadAssetId === pickedLeadAssetId && overlapRatio >= 0.34) return true;
  if (sharedTopIds.length >= 2) return true;
  if (overlapRatio >= PACKAGE_DIVERSITY_OVERLAP_RATIO) return true;
  if (overlapValueRatio >= PACKAGE_DIVERSITY_VALUE_OVERLAP_RATIO) return true;
  return false;
}

function selectDiverseTradeIdeas(ideas, maxResults, values, lockedAssetIds = new Set()) {
  const selected = [];
  const heldBack = [];

  for (const idea of ideas) {
    if (selected.some((picked) => areTradeIdeasTooSimilar(idea, picked, values, lockedAssetIds))) {
      heldBack.push(idea);
      continue;
    }
    selected.push(idea);
    if (selected.length >= maxResults) return selected;
  }

  for (const idea of heldBack) {
    if (selected.length >= maxResults) break;
    selected.push(idea);
  }

  return selected;
}

function scoreTradeIdea({ myRoster, theirRoster, targetAsset, myAssets, theirAssets, values, pctDiff, tradeLab, ideaStyle, coreAssetIds = null }) {
  const realism = evaluateTradeIdeaRealism({ targetAsset, myAssets, values });
  if (!realism.viable) {
    return { viable: false };
  }

  const marketMyValue = Math.max(0, calculatePerceivedPackageValue(myAssets, values, tradeLab) - realism.packageTax);
  const marketTheirValue = calculatePerceivedPackageValue(theirAssets, values, tradeLab);
  const marketDelta = marketMyValue - marketTheirValue;
  const resolvedCoreAssetIds = coreAssetIds || getCoreAssetIdSet(myRoster, values);
  const exposesCore = myAssets.some((asset) => resolvedCoreAssetIds.has(asset.assetId));

  let labScore = 82;
  labScore -= pctDiff * (tradeLab.tradeVibe === "chaos" ? 0.55 : tradeLab.tradeVibe === "aggressive" ? 0.8 : 1.1);
  labScore += Math.max(-18, Math.min(18, marketDelta / 240));

  if (tradeLab.positionPremium !== "none" && myAssets.some((asset) => playerPositionForAsset(asset) === tradeLab.positionPremium)) {
    labScore += 6;
  }
  if (ideaStyle === "throw-in-back" && theirAssets.length > 1) labScore += 4;
  if (!exposesCore) labScore += 8;
  if (exposesCore) labScore -= 16;
  labScore += realism.scoreAdjustment;
  labScore += getTeamStateScoreAdjustment({ targetAsset, myAssets, theirAssets, tradeLab });
  if (tradeLab.tradeVibe === "aggressive") labScore += 3;
  if (tradeLab.tradeVibe === "chaos") labScore += 6;

  const reasoning = buildTradeReasoning({
    myRoster,
    theirRoster,
    targetAsset,
    myAssets,
    theirAssets,
    values,
    tradeLab,
    marketDelta,
    exposesCore,
    ideaStyle,
  });

  return {
    viable: true,
    labScore: clamp(Math.round(labScore), 1, 99),
    marketMyValue,
    marketTheirValue,
    marketDelta: Math.round(marketDelta),
    primaryAssetId: realism.packageProfile.leadAssetId,
    primaryAssetValue: realism.packageProfile.leadAssetValue,
    topOutgoingAssetIds: realism.packageProfile.topAssetIds,
    tags: reasoning.tags,
    summary: reasoning.summary,
    pitch: reasoning.pitch,
  };
}

function compareTradeIdeas(a, b) {
  const byLabScore = b.labScore - a.labScore;
  if (byLabScore !== 0) return byLabScore;

  const byDiff = Math.abs(a.pctDiff) - Math.abs(b.pctDiff);
  if (byDiff !== 0) return byDiff;

  const byPrimaryAsset = (b.primaryAssetValue || 0) - (a.primaryAssetValue || 0);
  if (byPrimaryAsset !== 0) return byPrimaryAsset;

  const byMarketDelta = b.marketDelta - a.marketDelta;
  if (byMarketDelta !== 0) return byMarketDelta;

  const byEvenValue = a.evenValue - b.evenValue;
  if (byEvenValue !== 0) return byEvenValue;

  return (a.myAssets.length + a.theirAssets.length) - (b.myAssets.length + b.theirAssets.length);
}

function calculatePerceivedPackageValue(assets, values, tradeLab) {
  const total = assets.reduce((sum, asset) => sum + getPerceivedAssetValue(asset, values, tradeLab), 0);
  let packageAdjustment = 0;

  if (assets.length >= 2) {
    packageAdjustment -= 55 * (assets.length - 1);
    if (tradeLab.tradeVibe === "aggressive") packageAdjustment += 20 * (assets.length - 1);
    if (tradeLab.tradeVibe === "chaos") packageAdjustment += 35 * (assets.length - 1);
    if (tradeLab.teamState === "contending") packageAdjustment -= 20 * (assets.length - 1);
  }

  return Math.round(total + packageAdjustment);
}

function getPerceivedAssetValue(asset, values, tradeLab) {
  const baseValue = getAssetValue(asset, values);
  let multiplier = 1;

  if (tradeLab.positionPremium !== "none" && playerPositionForAsset(asset) === tradeLab.positionPremium) multiplier += 0.1;
  if (tradeLab.teamState === "rebuilding") {
    if (asset.assetType === "pick") multiplier += 0.09;
    if (isYouthAsset(asset)) multiplier += 0.08;
    if (isVeteranAsset(asset)) multiplier -= 0.06;
  }
  if (tradeLab.teamState === "contending") {
    if (asset.assetType === "pick") multiplier -= 0.04;
    if (isVeteranAsset(asset) || isWinNowTarget(asset)) multiplier += 0.07;
  }

  return Math.round(baseValue * multiplier);
}

function buildTradeReasoning({
  myRoster,
  theirRoster,
  targetAsset,
  myAssets,
  theirAssets,
  values,
  tradeLab,
  marketDelta,
  exposesCore,
  ideaStyle,
}) {
  const tags = [];
  const notes = [];

  if (tradeLab.positionPremium !== "none" && myAssets.some((asset) => playerPositionForAsset(asset) === tradeLab.positionPremium)) {
    tags.push(`${tradeLab.positionPremium} Premium`);
    notes.push(`${tradeLab.positionPremium.toLowerCase()} liquidity is doing part of the work here`);
  }
  if (!exposesCore) {
    tags.push("Core Intact");
    notes.push("you are not cutting into the spine of your roster");
  }
  if (tradeLab.teamState === "rebuilding") {
    tags.push("Rebuild Lens");
    if (isRebuildFriendlyTarget(targetAsset)) {
      notes.push(`the return keeps your timeline younger around ${targetAsset.name}`);
    }
    if (myAssets.some(isVeteranAsset)) {
      notes.push("you are cashing out win-now value instead of shipping your youngest insulation");
    }
  }
  if (tradeLab.teamState === "middle") {
    tags.push("Flexible Build");
    notes.push("the package stays balanced enough for a team that is not fully all-in or tearing it down");
  }
  if (tradeLab.teamState === "contending") {
    tags.push("Win-Now Push");
    notes.push(`this consolidates value into a player you actually want in your lineup now`);
    if (myAssets.length > theirAssets.length) {
      tags.push("Consolidation");
    }
  }
  if (ideaStyle === "throw-in-back" && theirAssets.length > 1) {
    tags.push("Throw-In Back");
    notes.push("the extra piece back keeps the offer from feeling too one-sided");
  }
  if (marketDelta >= 250) {
    tags.push("Market Leverage");
  }
  if (tags.length === 0) {
    tags.push("Fair Market");
    notes.push("this is mostly a straightforward value conversation");
  }

  const summary = notes.slice(0, 2).join(". ").replace(/\.$/, "") || "clean starter package with enough market logic to open the conversation";

  let pitch = `I'm trying to get to ${targetAsset.name} without wasting your time. This gives you ${myAssets.length > 1 ? `${myAssets.length} usable pieces` : "real value"} and keeps it close to market.`;
  if (tradeLab.positionPremium !== "none" && myAssets.some((asset) => playerPositionForAsset(asset) === tradeLab.positionPremium)) {
    pitch = `I know ${tradeLab.positionPremium}s carry extra juice in this league, so I built this around that premium instead of random filler.`;
  } else if (tradeLab.teamState === "rebuilding") {
    pitch = `I'm willing to move some win-now value, but I want the return to make sense for a younger timeline around ${targetAsset.name}.`;
  } else if (tradeLab.teamState === "contending") {
    pitch = `I'm trying to turn extra depth and future insulation into a starter I can actually use, and this keeps the value honest.`;
  } else if (ideaStyle === "throw-in-back" && theirAssets.length > 1) {
    pitch = `I'm good paying for ${targetAsset.name}, but I'd want the small add-on back so the deal lands closer to neutral for both sides.`;
  }

  return {
    tags: [...new Set(tags)].slice(0, 4),
    summary: `${summary}.`,
    pitch,
  };
}

function getTeamStateLabel(teamState) {
  return {
    rebuilding: "Rebuilding",
    middle: "Middle",
    contending: "Contending",
  }[teamState] || "Middle";
}

function getTeamStateScoreAdjustment({ targetAsset, myAssets, theirAssets, tradeLab }) {
  if (tradeLab.teamState === "rebuilding") {
    let score = 0;
    if (isRebuildFriendlyTarget(targetAsset)) score += 10;
    if (theirAssets.length > 1) score += 3;
    if (myAssets.some(isVeteranAsset)) score += 6;
    if (myAssets.some((asset) => isFirstRoundPick(asset) || isYouthAsset(asset))) score -= 8;
    return score;
  }

  if (tradeLab.teamState === "contending") {
    let score = 0;
    if (isWinNowTarget(targetAsset)) score += 10;
    if (myAssets.length > theirAssets.length) score += 5;
    if (myAssets.some((asset) => isFirstRoundPick(asset) || isYouthAsset(asset))) score += 5;
    return score;
  }

  let score = 0;
  const targetAge = playerAgeForAsset(targetAsset);
  if (Number.isFinite(targetAge) && targetAge >= 23 && targetAge <= 27) score += 4;
  if (myAssets.length <= 2) score += 3;
  return score;
}

function isVeteranAsset(asset) {
  if (asset.assetType !== "player") return false;
  const age = playerAgeForAsset(asset);
  const position = playerPositionForAsset(asset);
  if (!Number.isFinite(age)) return false;
  if (position === "RB") return age >= 26;
  return age >= 28;
}

function isRebuildFriendlyTarget(asset) {
  if (asset.assetType !== "player") return false;
  const age = playerAgeForAsset(asset);
  const position = playerPositionForAsset(asset);
  if (!Number.isFinite(age)) return position === "QB" || position === "WR";
  if (position === "QB" || position === "WR") return age <= 27;
  return age <= 25;
}

function isWinNowTarget(asset) {
  if (asset.assetType !== "player") return false;
  const age = playerAgeForAsset(asset);
  const position = playerPositionForAsset(asset);
  if (!Number.isFinite(age)) return position === "RB" || position === "TE";
  if (position === "RB") return age <= 27;
  if (position === "TE") return age <= 29;
  return age <= 30;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatPackageAdjustment(idea) {
  if (!idea.packageAdjustment) return "none";
  const side = idea.packageAdjustmentSide === "my" ? "your side" : "their side";
  return `+${formatNumber(idea.packageAdjustment)} on ${side}`;
}

function calculatePctDiff(a, b) {
  if (!a || !b) return 100;
  return Math.abs(a - b) / Math.max(a, b) * 100;
}

function getGlobalMaxPlayerValue(values, tradeMaxValue = 0) {
  let maxValue = Math.max(KTC_GLOBAL_MAX_FALLBACK, tradeMaxValue);
  for (const value of Object.values(values || {})) {
    if (Number.isFinite(value) && value > maxValue) {
      maxValue = value;
    }
  }
  return maxValue;
}

function calculateKtcRawAdjustment(playerValue, tradeMaxValue, globalMaxValue) {
  if (!Number.isFinite(playerValue) || playerValue <= 0 || !Number.isFinite(tradeMaxValue) || tradeMaxValue <= 0) return 0;

  return playerValue * (
    KTC_RAW_BASE
      + KTC_RAW_ELITE_WEIGHT * (playerValue / globalMaxValue) ** 8
      + KTC_RAW_TRADE_WEIGHT * (playerValue / tradeMaxValue) ** 1.3
      + KTC_RAW_DEPTH_WEIGHT * (playerValue / (globalMaxValue + 2000)) ** 1.28
  );
}

function findEvenValueForRawGap(targetRawGap, tradeMaxValue, globalMaxValue) {
  if (!Number.isFinite(targetRawGap) || targetRawGap <= 0) return 0;

  const maxReachableRaw = calculateKtcRawAdjustment(globalMaxValue, globalMaxValue, globalMaxValue);
  if (targetRawGap >= maxReachableRaw) {
    return Math.round(globalMaxValue);
  }

  let low = 0;
  let high = globalMaxValue;
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const rawValue = calculateKtcRawAdjustment(mid, Math.max(tradeMaxValue, mid), globalMaxValue);
    if (rawValue < targetRawGap) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.max(0, Math.round(high));
}

function calculatePackageAdjustment({ myValues, theirValues, globalMaxValue }) {
  const myBaseValue = myValues.reduce((sum, value) => sum + value, 0);
  const theirBaseValue = theirValues.reduce((sum, value) => sum + value, 0);
  const tradeMaxValue = Math.max(0, ...myValues, ...theirValues);

  if (!tradeMaxValue) {
    return {
      myBaseValue,
      theirBaseValue,
      myAdjustedValue: myBaseValue,
      theirAdjustedValue: theirBaseValue,
      packageAdjustment: 0,
      packageAdjustmentSide: null,
      evenValue: 0,
    };
  }

  const myRawValue = myValues.reduce((sum, value) => sum + calculateKtcRawAdjustment(value, tradeMaxValue, globalMaxValue), 0);
  const theirRawValue = theirValues.reduce((sum, value) => sum + calculateKtcRawAdjustment(value, tradeMaxValue, globalMaxValue), 0);

  if (Math.abs(myRawValue - theirRawValue) < 1e-6) {
    return {
      myBaseValue,
      theirBaseValue,
      myAdjustedValue: myBaseValue,
      theirAdjustedValue: theirBaseValue,
      packageAdjustment: 0,
      packageAdjustmentSide: null,
      evenValue: 0,
    };
  }

  if (myRawValue > theirRawValue) {
    const evenValue = findEvenValueForRawGap(myRawValue - theirRawValue, tradeMaxValue, globalMaxValue);
    const packageAdjustment = Math.max(0, Math.round(theirBaseValue + evenValue - myBaseValue));
    return {
      myBaseValue,
      theirBaseValue,
      myAdjustedValue: myBaseValue + packageAdjustment,
      theirAdjustedValue: theirBaseValue,
      packageAdjustment,
      packageAdjustmentSide: packageAdjustment > 0 ? "my" : null,
      evenValue,
    };
  }

  const evenValue = findEvenValueForRawGap(theirRawValue - myRawValue, tradeMaxValue, globalMaxValue);
  const packageAdjustment = Math.max(0, Math.round(myBaseValue + evenValue - theirBaseValue));
  return {
    myBaseValue,
    theirBaseValue,
    myAdjustedValue: myBaseValue,
    theirAdjustedValue: theirBaseValue + packageAdjustment,
    packageAdjustment,
    packageAdjustmentSide: packageAdjustment > 0 ? "their" : null,
    evenValue,
  };
}

function buildPackages(assets, values, maxAssets) {
  const valuedAssets = assets
    .map((asset) => ({ asset, value: getAssetValue(asset, values) }))
    .filter((entry) => Number.isFinite(entry.value));

  const packages = [];
  for (let size = 1; size <= Math.min(maxAssets, valuedAssets.length); size++) {
    for (const combo of combinationsOfSize(valuedAssets, size)) {
      packages.push({
        assets: combo.map((entry) => entry.asset),
        values: combo.map((entry) => entry.value),
      });
    }
  }
  return packages;
}

function buildTargetPackages({ theirRoster, targetAsset, values, allowExtraTargetAssets, maxExtraAssets }) {
  const targetValue = getAssetValue(targetAsset, values);
  if (!Number.isFinite(targetValue)) return [];

  const packages = [{ assets: [targetAsset], values: [targetValue] }];
  if (!allowExtraTargetAssets) return packages;

  const maxThrowInValue = Math.max(900, Math.round(targetValue * 0.3));
  const extras = theirRoster.assets
    .filter((asset) => asset.assetId !== targetAsset.assetId)
    .map((asset) => ({ asset, value: getAssetValue(asset, values) }))
    .filter((entry) => Number.isFinite(entry.value) && entry.value <= maxThrowInValue)
    .sort((a, b) => a.value - b.value);

  for (let size = 1; size <= Math.min(maxExtraAssets, extras.length); size++) {
    for (const combo of combinationsOfSize(extras, size)) {
      packages.push({
        assets: [targetAsset, ...combo.map((entry) => entry.asset)],
        values: [targetValue, ...combo.map((entry) => entry.value)],
      });
    }
  }

  return packages;
}

function combinationsOfSize(items, size) {
  if (size === 0) return [[]];
  if (size > items.length) return [];

  const out = [];
  const stack = [];

  function walk(startIndex) {
    if (stack.length === size) {
      out.push([...stack]);
      return;
    }
    for (let i = startIndex; i <= items.length - (size - stack.length); i++) {
      stack.push(items[i]);
      walk(i + 1);
      stack.pop();
    }
  }

  walk(0);
  return out;
}

function renderAssetList(assets, values, teamClass = "") {
  const sortedAssets = [...assets].sort((a, b) => sortAssetsByValueDesc(a, b, values));
  return `
    <ul class="asset-list ${teamClass}">
      ${sortedAssets
        .map(
          (asset) => `
            <li class="asset-item">
              <span>${asset.name}</span>
              <span class="asset-value">${formatAssetSecondaryLabel(asset, values)}</span>
            </li>`
        )
        .join("")}
    </ul>`;
}

function setButtonLoading(button, isLoading, loadingText = "Loading...") {
  if (!button) return;
  if (!button.dataset.defaultLabel) button.dataset.defaultLabel = button.textContent;
  button.disabled = isLoading;
  button.classList.toggle("loading", isLoading);
  button.textContent = isLoading ? loadingText : button.dataset.defaultLabel;
}

function formatNumber(value) {
  return Number(value).toLocaleString();
}

function getAssetValue(asset, values) {
  const exact = values[asset.assetId];
  if (Number.isFinite(exact)) return exact;

  if (asset.assetType === "pick") {
    const resolvedPickValue = resolvePickAssetValue(asset, values);
    if (Number.isFinite(resolvedPickValue)) return resolvedPickValue;
  }

  return estimatedValue(asset);
}

function formatAssetSecondaryLabel(asset, values) {
  const parts = [formatNumber(getAssetValue(asset, values))];
  if (asset.assetType === "player") {
    const position = formatPlayerPositionLabel(asset);
    if (position) parts.push(position);
    const age = playerAgeForAsset(asset);
    if (Number.isFinite(age)) parts.push(`${age}y`);
  } else {
    if (asset.raw?.season) parts.push(String(asset.raw.season));
    const pickBucket = getAssetPickBucket(asset);
    if (Number(asset.raw?.round) === 1 && pickBucket !== "any") parts.push(formatPickBucketLabel(pickBucket));
    if (asset.raw?.round) parts.push(`R${asset.raw.round}`);
  }
  return `(${parts.join(" • ")})`;
}

function playerPositionForRaw(raw) {
  return (raw?.position || raw?.fantasy_positions?.[0] || "").toUpperCase();
}

function playerPositionForAsset(asset) {
  return playerPositionForRaw(asset?.raw);
}

function getPlayerPositionRankLabel(asset) {
  if (asset?.assetType !== "player") return "";
  return state.playerPositionRankByAssetId[asset.assetId] || "";
}

function formatPlayerPositionLabel(asset) {
  return getPlayerPositionRankLabel(asset) || playerPositionForAsset(asset) || "Player";
}

function refreshPlayerPositionRanks() {
  const groupedPlayers = new Map();

  Object.entries(state.values).forEach(([assetId, value]) => {
    if (!assetId.startsWith("player:") || !Number.isFinite(value)) return;

    const playerId = assetId.slice("player:".length);
    const player = state.players?.[playerId];
    const position = playerPositionForRaw(player);
    if (!position) return;

    if (!groupedPlayers.has(position)) groupedPlayers.set(position, []);
    groupedPlayers.get(position).push({
      assetId,
      value,
      name: player?.full_name
        || `${(player?.first_name || "").trim()} ${(player?.last_name || "").trim()}`.trim()
        || state.valueNameMap[assetId]
        || assetId,
    });
  });

  const nextRankMap = {};
  groupedPlayers.forEach((entries, position) => {
    entries
      .sort((a, b) => (b.value - a.value) || a.name.localeCompare(b.name) || a.assetId.localeCompare(b.assetId))
      .forEach((entry, index) => {
        nextRankMap[entry.assetId] = `${position}${index + 1}`;
      });
  });

  state.playerPositionRankByAssetId = nextRankMap;
}

function playerAgeForAsset(asset) {
  const age = Number(asset?.raw?.age);
  return Number.isFinite(age) ? age : null;
}

function isYouthAsset(asset) {
  if (asset.assetType !== "player") return false;
  const age = playerAgeForAsset(asset);
  return Number.isFinite(age) && age <= 24;
}

function isFirstRoundPick(asset) {
  return asset.assetType === "pick" && Number(asset.raw?.round) === 1;
}

function getCoreAssetIdSet(myRoster, values) {
  const topPlayers = myRoster.assets
    .filter((asset) => asset.assetType === "player")
    .map((asset) => ({ assetId: asset.assetId, value: getAssetValue(asset, values) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)
    .map((entry) => entry.assetId);

  return new Set(topPlayers);
}

function estimatedValue(asset) {
  if (asset.assetType === "pick") return 2200;
  if (isInactivePlayerAsset(asset)) return 0;

  const position = playerPositionForAsset(asset);
  const age = Number(asset.raw?.age || 26);
  const baseByPos = {
    QB: 4300,
    RB: 4200,
    WR: 4000,
    TE: 3000,
    K: 100,
    DEF: 500,
  };
  const base = baseByPos[position] || 1800;
  const ageModifier = Math.max(-1400, (26 - age) * 130);
  return Math.max(300, Math.round(base + ageModifier));
}

function isInactivePlayerAsset(asset) {
  if (asset.assetType !== "player") return false;
  if (asset.raw?.active === false) return true;

  const status = String(asset.raw?.status || "").trim().toLowerCase();
  if (["inactive", "retired", "reserve_retired", "reserve/did_not_report", "did_not_report"].includes(status)) {
    return true;
  }

  const team = String(asset.raw?.team || "").trim().toUpperCase();
  if (!team || team === "FA") {
    const age = playerAgeForAsset(asset);
    if (Number.isFinite(age) && age >= 30) return true;
  }

  return false;
}

function normalizeRosterIdKey(value) {
  if (value == null || value === "") return null;
  return String(value);
}

function toNumericIfPossible(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && String(numeric) === String(value) ? numeric : value;
}

function normalizeOwnedPickRecord(pick, fallbackOwnerId = null) {
  const season = pick?.season != null ? String(pick.season) : "";
  const round = Number(pick?.round);
  if (!season || !Number.isFinite(round)) return null;

  const originalOwner = pick?.original_owner ?? pick?.roster_id ?? fallbackOwnerId ?? "any";
  const currentOwner = pick?.owner_id ?? fallbackOwnerId ?? originalOwner;

  return {
    ...pick,
    season,
    round,
    roster_id: originalOwner,
    original_owner: originalOwner,
    owner_id: currentOwner,
    previous_owner_id: pick?.previous_owner_id ?? currentOwner,
  };
}

function normalizeTradedPickRecord(pick) {
  const season = pick?.season != null ? String(pick.season) : "";
  const round = Number(pick?.round);
  const originalOwner = pick?.roster_id ?? pick?.original_owner;
  const currentOwner = pick?.owner_id;
  if (!season || !Number.isFinite(round) || originalOwner == null || currentOwner == null) {
    return null;
  }

  return {
    ...pick,
    season,
    round,
    roster_id: originalOwner,
    original_owner: originalOwner,
    owner_id: currentOwner,
    previous_owner_id: pick?.previous_owner_id ?? currentOwner,
  };
}

function inferLeaguePickSeasons(league, rosters, tradedPicks = [], pickValueCatalog = state.pickValueCatalog) {
  const explicitSeasons = rosters
    .flatMap((roster) => Array.isArray(roster?.picks) ? roster.picks : [])
    .map((pick) => Number(pick?.season))
    .filter(Number.isFinite);
  const tradedSeasons = tradedPicks
    .map((pick) => Number(pick?.season))
    .filter(Number.isFinite);
  const catalogSeasons = pickValueCatalog
    .map((pick) => Number(pick?.season))
    .filter(Number.isFinite);

  const configuredLeagueSeason = Number(league?.season);
  const baseSeason = Number.isFinite(configuredLeagueSeason) ? configuredLeagueSeason : new Date().getFullYear();
  const observedStartSeasons = [...explicitSeasons, ...tradedSeasons];
  const startSeason = observedStartSeasons.length > 0
    ? Math.min(...observedStartSeasons)
    : baseSeason;
  const endSeason = Math.max(
    startSeason + (observedStartSeasons.length > 0 ? 1 : 2),
    ...[...explicitSeasons, ...tradedSeasons, ...catalogSeasons]
  );

  const seasons = [];
  for (let season = startSeason; season <= endSeason; season++) {
    seasons.push(String(season));
  }
  return seasons;
}

function inferLeagueDraftRounds(league, rosters, tradedPicks = []) {
  const configuredRounds = Number(league?.settings?.draft_rounds);
  const explicitRounds = rosters
    .flatMap((roster) => Array.isArray(roster?.picks) ? roster.picks : [])
    .map((pick) => Number(pick?.round))
    .filter(Number.isFinite);
  const tradedRounds = tradedPicks
    .map((pick) => Number(pick?.round))
    .filter(Number.isFinite);

  if (Number.isFinite(configuredRounds) && configuredRounds > 0) {
    return Math.max(configuredRounds, ...explicitRounds, ...tradedRounds);
  }

  return Math.max(...explicitRounds, ...tradedRounds, 5);
}

function buildOwnedPickKey(season, round, originalOwnerKey) {
  return `${season}:${round}:${originalOwnerKey}`;
}

function buildOwnedPicksByRoster(league, rosters, tradedPicks = [], pickValueCatalog = state.pickValueCatalog) {
  const rosterKeys = rosters
    .map((roster) => normalizeRosterIdKey(roster.roster_id))
    .filter(Boolean);
  const ownedByRoster = new Map(rosterKeys.map((rosterKey) => [rosterKey, []]));
  const explicitPickCount = rosters.reduce(
    (total, roster) => total + (Array.isArray(roster?.picks) ? roster.picks.length : 0),
    0
  );

  if (explicitPickCount > 0) {
    rosters.forEach((roster) => {
      const rosterKey = normalizeRosterIdKey(roster.roster_id);
      if (!rosterKey) return;
      ownedByRoster.set(
        rosterKey,
        (Array.isArray(roster.picks) ? roster.picks : [])
          .map((pick) => normalizeOwnedPickRecord(pick, roster.roster_id))
          .filter(Boolean)
      );
    });
    return ownedByRoster;
  }

  const seasons = inferLeaguePickSeasons(league, rosters, tradedPicks, pickValueCatalog);
  const draftRounds = inferLeagueDraftRounds(league, rosters, tradedPicks);
  if (seasons.length === 0 || draftRounds <= 0) return ownedByRoster;

  const rosterKeySet = new Set(rosterKeys);
  const currentOwnerByPick = new Map();

  for (const season of seasons) {
    for (let round = 1; round <= draftRounds; round++) {
      for (const originalOwnerKey of rosterKeys) {
        currentOwnerByPick.set(buildOwnedPickKey(season, round, originalOwnerKey), originalOwnerKey);
      }
    }
  }

  tradedPicks
    .map((pick) => normalizeTradedPickRecord(pick))
    .filter(Boolean)
    .forEach((pick) => {
      const originalOwnerKey = normalizeRosterIdKey(pick.roster_id);
      const currentOwnerKey = normalizeRosterIdKey(pick.owner_id);
      if (
        !originalOwnerKey
        || !currentOwnerKey
        || !rosterKeySet.has(originalOwnerKey)
        || !rosterKeySet.has(currentOwnerKey)
      ) {
        return;
      }
      currentOwnerByPick.set(buildOwnedPickKey(pick.season, pick.round, originalOwnerKey), currentOwnerKey);
    });

  currentOwnerByPick.forEach((currentOwnerKey, ownershipKey) => {
    const targetList = ownedByRoster.get(currentOwnerKey);
    if (!targetList) return;

    const [season, roundToken, originalOwnerKey] = ownershipKey.split(":");
    targetList.push({
      season,
      round: Number(roundToken),
      roster_id: toNumericIfPossible(originalOwnerKey),
      original_owner: toNumericIfPossible(originalOwnerKey),
      owner_id: toNumericIfPossible(currentOwnerKey),
      previous_owner_id: toNumericIfPossible(currentOwnerKey),
    });
  });

  ownedByRoster.forEach((picks) => {
    picks.sort((a, b) => {
      const seasonDiff = Number(a.season) - Number(b.season);
      if (seasonDiff !== 0) return seasonDiff;
      const roundDiff = Number(a.round) - Number(b.round);
      if (roundDiff !== 0) return roundDiff;
      return String(a.original_owner).localeCompare(String(b.original_owner));
    });
  });

  return ownedByRoster;
}

function normalizeRosters(league, rosters, users, players, previousContext = { league: null, users: [], rosters: [] }, tradedPicks = []) {
  const userById = new Map(users.map((u) => [String(u.user_id), u]));
  const rosterById = new Map(rosters.map((roster) => [String(roster.roster_id), roster]));
  const previousFinishLookup = buildPreviousFinishLookup(previousContext.league, previousContext.rosters);
  const ownedPicksByRoster = buildOwnedPicksByRoster(league, rosters, tradedPicks);

  return rosters.map((roster) => {
    const owner = userById.get(String(roster.owner_id)) || {};
    const playerAssets = (roster.players || []).map((playerId) => {
      const p = players[playerId] || {};
      const name = `${(p.first_name || "").trim()} ${(p.last_name || "").trim()}`.trim() || p.full_name || playerId;
      return {
        assetId: `player:${playerId}`,
        name,
        assetType: "player",
        raw: p,
      };
    });

    const pickAssets = (ownedPicksByRoster.get(String(roster.roster_id)) || []).map((pick) => {
      const finishInfo = resolvePreviousFinishInfo(pick.original_owner, rosterById, previousFinishLookup);
      const pickBucket = Number(pick.round) === 1 ? finishInfo?.bucket || "any" : "any";
      return {
        assetId: `pick:${pick.season}:r${pick.round}:${pick.original_owner || "any"}`,
        valueAssetId: buildPickValueAssetId(pick, pickBucket),
        valueBucket: pickBucket,
        name: formatPickName(pick, { userById, rosterById, previousFinishLookup, pickBucket }),
        assetType: "pick",
        raw: {
          ...pick,
          ktcBucket: pickBucket,
          previousFinishLabel: finishInfo?.label || null,
        },
      };
    });

    return {
      rosterId: roster.roster_id,
      manager: {
        userId: roster.owner_id || "unknown",
        displayName: displayNameForUser(owner, `Roster ${roster.roster_id}`),
      },
      assets: [...playerAssets, ...pickAssets],
    };
  });
}

function displayNameForUser(user, fallback) {
  if (!user) return fallback;
  return user.display_name || user.username || fallback;
}

function extractRosterPoints(roster) {
  const settings = roster?.settings || {};
  if (settings.fpts == null) return null;
  return Number(settings.fpts) + Number(settings.fpts_decimal || 0) / 100;
}

function ordinal(rank) {
  const mod100 = rank % 100;
  if (mod100 >= 10 && mod100 <= 20) return `${rank}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[rank % 10] || "th";
  return `${rank}${suffix}`;
}

function formatPreviousYearRankLabel(rank, totalTeams) {
  if (!Number.isFinite(rank) || !Number.isFinite(totalTeams) || totalTeams <= 0) {
    return "Previous Year";
  }
  return `${ordinal(rank)}/${ordinal(totalTeams)} in Previous Year`;
}

function buildPreviousFinishLookup(previousLeague, previousRosters = []) {
  if (!previousLeague || previousRosters.length === 0) {
    return { byRosterId: new Map(), byUserId: new Map() };
  }

  const season = String(previousLeague.season || "previous season");
  const ranked = previousRosters
    .map((roster) => ({
      rosterId: String(roster.roster_id),
      ownerId: roster.owner_id != null ? String(roster.owner_id) : null,
      explicitRank: extractRosterFinishRank(roster),
      wins: Number(roster?.settings?.wins || 0),
      losses: Number(roster?.settings?.losses || 0),
      ties: Number(roster?.settings?.ties || 0),
      points: extractRosterPoints(roster),
    }))
    .sort((a, b) => {
      if (Number.isFinite(a.explicitRank) && Number.isFinite(b.explicitRank)) return a.explicitRank - b.explicitRank;
      if (Number.isFinite(a.explicitRank)) return -1;
      if (Number.isFinite(b.explicitRank)) return 1;
      return b.wins - a.wins
        || a.losses - b.losses
        || b.ties - a.ties
        || (b.points || 0) - (a.points || 0)
        || Number(a.rosterId) - Number(b.rosterId);
    });

  const byRosterId = new Map();
  const byUserId = new Map();
  const totalTeams = ranked.length;
  ranked.forEach((entry, index) => {
    const finishRank = Number.isFinite(entry.explicitRank) ? entry.explicitRank : index + 1;
    const bucket = determineFirstRoundBucket(finishRank, totalTeams);
    const tierLabel = describeFinishTier(finishRank, totalTeams);
    const info = {
      rank: finishRank,
      season,
      totalTeams,
      bucket,
      tierLabel,
      label: formatPreviousYearRankLabel(finishRank, totalTeams),
    };
    byRosterId.set(entry.rosterId, info);
    if (entry.ownerId) byUserId.set(entry.ownerId, info);
  });

  return { byRosterId, byUserId };
}

function extractRosterFinishRank(roster) {
  const settings = roster?.settings || {};
  const candidates = [settings.rank, settings.final_rank, settings.standings_rank];
  for (const candidate of candidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return null;
}

function determineFirstRoundBucket(finishRank, totalTeams) {
  if (!Number.isFinite(finishRank) || !Number.isFinite(totalTeams) || totalTeams <= 0) return "any";
  const tierSize = Math.max(1, Math.floor(totalTeams / 3));
  if (finishRank <= tierSize) return "late";
  if (finishRank > totalTeams - tierSize) return "early";
  return "mid";
}

function describeFinishTier(finishRank, totalTeams) {
  if (!Number.isFinite(finishRank) || !Number.isFinite(totalTeams) || totalTeams <= 0) return "previous finish";
  const tierSize = Math.max(1, Math.floor(totalTeams / 3));
  const middleSize = Math.max(1, totalTeams - tierSize * 2);
  if (finishRank <= tierSize) return `top ${tierSize}`;
  if (finishRank > totalTeams - tierSize) return `bottom ${tierSize}`;
  return `middle ${middleSize}`;
}

function resolvePickOwnerName(originalOwner, rosterById, userById) {
  if (originalOwner == null) return null;

  const ownerKey = String(originalOwner);
  const roster = rosterById.get(ownerKey);
  if (roster) {
    const owner = roster.owner_id != null ? userById.get(String(roster.owner_id)) : null;
    return displayNameForUser(owner, `Roster ${roster.roster_id}`);
  }

  const user = userById.get(ownerKey);
  if (user) return displayNameForUser(user, ownerKey);
  return null;
}

function resolvePreviousFinishInfo(originalOwner, rosterById, previousFinishLookup) {
  if (originalOwner == null) return null;

  const ownerKey = String(originalOwner);
  if (previousFinishLookup.byRosterId.has(ownerKey)) return previousFinishLookup.byRosterId.get(ownerKey);
  if (previousFinishLookup.byUserId.has(ownerKey)) return previousFinishLookup.byUserId.get(ownerKey);

  const roster = rosterById.get(ownerKey);
  if (!roster) return null;

  const rosterKey = String(roster.roster_id);
  if (previousFinishLookup.byRosterId.has(rosterKey)) return previousFinishLookup.byRosterId.get(rosterKey);

  const ownerId = roster.owner_id != null ? String(roster.owner_id) : null;
  if (ownerId && previousFinishLookup.byUserId.has(ownerId)) return previousFinishLookup.byUserId.get(ownerId);
  return null;
}

function resolvePreviousFinishLabel(originalOwner, rosterById, previousFinishLookup) {
  return resolvePreviousFinishInfo(originalOwner, rosterById, previousFinishLookup)?.label || null;
}

function buildPickValueAssetId(pick, pickBucket = "any") {
  const bucket = Number(pick?.round) === 1 ? normalizePickBucket(pickBucket) : "any";
  return `pick:${pick.season}:r${pick.round}:${bucket}`;
}

function formatPickName(pick, { userById, rosterById, previousFinishLookup, pickBucket = "any" }) {
  const details = [];
  const ownerName = resolvePickOwnerName(pick.original_owner, rosterById, userById);
  if (ownerName) details.push(`from ${ownerName}`);

  const finishLabel = resolvePreviousFinishLabel(pick.original_owner, rosterById, previousFinishLookup);
  if (finishLabel) details.push(finishLabel);

  const suffix = details.length ? ` (${details.join(", ")})` : "";
  const bucketLabel = Number(pick.round) === 1 && normalizePickBucket(pickBucket) !== "any"
    ? ` ${formatPickBucketLabel(pickBucket)}`
    : "";
  return `${pick.season}${bucketLabel} ${ordinal(Number(pick.round) || 1)}${suffix}`;
}

async function loadValues(optionalUrl) {
  if (optionalUrl) {
    const payload = await fetch(optionalUrl).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
    return coerceValueMap(payload);
  }

  const csvText = await fetch(SAMPLE_VALUES_PATH).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  });
  return parseCsvValues(csvText);
}

function primeValuationData() {
  ensureValuesLoaded("").catch((err) => {
    console.warn("Could not preload valuation data", err);
  });
}

async function ensureValuesLoaded(optionalUrl = "") {
  if (optionalUrl) {
    return applyValuationBundle(await loadValues(optionalUrl), { rerender: false });
  }

  if (Object.keys(state.values).length > 0 && state.pickValueCatalog.length > 0) {
    return { values: state.values, nameMap: state.valueNameMap };
  }

  if (!state.valuationsPromise) {
    state.valuationsPromise = loadValues("")
      .then((bundle) => applyValuationBundle(bundle))
      .catch((err) => {
        state.valuationsPromise = null;
        throw err;
      });
  }

  return state.valuationsPromise;
}

function applyValuationBundle(bundle, { rerender = true } = {}) {
  state.values = bundle?.values && typeof bundle.values === "object" ? bundle.values : {};
  state.valueNameMap = bundle?.nameMap && typeof bundle.nameMap === "object" ? bundle.nameMap : {};
  refreshPlayerPositionRanks();
  state.pickValueCatalog = buildPickValuationCatalog(state.values, state.valueNameMap);
  state.globalMaxPlayerValue = getGlobalMaxPlayerValue(state.values);

  if (state.league && state.rosters.length > 0 && state.users.length > 0) {
    state.normalizedRosters = normalizeRosters(
      state.league,
      state.rosters,
      state.users,
      state.players,
      {
        league: state.previousLeague,
        users: state.previousUsers,
        rosters: state.previousRosters,
      },
      state.tradedPicks
    );
    pruneSelectedOutgoingAssets();
    pruneExcludedOutgoingAssets();
  }

  if (rerender) {
    renderPlayerSearch();
    renderOutgoingAssetSearch();
  }

  return {
    values: state.values,
    nameMap: state.valueNameMap,
  };
}

function parseCsvValues(csvText) {
  const rows = csvText.trim().split("\n");
  const values = {};
  const nameMap = {};
  for (let i = 1; i < rows.length; i++) {
    const [assetId, rawValue, ...rawNameParts] = rows[i].split(",");
    const value = Number(rawValue);
    const name = rawNameParts.join(",").trim();
    if (assetId && Number.isFinite(value)) {
      values[assetId] = value;
      if (name) nameMap[assetId] = name;
    }
  }
  return { values, nameMap };
}

function coerceValueMap(payload) {
  if (Array.isArray(payload)) {
    return payload.reduce((acc, item) => {
      if (item?.asset_id && Number.isFinite(item.value)) {
        acc.values[item.asset_id] = item.value;
        if (item.name) acc.nameMap[item.asset_id] = item.name;
      }
      return acc;
    }, { values: {}, nameMap: {} });
  }
  return {
    values: payload?.values && typeof payload.values === "object" ? payload.values : payload,
    nameMap: payload?.nameMap && typeof payload.nameMap === "object" ? payload.nameMap : {},
  };
}

async function apiGet(path, { timeoutMs = 25000 } = {}) {
  const controller = new AbortController();
  const abortTimeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await withTimeout(fetch(`${API_BASE}${path}`, { signal: controller.signal, cache: "no-store" }), timeoutMs + 1500, `Request timed out after ${Math.round(timeoutMs / 1000)}s`);
    if (!response.ok) {
      throw new Error(`Sleeper API returned ${response.status}`);
    }
    return await withTimeout(response.json(), timeoutMs + 1500, "Sleeper API response parse timed out");
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Sleeper API timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    if (err instanceof TypeError) {
      throw new Error("Network/CORS error while contacting Sleeper API");
    }
    throw err;
  } finally {
    clearTimeout(abortTimeoutId);
  }
}

function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

function setStatus(message, { ok = false, loading = false } = {}) {
  el.leagueStatusText.textContent = message;
  el.leagueStatus.className = `status ${ok ? "ok" : loading ? "loading" : "muted"}`;
  el.leagueStatusLoader.classList.toggle("hidden", !loading);
}

function startLeagueLoadingUi() {
  el.loadLeagueBtn.disabled = true;
  el.loadLeagueBtn.classList.add("loading");
  el.loadLeagueBtn.textContent = "Loading...";

  leagueLoadStartedAt = Date.now();
  setStatus("Loading Sleeper data...", { loading: true });

  clearInterval(leagueLoadAnimationTimer);
  leagueLoadAnimationTimer = setInterval(() => {
    const elapsedSec = Math.floor((Date.now() - leagueLoadStartedAt) / 1000);
    setStatus(`Loading Sleeper data • ${elapsedSec}s`, { loading: true });
  }, 850);
}

function stopLeagueLoadingUi() {
  clearInterval(leagueLoadAnimationTimer);
  leagueLoadAnimationTimer = null;
  el.loadLeagueBtn.disabled = false;
  el.loadLeagueBtn.classList.remove("loading");
  el.loadLeagueBtn.textContent = "Load League";
}
