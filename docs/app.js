const API_BASE = "https://api.sleeper.app/v1";
const SAMPLE_VALUES_PATH = "./data/ktc_values_sample.csv";
const PLAYERS_CACHE_KEY = "fda_players_nfl_cache_v1";
const PLAYERS_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const DEFAULT_FAIRNESS_PCT = 20;
const KTC_RAW_BASE = 0.10;
const KTC_RAW_ELITE_WEIGHT = 0.04;
const KTC_RAW_TRADE_WEIGHT = 0.09;
const KTC_RAW_DEPTH_WEIGHT = 0.24;
const KTC_GLOBAL_MAX_FALLBACK = 9999;

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
  values: {},
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
  snapshotLeague: document.querySelector("#snapshot-league"),
  snapshotManager: document.querySelector("#snapshot-manager"),
  snapshotTarget: document.querySelector("#snapshot-target"),
  snapshotPool: document.querySelector("#snapshot-pool"),
  identitySection: document.querySelector("#identity-section"),
  meSelect: document.querySelector("#me-select"),
  playerSection: document.querySelector("#player-section"),
  targetPlayersToggle: document.querySelector("#target-players-toggle"),
  targetPicksToggle: document.querySelector("#target-picks-toggle"),
  playerSearch: document.querySelector("#player-search"),
  playerResults: document.querySelector("#player-results"),
  builderSection: document.querySelector("#builder-section"),
  givePlayersToggle: document.querySelector("#give-players-toggle"),
  givePicksToggle: document.querySelector("#give-picks-toggle"),
  myAssetSearch: document.querySelector("#my-asset-search"),
  myAssetResults: document.querySelector("#my-asset-results"),
  selectVisibleAssetsBtn: document.querySelector("#select-visible-assets-btn"),
  clearSelectedAssetsBtn: document.querySelector("#clear-selected-assets-btn"),
  clearExcludedAssetsBtn: document.querySelector("#clear-excluded-assets-btn"),
  selectedAssetsSummary: document.querySelector("#selected-assets-summary"),
  excludeAssetSelect: document.querySelector("#exclude-asset-select"),
  excludedAssetsSummary: document.querySelector("#excluded-assets-summary"),
  excludedAssetsList: document.querySelector("#excluded-assets-list"),
  marketSection: document.querySelector("#market-section"),
  positionPremiumSelect: document.querySelector("#position-premium-select"),
  tradeVibeSelect: document.querySelector("#trade-vibe-select"),
  teamStateSelect: document.querySelector("#team-state-select"),
  pickPremiumToggle: document.querySelector("#pick-premium-toggle"),
  youthPremiumToggle: document.querySelector("#youth-premium-toggle"),
  depthPremiumToggle: document.querySelector("#depth-premium-toggle"),
  protectCoreToggle: document.querySelector("#protect-core-toggle"),
  protectFirstsToggle: document.querySelector("#protect-firsts-toggle"),
  preferConsolidationToggle: document.querySelector("#prefer-consolidation-toggle"),
  swingBigToggle: document.querySelector("#swing-big-toggle"),
  settingsSection: document.querySelector("#settings-section"),
  fairnessInput: document.querySelector("#fairness-input"),
  maxResultsInput: document.querySelector("#max-results-input"),
  ktcUrlInput: document.querySelector("#ktc-url-input"),
  allowExtraTargetAssetsInput: document.querySelector("#allow-extra-target-assets"),
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
el.targetPlayersToggle?.addEventListener("change", () => updateAssetTypeFilter("target", "players", el.targetPlayersToggle.checked));
el.targetPicksToggle?.addEventListener("change", () => updateAssetTypeFilter("target", "picks", el.targetPicksToggle.checked));
el.givePlayersToggle?.addEventListener("change", () => updateAssetTypeFilter("outgoing", "players", el.givePlayersToggle.checked));
el.givePicksToggle?.addEventListener("change", () => updateAssetTypeFilter("outgoing", "picks", el.givePicksToggle.checked));
el.myAssetSearch?.addEventListener("input", () => {
  invalidateResults();
  renderOutgoingAssetSearch();
});
el.selectVisibleAssetsBtn?.addEventListener("click", selectVisibleOutgoingAssets);
el.clearSelectedAssetsBtn?.addEventListener("click", clearSelectedOutgoingAssets);
el.clearExcludedAssetsBtn?.addEventListener("click", clearExcludedOutgoingAssets);
el.excludeAssetSelect?.addEventListener("change", handleExcludedAssetSelectChange);
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

function renderSessionSnapshot() {
  const meRosterId = Number(el.meSelect?.value || state.meRosterId);
  const meRoster = state.normalizedRosters.find((roster) => roster.rosterId === meRosterId) || null;

  if (el.snapshotLeague) {
    el.snapshotLeague.textContent = state.leagueName || "Waiting for load";
  }
  if (el.snapshotManager) {
    el.snapshotManager.textContent = meRoster?.manager.displayName || (state.normalizedRosters.length ? "Choose manager" : "Choose after load");
  }
  if (el.snapshotTarget) {
    el.snapshotTarget.textContent = state.targetAsset?.name || "No target yet";
  }
  if (el.snapshotPool) {
    if (state.selectedOutgoingAssetIds.size > 0 || state.excludedOutgoingAssetIds.size > 0) {
      const notes = [];
      if (state.selectedOutgoingAssetIds.size > 0) {
        notes.push(`${state.selectedOutgoingAssetIds.size} included`);
      }
      if (state.excludedOutgoingAssetIds.size > 0) {
        notes.push(`${state.excludedOutgoingAssetIds.size} protected`);
      }
      el.snapshotPool.textContent = notes.join(" / ");
    } else if (state.leagueName) {
      el.snapshotPool.textContent = "Builder picks the package";
    } else {
      el.snapshotPool.textContent = "Optional shortlist";
    }
  }
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
  renderSessionSnapshot();
  el.resultsList.innerHTML = "";
  el.resultsSection.classList.add("hidden");

  try {
    const { league, users, rosters } = await loadLeagueCoreData(leagueId);
    const previousContext = await loadPreviousLeagueContext(league);

    state.leagueId = leagueId;
    state.leagueName = league?.name || `League ${leagueId}`;
    state.league = league;
    state.users = users;
    state.rosters = rosters;
    state.players = {};
    state.previousLeague = previousContext.league;
    state.previousUsers = previousContext.users;
    state.previousRosters = previousContext.rosters;
    state.normalizedRosters = normalizeRosters(rosters, users, state.players, previousContext);

    hydrateManagerSelector();
    renderSessionSnapshot();
    el.identitySection.classList.remove("hidden");
    el.playerSection.classList.remove("hidden");
    el.builderSection.classList.remove("hidden");
    el.marketSection.classList.remove("hidden");
    el.settingsSection.classList.remove("hidden");
    setStatus(`Loaded ${state.leagueName}. Player names are still syncing...`, { loading: true });

    loadPlayersWithCache()
      .then((players) => {
        state.players = players;
        state.normalizedRosters = normalizeRosters(state.rosters, state.users, players, {
          league: state.previousLeague,
          users: state.previousUsers,
          rosters: state.previousRosters,
        });
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
    } else {
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

  const preservedRoster = state.normalizedRosters.find((roster) => roster.rosterId === selectedRosterId);
  if (preservedRoster) {
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
  const position = playerPositionForAsset(asset);
  const haystack = [asset.name, pickSeason, pickRound, position, asset.assetType].join(" ").toLowerCase();
  return haystack.includes(query);
}

function sortAssetsForList(a, b) {
  if (a.assetType !== b.assetType) return a.assetType === "player" ? -1 : 1;
  return a.name.localeCompare(b.name);
}

function renderPlayerSearch() {
  if (!state.meRosterId) return;
  const meRosterId = Number(el.meSelect.value || state.meRosterId);
  state.meRosterId = meRosterId;
  const query = el.playerSearch.value.trim().toLowerCase();
  let snapshotNeedsRefresh = false;

  if (
    state.targetAsset &&
    (state.targetAsset.managerRosterId === meRosterId || !assetTypeAllowed(state.targetAsset, state.targetFilters))
  ) {
    state.targetAsset = null;
    snapshotNeedsRefresh = true;
  }

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
    .sort(sortAssetsForList)
    .slice(0, 150);

  el.playerResults.innerHTML = "";

  if (candidates.length === 0) {
    el.playerResults.innerHTML = `<div class="player-item muted">No matching players found on other rosters.</div>`;
    if (snapshotNeedsRefresh) renderSessionSnapshot();
    return;
  }

  for (const asset of candidates) {
    const row = document.createElement("div");
    row.className = `player-item ${state.targetAsset?.assetId === asset.assetId ? "selected" : ""}`;
    row.innerHTML = buildAssetPickerMarkup(asset, {
      values: state.values,
      contextLabel: asset.managerName,
    });
    row.addEventListener("click", () => {
      state.targetAsset = asset;
      el.resultsSection.classList.add("hidden");
      renderSessionSnapshot();
      renderPlayerSearch();
    });
    el.playerResults.appendChild(row);
  }

  if (snapshotNeedsRefresh) renderSessionSnapshot();
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

function handleExcludedAssetSelectChange() {
  const assetId = el.excludeAssetSelect?.value || "";
  if (!assetId) return;
  addExcludedOutgoingAsset(assetId);
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

  const query = el.myAssetSearch?.value.trim().toLowerCase() || "";
  return meRoster.assets
    .filter((asset) => assetTypeAllowed(asset, state.outgoingFilters))
    .filter((asset) => !state.excludedOutgoingAssetIds.has(asset.assetId))
    .filter((asset) => assetMatchesQuery(asset, query))
    .sort(sortAssetsForList)
    .slice(0, 150);
}

function selectVisibleOutgoingAssets() {
  invalidateResults();
  const visibleAssets = getVisibleOutgoingAssets();
  visibleAssets.forEach((asset) => state.selectedOutgoingAssetIds.add(asset.assetId));
  renderOutgoingAssetSearch();
}

function clearSelectedOutgoingAssets() {
  invalidateResults();
  state.selectedOutgoingAssetIds.clear();
  renderOutgoingAssetSearch();
}

function toggleOutgoingAsset(assetId) {
  invalidateResults();
  if (state.selectedOutgoingAssetIds.has(assetId)) {
    state.selectedOutgoingAssetIds.delete(assetId);
  } else {
    state.selectedOutgoingAssetIds.add(assetId);
  }
  renderOutgoingAssetSearch();
}

function renderOutgoingAssetSearch() {
  if (!el.myAssetResults) return;
  const meRoster = getMyRoster();
  renderExcludedAssetControls(meRoster);
  if (!meRoster) {
    el.myAssetResults.innerHTML = `<div class="player-item muted">Choose your team first.</div>`;
    updateSelectedAssetsSummary();
    return;
  }

  const visibleAssets = getVisibleOutgoingAssets();
  el.myAssetResults.innerHTML = "";

  if (visibleAssets.length === 0) {
    const emptyState = state.excludedOutgoingAssetIds.size > 0
      ? "No matching assets found outside your protected list."
      : "No matching assets found on your roster.";
    el.myAssetResults.innerHTML = `<div class="player-item muted">${emptyState}</div>`;
    updateSelectedAssetsSummary();
    return;
  }

  for (const asset of visibleAssets) {
    const row = document.createElement("div");
    const selected = state.selectedOutgoingAssetIds.has(asset.assetId);
    row.className = `player-item ${selected ? "selected" : ""}`;
    row.innerHTML = buildAssetPickerMarkup(asset, {
      values: state.values,
      contextLabel: selected ? "Selected for your side" : "Tap to include on your side",
      emphasisTags: getProtectionTags(asset, meRoster, state.values),
    });
    row.addEventListener("click", () => toggleOutgoingAsset(asset.assetId));
    el.myAssetResults.appendChild(row);
  }

  updateSelectedAssetsSummary();
}

function renderExcludedAssetControls(meRoster = getMyRoster()) {
  hydrateExcludedAssetSelect(meRoster);
  renderExcludedOutgoingAssets(meRoster);
  updateExcludedAssetsSummary();
}

function hydrateExcludedAssetSelect(meRoster = getMyRoster()) {
  if (!el.excludeAssetSelect) return;

  el.excludeAssetSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";

  if (!meRoster) {
    placeholder.textContent = "Choose your team first.";
    el.excludeAssetSelect.appendChild(placeholder);
    el.excludeAssetSelect.disabled = true;
    return;
  }

  const availableAssets = meRoster.assets
    .filter((asset) => !state.excludedOutgoingAssetIds.has(asset.assetId))
    .sort(sortAssetsForList);

  placeholder.textContent = availableAssets.length > 0
    ? "Select a player or pick to protect"
    : "No more assets available to protect";
  el.excludeAssetSelect.appendChild(placeholder);

  for (const asset of availableAssets) {
    const option = document.createElement("option");
    option.value = asset.assetId;
    option.textContent = buildAssetSelectLabel(asset);
    el.excludeAssetSelect.appendChild(option);
  }

  el.excludeAssetSelect.value = "";
  el.excludeAssetSelect.disabled = availableAssets.length === 0;
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
    .sort(sortAssetsForList);

  if (protectedAssets.length === 0) {
    el.excludedAssetsList.innerHTML = `<p class="muted small">No protected assets yet.</p>`;
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

  if (state.selectedOutgoingAssetIds.size > 0) {
    el.selectedAssetsSummary.textContent = `${state.selectedOutgoingAssetIds.size} exact piece${state.selectedOutgoingAssetIds.size === 1 ? "" : "s"} selected. Trade ideas will only use these included assets.`;
    renderSessionSnapshot();
    return;
  }

  el.selectedAssetsSummary.textContent = "Optional. Leave this blank and the builder can use players or picks while avoiding your highest-value core pieces.";
  renderSessionSnapshot();
}

function updateExcludedAssetsSummary() {
  if (!el.excludedAssetsSummary) return;

  if (state.excludedOutgoingAssetIds.size > 0) {
    el.excludedAssetsSummary.textContent = `${state.excludedOutgoingAssetIds.size} protected piece${state.excludedOutgoingAssetIds.size === 1 ? "" : "s"} will stay off your side of every trade idea.`;
    renderSessionSnapshot();
    return;
  }

  el.excludedAssetsSummary.textContent = "Optional. Protected assets stay out of generated trade ideas.";
  renderSessionSnapshot();
}

function buildAssetSelectLabel(asset) {
  const details = [];
  if (asset.assetType === "player") {
    const position = playerPositionForAsset(asset);
    if (position) details.push(position);
    if (asset.raw?.team) details.push(asset.raw.team);
  }
  if (asset.assetType === "pick") {
    if (asset.raw?.season) details.push(String(asset.raw.season));
    if (asset.raw?.round) details.push(`R${asset.raw.round}`);
  }
  return details.length > 0 ? `${asset.name} - ${details.join(" - ")}` : asset.name;
}

function buildAssetPickerMarkup(asset, { values, contextLabel, emphasisTags = [] } = {}) {
  const pills = [];
  pills.push(`<span class="asset-pill ${asset.assetType === "pick" ? "gold" : ""}">${asset.assetType === "pick" ? "Pick" : playerPositionForAsset(asset) || "Player"}</span>`);

  if (asset.assetType === "player" && asset.raw?.age) {
    pills.push(`<span class="asset-pill">${asset.raw.age} yrs</span>`);
  }

  if (asset.assetType === "pick") {
    if (asset.raw?.season) pills.push(`<span class="asset-pill">${asset.raw.season}</span>`);
    if (asset.raw?.round) pills.push(`<span class="asset-pill">R${asset.raw.round}</span>`);
  }

  emphasisTags.slice(0, 2).forEach((tag) => pills.push(`<span class="asset-pill rose">${tag}</span>`));

  return `
    <div class="asset-row-top">
      <div class="asset-name-stack">
        <strong>${asset.name}</strong>
        ${contextLabel ? `<span class="asset-context">${contextLabel}</span>` : ""}
      </div>
      <span class="asset-value-badge">Value ${formatNumber(getAssetValue(asset, values))}</span>
    </div>
    <div class="asset-meta">
      ${pills.join("")}
    </div>
  `;
}

function getProtectionTags(asset, myRoster, values) {
  const tags = [];
  if (getCoreAssetIdSet(myRoster, values).has(asset.assetId)) {
    tags.push("Core piece");
  }
  if (isFirstRoundPick(asset)) {
    tags.push("1st-round pick");
  }
  return tags;
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

  const fairnessPct = DEFAULT_FAIRNESS_PCT;
  const maxResults = clamp(Number(el.maxResultsInput?.value || 3), 1, 6);
  const tradeLab = getTradeLabSettings();

  try {
    setButtonLoading(el.generateBtn, true, "Building trade ideas...");
    state.values = await loadValues(el.ktcUrlInput?.value?.trim() || "");
    renderPlayerSearch();
    renderOutgoingAssetSearch();

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

    el.resultsList.innerHTML = [
      renderTradeIdeaGroup({
        title: "Direct ideas",
        subtitle: `Straight-up offers for ${state.targetAsset.name} only.`,
        emptyText: "No direct offers survived the value and roster-fit checks.",
        ideas: directIdeas,
        values: state.values,
      }),
      renderTradeIdeaGroup({
        title: "Throw-in-back ideas",
        subtitle: `${state.targetAsset.name} plus one smaller piece from their side.`,
        emptyText: "No clean throw-in-back variations fit the current setup.",
        ideas: throwInIdeas,
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
  notes.push(`${tradeLab.tradeVibe} room`);
  if (tradeLab.positionPremium !== "none") notes.push(`${tradeLab.positionPremium} premium`);
  if (tradeLab.selectedOutgoingAssetIds.size > 0) {
    notes.push(`${tradeLab.selectedOutgoingAssetIds.size} hand-picked asset${tradeLab.selectedOutgoingAssetIds.size === 1 ? "" : "s"}`);
  }
  if (tradeLab.excludedOutgoingAssetIds.size > 0) {
    notes.push(`${tradeLab.excludedOutgoingAssetIds.size} protected asset${tradeLab.excludedOutgoingAssetIds.size === 1 ? "" : "s"}`);
  }
  return `${meRoster.manager.displayName} targeting ${targetAsset.name} from ${theirRoster.manager.displayName} • ${notes.join(" • ")}`;
}

function buildNoIdeasMessage(tradeLab) {
  const advice = [];
  if (tradeLab.selectedOutgoingAssetIds.size > 0) advice.push("leave the include list blank or include more pieces");
  if (tradeLab.excludedOutgoingAssetIds.size > 0) advice.push("protect fewer assets");
  advice.push("change the target");
  advice.push("try a different team-state lens");
  return `No trade ideas cleared the value and fit checks. Try to ${advice.join(", ")}.`;
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
  return `
    <article class="trade-card">
      <div class="trade-card-header">
        <div>
          <h3>Idea ${index + 1}</h3>
          <p class="trade-style-label">${idea.styleLabel}</p>
          <p class="muted small">${idea.summary}</p>
        </div>
        <span class="trade-score">Trade Lab ${idea.labScore}</span>
      </div>
      <div class="trade-tag-row">
        ${idea.tags.map((tag) => `<span class="trade-tag">${tag}</span>`).join("")}
      </div>
      <div class="trade-body-grid">
        <section class="trade-side">
          <h4>You send</h4>
          ${renderAssetList(idea.myAssets, values)}
        </section>
        <section class="trade-side">
          <h4>You receive</h4>
          ${renderAssetList(idea.theirAssets, values)}
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
          ${formatNumber(idea.evenValue)}
        </div>
      </div>
      <p class="trade-pitch"><strong>Pitch:</strong> ${idea.pitch}</p>
    </article>
  `;
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
}) {
  const targetValue = getAssetValue(targetAsset, values);
  if (!Number.isFinite(targetValue)) return [];

  const myAssetPool = resolveOutgoingAssetPool({ myRoster, values, tradeLab });
  if (myAssetPool.length === 0) return [];

  const globalMaxValue = getGlobalMaxPlayerValue(values, targetValue);
  const myPackages = buildPackages(myAssetPool, values, 3);
  const theirPackages = buildTargetPackages({ theirRoster, targetAsset, values, allowExtraTargetAssets, maxExtraAssets: 1 }).filter(
    (pkg) => (requireExtraTargetAsset ? pkg.assets.length > 1 : pkg.assets.length === 1)
  );
  const effectiveFairnessPct = getEffectiveFairnessPct(fairnessPct, tradeLab.tradeVibe);
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
        });

        rawIdeas.push({
          myAssets: myPackage.assets,
          theirAssets: theirPackage.assets,
          ...packageResult,
          pctDiff: Number(pctDiff.toFixed(2)),
          styleLabel: ideaStyle === "throw-in-back" ? "Throw-in back" : "Direct",
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

  return deduped.slice(0, maxResults);
}

function resolveOutgoingAssetPool({ myRoster, values, tradeLab }) {
  let pool = myRoster.assets.filter((asset) =>
    !tradeLab.excludedOutgoingAssetIds.has(asset.assetId)
    && (
      (asset.assetType === "player" && tradeLab.allowPlayers)
      || (asset.assetType === "pick" && tradeLab.allowPicks)
    )
  );

  if (tradeLab.selectedOutgoingAssetIds.size > 0) {
    return pool.filter((asset) => tradeLab.selectedOutgoingAssetIds.has(asset.assetId));
  }

  const coreAssetIds = getCoreAssetIdSet(myRoster, values);
  const nonCorePool = pool.filter((asset) => !coreAssetIds.has(asset.assetId));
  if (nonCorePool.length >= 3) {
    pool = nonCorePool;
  }

  if (tradeLab.teamState === "rebuilding") {
    const nonPremiumFuture = pool.filter((asset) => !isFirstRoundPick(asset));
    if (nonPremiumFuture.length >= 3) {
      pool = nonPremiumFuture;
    }
  }

  return pool;
}

function getEffectiveFairnessPct(fairnessPct, tradeVibe) {
  const vibeBuffer = {
    balanced: 0,
    aggressive: 4,
    chaos: 8,
  };
  return fairnessPct + (vibeBuffer[tradeVibe] || 0);
}

function scoreTradeIdea({ myRoster, theirRoster, targetAsset, myAssets, theirAssets, values, pctDiff, tradeLab, ideaStyle }) {
  const marketMyValue = calculatePerceivedPackageValue(myAssets, values, tradeLab);
  const marketTheirValue = calculatePerceivedPackageValue(theirAssets, values, tradeLab);
  const marketDelta = marketMyValue - marketTheirValue;
  const coreAssetIds = getCoreAssetIdSet(myRoster, values);
  const exposesCore = myAssets.some((asset) => coreAssetIds.has(asset.assetId));

  let labScore = 82;
  labScore -= pctDiff * (tradeLab.tradeVibe === "chaos" ? 0.55 : tradeLab.tradeVibe === "aggressive" ? 0.8 : 1.1);
  labScore += Math.max(-18, Math.min(18, marketDelta / 240));

  if (tradeLab.positionPremium !== "none" && myAssets.some((asset) => playerPositionForAsset(asset) === tradeLab.positionPremium)) {
    labScore += 6;
  }
  if (ideaStyle === "throw-in-back" && theirAssets.length > 1) labScore += 4;
  if (!exposesCore) labScore += 8;
  if (exposesCore) labScore -= 16;
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
    labScore: clamp(Math.round(labScore), 1, 99),
    marketMyValue,
    marketTheirValue,
    marketDelta: Math.round(marketDelta),
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

  const byMarketDelta = b.marketDelta - a.marketDelta;
  if (byMarketDelta !== 0) return byMarketDelta;

  const byEvenValue = a.evenValue - b.evenValue;
  if (byEvenValue !== 0) return byEvenValue;

  return (a.myAssets.length + a.theirAssets.length) - (b.myAssets.length + b.theirAssets.length);
}

function calculatePerceivedPackageValue(assets, values, tradeLab) {
  const total = assets.reduce((sum, asset) => sum + getPerceivedAssetValue(asset, values, tradeLab), 0);
  let packageBonus = 0;

  if (assets.length >= 2) {
    if (tradeLab.tradeVibe === "aggressive") packageBonus += 70 * (assets.length - 1);
    if (tradeLab.tradeVibe === "chaos") packageBonus += 120 * (assets.length - 1);
    if (tradeLab.teamState === "contending") packageBonus += 40 * (assets.length - 1);
  }

  return Math.round(total + packageBonus);
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

  let pitch = `Open with: “I’m trying to get to ${targetAsset.name} without wasting your time. This gives you ${myAssets.length > 1 ? `${myAssets.length} usable pieces` : "real value"} and keeps it close to market.”`;
  if (tradeLab.positionPremium !== "none" && myAssets.some((asset) => playerPositionForAsset(asset) === tradeLab.positionPremium)) {
    pitch = `Open with: “I know ${tradeLab.positionPremium}s carry extra juice in this league, so I built this around that premium instead of random filler.”`;
  } else if (tradeLab.teamState === "rebuilding") {
    pitch = `Open with: “I’m willing to move some win-now value, but I want the return to make sense for a younger timeline around ${targetAsset.name}.”`;
  } else if (tradeLab.teamState === "contending") {
    pitch = `Open with: “I’m trying to turn extra depth and future insulation into a starter I can actually use, and this keeps the value honest.”`;
  } else if (ideaStyle === "throw-in-back" && theirAssets.length > 1) {
    pitch = `Open with: “I’m good paying for ${targetAsset.name}, but I’d want the small add-on back so the deal lands closer to neutral for both sides.”`;
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

function renderAssetList(assets, values) {
  return `
    <ul class="asset-list">
      ${assets
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
    const anyId = asset.assetId.replace(/:[^:]+$/, ":any");
    if (Number.isFinite(values[anyId])) return values[anyId];
  }

  return estimatedValue(asset);
}

function formatAssetSecondaryLabel(asset, values) {
  const parts = [formatNumber(getAssetValue(asset, values))];
  if (asset.assetType === "player") {
    const position = playerPositionForAsset(asset);
    if (position) parts.push(position);
    const age = playerAgeForAsset(asset);
    if (Number.isFinite(age)) parts.push(`${age}y`);
  } else {
    if (asset.raw?.season) parts.push(String(asset.raw.season));
    if (asset.raw?.round) parts.push(`R${asset.raw.round}`);
  }
  return `(${parts.join(" • ")})`;
}

function playerPositionForAsset(asset) {
  return (asset?.raw?.position || asset?.raw?.fantasy_positions?.[0] || "").toUpperCase();
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

function normalizeRosters(rosters, users, players, previousContext = { league: null, users: [], rosters: [] }) {
  const userById = new Map(users.map((u) => [String(u.user_id), u]));
  const rosterById = new Map(rosters.map((roster) => [String(roster.roster_id), roster]));
  const previousFinishLookup = buildPreviousFinishLookup(previousContext.league, previousContext.rosters);

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

    const pickAssets = (roster.picks || []).map((pick) => ({
      assetId: `pick:${pick.season}:r${pick.round}:${pick.original_owner || "any"}`,
      name: formatPickName(pick, { userById, rosterById, previousFinishLookup }),
      assetType: "pick",
      raw: pick,
    }));

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

function buildPreviousFinishLookup(previousLeague, previousRosters = []) {
  if (!previousLeague || previousRosters.length === 0) {
    return { byRosterId: new Map(), byUserId: new Map() };
  }

  const season = String(previousLeague.season || "previous season");
  const ranked = previousRosters
    .map((roster) => ({
      rosterId: String(roster.roster_id),
      ownerId: roster.owner_id != null ? String(roster.owner_id) : null,
      points: extractRosterPoints(roster),
    }))
    .filter((entry) => Number.isFinite(entry.points))
    .sort((a, b) => b.points - a.points || Number(a.rosterId) - Number(b.rosterId));

  const byRosterId = new Map();
  const byUserId = new Map();
  ranked.forEach((entry, index) => {
    const label = `${ordinal(index + 1)} in ${season} PF`;
    byRosterId.set(entry.rosterId, label);
    if (entry.ownerId) byUserId.set(entry.ownerId, label);
  });

  return { byRosterId, byUserId };
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

function resolvePreviousFinishLabel(originalOwner, rosterById, previousFinishLookup) {
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

function formatPickName(pick, { userById, rosterById, previousFinishLookup }) {
  const details = [];
  const ownerName = resolvePickOwnerName(pick.original_owner, rosterById, userById);
  if (ownerName) details.push(`from ${ownerName}`);

  const finishLabel = resolvePreviousFinishLabel(pick.original_owner, rosterById, previousFinishLookup);
  if (finishLabel) details.push(finishLabel);

  const suffix = details.length ? ` (${details.join(", ")})` : "";
  return `${pick.season} Round ${pick.round} Pick${suffix}`;
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

function parseCsvValues(csvText) {
  const rows = csvText.trim().split("\n");
  const out = {};
  for (let i = 1; i < rows.length; i++) {
    const [assetId, rawValue] = rows[i].split(",");
    const value = Number(rawValue);
    if (assetId && Number.isFinite(value)) out[assetId] = value;
  }
  return out;
}

function coerceValueMap(payload) {
  if (Array.isArray(payload)) {
    return payload.reduce((acc, item) => {
      if (item?.asset_id && Number.isFinite(item.value)) acc[item.asset_id] = item.value;
      return acc;
    }, {});
  }
  return payload;
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
