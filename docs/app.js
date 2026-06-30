const API_BASE = "https://api.sleeper.app/v1";
const SAMPLE_VALUES_PATH = "./data/ktc_values_sample.csv";
const PLAYERS_CACHE_KEY = "fda_players_nfl_cache_v1";
const PLAYERS_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const DEFAULT_FAIRNESS_PCT = 20;
const DEFAULT_MAX_RESULTS = 3;
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
const ELITE_VALUE_PREMIUM_TIERS = [
  { floor: 9000, multiplier: 1.32 },
  { floor: 8000, multiplier: 1.27 },
  { floor: 7000, multiplier: 1.21 },
  { floor: 6000, multiplier: 1.15 },
  { floor: 5000, multiplier: 1.09 },
];
const PACKAGE_DIVERSITY_OVERLAP_RATIO = 0.55;
const PACKAGE_DIVERSITY_VALUE_OVERLAP_RATIO = 0.72;
const KTC_RAW_BASE = 0.10;
const KTC_RAW_ELITE_WEIGHT = 0.08;
const KTC_RAW_TRADE_WEIGHT = 0.11;
const KTC_RAW_DEPTH_WEIGHT = 0.18;
const KTC_GLOBAL_MAX_FALLBACK = 9999;
const DEFAULT_MULTI_TEAM_COUNT = 3;
const TRENDING_PLAYERS_LIMIT = 30;
const TRENDING_LOOKBACK_HOURS = 24;
const MULTI_TEAM_MAX_EXTRAS_PER_SENDER = 3;
const MULTI_TEAM_VALUE_STEP = 180;
const MULTI_TEAM_VALUE_VARIANTS = 4;
const MULTI_TEAM_FILLER_POOL_LIMIT = 12;
const SHOP_COUNTERPARTY_POOL_LIMIT = 12;
const MULTI_TEAM_BASE_FAIRNESS_BUFFER = 10;
const MULTI_TEAM_PER_TEAM_FAIRNESS_BUFFER = 2;
const MULTI_TEAM_VARIANT_COUNT = 8;
const MULTI_TEAM_SENDER_PACKAGE_OPTION_LIMIT = 6;
const MULTI_TEAM_MAX_FILLER_PAIRS_PER_ASSET = 3;
const MULTI_TEAM_MAX_FILLER_RATIO_BASE = 0.52;
const MULTI_TEAM_MAX_FILLER_RATIO_STEP = 0.04;
const MULTI_TEAM_MAX_FILLER_OVERSHOOT_BASE = 650;
const MULTI_TEAM_MAX_UNREQUESTED_ANCHOR_RATIO_BASE = 0.82;
const MULTI_TEAM_MAX_UNREQUESTED_ANCHOR_RATIO_STEP = 0.18;
const MULTI_TEAM_MAX_FILLER_OVERAGE_RATIO_BASE = 0.18;
const MULTI_TEAM_MAX_FILLER_OVERAGE_RATIO_STEP = 0.05;
const MULTI_TEAM_COMPENSATION_BEAM_WIDTH = 28;
const MULTI_TEAM_COMPENSATION_BRANCH_LIMIT = 12;
const MULTI_TEAM_COMPENSATION_DONOR_LIMIT = 3;
const MULTI_TEAM_COMPENSATION_RECIPIENT_LIMIT = 3;
const MULTI_TEAM_COMPENSATION_ASSET_POOL_LIMIT = 16;
const MULTI_TEAM_COMPENSATION_TOLERANCE = 425;
const AUTO_MULTI_TEAM_MY_ANCHOR_CANDIDATE_LIMIT = 3;
const AUTO_MULTI_TEAM_HELPER_ANCHOR_CANDIDATE_LIMIT = 2;
const AUTO_MULTI_TEAM_HELPER_ANCHOR_CAP_SHARE = 0.68;
const CUSTOM_MULTI_TEAM_BASE_ANCHOR_CANDIDATE_LIMIT = 3;
const CUSTOM_MULTI_TEAM_SECONDARY_ANCHOR_LIMIT = 2;
const CUSTOM_MULTI_TEAM_SECONDARY_ANCHOR_MIN_SHARE = 0.16;
const CUSTOM_MULTI_TEAM_SECONDARY_ANCHOR_MAX_SHARE = 0.78;
const CUSTOM_MULTI_TEAM_ORDER_LIMIT = 12;
const CUSTOM_MULTI_TEAM_PLAN_LIMIT = 18;
const AUTOSELECT_MANAGER_BY_LEAGUE = {
  "1315165104303513600": "NikoSkiouris",
};
const TRANSACTION_WEEK_START = 1;
const TRANSACTION_WEEK_FALLBACK_END = 18;
const ANALYTICS_RECENT_TRADE_LIMIT = 6;
const ANALYTICS_POWER_RANK_LIMIT = 12;
const ANALYTICS_ASSET_LEADER_LIMIT = 8;

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
  shopAsset: null,
  valuationsPromise: null,
  values: {},
  valueNameMap: {},
  playerPositionRankByAssetId: {},
  pickValueCatalog: [],
  globalMaxPlayerValue: KTC_GLOBAL_MAX_FALLBACK,
  tradedPicks: [],
  currentDraftContext: null,
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
  customParticipantRosterIds: [],
  trendingAdds: [],
  trendingDrops: [],
  trendingLoaded: false,
  playerMetadataLoaded: false,
  playerMetadataFailed: false,
  activePage: "analytics",
  transactions: [],
  transactionsLoaded: false,
  transactionsFailed: false,
  transactionWeeksLoaded: 0,
  transactionLoadError: "",
};

const el = {
  leagueId: document.querySelector("#league-id"),
  loadLeagueBtn: document.querySelector("#load-league-btn"),
  copyLeagueIdBtn: document.querySelector("#copy-league-id-btn"),
  copyLeagueIdFeedback: document.querySelector("#copy-league-id-feedback"),
  leagueStatus: document.querySelector("#league-status"),
  leagueStatusText: document.querySelector("#league-status-text"),
  leagueStatusLoader: document.querySelector("#league-status-loader"),
  chromeLeagueLabel: document.querySelector("#chrome-league-label"),
  chromeManagerLabel: document.querySelector("#chrome-manager-label"),
  chromeModeLabel: document.querySelector("#chrome-mode-label"),
  identitySection: document.querySelector("#identity-section"),
  meSelect: document.querySelector("#me-select"),
  pageTabs: document.querySelector("#page-tabs"),
  analyticsTab: document.querySelector("#analytics-tab"),
  traderTab: document.querySelector("#trader-tab"),
  analyticsPage: document.querySelector("#analytics-page"),
  traderPage: document.querySelector("#trader-page"),
  powerSection: document.querySelector("#power-section"),
  powerDashboard: document.querySelector("#power-dashboard"),
  analyticsSection: document.querySelector("#analytics-section"),
  analyticsDashboard: document.querySelector("#analytics-dashboard"),
  playerSection: document.querySelector("#player-section"),
  tradeModeSelect: document.querySelector("#trade-mode-select"),
  modeCards: document.querySelectorAll("[data-trade-mode]"),
  tradeModeHelp: document.querySelector("#trade-mode-help"),
  playerSearchLabel: document.querySelector("#player-search-label"),
  targetSearchShell: document.querySelector("#target-search-shell"),
  targetChip: document.querySelector("#target-chip"),
  targetChipLabel: document.querySelector("#target-chip-label"),
  clearTargetBtn: document.querySelector("#clear-target-btn"),
  playerSearch: document.querySelector("#player-search"),
  playerResults: document.querySelector("#player-results"),
  settingsSection: document.querySelector("#settings-section"),
  generateBtn: document.querySelector("#generate-btn"),
  generateHelp: document.querySelector("#generate-help"),
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
el.analyticsTab?.addEventListener("click", () => setActivePage("analytics"));
el.traderTab?.addEventListener("click", () => setActivePage("trader"));
el.playerSearch.addEventListener("input", () => {
  invalidateResults();
  renderPlayerSearch();
});
el.tradeModeSelect?.addEventListener("change", () => {
  invalidateResults();
  syncTradeModeUi();
});
el.modeCards?.forEach((button) => {
  button.addEventListener("click", () => {
    if (!el.tradeModeSelect) return;
    el.tradeModeSelect.value = button.dataset.tradeMode || "shop";
    invalidateResults();
    syncTradeModeUi();
  });
});
el.clearTargetBtn?.addEventListener("click", clearTargetAsset);
el.meSelect.addEventListener("change", () => {
  invalidateResults();
  state.meRosterId = Number(el.meSelect.value);
  renderPlayerSearch();
  pruneSelectedOutgoingAssets();
  pruneExcludedOutgoingAssets();
  syncTradeModeUi();
  renderPowerDashboard();
  renderLeagueAnalyticsDashboard();
  renderSessionSnapshot();
});
el.generateBtn.addEventListener("click", generateTradeIdeas);

renderSessionSnapshot();
syncTradeModeUi();

let leagueLoadAnimationTimer = null;
let leagueLoadStartedAt = 0;
let copyFeedbackTimer = null;

function invalidateResults() {
  el.resultsSection.classList.add("hidden");
  syncGenerateState();
}

function showAppPages() {
  el.pageTabs?.classList.remove("hidden");
  setActivePage(state.activePage || "analytics");
}

function hideAppPages() {
  el.pageTabs?.classList.add("hidden");
  el.analyticsPage?.classList.add("hidden");
  el.traderPage?.classList.add("hidden");
}

function setActivePage(page) {
  const nextPage = page === "trader" ? "trader" : "analytics";
  state.activePage = nextPage;

  el.analyticsPage?.classList.toggle("hidden", nextPage !== "analytics");
  el.traderPage?.classList.toggle("hidden", nextPage !== "trader");
  el.analyticsTab?.classList.toggle("active", nextPage === "analytics");
  el.traderTab?.classList.toggle("active", nextPage === "trader");
  el.analyticsTab?.setAttribute("aria-selected", String(nextPage === "analytics"));
  el.traderTab?.setAttribute("aria-selected", String(nextPage === "trader"));
  renderSessionSnapshot();

  if (nextPage === "analytics") {
    renderPowerDashboard();
    renderLeagueAnalyticsDashboard();
    return;
  }
  syncTradeModeUi();
}

function getTradeMode() {
  return el.tradeModeSelect?.value || "shop";
}

function getTradeTier() {
  return "all";
}

function getCurrentPrimaryAsset() {
  return getTradeMode() === "shop" ? state.shopAsset : state.targetAsset;
}

function setCurrentPrimaryAsset(asset) {
  if (getTradeMode() === "shop") {
    state.shopAsset = asset;
    return;
  }
  state.targetAsset = asset;
}

function clearTargetAsset() {
  invalidateResults();
  if (getTradeMode() === "shop") {
    state.shopAsset = null;
  } else {
    state.targetAsset = null;
  }
  if (el.playerSearch) el.playerSearch.value = "";
  renderPlayerSearch();
  syncGenerateState();
}

function syncTargetSearchUi() {
  const selectedAsset = getCurrentPrimaryAsset();
  const hasTarget = Boolean(selectedAsset);
  const mode = getTradeMode();
  const placeholderByMode = {
    acquire: "Search another roster for the player or pick you want",
    shop: "Search your roster for the player or pick you want to move",
  };

  if (el.targetChip) {
    el.targetChip.classList.toggle("hidden", !hasTarget);
  }
  if (el.targetChipLabel) {
    el.targetChipLabel.textContent = selectedAsset?.name || "";
  }
  if (el.targetSearchShell) {
    el.targetSearchShell.classList.toggle("has-token", hasTarget);
  }
  if (el.playerSearch) {
    el.playerSearch.placeholder = hasTarget ? "" : (placeholderByMode[mode] || "Search player or pick");
  }
  syncGenerateState();
}

function isReadyToGenerate() {
  if (!state.meRosterId) return false;
  const mode = getTradeMode();
  if (mode === "surprise") return true;
  if (mode === "shop") return Boolean(state.shopAsset);
  if (mode === "acquire") return Boolean(state.targetAsset);
  return false;
}

function getGenerateHelpText() {
  if (!state.meRosterId) return "Load a league and choose your team first.";
  const mode = getTradeMode();
  if (mode === "surprise") return "Ready. The app will find a three-team blockbuster.";
  if (mode === "shop") {
    return state.shopAsset
      ? `Ready to shop ${state.shopAsset.name}.`
      : "Choose one of your players or picks to shop.";
  }
  if (mode === "acquire") {
    return state.targetAsset
      ? `Ready to build offers for ${state.targetAsset.name}.`
      : "Choose the player or pick you want from another team.";
  }
  return "Choose a trade path first.";
}

function syncGenerateState() {
  if (el.generateBtn && !el.generateBtn.classList.contains("loading")) {
    el.generateBtn.disabled = !isReadyToGenerate();
  }
  if (el.generateHelp) {
    el.generateHelp.textContent = getGenerateHelpText();
  }
}

function renderSessionSnapshot() {
  document.body.classList.toggle("league-loaded", Boolean(state.leagueId));
  if (el.chromeLeagueLabel) {
    el.chromeLeagueLabel.textContent = state.leagueName || "Not loaded";
  }
  if (el.chromeManagerLabel) {
    el.chromeManagerLabel.textContent = getMyRoster()?.manager?.displayName || "Select team";
  }
  if (el.chromeModeLabel) {
    const pageLabel = state.activePage === "trader" ? "Trade Lab" : "Analytics";
    const modeLabelByMode = {
      acquire: "Acquire",
      shop: "Shop",
      surprise: "Blockbuster",
    };
    const modeLabel = state.activePage === "trader" ? modeLabelByMode[getTradeMode()] || "Trade Lab" : pageLabel;
    el.chromeModeLabel.textContent = modeLabel;
  }
}

function scrollLoadedWorkspaceIntoView() {
  if (!el.identitySection || el.identitySection.classList.contains("hidden")) return;
  requestAnimationFrame(() => {
    if (window.matchMedia?.("(max-width: 720px)").matches) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    el.identitySection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function syncTradeModeUi() {
  const mode = getTradeMode();
  const searchEnabled = mode !== "surprise";
  const selectedAsset = getCurrentPrimaryAsset();
  const copyByMode = {
    acquire: {
      help: "Search another roster for the player or pick you want.",
      label: "Who do you want?",
    },
    shop: {
      help: "Pick one player or pick from your roster. The app will shop it around the league.",
      label: "Who are you willing to move?",
    },
    surprise: {
      help: "No player search needed. The app will pick teams and build a multi-team blockbuster.",
      label: "Surprise blockbuster",
    },
  };

  el.modeCards?.forEach((button) => {
    const isActive = button.dataset.tradeMode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  el.playerSearchLabel?.classList.toggle("hidden", !searchEnabled);
  el.targetSearchShell?.classList.toggle("hidden", !searchEnabled);
  el.playerResults?.classList.toggle("hidden", !searchEnabled);

  if (el.tradeModeHelp) el.tradeModeHelp.textContent = copyByMode[mode]?.help || "";
  if (el.playerSearchLabel) el.playerSearchLabel.textContent = copyByMode[mode]?.label || "Search player or pick";
  if (!searchEnabled && el.playerResults) {
    el.playerResults.innerHTML = "";
  }

  if (searchEnabled) {
    syncTargetSearchUi();
    if (selectedAsset && !el.playerSearch?.value.trim()) {
      el.playerResults?.classList.add("hidden");
    }
    renderPlayerSearch();
  }
  syncGenerateState();
  renderSessionSnapshot();
}

async function loadLeague() {
  const leagueId = el.leagueId.value.trim();
  if (!leagueId) {
    setStatus("Please enter a league ID.");
    return;
  }

  startLeagueLoadingUi();
  state.targetAsset = null;
  state.shopAsset = null;
  state.selectedOutgoingAssetIds.clear();
  state.excludedOutgoingAssetIds.clear();
  state.customParticipantRosterIds = [];
  state.tradedPicks = [];
  state.currentDraftContext = null;
  state.trendingAdds = [];
  state.trendingDrops = [];
  state.trendingLoaded = false;
  state.playerMetadataLoaded = false;
  state.playerMetadataFailed = false;
  state.activePage = "analytics";
  state.transactions = [];
  state.transactionsLoaded = false;
  state.transactionsFailed = false;
  state.transactionWeeksLoaded = 0;
  state.transactionLoadError = "";
  if (el.playerSearch) el.playerSearch.value = "";
  renderSessionSnapshot();
  renderPowerDashboard();
  renderLeagueAnalyticsDashboard();
  el.powerSection?.classList.add("hidden");
  el.analyticsSection?.classList.add("hidden");
  hideAppPages();
  el.resultsList.innerHTML = "";
  el.resultsSection.classList.add("hidden");

  try {
    const { league, users, rosters, tradedPicks, drafts } = await loadLeagueCoreData(leagueId);
    const previousContext = await loadPreviousLeagueContext(league);
    const currentDraftContext = await loadCurrentSeasonDraftContext(leagueId, league, rosters, drafts);

    state.leagueId = leagueId;
    state.leagueName = league?.name || `League ${leagueId}`;
    state.league = league;
    state.users = users;
    state.rosters = rosters;
    state.tradedPicks = tradedPicks;
    state.currentDraftContext = currentDraftContext;
    state.players = {};
    state.previousLeague = previousContext.league;
    state.previousUsers = previousContext.users;
    state.previousRosters = previousContext.rosters;
    state.normalizedRosters = normalizeRosters(league, rosters, users, state.players, previousContext, tradedPicks, currentDraftContext);

    hydrateManagerSelector();
    syncTradeModeUi();
    renderSessionSnapshot();
    el.identitySection.classList.remove("hidden");
    el.powerSection?.classList.remove("hidden");
    el.analyticsSection?.classList.remove("hidden");
    el.playerSection.classList.remove("hidden");
    el.settingsSection?.classList.remove("hidden");
    showAppPages();
    renderPowerDashboard();
    renderLeagueAnalyticsDashboard();
    scrollLoadedWorkspaceIntoView();
    setStatus(`Loaded ${state.leagueName}. Player names are still syncing...`, { loading: true });
    primeValuationData();
    loadTrendingPlayers();
    loadLeagueTransactions(leagueId, league);

    loadPlayersWithCache()
      .then((players) => {
        state.players = players;
        state.playerMetadataLoaded = true;
        state.playerMetadataFailed = false;
        refreshPlayerPositionRanks();
        state.normalizedRosters = normalizeRosters(state.league, state.rosters, state.users, players, {
          league: state.previousLeague,
          users: state.previousUsers,
          rosters: state.previousRosters,
        }, state.tradedPicks, state.currentDraftContext);
        hydrateManagerSelector();
        syncTradeModeUi();
        renderPowerDashboard();
        renderLeagueAnalyticsDashboard();
        setStatus(`Loaded ${state.leagueName}. Choose your team to continue.`, { ok: true });
      })
      .catch((err) => {
        state.playerMetadataLoaded = false;
        state.playerMetadataFailed = true;
        syncTradeModeUi();
        renderPowerDashboard();
        renderLeagueAnalyticsDashboard();
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
    { key: "drafts", label: "league drafts", path: `/league/${leagueId}/drafts`, optional: true },
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
    drafts: Array.isArray(byKey.drafts) ? byKey.drafts : [],
  };
}

function buildCurrentDraftDetailCandidateIds(league, drafts = []) {
  const leagueSeason = String(league?.season || "").trim();
  const candidateIds = [];
  const seen = new Set();
  const push = (draftId) => {
    const normalized = String(draftId || "").trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    candidateIds.push(normalized);
  };

  drafts
    .filter((draft) => String(draft?.season || "").trim() === leagueSeason)
    .forEach((draft) => push(draft?.draft_id));

  push(league?.draft_id);
  return candidateIds;
}

function buildCurrentDraftContext(league, rosters, draftDetails) {
  const leagueSeason = String(league?.season || "").trim();
  const draftSeason = String(draftDetails?.season || "").trim();
  if (!leagueSeason || !draftSeason || draftSeason !== leagueSeason) return null;

  const slotByRosterId = new Map();
  const slotMap = draftDetails?.slot_to_roster_id && typeof draftDetails.slot_to_roster_id === "object"
    ? draftDetails.slot_to_roster_id
    : {};

  Object.entries(slotMap).forEach(([slotToken, rosterId]) => {
    const slot = Number(slotToken);
    const rosterKey = normalizeRosterIdKey(rosterId);
    if (!Number.isFinite(slot) || !rosterKey) return;
    slotByRosterId.set(rosterKey, slot);
  });

  if (slotByRosterId.size === 0) {
    const rosterIdByOwnerId = new Map(
      rosters
        .map((roster) => [normalizeRosterIdKey(roster.owner_id), normalizeRosterIdKey(roster.roster_id)])
        .filter(([ownerId, rosterId]) => ownerId && rosterId)
    );
    const draftOrder = draftDetails?.draft_order && typeof draftDetails.draft_order === "object"
      ? draftDetails.draft_order
      : {};

    Object.entries(draftOrder).forEach(([ownerId, slotToken]) => {
      const slot = Number(slotToken);
      const rosterKey = rosterIdByOwnerId.get(normalizeRosterIdKey(ownerId));
      if (!Number.isFinite(slot) || !rosterKey) return;
      slotByRosterId.set(rosterKey, slot);
    });
  }

  if (slotByRosterId.size === 0) return null;

  return {
    draftId: String(draftDetails?.draft_id || ""),
    season: draftSeason,
    totalSlots: Math.max(
      Number(draftDetails?.settings?.teams) || 0,
      Number(league?.total_rosters) || 0,
      rosters.length,
      ...slotByRosterId.values()
    ),
    slotByRosterId,
  };
}

async function loadCurrentSeasonDraftContext(leagueId, league, rosters, drafts = []) {
  const candidateIds = buildCurrentDraftDetailCandidateIds(league, drafts);
  for (const draftId of candidateIds) {
    try {
      const draftDetails = await apiGetWithRetry(`/draft/${draftId}`, { timeoutMs: 12000, retries: 1 });
      const context = buildCurrentDraftContext(league, rosters, draftDetails);
      if (context) return context;
    } catch (err) {
      console.warn(`Could not load draft details for ${draftId}`, err);
    }
  }

  return null;
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

async function loadTrendingPlayers() {
  state.trendingLoaded = false;
  try {
    const [adds, drops] = await Promise.all([
      apiGetWithRetry(`/players/nfl/trending/add?lookback_hours=${TRENDING_LOOKBACK_HOURS}&limit=${TRENDING_PLAYERS_LIMIT}`, { timeoutMs: 9000, retries: 1 }),
      apiGetWithRetry(`/players/nfl/trending/drop?lookback_hours=${TRENDING_LOOKBACK_HOURS}&limit=${TRENDING_PLAYERS_LIMIT}`, { timeoutMs: 9000, retries: 1 }),
    ]);
    state.trendingAdds = Array.isArray(adds) ? adds : [];
    state.trendingDrops = Array.isArray(drops) ? drops : [];
    state.trendingLoaded = true;
  } catch (err) {
    console.warn("Could not load Sleeper trending players", err);
    state.trendingAdds = [];
    state.trendingDrops = [];
    state.trendingLoaded = false;
  } finally {
    renderPowerDashboard();
    renderLeagueAnalyticsDashboard();
  }
}

async function loadLeagueTransactions(leagueId, league) {
  const loadLeagueId = String(leagueId || "");
  state.transactions = [];
  state.transactionsLoaded = false;
  state.transactionsFailed = false;
  state.transactionWeeksLoaded = 0;
  state.transactionLoadError = "";
  renderLeagueAnalyticsDashboard();

  const weeks = buildTransactionWeeks(league);
  try {
    const settled = await Promise.allSettled(
      weeks.map((week) =>
        apiGetWithRetry(`/league/${loadLeagueId}/transactions/${week}`, { timeoutMs: 10000, retries: 1 })
          .then((transactions) => ({
            week,
            transactions: Array.isArray(transactions) ? transactions : [],
          }))
      )
    );

    if (state.leagueId !== loadLeagueId) return;

    const transactions = [];
    let loadedWeeks = 0;
    settled.forEach((result) => {
      if (result.status !== "fulfilled") return;
      loadedWeeks += 1;
      result.value.transactions.forEach((transaction) => {
        transactions.push({
          ...transaction,
          leg: transaction?.leg ?? result.value.week,
          week: result.value.week,
        });
      });
    });

    state.transactions = dedupeTransactions(transactions);
    state.transactionWeeksLoaded = loadedWeeks;
    state.transactionsLoaded = true;
    state.transactionsFailed = loadedWeeks === 0;
    state.transactionLoadError = loadedWeeks === 0 ? "Sleeper did not return transaction weeks for this league." : "";
  } catch (err) {
    if (state.leagueId !== loadLeagueId) return;
    state.transactions = [];
    state.transactionsLoaded = true;
    state.transactionsFailed = true;
    state.transactionLoadError = err.message || "Could not load Sleeper transactions.";
  } finally {
    if (state.leagueId === loadLeagueId) {
      renderLeagueAnalyticsDashboard();
    }
  }
}

function buildTransactionWeeks(league) {
  const playoffStart = Number(league?.settings?.playoff_week_start);
  const tradeDeadline = Number(league?.settings?.trade_deadline);
  const configuredEnd = Math.max(
    TRANSACTION_WEEK_FALLBACK_END,
    Number.isFinite(playoffStart) ? playoffStart + 3 : 0,
    Number.isFinite(tradeDeadline) ? tradeDeadline + 6 : 0
  );
  const endWeek = clamp(configuredEnd, TRANSACTION_WEEK_START, 22);
  const weeks = [];
  for (let week = TRANSACTION_WEEK_START; week <= endWeek; week++) {
    weeks.push(week);
  }
  return weeks;
}

function dedupeTransactions(transactions) {
  const byId = new Map();
  transactions.forEach((transaction) => {
    const transactionId = String(transaction?.transaction_id || "");
    if (!transactionId || byId.has(transactionId)) return;
    byId.set(transactionId, transaction);
  });
  return [...byId.values()].sort((a, b) => Number(b.status_updated || b.created || 0) - Number(a.status_updated || a.created || 0));
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
  pruneExcludedOutgoingAssets();
  renderPlayerSearch();
  renderSessionSnapshot();
  renderPowerDashboard();
  renderLeagueAnalyticsDashboard();
}

function getMyRoster() {
  if (!state.meRosterId) return null;
  const meRosterId = Number(el.meSelect.value || state.meRosterId);
  state.meRosterId = meRosterId;
  return state.normalizedRosters.find((roster) => roster.rosterId === meRosterId) || null;
}

function renderPowerDashboard() {
  if (!el.powerDashboard) return;
  const meRoster = getMyRoster();
  if (!meRoster || state.normalizedRosters.length === 0) {
    el.powerDashboard.innerHTML = `<p class="muted">Choose your team to generate a power score.</p>`;
    return;
  }
  if (!state.playerMetadataLoaded) {
    el.powerDashboard.innerHTML = `
      <div class="power-sync">
        <strong>${state.playerMetadataFailed ? "Player metadata unavailable" : "Syncing player metadata"}</strong>
        <p class="muted">${
          state.playerMetadataFailed
            ? "Sleeper league data loaded, but positions and ages are missing. Trade search still works with fallback values."
            : "Power Score needs Sleeper positions, ages, injury flags, and team metadata before it can grade the roster."
        }</p>
      </div>
    `;
    return;
  }

  const context = buildLeaguePowerContext({
    league: state.league,
    rosters: state.normalizedRosters,
    values: state.values,
  });
  const profile = buildTeamPowerProfile({
    roster: meRoster,
    values: state.values,
    league: state.league,
    context,
  });
  const insights = buildSleeperInsightCards(profile, context);
  const trendNote = state.trendingLoaded
    ? "Sleeper market trends loaded"
    : "Sleeper market trends syncing";

  el.powerDashboard.innerHTML = `
    <div class="power-hero">
      <div class="power-score-ring" style="--score:${profile.score}">
        <strong>${profile.score}</strong>
        <span>/100</span>
      </div>
      <div class="power-hero-copy">
        <div class="power-title-row">
          <h3>${profile.managerName} Power Level</h3>
          <span class="power-tier ${profile.tierClass}">${profile.grade}</span>
        </div>
        <p>${profile.laneLabel} • ${formatStarterRank(profile.rank, profile.totalTeams)} lineup • ${formatNumber(profile.metrics.starterValue)} starter value</p>
        <div class="power-badge-row">
          ${profile.badges.map((badge) => `<span class="power-badge">${badge}</span>`).join("")}
          <span class="power-badge muted-badge">${trendNote}</span>
        </div>
      </div>
    </div>
    <div class="power-stat-grid">
      ${renderPowerStat("Starter XP", formatNumber(profile.metrics.starterValue), profile.componentLabels.starter)}
      ${renderPowerStat("Bench XP", formatNumber(profile.metrics.benchValue), profile.componentLabels.bench)}
      ${renderPowerStat("Pick Vault", formatNumber(profile.assetSummary.pickValue), `${profile.assetSummary.firstRoundPickCount} firsts`)}
      ${renderPowerStat("Timeline", profile.assetSummary.averageAgeLabel, profile.componentLabels.timeline)}
    </div>
    <div class="power-lanes">
      <section class="power-lane">
        <h4>Position Map</h4>
        <div class="position-meter-list">
          ${profile.positionSummaries.map(renderPositionMeter).join("")}
        </div>
      </section>
      <section class="power-lane">
        <h4>Sleeper Intel</h4>
        <div class="insight-list">
          ${insights.map(renderSleeperInsight).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderLeagueAnalyticsDashboard() {
  if (!el.analyticsDashboard) return;
  const meRoster = getMyRoster();
  if (!state.league || state.normalizedRosters.length === 0 || !meRoster) {
    el.analyticsDashboard.innerHTML = `<p class="muted">Choose your team to generate analytics.</p>`;
    return;
  }

  const model = buildLeagueAnalyticsModel(meRoster);
  el.analyticsDashboard.innerHTML = renderAnalyticsDashboard(model);
}

function buildLeagueAnalyticsModel(meRoster) {
  const context = buildLeaguePowerContext({
    league: state.league,
    rosters: state.normalizedRosters,
    values: state.values,
  });
  const profiles = state.normalizedRosters
    .map((roster) => buildTeamPowerProfile({
      roster,
      values: state.values,
      league: state.league,
      context,
    }))
    .sort((a, b) => b.score - a.score || a.rank - b.rank || a.managerName.localeCompare(b.managerName));
  const meProfile = profiles.find((profile) => String(profile.rosterId) === String(meRoster.rosterId))
    || buildTeamPowerProfile({ roster: meRoster, values: state.values, league: state.league, context });
  const market = buildTradeMarketAnalytics(meRoster);
  const rosterAnalytics = buildRosterAnalytics(meRoster, meProfile, context, profiles, market);
  const leagueAnalytics = buildLeagueAnalytics(context, profiles, market);
  const quests = buildAnalyticsQuests(meProfile, rosterAnalytics, leagueAnalytics, market);

  return {
    meRoster,
    meProfile,
    context,
    profiles,
    market,
    rosterAnalytics,
    leagueAnalytics,
    quests,
  };
}

function renderAnalyticsDashboard(model) {
  const { meProfile, market, rosterAnalytics, leagueAnalytics, quests } = model;
  const syncLabel = state.transactionsLoaded
    ? state.transactionsFailed
      ? "Trade market unavailable"
      : `${state.transactionWeeksLoaded} transaction weeks scanned`
    : "Trade market syncing";
  const favoritePartnerLabel = market.favoritePartner
    ? market.favoritePartner.otherManagerName
    : market.myTradeCount > 0 ? "No repeat partner" : "No trades yet";
  const leaguePairLabel = market.topPair
    ? market.topPair.managerNames.join(" / ")
    : "No trade pairs yet";

  return `
    <div class="analytics-hero">
      <div class="analytics-hero-main">
        <span class="analytics-kicker">${escapeHtml(state.leagueName || "League")} Command Center</span>
        <h3>${escapeHtml(meProfile.managerName)} GM profile</h3>
        <p>${escapeHtml(rosterAnalytics.identityLine)}</p>
        <div class="power-badge-row">
          ${rosterAnalytics.badges.map((badge) => `<span class="power-badge">${escapeHtml(badge)}</span>`).join("")}
          <span class="power-badge muted-badge">${escapeHtml(syncLabel)}</span>
        </div>
      </div>
      <div class="gm-level-panel">
        <span>GM Level</span>
        <strong>${rosterAnalytics.gmLevel}</strong>
        <small>${escapeHtml(rosterAnalytics.gmTitle)}</small>
      </div>
    </div>

    <div class="analytics-metric-grid">
      ${renderAnalyticsMetric("Team Power", `${meProfile.score}/100`, `${formatStarterRank(meProfile.rank, meProfile.totalTeams)} lineup`, "blue")}
      ${renderAnalyticsMetric("My Trades", formatNumber(market.myTradeCount), `${market.myTradeRankLabel} in market activity`, "green")}
      ${renderAnalyticsMetric("League Trades", formatNumber(market.tradeCount), `${formatNumber(market.movedAssetCount)} assets moved`, "gold")}
      ${renderAnalyticsMetric("Favorite Partner", favoritePartnerLabel, market.favoritePartner ? `${market.favoritePartner.count} trade${market.favoritePartner.count === 1 ? "" : "s"}` : "Trade graph empty", "blue")}
      ${renderAnalyticsMetric("League Rivalry", leaguePairLabel, market.topPair ? `${market.topPair.count} completed trade${market.topPair.count === 1 ? "" : "s"}` : "No completed trades", "rose")}
      ${renderAnalyticsMetric("Chaos Index", `${market.chaosScore}/99`, leagueAnalytics.marketTempoLabel, "gold")}
    </div>

    <div class="analytics-two-col">
      ${renderTeamDnaPanel(rosterAnalytics, meProfile)}
      ${renderTradeMarketPanel(market)}
    </div>

    <div class="analytics-two-col">
      ${renderLeagueEconomyPanel(leagueAnalytics, market)}
      ${renderQuestPanel(quests)}
    </div>

    ${renderPowerRankingsPanel(model.profiles)}

    <div class="analytics-two-col">
      ${renderRecentTradesPanel(market)}
      ${renderAssetMarketPanel(market)}
    </div>
  `;
}

function renderAnalyticsMetric(label, value, detail, tone = "") {
  return `
    <section class="analytics-metric ${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      <small>${escapeHtml(detail || "")}</small>
    </section>
  `;
}

function renderTeamDnaPanel(rosterAnalytics, profile) {
  return `
    <section class="analytics-panel">
      <div class="analytics-panel-heading">
        <h3>Team DNA</h3>
        <span>${escapeHtml(profile.laneLabel)}</span>
      </div>
      <div class="dna-grid">
        ${renderDnaCell("Win-Now", rosterAnalytics.winNowScore, rosterAnalytics.winNowLabel)}
        ${renderDnaCell("Future", rosterAnalytics.futureScore, rosterAnalytics.futureLabel)}
        ${renderDnaCell("Depth", rosterAnalytics.depthScore, rosterAnalytics.depthLabel)}
        ${renderDnaCell("Leverage", rosterAnalytics.leverageScore, rosterAnalytics.leverageLabel)}
      </div>
      <div class="analytics-progress-list">
        ${renderAnalyticsProgressRow("Starter edge", rosterAnalytics.starterEdgePercent, rosterAnalytics.starterEdgeLabel)}
        ${renderAnalyticsProgressRow("Pick vault", rosterAnalytics.pickVaultPercent, rosterAnalytics.pickVaultLabel)}
        ${renderAnalyticsProgressRow("Value concentration", rosterAnalytics.concentrationPercent, rosterAnalytics.concentrationLabel)}
        ${renderAnalyticsProgressRow("Age curve", rosterAnalytics.timelinePercent, rosterAnalytics.timelineLabel)}
      </div>
      <div class="mini-scout-list">
        ${rosterAnalytics.scoutingNotes.map((note) => renderMiniScout(note)).join("")}
      </div>
    </section>
  `;
}

function renderDnaCell(label, score, detail) {
  return `
    <section class="dna-cell">
      <div class="dna-score-ring" style="--score:${score}">
        <strong>${score}</strong>
      </div>
      <span>${escapeHtml(label)}</span>
      <small>${escapeHtml(detail)}</small>
    </section>
  `;
}

function renderAnalyticsProgressRow(label, percent, detail) {
  const safePercent = clamp(Math.round(percent), 0, 100);
  return `
    <div class="analytics-progress-row">
      <div>
        <strong>${escapeHtml(label)}</strong>
        <span>${escapeHtml(detail)}</span>
      </div>
      <div class="meter-track" aria-hidden="true">
        <span style="width:${safePercent}%"></span>
      </div>
    </div>
  `;
}

function renderMiniScout(note) {
  return `
    <section class="mini-scout ${note.tone || ""}">
      <strong>${escapeHtml(note.title)}</strong>
      <span>${escapeHtml(note.body)}</span>
    </section>
  `;
}

function renderTradeMarketPanel(market) {
  return `
    <section class="analytics-panel">
      <div class="analytics-panel-heading">
        <h3>Trade Market</h3>
        <span>${escapeHtml(market.tradeStatusLabel)}</span>
      </div>
      <div class="market-split-grid">
        ${renderMarketSplit("Players", market.playerMovementCount, market.movedAssetCount)}
        ${renderMarketSplit("Picks", market.pickMovementCount, market.movedAssetCount)}
        ${renderMarketSplit("Multi-Team", market.multiTeamTradeCount, market.tradeCount)}
      </div>
      <div class="analytics-list">
        ${market.myPartners.length > 0
          ? market.myPartners.slice(0, 5).map((partner) => renderTradePartnerRow(partner)).join("")
          : `<p class="muted small analytics-empty">No completed trades for your roster in the scanned weeks.</p>`}
      </div>
      <div class="timeline-bars">
        ${market.weeklyTimeline.map((week) => renderTimelineBar(week, market.maxWeeklyTradeCount)).join("")}
      </div>
    </section>
  `;
}

function renderMarketSplit(label, count, total) {
  const pct = total > 0 ? Math.round(count / total * 100) : 0;
  return `
    <section class="market-split">
      <strong>${formatNumber(count)}</strong>
      <span>${escapeHtml(label)}</span>
      <div class="meter-track" aria-hidden="true"><span style="width:${pct}%"></span></div>
    </section>
  `;
}

function renderTradePartnerRow(partner) {
  const width = clamp(partner.sharePct, 8, 100);
  return `
    <div class="analytics-row">
      <div>
        <strong>${escapeHtml(partner.otherManagerName)}</strong>
        <span>${formatNumber(partner.assetsMoved)} assets • ${formatNumber(partner.valueMoved)} value moved</span>
      </div>
      <div class="row-meter" aria-hidden="true"><span style="width:${width}%"></span></div>
      <em>${partner.count}</em>
    </div>
  `;
}

function renderTimelineBar(week, maxCount) {
  const height = maxCount > 0 ? clamp(Math.round(week.count / maxCount * 100), 8, 100) : 8;
  return `
    <div class="timeline-bar" title="Week ${week.week}: ${week.count} trade${week.count === 1 ? "" : "s"}">
      <span style="height:${height}%"></span>
      <small>${week.week}</small>
    </div>
  `;
}

function renderLeagueEconomyPanel(leagueAnalytics, market) {
  return `
    <section class="analytics-panel">
      <div class="analytics-panel-heading">
        <h3>League Economy</h3>
        <span>${escapeHtml(leagueAnalytics.parityLabel)}</span>
      </div>
      <div class="economy-grid">
        ${renderEconomyCell("Contenders", leagueAnalytics.contenderCount, "top lanes")}
        ${renderEconomyCell("Rebuilders", leagueAnalytics.rebuildCount, "future lanes")}
        ${renderEconomyCell("Middle Builds", leagueAnalytics.middleCount, "swing teams")}
        ${renderEconomyCell("Traded Picks", state.tradedPicks.length, "pick records")}
      </div>
      <div class="analytics-progress-list">
        ${renderAnalyticsProgressRow("Power parity", leagueAnalytics.parityScore, leagueAnalytics.powerGapLabel)}
        ${renderAnalyticsProgressRow("Market tempo", market.chaosScore, leagueAnalytics.marketTempoLabel)}
        ${renderAnalyticsProgressRow("Future capital spread", leagueAnalytics.pickSpreadScore, leagueAnalytics.pickSpreadLabel)}
      </div>
      <div class="analytics-list">
        ${leagueAnalytics.managerSpotlights.map((spotlight) => renderSpotlightRow(spotlight)).join("")}
      </div>
    </section>
  `;
}

function renderEconomyCell(label, value, detail) {
  return `
    <section class="economy-cell">
      <strong>${formatNumber(value)}</strong>
      <span>${escapeHtml(label)}</span>
      <small>${escapeHtml(detail)}</small>
    </section>
  `;
}

function renderSpotlightRow(spotlight) {
  return `
    <div class="spotlight-row ${spotlight.tone || ""}">
      <strong>${escapeHtml(spotlight.label)}</strong>
      <span>${escapeHtml(spotlight.value)}</span>
    </div>
  `;
}

function renderQuestPanel(quests) {
  return `
    <section class="analytics-panel">
      <div class="analytics-panel-heading">
        <h3>Quest Board</h3>
        <span>${quests.length} active</span>
      </div>
      <div class="quest-list">
        ${quests.map((quest) => `
          <section class="quest-item ${quest.tone || ""}">
            <div>
              <strong>${escapeHtml(quest.title)}</strong>
              <span>${escapeHtml(quest.body)}</span>
            </div>
            <em>${formatNumber(quest.xp)} XP</em>
          </section>
        `).join("")}
      </div>
    </section>
  `;
}

function renderPowerRankingsPanel(profiles) {
  return `
    <section class="analytics-panel analytics-panel-wide">
      <div class="analytics-panel-heading">
        <h3>League Power Rankings</h3>
        <span>top ${Math.min(ANALYTICS_POWER_RANK_LIMIT, profiles.length)}</span>
      </div>
      <div class="power-rank-table">
        ${profiles.slice(0, ANALYTICS_POWER_RANK_LIMIT).map((profile, index) => renderPowerRankRow(profile, index)).join("")}
      </div>
    </section>
  `;
}

function renderPowerRankRow(profile, index) {
  const isMe = String(profile.rosterId) === String(state.meRosterId);
  return `
    <div class="power-rank-row ${isMe ? "you" : ""}">
      <span class="rank-number">${index + 1}</span>
      <div>
        <strong>${escapeHtml(profile.managerName)}</strong>
        <span>${escapeHtml(profile.laneLabel)} • ${profile.assetSummary.averageAgeLabel} avg age</span>
      </div>
      <span>${formatNumber(profile.metrics.starterValue)} starters</span>
      <span>${formatNumber(profile.assetSummary.pickValue)} picks</span>
      <strong>${profile.score}</strong>
    </div>
  `;
}

function renderRecentTradesPanel(market) {
  return `
    <section class="analytics-panel">
      <div class="analytics-panel-heading">
        <h3>Recent Trades</h3>
        <span>${market.recentTrades.length} shown</span>
      </div>
      <div class="recent-trade-list">
        ${market.recentTrades.length > 0
          ? market.recentTrades.map((trade) => renderRecentTrade(trade)).join("")
          : `<p class="muted small analytics-empty">No completed trades found in the scanned weeks.</p>`}
      </div>
    </section>
  `;
}

function renderRecentTrade(trade) {
  return `
    <section class="recent-trade">
      <div>
        <strong>${escapeHtml(trade.title)}</strong>
        <span>${escapeHtml(trade.subtitle)}</span>
      </div>
      <p>${escapeHtml(trade.preview)}</p>
    </section>
  `;
}

function renderAssetMarketPanel(market) {
  return `
    <section class="analytics-panel">
      <div class="analytics-panel-heading">
        <h3>Asset Market</h3>
        <span>${formatNumber(market.totalMovedValue)} value moved</span>
      </div>
      <div class="analytics-list">
        ${market.assetLeaders.length > 0
          ? market.assetLeaders.slice(0, ANALYTICS_ASSET_LEADER_LIMIT).map((asset) => renderAssetMarketRow(asset, market.topMovedAssetCount)).join("")
          : `<p class="muted small analytics-empty">No traded assets to rank yet.</p>`}
      </div>
      <div class="manager-heat-list">
        ${market.managerLeaderboard.slice(0, 5).map((manager) => renderManagerHeatRow(manager, market.maxManagerTradeCount)).join("")}
      </div>
    </section>
  `;
}

function renderAssetMarketRow(asset, maxCount) {
  const width = maxCount > 0 ? clamp(Math.round(asset.count / maxCount * 100), 8, 100) : 8;
  return `
    <div class="analytics-row">
      <div>
        <strong>${escapeHtml(asset.name)}</strong>
        <span>${escapeHtml(asset.typeLabel)} • ${formatNumber(asset.totalValue)} value</span>
      </div>
      <div class="row-meter" aria-hidden="true"><span style="width:${width}%"></span></div>
      <em>${asset.count}</em>
    </div>
  `;
}

function renderManagerHeatRow(manager, maxTrades) {
  const width = maxTrades > 0 ? clamp(Math.round(manager.tradeCount / maxTrades * 100), 8, 100) : 8;
  return `
    <div class="manager-heat-row">
      <strong>${escapeHtml(manager.managerName)}</strong>
      <div class="meter-track" aria-hidden="true"><span style="width:${width}%"></span></div>
      <span>${manager.tradeCount} trades</span>
    </div>
  `;
}

function buildRosterAnalytics(meRoster, profile, context, profiles, market) {
  const assetSummary = profile.assetSummary;
  const starterPercent = Math.round(percentileFromValues(context.starterValues, profile.metrics.starterValue) * 100);
  const benchPercent = Math.round(percentileFromValues(context.benchValues, profile.metrics.benchValue) * 100);
  const pickPercent = Math.round(percentileFromValues(context.pickValues, assetSummary.pickValue) * 100);
  const timelinePercent = Math.round(calculateTimelineScore(assetSummary) * 100);
  const topThreeValue = assetSummary.topPlayers.slice(0, 3).reduce((sum, entry) => sum + entry.value, 0);
  const concentrationPercent = assetSummary.playerValue > 0
    ? Math.round(topThreeValue / assetSummary.playerValue * 100)
    : 0;
  const leverageScore = clamp(Math.round((pickPercent * 0.35) + (benchPercent * 0.25) + (100 - concentrationPercent) * 0.2 + market.myMarketSharePct * 0.2), 1, 99);
  const winNowScore = clamp(Math.round(profile.score * 0.68 + starterPercent * 0.32), 1, 99);
  const futureScore = clamp(Math.round(pickPercent * 0.38 + timelinePercent * 0.42 + Math.min(100, assetSummary.youthCount * 8) * 0.2), 1, 99);
  const depthScore = clamp(Math.round(benchPercent * 0.7 + (100 - concentrationPercent) * 0.3), 1, 99);
  const gmLevel = clamp(Math.round(profile.score * 0.62 + market.myTradeCount * 5 + pickPercent * 0.12 + starterPercent * 0.18), 1, 99);
  const topProfile = profiles[0];
  const strongest = profile.strongestPosition?.position || "best position";
  const weakest = profile.weakestPosition?.position || "upgrade spot";
  const badges = [
    profile.laneLabel,
    market.myTradeCount >= 3 ? "Active Dealmaker" : "Market Watcher",
    `${strongest} Edge`,
    `${weakest} Quest`,
  ];

  return {
    gmLevel,
    gmTitle: classifyGmTitle({ gmLevel, market, profile }),
    identityLine: buildGmIdentityLine(profile, market, topProfile),
    badges: [...new Set(badges)].slice(0, 5),
    winNowScore,
    futureScore,
    depthScore,
    leverageScore,
    winNowLabel: `${formatStarterRank(profile.rank, profile.totalTeams)} lineup`,
    futureLabel: `${assetSummary.firstRoundPickCount} first${assetSummary.firstRoundPickCount === 1 ? "" : "s"}`,
    depthLabel: `${ordinal(benchPercent)} percentile bench`,
    leverageLabel: market.favoritePartner ? `${market.favoritePartner.otherManagerName} link` : "open market",
    starterEdgePercent: starterPercent,
    starterEdgeLabel: `${ordinal(starterPercent)} percentile starter value`,
    pickVaultPercent: pickPercent,
    pickVaultLabel: `${formatNumber(assetSummary.pickValue)} pick value`,
    concentrationPercent,
    concentrationLabel: `${concentrationPercent}% of player value in top 3`,
    timelinePercent,
    timelineLabel: `${assetSummary.averageAgeLabel} weighted top-core age`,
    scoutingNotes: buildRosterScoutingNotes(meRoster, profile, market, concentrationPercent),
  };
}

function classifyGmTitle({ gmLevel, market, profile }) {
  if (gmLevel >= 88 && market.myTradeCount >= 3) return "Market Overlord";
  if (profile.score >= 88) return "Title Architect";
  if (profile.assetSummary.firstRoundPickCount >= 4) return "Pick Baron";
  if (market.myTradeCount >= 4) return "Deal Flow Engine";
  if (profile.lane.id === "rebuild") return "Timeline Engineer";
  return "Roster Strategist";
}

function buildGmIdentityLine(profile, market, topProfile) {
  const lead = `${profile.laneLabel} with a ${profile.grade} power grade`;
  const rank = `ranked ${formatStarterRank(profile.rank, profile.totalTeams)} by lineup value`;
  const marketLine = market.myTradeCount > 0
    ? `${market.myTradeCount} completed trade${market.myTradeCount === 1 ? "" : "s"} in the scanned market`
    : "no completed trades in the scanned market";
  const chaseLine = topProfile && String(topProfile.rosterId) !== String(profile.rosterId)
    ? `The current power target is ${topProfile.managerName}.`
    : "You sit at the top of the current power board.";
  return `${lead}, ${rank}, with ${marketLine}. ${chaseLine}`;
}

function buildRosterScoutingNotes(meRoster, profile, market, concentrationPercent) {
  const notes = [];
  if (profile.strongestPosition) {
    notes.push({
      title: "Roster Edge",
      body: `${profile.strongestPosition.position} is your strongest scoring lever at ${profile.strongestPosition.rankLabel}.`,
      tone: "green",
    });
  }
  if (profile.weakestPosition) {
    notes.push({
      title: "Roster Leak",
      body: `${profile.weakestPosition.position} is the cleanest upgrade lane at ${profile.weakestPosition.rankLabel}.`,
      tone: profile.weakestPosition.percentile <= 0.42 ? "gold" : "blue",
    });
  }
  if (concentrationPercent >= 55) {
    notes.push({
      title: "Fragility Watch",
      body: `Your top three players hold ${concentrationPercent}% of player value, so one injury can swing the profile.`,
      tone: "rose",
    });
  } else {
    notes.push({
      title: "Depth Shape",
      body: `Value is spread well enough that the roster can absorb a consolidation trade.`,
      tone: "blue",
    });
  }
  if (market.favoritePartner) {
    notes.push({
      title: "Trade Route",
      body: `${market.favoritePartner.otherManagerName} is your most common trade lane in this league sample.`,
      tone: "green",
    });
  } else {
    notes.push({
      title: "Trade Route",
      body: `${meRoster.manager.displayName} has no repeat trade partner in the scanned weeks.`,
      tone: "gold",
    });
  }
  return notes.slice(0, 4);
}

function buildLeagueAnalytics(context, profiles, market) {
  const scores = profiles.map((profile) => profile.score).filter(Number.isFinite);
  const starterValues = context.starterValues.filter(Number.isFinite);
  const pickValues = context.pickValues.filter(Number.isFinite);
  const maxStarter = starterValues.length ? Math.max(...starterValues) : 0;
  const minStarter = starterValues.length ? Math.min(...starterValues) : 0;
  const powerGap = Math.max(0, maxStarter - minStarter);
  const parityScore = maxStarter > 0 ? clamp(Math.round(100 - (powerGap / maxStarter * 100)), 1, 99) : 50;
  const maxPick = pickValues.length ? Math.max(...pickValues) : 0;
  const minPick = pickValues.length ? Math.min(...pickValues) : 0;
  const pickSpread = Math.max(0, maxPick - minPick);
  const pickSpreadScore = maxPick > 0 ? clamp(Math.round(pickSpread / maxPick * 100), 1, 99) : 0;
  const contenderCount = profiles.filter((profile) => ["contender", "fragile-contender", "playoff-hunter"].includes(profile.lane.id)).length;
  const rebuildCount = profiles.filter((profile) => profile.lane.id === "rebuild").length;
  const middleCount = Math.max(0, profiles.length - contenderCount - rebuildCount);
  const topPickProfile = profiles.slice().sort((a, b) => b.assetSummary.pickValue - a.assetSummary.pickValue)[0];
  const youngestProfile = profiles
    .filter((profile) => Number.isFinite(profile.assetSummary.averageAge))
    .sort((a, b) => a.assetSummary.averageAge - b.assetSummary.averageAge)[0];
  const oldestProfile = profiles
    .filter((profile) => Number.isFinite(profile.assetSummary.averageAge))
    .sort((a, b) => b.assetSummary.averageAge - a.assetSummary.averageAge)[0];
  const medianScore = median(scores);

  return {
    contenderCount,
    rebuildCount,
    middleCount,
    parityScore,
    parityLabel: parityScore >= 72 ? "tight race" : parityScore >= 48 ? "tiered league" : "power gap",
    powerGapLabel: `${formatNumber(powerGap)} starter gap from top to bottom`,
    pickSpreadScore,
    pickSpreadLabel: `${formatNumber(pickSpread)} pick-value spread`,
    marketTempoLabel: market.tradeCount >= profiles.length ? "active trade room" : market.tradeCount > 0 ? "selective trade room" : "quiet trade room",
    medianScore,
    managerSpotlights: [
      topPickProfile ? {
        label: "Pick Vault Leader",
        value: `${topPickProfile.managerName} (${formatNumber(topPickProfile.assetSummary.pickValue)})`,
        tone: "gold",
      } : null,
      youngestProfile ? {
        label: "Youngest Core",
        value: `${youngestProfile.managerName} (${youngestProfile.assetSummary.averageAgeLabel})`,
        tone: "green",
      } : null,
      oldestProfile ? {
        label: "Oldest Core",
        value: `${oldestProfile.managerName} (${oldestProfile.assetSummary.averageAgeLabel})`,
        tone: "rose",
      } : null,
      profiles[0] ? {
        label: "Power Leader",
        value: `${profiles[0].managerName} (${profiles[0].score}/100)`,
        tone: "blue",
      } : null,
    ].filter(Boolean),
  };
}

function buildAnalyticsQuests(profile, rosterAnalytics, leagueAnalytics, market) {
  const quests = [];
  if (profile.weakestPosition) {
    quests.push({
      title: `Patch ${profile.weakestPosition.position}`,
      body: `Raise the weakest position from ${profile.weakestPosition.rankLabel}; even a mid-tier starter can move the power score.`,
      xp: 420,
      tone: "gold",
    });
  }
  if (profile.assetSummary.firstRoundPickCount > 0 && profile.score >= 78) {
    quests.push({
      title: "Convert Ammo",
      body: `Use one future first as a catalyst for a starter upgrade while the roster is in ${profile.laneLabel} mode.`,
      xp: 360,
      tone: "green",
    });
  }
  if (rosterAnalytics.concentrationPercent >= 55) {
    quests.push({
      title: "Insure The Core",
      body: `Top-heavy value profile detected; explore one depth-positive trade that does not drain starter value.`,
      xp: 300,
      tone: "rose",
    });
  }
  if (market.favoritePartner) {
    quests.push({
      title: `Reopen ${market.favoritePartner.otherManagerName}`,
      body: `${market.favoritePartner.count} prior trade${market.favoritePartner.count === 1 ? "" : "s"} make this the warmest negotiation lane.`,
      xp: 260,
      tone: "blue",
    });
  } else {
    quests.push({
      title: "Create A Trade Route",
      body: `No recurring partner found; identify one manager with a roster need that matches your surplus.`,
      xp: 240,
      tone: "blue",
    });
  }
  if (leagueAnalytics.parityScore <= 48) {
    quests.push({
      title: "Attack The Gap",
      body: `The league has a wide power gap, so one aggressive consolidation can matter more than a small value win.`,
      xp: 340,
      tone: "gold",
    });
  }
  if (market.myTradeCount === 0 && market.tradeCount > 0) {
    quests.push({
      title: "Enter The Market",
      body: `The league has completed ${market.tradeCount} trade${market.tradeCount === 1 ? "" : "s"} while you stayed quiet.`,
      xp: 220,
      tone: "green",
    });
  }
  return quests.slice(0, 5);
}

function buildTradeMarketAnalytics(meRoster) {
  const tradeTransactions = state.transactions
    .filter((transaction) => transaction?.type === "trade" && transaction?.status === "complete")
    .sort((a, b) => Number(b.status_updated || b.created || 0) - Number(a.status_updated || a.created || 0));
  const allCompleteTransactions = state.transactions.filter((transaction) => transaction?.status === "complete");
  const meRosterKey = normalizeRosterIdKey(meRoster.rosterId);
  const pairMap = new Map();
  const managerStats = new Map();
  const assetMap = new Map();
  const weeklyMap = new Map();
  let movedAssetCount = 0;
  let pickMovementCount = 0;
  let playerMovementCount = 0;
  let totalMovedValue = 0;
  let multiTeamTradeCount = 0;

  state.normalizedRosters.forEach((roster) => {
    managerStats.set(normalizeRosterIdKey(roster.rosterId), {
      rosterId: roster.rosterId,
      managerName: roster.manager.displayName,
      tradeCount: 0,
      sentAssets: 0,
      receivedAssets: 0,
      sentValue: 0,
      receivedValue: 0,
    });
  });

  tradeTransactions.forEach((transaction) => {
    const participantIds = getTransactionParticipantIds(transaction);
    if (participantIds.length > 2) multiTeamTradeCount += 1;
    const movements = buildTradeMovements(transaction);
    const movedValue = movements.reduce((sum, movement) => sum + movement.value, 0);
    const week = Number(transaction.leg || transaction.week || 0);
    if (!weeklyMap.has(week)) weeklyMap.set(week, { week, count: 0, movedValue: 0 });
    weeklyMap.get(week).count += 1;
    weeklyMap.get(week).movedValue += movedValue;

    participantIds.forEach((rosterId) => {
      const stats = ensureManagerTradeStats(managerStats, rosterId);
      stats.tradeCount += 1;
    });

    for (let i = 0; i < participantIds.length; i++) {
      for (let j = i + 1; j < participantIds.length; j++) {
        const left = participantIds[i];
        const right = participantIds[j];
        const key = buildRosterPairKey(left, right);
        const pairMovements = movements.filter((movement) =>
          buildRosterPairKey(movement.fromRosterId, movement.toRosterId) === key
        );
        if (!pairMap.has(key)) {
          pairMap.set(key, {
            rosterIds: key.split("|"),
            count: 0,
            assetsMoved: 0,
            valueMoved: 0,
          });
        }
        const pair = pairMap.get(key);
        pair.count += 1;
        pair.assetsMoved += pairMovements.length || movements.length;
        pair.valueMoved += pairMovements.length
          ? pairMovements.reduce((sum, movement) => sum + movement.value, 0)
          : movedValue;
      }
    }

    movements.forEach((movement) => {
      movedAssetCount += 1;
      totalMovedValue += movement.value;
      if (movement.assetType === "pick") {
        pickMovementCount += 1;
      } else {
        playerMovementCount += 1;
      }

      const fromStats = ensureManagerTradeStats(managerStats, movement.fromRosterId);
      const toStats = ensureManagerTradeStats(managerStats, movement.toRosterId);
      fromStats.sentAssets += 1;
      fromStats.sentValue += movement.value;
      toStats.receivedAssets += 1;
      toStats.receivedValue += movement.value;

      if (!assetMap.has(movement.assetId)) {
        assetMap.set(movement.assetId, {
          assetId: movement.assetId,
          name: movement.name,
          assetType: movement.assetType,
          typeLabel: movement.assetType === "pick" ? "Pick" : movement.positionLabel || "Player",
          count: 0,
          totalValue: 0,
        });
      }
      const assetEntry = assetMap.get(movement.assetId);
      assetEntry.count += 1;
      assetEntry.totalValue += movement.value;
    });
  });

  const managerLeaderboard = [...managerStats.values()]
    .sort((a, b) => b.tradeCount - a.tradeCount || b.sentValue + b.receivedValue - (a.sentValue + a.receivedValue) || a.managerName.localeCompare(b.managerName));
  const myStats = managerStats.get(meRosterKey) || ensureManagerTradeStats(managerStats, meRosterKey);
  const myTradeRank = managerLeaderboard.findIndex((manager) => String(manager.rosterId) === String(meRoster.rosterId)) + 1;
  const pairLeaders = [...pairMap.values()]
    .map((pair) => ({
      ...pair,
      managerNames: pair.rosterIds.map(getRosterManagerName),
      sharePct: tradeTransactions.length > 0 ? Math.round(pair.count / tradeTransactions.length * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || b.valueMoved - a.valueMoved || a.managerNames.join("").localeCompare(b.managerNames.join("")));
  const myPartners = pairLeaders
    .filter((pair) => pair.rosterIds.includes(meRosterKey))
    .map((pair) => {
      const otherRosterId = pair.rosterIds.find((rosterId) => rosterId !== meRosterKey);
      return {
        ...pair,
        otherRosterId,
        otherManagerName: getRosterManagerName(otherRosterId),
      };
    });
  const assetLeaders = [...assetMap.values()]
    .sort((a, b) => b.count - a.count || b.totalValue - a.totalValue || a.name.localeCompare(b.name));
  const weeklyTimeline = buildWeeklyTradeTimeline(weeklyMap);
  const maxWeeklyTradeCount = weeklyTimeline.reduce((max, week) => Math.max(max, week.count), 0);
  const maxManagerTradeCount = managerLeaderboard.reduce((max, manager) => Math.max(max, manager.tradeCount), 0);
  const topMovedAssetCount = assetLeaders.reduce((max, asset) => Math.max(max, asset.count), 0);
  const myMarketSharePct = tradeTransactions.length > 0 ? Math.round(myStats.tradeCount / tradeTransactions.length * 100) : 0;
  const chaosScore = calculateMarketChaosScore({
    tradeCount: tradeTransactions.length,
    rosterCount: state.normalizedRosters.length,
    pairCount: pairLeaders.length,
    movedAssetCount,
    multiTeamTradeCount,
    totalTransactions: allCompleteTransactions.length,
  });

  return {
    tradeCount: tradeTransactions.length,
    transactionCount: allCompleteTransactions.length,
    myTradeCount: myStats.tradeCount,
    myTradeRank,
    myTradeRankLabel: myTradeRank > 0 ? `${ordinal(myTradeRank)} of ${managerLeaderboard.length}` : "unranked",
    myMarketSharePct,
    favoritePartner: myPartners[0] || null,
    topPair: pairLeaders[0] || null,
    pairLeaders,
    myPartners,
    managerLeaderboard,
    assetLeaders,
    recentTrades: tradeTransactions.slice(0, ANALYTICS_RECENT_TRADE_LIMIT).map(buildRecentTradeSummary),
    weeklyTimeline,
    maxWeeklyTradeCount,
    maxManagerTradeCount,
    topMovedAssetCount,
    movedAssetCount,
    pickMovementCount,
    playerMovementCount,
    totalMovedValue: Math.round(totalMovedValue),
    multiTeamTradeCount,
    chaosScore,
    tradeStatusLabel: state.transactionsLoaded
      ? state.transactionsFailed ? "transactions unavailable" : `${tradeTransactions.length} completed trades`
      : "syncing transactions",
  };
}

function ensureManagerTradeStats(managerStats, rosterId) {
  const rosterKey = normalizeRosterIdKey(rosterId);
  if (!managerStats.has(rosterKey)) {
    managerStats.set(rosterKey, {
      rosterId,
      managerName: getRosterManagerName(rosterId),
      tradeCount: 0,
      sentAssets: 0,
      receivedAssets: 0,
      sentValue: 0,
      receivedValue: 0,
    });
  }
  return managerStats.get(rosterKey);
}

function getTransactionParticipantIds(transaction) {
  return [...new Set((transaction?.roster_ids || [])
    .map(normalizeRosterIdKey)
    .filter(Boolean))]
    .sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
}

function buildRosterPairKey(leftRosterId, rightRosterId) {
  return [normalizeRosterIdKey(leftRosterId), normalizeRosterIdKey(rightRosterId)]
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b) || a.localeCompare(b))
    .join("|");
}

function getRosterManagerName(rosterId) {
  const rosterKey = normalizeRosterIdKey(rosterId);
  const roster = state.normalizedRosters.find((entry) => normalizeRosterIdKey(entry.rosterId) === rosterKey);
  return roster?.manager?.displayName || `Roster ${rosterKey || "?"}`;
}

function buildTradeMovements(transaction) {
  const movements = [];
  const adds = transaction?.adds && typeof transaction.adds === "object" ? transaction.adds : {};
  const drops = transaction?.drops && typeof transaction.drops === "object" ? transaction.drops : {};

  Object.entries(adds).forEach(([playerId, toRosterId]) => {
    const fromRosterId = drops[playerId];
    if (fromRosterId == null || toRosterId == null || String(fromRosterId) === String(toRosterId)) return;
    const asset = buildTransactionPlayerAsset(playerId);
    const value = getAssetValue(asset, state.values);
    movements.push({
      assetId: asset.assetId,
      assetType: "player",
      name: asset.name,
      fromRosterId: normalizeRosterIdKey(fromRosterId),
      toRosterId: normalizeRosterIdKey(toRosterId),
      value: Number.isFinite(value) ? value : 0,
      positionLabel: formatPlayerPositionLabel(asset),
    });
  });

  (Array.isArray(transaction?.draft_picks) ? transaction.draft_picks : []).forEach((pick) => {
    const fromRosterId = pick?.previous_owner_id;
    const toRosterId = pick?.owner_id;
    if (fromRosterId == null || toRosterId == null || String(fromRosterId) === String(toRosterId)) return;
    const asset = buildTransactionPickAsset(pick);
    const value = getAssetValue(asset, state.values);
    movements.push({
      assetId: asset.assetId,
      assetType: "pick",
      name: asset.name,
      fromRosterId: normalizeRosterIdKey(fromRosterId),
      toRosterId: normalizeRosterIdKey(toRosterId),
      value: Number.isFinite(value) ? value : 0,
      positionLabel: "Pick",
    });
  });

  return movements;
}

function buildTransactionPlayerAsset(playerId) {
  const assetId = `player:${playerId}`;
  const existingAsset = state.normalizedRosters
    .flatMap((roster) => roster.assets)
    .find((asset) => asset.assetId === assetId);
  if (existingAsset) return existingAsset;

  const raw = state.players?.[String(playerId)] || {};
  const name = raw.full_name
    || `${(raw.first_name || "").trim()} ${(raw.last_name || "").trim()}`.trim()
    || state.valueNameMap[assetId]
    || `Player ${playerId}`;
  return {
    assetId,
    name,
    assetType: "player",
    raw,
  };
}

function buildTransactionPickAsset(pick) {
  const season = pick?.season != null ? String(pick.season) : "";
  const round = Number(pick?.round);
  const originalOwner = pick?.roster_id ?? pick?.original_owner ?? "any";
  const userById = new Map(state.users.map((user) => [String(user.user_id), user]));
  const rosterById = new Map(state.rosters.map((roster) => [String(roster.roster_id), roster]));
  const ownerName = resolvePickOwnerName(originalOwner, rosterById, userById);
  const roundLabel = Number.isFinite(round) ? ordinal(round) : "pick";
  const name = `${season} ${roundLabel}${ownerName ? ` from ${ownerName}` : ""}`;
  const normalizedPick = {
    ...pick,
    season,
    round,
    roster_id: originalOwner,
    original_owner: originalOwner,
    owner_id: pick?.owner_id ?? originalOwner,
  };
  return {
    assetId: `pick:${season}:r${round}:${originalOwner}`,
    valueAssetId: `pick:${season}:r${round}:any`,
    valueBucket: "any",
    name,
    assetType: "pick",
    raw: normalizedPick,
  };
}

function buildWeeklyTradeTimeline(weeklyMap) {
  const endWeek = Math.max(
    TRANSACTION_WEEK_FALLBACK_END,
    ...[...weeklyMap.keys()].map((week) => Number(week)).filter(Number.isFinite)
  );
  const weeks = [];
  for (let week = TRANSACTION_WEEK_START; week <= endWeek; week++) {
    const entry = weeklyMap.get(week) || { week, count: 0, movedValue: 0 };
    weeks.push({
      week,
      count: entry.count,
      movedValue: Math.round(entry.movedValue || 0),
    });
  }
  return weeks;
}

function calculateMarketChaosScore({ tradeCount, rosterCount, pairCount, movedAssetCount, multiTeamTradeCount, totalTransactions }) {
  if (!rosterCount) return 1;
  const tradeDensity = tradeCount / rosterCount;
  const pairDensity = pairCount / Math.max(1, rosterCount);
  const transactionDensity = totalTransactions / Math.max(1, rosterCount * 6);
  return clamp(Math.round(
    tradeDensity * 28
      + pairDensity * 22
      + movedAssetCount * 1.6
      + multiTeamTradeCount * 8
      + transactionDensity * 18
  ), 1, 99);
}

function buildRecentTradeSummary(transaction) {
  const participantIds = getTransactionParticipantIds(transaction);
  const participantNames = participantIds.map(getRosterManagerName);
  const movements = buildTradeMovements(transaction);
  const byRecipient = new Map();
  movements.forEach((movement) => {
    if (!byRecipient.has(movement.toRosterId)) byRecipient.set(movement.toRosterId, []);
    byRecipient.get(movement.toRosterId).push(movement);
  });
  const preview = participantIds
    .map((rosterId) => {
      const assets = byRecipient.get(rosterId) || [];
      const names = assets.slice(0, 3).map((asset) => asset.name);
      const suffix = assets.length > 3 ? ` +${assets.length - 3}` : "";
      return `${getRosterManagerName(rosterId)} got ${names.length ? names.join(", ") + suffix : "value"}`;
    })
    .join(" | ");
  const date = formatTransactionDate(transaction.status_updated || transaction.created);
  return {
    title: participantNames.join(" / "),
    subtitle: `${date} • ${movements.length} asset${movements.length === 1 ? "" : "s"} moved`,
    preview: preview || "Trade details unavailable from Sleeper payload.",
  };
}

function formatTransactionDate(timestamp) {
  const numeric = Number(timestamp);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Unknown date";
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(numeric));
  } catch {
    return "Unknown date";
  }
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle];
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPowerStat(label, value, detail) {
  return `
    <section class="power-stat">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${detail}</small>
    </section>
  `;
}

function renderPositionMeter(position) {
  return `
    <div class="position-meter">
      <div class="position-meter-top">
        <strong>${position.position}</strong>
        <span>${position.rankLabel}</span>
      </div>
      <div class="meter-track" aria-hidden="true">
        <span style="width:${Math.round(position.percentile * 100)}%"></span>
      </div>
      <p>${position.label}</p>
    </div>
  `;
}

function renderSleeperInsight(insight) {
  return `
    <section class="insight-item ${insight.tone || ""}">
      <strong>${insight.title}</strong>
      <span>${insight.body}</span>
    </section>
  `;
}

function buildLeaguePowerContext({ league, rosters, values, metricsByRosterId = null }) {
  const resolvedMetrics = metricsByRosterId || new Map();
  if (!metricsByRosterId) {
    rosters.forEach((roster) => {
      resolvedMetrics.set(roster.rosterId, evaluateRosterStrength(roster, values, league));
    });
  }

  const ranks = rankRosterMetrics(resolvedMetrics);
  const positions = getPowerPositions(league, rosters);
  const pickValues = rosters.map((roster) => summarizeRosterAssets(roster, values).pickValue);
  const positionValuesByPosition = new Map();

  positions.forEach((position) => {
    positionValuesByPosition.set(
      position,
      rosters.map((roster) => calculateRosterPositionValue(roster, values, league, position))
    );
  });

  return {
    league,
    rosters,
    values,
    metricsByRosterId: resolvedMetrics,
    ranks,
    totalTeams: rosters.length,
    starterValues: [...resolvedMetrics.values()].map((metrics) => metrics.starterValue),
    benchValues: [...resolvedMetrics.values()].map((metrics) => metrics.benchValue),
    totalValues: [...resolvedMetrics.values()].map((metrics) => metrics.totalValue),
    pickValues,
    positions,
    positionValuesByPosition,
  };
}

function buildTeamPowerProfile({ roster, values, league, context, metrics = null, rank = null }) {
  const resolvedMetrics = metrics || context.metricsByRosterId.get(roster.rosterId) || evaluateRosterStrength(roster, values, league);
  const resolvedRank = rank || context.ranks.get(roster.rosterId) || context.totalTeams;
  const assetSummary = summarizeRosterAssets(roster, values);
  const positionSummaries = context.positions.map((position) =>
    buildPositionPowerSummary(roster, values, league, context, position)
  );
  const strongestPosition = positionSummaries.slice().sort((a, b) => b.percentile - a.percentile)[0] || null;
  const weakestPosition = positionSummaries.slice().sort((a, b) => a.percentile - b.percentile)[0] || null;
  const starterPercentile = percentileFromValues(context.starterValues, resolvedMetrics.starterValue);
  const benchPercentile = percentileFromValues(context.benchValues, resolvedMetrics.benchValue);
  const totalPercentile = percentileFromValues(context.totalValues, resolvedMetrics.totalValue);
  const pickPercentile = percentileFromValues(context.pickValues, assetSummary.pickValue);
  const rankPercentile = context.totalTeams > 1 ? (context.totalTeams - resolvedRank) / (context.totalTeams - 1) : 1;
  const balancePercentile = positionSummaries.length
    ? positionSummaries.reduce((sum, entry) => sum + entry.percentile, 0) / positionSummaries.length
    : 0.5;
  const timelineScore = calculateTimelineScore(assetSummary);
  const score = clamp(Math.round(
    44
      + starterPercentile * 30
      + rankPercentile * 8
      + totalPercentile * 10
      + benchPercentile * 4
      + pickPercentile * 3
      + balancePercentile * 2
      + timelineScore * 2
  ), 35, 99);
  const lane = classifyPowerLane({ rank: resolvedRank, totalTeams: context.totalTeams, score, assetSummary, pickPercentile });
  const grade = formatPowerGrade(score);

  return {
    rosterId: roster.rosterId,
    managerName: roster.manager.displayName,
    score,
    grade: grade.label,
    tierClass: grade.className,
    rank: resolvedRank,
    totalTeams: context.totalTeams,
    lane,
    laneLabel: lane.label,
    metrics: resolvedMetrics,
    assetSummary,
    positionSummaries,
    strongestPosition,
    weakestPosition,
    badges: buildPowerBadges({ score, lane, assetSummary, strongestPosition, weakestPosition }),
    componentLabels: {
      starter: `${ordinal(Math.round(starterPercentile * 100))} percentile`,
      bench: `${ordinal(Math.round(benchPercentile * 100))} percentile`,
      timeline: assetSummary.averageAge ? `${assetSummary.youthCount} youth / ${assetSummary.veteranCount} vets` : "age data limited",
    },
  };
}

function summarizeRosterAssets(roster, values) {
  const playerEntries = roster.assets
    .filter((asset) => asset.assetType === "player" && isTradeEligibleAsset(asset))
    .map((asset) => ({ asset, value: getAssetValue(asset, values) }))
    .filter((entry) => Number.isFinite(entry.value))
    .sort((a, b) => b.value - a.value || a.asset.name.localeCompare(b.asset.name));
  const pickEntries = roster.assets
    .filter((asset) => asset.assetType === "pick")
    .map((asset) => ({ asset, value: getAssetValue(asset, values) }))
    .filter((entry) => Number.isFinite(entry.value))
    .sort((a, b) => b.value - a.value || a.asset.name.localeCompare(b.asset.name));
  const topWeightedAgeEntries = playerEntries.slice(0, 12).filter((entry) => Number.isFinite(playerAgeForAsset(entry.asset)));
  const totalAgeWeight = topWeightedAgeEntries.reduce((sum, entry) => sum + Math.max(1, entry.value), 0);
  const averageAge = totalAgeWeight > 0
    ? topWeightedAgeEntries.reduce((sum, entry) => sum + playerAgeForAsset(entry.asset) * Math.max(1, entry.value), 0) / totalAgeWeight
    : null;
  const teamStack = buildTopTeamStack(playerEntries);

  return {
    playerValue: playerEntries.reduce((sum, entry) => sum + entry.value, 0),
    pickValue: pickEntries.reduce((sum, entry) => sum + entry.value, 0),
    playerCount: playerEntries.length,
    pickCount: pickEntries.length,
    firstRoundPickCount: pickEntries.filter((entry) => isFirstRoundPick(entry.asset)).length,
    youthCount: playerEntries.filter((entry) => isYouthAsset(entry.asset)).length,
    veteranCount: playerEntries.filter((entry) => isVeteranAsset(entry.asset)).length,
    injuredCount: playerEntries.filter((entry) => isInjuryFlaggedAsset(entry.asset)).length,
    averageAge,
    averageAgeLabel: Number.isFinite(averageAge) ? `${averageAge.toFixed(1)}y` : "N/A",
    topPlayers: playerEntries.slice(0, 5),
    topPicks: pickEntries.slice(0, 4),
    teamStack,
  };
}

function buildTopTeamStack(playerEntries) {
  const byTeam = new Map();
  playerEntries.slice(0, 14).forEach((entry) => {
    const team = String(entry.asset.raw?.team || "").trim().toUpperCase();
    if (!team || team === "FA") return;
    if (!byTeam.has(team)) byTeam.set(team, []);
    byTeam.get(team).push(entry);
  });
  const stacks = [...byTeam.entries()]
    .map(([team, entries]) => ({
      team,
      entries,
      value: entries.reduce((sum, entry) => sum + entry.value, 0),
    }))
    .filter((stack) => stack.entries.length >= 2)
    .sort((a, b) => b.value - a.value || b.entries.length - a.entries.length);
  return stacks[0] || null;
}

function isInjuryFlaggedAsset(asset) {
  if (asset.assetType !== "player") return false;
  const injuryStatus = String(asset.raw?.injury_status || "").trim();
  const status = String(asset.raw?.status || "").trim().toLowerCase();
  return Boolean(injuryStatus) || status.includes("injured") || status.includes("ir") || status.includes("pup");
}

function getPowerPositions(league, rosters) {
  const priority = ["QB", "RB", "WR", "TE"];
  const playerPositions = new Set(
    rosters.flatMap((roster) =>
      roster.assets
        .filter((asset) => asset.assetType === "player")
        .flatMap((asset) => playerPositionsForAsset(asset))
    )
  );
  return priority.filter((position) => playerPositions.has(position) || getPositionStarterDemand(league, position) > 0);
}

function getPositionStarterDemand(league, position) {
  const slots = getStarterRosterSlots(league);
  const normalizedPosition = normalizePlayerPosition(position);
  const rawDemand = slots.reduce((sum, slot) => {
    const allowed = getAllowedPositionsForSlot(slot);
    if (!allowed.has(normalizedPosition)) return sum;
    return sum + (allowed.size === 1 ? 1 : 1 / allowed.size);
  }, 0);
  return Math.max(1, Math.round(rawDemand));
}

function calculateRosterPositionValue(roster, values, league, position) {
  const demand = getPositionStarterDemand(league, position);
  return roster.assets
    .filter((asset) => asset.assetType === "player" && playerPositionsForAsset(asset).includes(position))
    .map((asset) => getAssetValue(asset, values))
    .filter(Number.isFinite)
    .sort((a, b) => b - a)
    .slice(0, demand)
    .reduce((sum, value) => sum + value, 0);
}

function buildPositionPowerSummary(roster, values, league, context, position) {
  const value = calculateRosterPositionValue(roster, values, league, position);
  const percentile = percentileFromValues(context.positionValuesByPosition.get(position) || [], value);
  const rank = rankValueDescending(context.positionValuesByPosition.get(position) || [], value);
  const label = percentile >= 0.72
    ? "edge"
    : percentile <= 0.42
      ? "upgrade target"
      : "stable";
  return {
    position,
    value,
    percentile,
    rank,
    rankLabel: `${ordinal(rank)} / ${context.totalTeams}`,
    label: `${label} • ${formatNumber(value)}`,
  };
}

function percentileFromValues(values, value) {
  const numericValues = values.filter(Number.isFinite);
  if (numericValues.length === 0 || !Number.isFinite(value)) return 0.5;
  if (numericValues.length === 1) return 1;
  const minValue = Math.min(...numericValues);
  const maxValue = Math.max(...numericValues);
  if (minValue === maxValue) return maxValue <= 0 ? 0 : 0.5;
  const belowOrEqual = numericValues.filter((entry) => entry <= value).length;
  return clamp(belowOrEqual / numericValues.length, 0, 1);
}

function rankValueDescending(values, value) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => b - a);
  const index = sorted.findIndex((entry) => entry <= value);
  return index >= 0 ? index + 1 : sorted.length || 1;
}

function calculateTimelineScore(assetSummary) {
  if (!Number.isFinite(assetSummary.averageAge)) return 0.5;
  const ageScore = clamp((28.8 - assetSummary.averageAge) / 7, 0, 1);
  const youthScore = clamp(assetSummary.youthCount / Math.max(5, assetSummary.playerCount * 0.28), 0, 1);
  return ageScore * 0.55 + youthScore * 0.45;
}

function classifyPowerLane({ rank, totalTeams, score, assetSummary, pickPercentile }) {
  const topTier = Math.max(1, Math.ceil(totalTeams / 3));
  const bottomTierStart = Math.max(1, totalTeams - topTier + 1);

  if (rank <= topTier && score >= 82) {
    if (assetSummary.averageAge >= 27.8 && pickPercentile <= 0.35) {
      return { id: "fragile-contender", label: "Fragile Contender" };
    }
    return { id: "contender", label: "Contender" };
  }
  if (rank >= bottomTierStart && (pickPercentile >= 0.58 || assetSummary.youthCount >= assetSummary.veteranCount)) {
    return { id: "rebuild", label: "Rebuild Engine" };
  }
  if (score >= 78) return { id: "playoff-hunter", label: "Playoff Hunter" };
  return { id: "middle", label: "Middle Build" };
}

function formatPowerGrade(score) {
  if (score >= 95) return { label: "S", className: "elite" };
  if (score >= 90) return { label: "A+", className: "elite" };
  if (score >= 84) return { label: "A", className: "strong" };
  if (score >= 78) return { label: "B+", className: "strong" };
  if (score >= 70) return { label: "B", className: "" };
  if (score >= 62) return { label: "C", className: "watch" };
  return { label: "D", className: "watch" };
}

function buildPowerBadges({ score, lane, assetSummary, strongestPosition, weakestPosition }) {
  const badges = [lane.label];
  if (score >= 90) badges.push("Title Threat");
  if (strongestPosition?.percentile >= 0.75) badges.push(`${strongestPosition.position} Edge`);
  if (weakestPosition?.percentile <= 0.28) badges.push(`${weakestPosition.position} Quest`);
  if (assetSummary.firstRoundPickCount >= 3) badges.push("Pick Hoarder");
  if (assetSummary.youthCount >= 7) badges.push("Youth Core");
  if (assetSummary.teamStack) badges.push(`${assetSummary.teamStack.team} Stack`);
  return [...new Set(badges)].slice(0, 5);
}

function buildSleeperInsightCards(profile, context) {
  const insights = [];
  const formatInsight = describeLeagueFormat(context.league);
  insights.push({
    title: "League Format",
    body: formatInsight,
    tone: "blue",
  });

  if (profile.strongestPosition) {
    insights.push({
      title: "Best Edge",
      body: `${profile.strongestPosition.position} ranks ${profile.strongestPosition.rankLabel} by starter-caliber value.`,
      tone: "green",
    });
  }

  if (profile.weakestPosition && profile.weakestPosition.percentile <= 0.42) {
    insights.push({
      title: "Upgrade Quest",
      body: `${profile.weakestPosition.position} is your cleanest path to a power jump.`,
      tone: "gold",
    });
  }

  if (profile.assetSummary.firstRoundPickCount > 0) {
    const topPick = profile.assetSummary.topPicks[0]?.asset;
    insights.push({
      title: "Draft Ammo",
      body: `${profile.assetSummary.firstRoundPickCount} first-round pick${profile.assetSummary.firstRoundPickCount === 1 ? "" : "s"} in the vault${topPick ? `, led by ${topPick.name}` : ""}.`,
      tone: "gold",
    });
  }

  if (state.tradedPicks.length > 0) {
    insights.push({
      title: "Pick Market",
      body: `${state.tradedPicks.length} traded pick record${state.tradedPicks.length === 1 ? "" : "s"} loaded from Sleeper for this league.`,
      tone: "blue",
    });
  }

  if (profile.assetSummary.injuredCount > 0) {
    insights.push({
      title: "Injury Drag",
      body: `${profile.assetSummary.injuredCount} rostered player${profile.assetSummary.injuredCount === 1 ? "" : "s"} carry an injury/status flag in Sleeper metadata.`,
      tone: "rose",
    });
  }

  const trendInsight = buildTrendingInsight(profile);
  if (trendInsight) insights.push(trendInsight);

  if (profile.assetSummary.teamStack) {
    insights.push({
      title: "NFL Stack",
      body: `${profile.assetSummary.teamStack.entries.length} top roster pieces are tied to ${profile.assetSummary.teamStack.team}.`,
      tone: "blue",
    });
  }

  return insights.slice(0, 7);
}

function describeLeagueFormat(league) {
  const slots = getStarterRosterSlots(league);
  const hasSuperflex = slots.some((slot) => ["SUPER_FLEX", "OP"].includes(slot));
  const scoring = league?.scoring_settings || {};
  const receptionValue = Number(scoring.rec);
  const pprLabel = Number.isFinite(receptionValue)
    ? receptionValue >= 1 ? "PPR" : receptionValue > 0 ? `${receptionValue} PPR` : "standard"
    : "custom scoring";
  const tePremiumKeys = Object.keys(scoring).filter((key) => /te/i.test(key) && Number(scoring[key]) > 0);
  const taxiSlots = Number(league?.settings?.taxi_slots || 0);
  const draftRounds = Number(league?.settings?.draft_rounds || 0);
  const parts = [
    hasSuperflex ? "Superflex" : "1-QB",
    pprLabel,
    `${slots.length} starters`,
  ];
  if (tePremiumKeys.length > 0) parts.push("TE premium signals");
  if (taxiSlots > 0) parts.push(`${taxiSlots} taxi`);
  if (draftRounds > 0) parts.push(`${draftRounds}-round rookie draft`);
  return parts.join(" • ");
}

function buildTrendingInsight(profile) {
  if (!state.trendingLoaded) return null;
  const rosterPlayerIds = new Set(
    state.normalizedRosters
      .find((roster) => roster.rosterId === profile.rosterId)
      ?.assets
      .filter((asset) => asset.assetType === "player")
      .map((asset) => asset.assetId.replace("player:", "")) || []
  );
  const hotRosterPlayer = state.trendingAdds.find((entry) => rosterPlayerIds.has(String(entry.player_id)));
  const coldRosterPlayer = state.trendingDrops.find((entry) => rosterPlayerIds.has(String(entry.player_id)));
  const hotPlayer = hotRosterPlayer || state.trendingAdds[0];
  if (!hotPlayer && !coldRosterPlayer) return null;

  if (hotRosterPlayer) {
    return {
      title: "Market Heat",
      body: `${formatTrendingPlayerName(hotRosterPlayer, "adds")} is on your roster and trending up on Sleeper adds.`,
      tone: "green",
    };
  }
  if (coldRosterPlayer) {
    return {
      title: "Market Risk",
      body: `${formatTrendingPlayerName(coldRosterPlayer, "drops")} is on your roster and showing up in Sleeper drops.`,
      tone: "rose",
    };
  }
  return {
    title: "Market Heat",
    body: `${formatTrendingPlayerName(hotPlayer, "adds")} is the current Sleeper add-market headliner.`,
    tone: "green",
  };
}

function formatTrendingPlayerName(trend, actionLabel = "adds") {
  const player = state.players?.[String(trend.player_id)] || {};
  const name = player.full_name
    || `${(player.first_name || "").trim()} ${(player.last_name || "").trim()}`.trim()
    || state.valueNameMap[`player:${trend.player_id}`]
    || `Player ${trend.player_id}`;
  return trend.count ? `${name} (${formatNumber(trend.count)} ${actionLabel})` : name;
}

function isTradeEligibleAsset(asset) {
  if (!asset) return false;
  if (asset.assetType === "pick") return true;
  if (asset.assetType !== "player") return false;

  const positions = playerPositionsForAsset(asset);
  if (positions.length === 0) return true;
  return !positions.some((position) => position === "K" || position === "DEF");
}

function assetTypeAllowed(asset, filters) {
  if (!isTradeEligibleAsset(asset)) return false;
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
  const mode = getTradeMode();

  const query = el.playerSearch.value.trim().toLowerCase();
  const selectedAsset = getCurrentPrimaryAsset();

  if (selectedAsset) {
    const selectedIsMine = selectedAsset.managerRosterId === meRosterId;
    const invalidForMode = mode === "shop"
      ? !selectedIsMine
      : selectedIsMine || !assetTypeAllowed(selectedAsset, state.targetFilters);
    if (invalidForMode) {
      if (mode === "shop") {
        state.shopAsset = null;
      } else {
        state.targetAsset = null;
      }
      if (el.playerSearch) el.playerSearch.value = "";
    }
  }

  syncTargetSearchUi();

  if (getCurrentPrimaryAsset() && !query) {
    el.playerResults.classList.add("hidden");
    el.playerResults.innerHTML = "";
    return;
  }

  el.playerResults.classList.remove("hidden");

  const rosterPool = mode === "shop"
    ? state.normalizedRosters.filter((roster) => roster.rosterId === meRosterId)
    : state.normalizedRosters.filter((roster) => roster.rosterId !== meRosterId);
  const typeFilters = mode === "shop" ? state.outgoingFilters : state.targetFilters;

  const candidates = rosterPool
    .flatMap((roster) =>
      roster.assets
        .filter((asset) => assetTypeAllowed(asset, typeFilters))
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
    const emptyText = mode === "shop"
      ? "No matching assets found on your roster."
      : "No matching players or picks found.";
    el.playerResults.innerHTML = `<div class="player-item muted">${emptyText}</div>`;
    return;
  }

  for (const asset of candidates) {
    const row = document.createElement("div");
    row.className = "player-item";
    row.innerHTML = buildAssetPickerMarkup(asset, {
      values: state.values,
      contextLabel: mode === "shop" ? "Your roster" : asset.managerName,
    });
    row.addEventListener("click", () => {
      setCurrentPrimaryAsset(asset);
      el.playerSearch.value = "";
      el.resultsSection.classList.add("hidden");
      renderPlayerSearch();
      syncGenerateState();
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

  const validAssetIds = new Set(meRoster.assets.filter(isTradeEligibleAsset).map((asset) => asset.assetId));
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

  const validAssetIds = new Set(meRoster.assets.filter(isTradeEligibleAsset).map((asset) => asset.assetId));
  state.excludedOutgoingAssetIds = new Set(
    [...state.excludedOutgoingAssetIds].filter((assetId) => validAssetIds.has(assetId))
  );
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

  const mode = getTradeMode();
  const meRoster = getMyRoster();
  if (!meRoster) {
    alert("Could not resolve your roster.");
    return;
  }
  if (mode === "acquire" && !state.targetAsset) {
    alert("Select a target asset first.");
    return;
  }
  if (mode === "shop" && !state.shopAsset) {
    alert("Select one of your own assets to shop first.");
    return;
  }

  const fairnessPct = DEFAULT_FAIRNESS_PCT;
  const maxResults = DEFAULT_MAX_RESULTS;
  const tradeLab = getTradeLabSettings();

  try {
    setButtonLoading(el.generateBtn, true, "Building trade ideas...");
    await ensureValuesLoaded("");
    await waitForNextPaint();
    const leagueStrengthBaseline = buildLeagueStrengthBaseline({
      league: state.league,
      rosters: state.normalizedRosters,
      values: state.values,
    });
    let resultPayload = null;

    if (mode === "acquire") {
      const theirRoster = state.normalizedRosters.find((roster) => roster.rosterId === state.targetAsset.managerRosterId);
      if (!theirRoster) {
        alert("Could not resolve the other roster.");
        return;
      }
      resultPayload = generateAcquisitionIdeaBuckets({
        meRoster,
        theirRoster,
        targetAsset: state.targetAsset,
        values: state.values,
        fairnessPct,
        maxResults,
        tradeLab,
        leagueStrengthBaseline,
      });
    } else if (mode === "shop") {
      resultPayload = generateShopIdeaBuckets({
        meRoster,
        shopAsset: state.shopAsset,
        values: state.values,
        fairnessPct,
        maxResults,
        tradeLab,
        leagueStrengthBaseline,
      });
    } else if (mode === "surprise") {
      resultPayload = generateSurpriseBlockbusterIdeas({
        meRoster,
        values: state.values,
        fairnessPct,
        maxResults,
        tradeLab,
      });
    }

    const totalIdeaCount = countIdeasInResultPayload(resultPayload);

    el.resultsSection.classList.remove("hidden");
    el.resultsSubtitle.textContent = buildResultsSubtitle({
      mode,
      meRoster,
      tradeLab,
      payload: resultPayload,
    });

    if (totalIdeaCount === 0) {
      el.resultsList.innerHTML = `<p class="muted">${buildNoIdeasMessage(tradeLab, mode)}</p>`;
      el.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    await waitForNextPaint();
    el.resultsList.innerHTML = renderResultPayload(resultPayload, state.values);
    el.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    alert(`Could not load valuation source. ${err.message}`);
  } finally {
    setButtonLoading(el.generateBtn, false);
    syncGenerateState();
  }
}

function enrichTradeIdea({ idea, myRoster, theirRoster, values, leagueStrengthBaseline }) {
  const impactAnalysis = leagueStrengthBaseline
    ? buildTradeImpactAnalysis({
      baseline: leagueStrengthBaseline,
      league: state.league,
      rosters: state.normalizedRosters,
      myRoster,
      theirRoster,
      myAssets: idea.myAssets,
      theirAssets: idea.theirAssets,
      values,
    })
    : null;
  const powerUpgrade = leagueStrengthBaseline
    ? buildTradePowerUpgrade({
      baseline: leagueStrengthBaseline,
      league: state.league,
      rosters: state.normalizedRosters,
      myRoster,
      myAssets: idea.myAssets,
      theirAssets: idea.theirAssets,
      values,
    })
    : null;
  const enriched = {
    ...idea,
    closestEvenPick: findClosestValuationPick(
      idea.evenValue,
      values,
      state.valueNameMap
    ),
    impactAnalysis,
    powerUpgrade,
  };

  return {
    ...enriched,
    tags: enriched.tags?.length ? enriched.tags : buildFallbackTradeTags(enriched),
    summary: enriched.summary || buildFallbackTradeSummary(enriched),
    pitch: enriched.pitch || buildFallbackTradePitch(enriched),
  };
}

function getTradeLabSettings() {
  return {
    allowPlayers: true,
    allowPicks: true,
    selectedOutgoingAssetIds: new Set(state.selectedOutgoingAssetIds),
    excludedOutgoingAssetIds: new Set(state.excludedOutgoingAssetIds),
    positionPremium: "none",
    tradeVibe: "balanced",
    teamState: "middle",
  };
}

function countIdeasInResultPayload(payload) {
  if (!payload?.groups) return 0;
  return payload.groups.reduce((total, group) => total + (group.ideas?.length || 0), 0);
}

function renderResultPayload(payload, values) {
  if (!payload?.groups) return "";
  if (payload.kind === "multi-team") {
    return payload.groups.map((group) => renderMultiTeamIdeaGroup(group, values)).join("");
  }
  return payload.groups
    .map((group) => renderTradeIdeaGroup({
      title: group.title,
      subtitle: group.subtitle,
      emptyText: group.emptyText,
      ideas: group.ideas,
      values,
    }))
    .join("");
}

function buildResultsSubtitle({ mode, meRoster, tradeLab, payload }) {
  const notes = [];
  if (tradeLab.selectedOutgoingAssetIds.size > 0) {
    notes.push(`${tradeLab.selectedOutgoingAssetIds.size} locked in`);
  }
  if (tradeLab.excludedOutgoingAssetIds.size > 0) {
    notes.push(`${tradeLab.excludedOutgoingAssetIds.size} protected`);
  }
  const suffix = notes.length > 0 ? ` • ${notes.join(" • ")}` : "";

  if (mode === "shop") {
    return `${meRoster.manager.displayName} shopping ${payload?.focusAsset?.name || "one asset"} across the league${suffix}`;
  }
  if (mode === "surprise") {
    const participantCount = payload?.teamCount || 0;
    return `${meRoster.manager.displayName} exploring automatic ${participantCount}-team blockbusters${suffix}`;
  }
  return `${meRoster.manager.displayName} targeting ${payload?.focusAsset?.name || "a target"} from ${payload?.primaryCounterpartyName || "another manager"}${suffix}`;
}

function buildNoIdeasMessage(tradeLab, mode = "acquire") {
  const advice = [];
  if (tradeLab.selectedOutgoingAssetIds.size > 0) advice.push("require fewer included assets");
  if (tradeLab.excludedOutgoingAssetIds.size > 0) advice.push("exclude fewer assets");
  if (mode === "shop") {
    advice.push("shop a different asset");
  } else if (mode === "surprise") {
    advice.push("try again after values finish loading");
  } else {
    advice.push("change the target");
  }
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

function renderMultiTeamIdeaGroup(group, values) {
  return `
    <section class="idea-group">
      <div class="idea-group-heading">
        <h3>${group.title}</h3>
        <p class="muted small">${group.subtitle}</p>
      </div>
      ${
        group.ideas.length > 0
          ? group.ideas.map((idea, idx) => renderMultiTeamCard(idea, idx, values)).join("")
          : `<p class="muted small idea-group-empty">${group.emptyText}</p>`
      }
    </section>
  `;
}

function renderMultiTeamCard(idea, index, values) {
  return `
    <article class="multi-team-card">
      <div class="multi-team-card-header">
        <div>
          <h3>Idea ${index + 1}</h3>
          <p class="muted small">${idea.teamCount} teams • max ${idea.maxPctDiff}% diff • added value ${formatNumber(idea.extraMovedValueTotal || 0)} • common value ${formatNumber(idea.commonValue)}</p>
        </div>
        <div class="participant-pill-row">
          ${idea.tags.map((tag) => `<span class="participant-pill">${tag}</span>`).join("")}
        </div>
      </div>
      <div class="multi-team-party-grid">
        ${idea.participants.map((participant) => renderMultiTeamPartyCard(participant, values, idea.meRosterId)).join("")}
      </div>
      <p class="multi-team-flow">${idea.summary}</p>
    </article>
  `;
}

function renderMultiTeamPartyCard(participant, values, meRosterId) {
  const isMe = participant.roster.rosterId === meRosterId;
  const bridgeGapLabel = participant.netValueDelta === 0
    ? "even on raw value"
    : participant.netValueDelta > 0
      ? `receive +${formatNumber(participant.netValueDelta)} raw`
      : `send +${formatNumber(Math.abs(participant.netValueDelta))} raw`;
  const packageAdjustmentLabel = !participant.packageAdjustment
    ? "none"
    : `+${formatNumber(participant.packageAdjustment)} on ${participant.packageAdjustmentSide === "my" ? "your side" : "their side"}`;
  const receiveFromLabel = participant.receiveFromNames?.length
    ? participant.receiveFromNames.join(", ")
    : "trade partners";
  const sendToLabel = participant.sendToNames?.length
    ? participant.sendToNames.join(", ")
    : "trade partners";
  return `
    <section class="multi-team-party-card ${isMe ? "you" : "other"}">
      <h4>${isMe ? "You" : participant.roster.manager.displayName}</h4>
      <p class="muted small">${receiveFromLabel} to ${sendToLabel}</p>
      <div class="trade-body-grid">
        <section class="trade-side team-a">
          <div class="trade-side-heading">
            <span class="trade-side-kicker">Outgoing</span>
            <h4>Send</h4>
          </div>
          ${renderAssetList(participant.outgoingAssets, values, "team-a")}
        </section>
        <section class="trade-side team-b">
          <div class="trade-side-heading">
            <span class="trade-side-kicker">Incoming</span>
            <h4>Receive</h4>
          </div>
          ${renderAssetList(participant.incomingAssets, values, "team-b")}
        </section>
      </div>
      <div class="trade-metrics">
        <div class="trade-metric">
          <strong>Raw balance</strong>
          send ${formatNumber(participant.outgoingAdjustedValue)} vs receive ${formatNumber(participant.incomingAdjustedValue)} (${participant.pctDiff}% diff)
        </div>
        <div class="trade-metric">
          <strong>Bridge gap</strong>
          ${bridgeGapLabel}
        </div>
        <div class="trade-metric">
          <strong>Package adjustment</strong>
          ${packageAdjustmentLabel}
        </div>
      </div>
    </section>
  `;
}

function formatAssetNameList(assets) {
  return assets.map((asset) => asset.name).join(", ");
}

function renderTradeCard(idea, index, values) {
  const evenValueLabel = formatEvenValueDisplay(idea);
  const isInitiallyOpen = index === 0;
  const powerLabel = idea.powerUpgrade
    ? `${idea.powerUpgrade.before.score} → ${idea.powerUpgrade.after.score}`
    : `${idea.labScore || 0}/99`;
  const powerDeltaLabel = idea.powerUpgrade
    ? formatSignedNumber(idea.powerUpgrade.delta)
    : `${idea.labScore || 0} fit`;
  const powerDeltaClass = idea.powerUpgrade?.delta > 0 ? "good" : idea.powerUpgrade?.delta < 0 ? "bad" : "";
  return `
    <details class="trade-card" ${isInitiallyOpen ? "open" : ""}>
      <summary class="trade-card-summary">
        <div>
          <h3>Idea ${index + 1}</h3>
          ${idea.counterpartyName ? `<p class="trade-card-context">with ${idea.counterpartyName}</p>` : ""}
          <p class="trade-card-preview">
            Send ${formatAssetNameList(idea.myAssets)} for ${formatAssetNameList(idea.theirAssets)}
          </p>
        </div>
        <div class="trade-summary-score ${powerDeltaClass}">
          <strong>${powerLabel}</strong>
          <span>${powerDeltaLabel}</span>
        </div>
        <span class="trade-card-toggle" aria-hidden="true"></span>
      </summary>
      <div class="trade-card-body">
        ${idea.powerUpgrade ? renderGameImpact(idea.powerUpgrade, idea) : ""}
        ${renderTradeNarrative(idea)}
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
            <strong>Adjusted value</strong>
            you ${formatNumber(idea.myAdjustedValue)} vs them ${formatNumber(idea.theirAdjustedValue)} (${idea.pctDiff}% apart)
          </div>
          <div class="trade-metric">
            <strong>Elite premium</strong>
            Top players are weighted above raw KTC package value.
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

function renderGameImpact(upgrade, idea) {
  const deltaClass = upgrade.delta > 0 ? "good" : upgrade.delta < 0 ? "bad" : "";
  return `
    <section class="game-impact ${deltaClass}">
      <div class="game-impact-main">
        <div>
          <span class="game-kicker">Power Quest</span>
          <h4>${upgrade.before.score} → ${upgrade.after.score} Team Power</h4>
          <p>${upgrade.summary}</p>
        </div>
        <div class="xp-chip ${deltaClass}">
          <strong>${formatSignedNumber(upgrade.delta)}</strong>
          <span>${formatNumber(upgrade.xp)} XP</span>
        </div>
      </div>
      <div class="power-progress-pair">
        ${renderPowerProgress("Current", upgrade.before.score)}
        ${renderPowerProgress("After Trade", upgrade.after.score)}
      </div>
      <div class="power-badge-row">
        ${upgrade.badges.map((badge) => `<span class="power-badge">${badge}</span>`).join("")}
        ${idea.labScore ? `<span class="power-badge muted-badge">Deal Fit ${idea.labScore}/99</span>` : ""}
      </div>
    </section>
  `;
}

function renderPowerProgress(label, score) {
  return `
    <div class="power-progress">
      <div class="position-meter-top">
        <strong>${label}</strong>
        <span>${score}/100</span>
      </div>
      <div class="meter-track" aria-hidden="true">
        <span style="width:${score}%"></span>
      </div>
    </div>
  `;
}

function renderTradeNarrative(idea) {
  const tags = idea.tags?.length
    ? `<div class="power-badge-row">${idea.tags.map((tag) => `<span class="power-badge">${tag}</span>`).join("")}</div>`
    : "";
  return `
    <section class="trade-narrative">
      ${tags}
      ${idea.summary ? `<p>${idea.summary}</p>` : ""}
      ${idea.pitch ? `<blockquote>${idea.pitch}</blockquote>` : ""}
    </section>
  `;
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

function buildTradePowerUpgrade({ baseline, league, rosters, myRoster, myAssets, theirAssets, values }) {
  const beforeContext = buildLeaguePowerContext({
    league,
    rosters,
    values,
    metricsByRosterId: baseline.metricsByRosterId,
  });
  const beforeProfile = buildTeamPowerProfile({
    roster: myRoster,
    values,
    league,
    context: beforeContext,
    metrics: baseline.metricsByRosterId.get(myRoster.rosterId),
    rank: baseline.ranks.get(myRoster.rosterId),
  });
  const afterRoster = buildRosterAfterTrade(myRoster, theirAssets, myAssets);
  const afterMetricsByRosterId = new Map(baseline.metricsByRosterId);
  afterMetricsByRosterId.set(myRoster.rosterId, evaluateRosterStrength(afterRoster, values, league));
  const afterRanks = rankRosterMetrics(afterMetricsByRosterId);
  const afterContext = buildLeaguePowerContext({
    league,
    rosters,
    values,
    metricsByRosterId: afterMetricsByRosterId,
  });
  const afterProfile = buildTeamPowerProfile({
    roster: afterRoster,
    values,
    league,
    context: afterContext,
    metrics: afterMetricsByRosterId.get(myRoster.rosterId),
    rank: afterRanks.get(myRoster.rosterId),
  });
  const delta = afterProfile.score - beforeProfile.score;

  return {
    before: beforeProfile,
    after: afterProfile,
    delta,
    xp: calculateTradeXp({ beforeProfile, afterProfile, delta }),
    badges: buildTradePowerBadges({ beforeProfile, afterProfile, delta, myAssets, theirAssets }),
    summary: buildTradePowerSummary({ beforeProfile, afterProfile, delta }),
  };
}

function calculateTradeXp({ beforeProfile, afterProfile, delta }) {
  const rankGain = Math.max(0, beforeProfile.rank - afterProfile.rank);
  const starterGain = Math.max(0, afterProfile.metrics.starterValue - beforeProfile.metrics.starterValue);
  const base = delta > 0 ? 120 : 45;
  return Math.round(base + Math.max(0, delta) * 95 + rankGain * 160 + Math.min(900, starterGain * 0.18));
}

function buildTradePowerBadges({ beforeProfile, afterProfile, delta, myAssets, theirAssets }) {
  const badges = [];
  if (delta >= 5) badges.push("Major Power-Up");
  if (delta > 0 && delta < 5) badges.push("Roster Buff");
  if (afterProfile.rank < beforeProfile.rank) badges.push(`Rank +${beforeProfile.rank - afterProfile.rank}`);
  if (afterProfile.metrics.starterValue > beforeProfile.metrics.starterValue + 300) badges.push("Lineup Boost");
  if (afterProfile.assetSummary.pickValue > beforeProfile.assetSummary.pickValue + 800) badges.push("Pick Vault Up");
  if (theirAssets.length < myAssets.length) badges.push("Consolidation");
  if (theirAssets.length > myAssets.length) badges.push("Depth Gain");
  if (afterProfile.weakestPosition?.position !== beforeProfile.weakestPosition?.position) badges.push("Hole Patched");
  if (badges.length === 0) badges.push(delta >= 0 ? "Clean Value" : "Risk-Reward");
  return badges.slice(0, 5);
}

function buildTradePowerSummary({ beforeProfile, afterProfile, delta }) {
  const parts = [];
  parts.push(delta > 0
    ? `adds ${delta} power point${delta === 1 ? "" : "s"}`
    : delta < 0
      ? `costs ${Math.abs(delta)} power point${Math.abs(delta) === 1 ? "" : "s"}`
      : "keeps your power score flat");

  if (afterProfile.rank < beforeProfile.rank) {
    parts.push(`lineup rank climbs from ${ordinal(beforeProfile.rank)} to ${ordinal(afterProfile.rank)}`);
  } else if (afterProfile.rank > beforeProfile.rank) {
    parts.push(`lineup rank falls from ${ordinal(beforeProfile.rank)} to ${ordinal(afterProfile.rank)}`);
  } else {
    parts.push(`lineup rank stays ${ordinal(afterProfile.rank)}`);
  }

  const starterDelta = afterProfile.metrics.starterValue - beforeProfile.metrics.starterValue;
  if (starterDelta !== 0) {
    parts.push(`starters ${starterDelta > 0 ? "gain" : "lose"} ${formatNumber(Math.abs(starterDelta))}`);
  }

  return `This trade ${parts.join(", ")}.`;
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

function getRequestedTierIds() {
  const tradeTier = getTradeTier();
  return tradeTier === "all" ? ["level-up", "even", "break-down"] : [tradeTier];
}

function getTradeTierCopy(tierId, mode, focusAssetName = "the target") {
  const byTier = {
    "level-up": {
      title: "Level Up",
      acquisitionSubtitle: `Add pieces to climb into ${focusAssetName}.`,
      shopSubtitle: `Use your asset as the anchor for a better player coming back.`,
      emptyText: "No level-up packages fit the current setup.",
    },
    even: {
      title: "Trade Even",
      acquisitionSubtitle: "Keep it tight with one-for-one or clean one-for-two structures.",
      shopSubtitle: "Look for sideways swaps that stay close to market.",
      emptyText: "No even swaps cleared the filters.",
    },
    "break-down": {
      title: "Break Down",
      acquisitionSubtitle: `${focusAssetName} plus extra pieces back from the other side.`,
      shopSubtitle: "Move one stronger asset for multiple useful pieces.",
      emptyText: "No break-down packages fit the current setup.",
    },
  };
  const copy = byTier[tierId];
  return {
    title: copy.title,
    subtitle: mode === "shop" ? copy.shopSubtitle : copy.acquisitionSubtitle,
    emptyText: copy.emptyText,
  };
}

function dedupeTwoTeamIdeas(ideas) {
  const seen = new Set();
  const output = [];
  for (const idea of ideas) {
    const key = [
      idea.counterpartyRosterId || "",
      idea.myAssets.map((asset) => asset.assetId).sort().join("|"),
      idea.theirAssets.map((asset) => asset.assetId).sort().join("|"),
    ].join("=>");
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(idea);
  }
  return output;
}

function classifyTwoTeamTradeTier(idea, focusAsset, values, { mode = "acquire" } = {}) {
  const myProfile = buildPackageProfile(idea.myAssets, values);
  const theirProfile = buildPackageProfile(idea.theirAssets, values);
  const leadOutgoingValue = myProfile.topValue || 0;
  const leadIncomingValue = theirProfile.topValue || 0;
  const incomingShare = theirProfile.totalValue > 0 ? leadIncomingValue / theirProfile.totalValue : 1;

  if (
    theirProfile.packageSize >= 2
    && (
      incomingShare < 0.72
      || leadOutgoingValue >= leadIncomingValue * (mode === "shop" ? 1.03 : 1.08)
      || (focusAsset && getAssetValue(focusAsset, values) > leadIncomingValue * 1.04)
    )
  ) {
    return "break-down";
  }

  if (
    leadIncomingValue >= leadOutgoingValue * 1.12
    || myProfile.packageSize > theirProfile.packageSize
    || (mode === "shop" && theirProfile.packageSize === 1 && leadIncomingValue > getAssetValue(focusAsset, values) * 1.08)
  ) {
    return "level-up";
  }

  return "even";
}

function generateAcquisitionIdeaBuckets({
  meRoster,
  theirRoster,
  targetAsset,
  values,
  fairnessPct,
  maxResults,
  tradeLab,
  leagueStrengthBaseline,
}) {
  const targetValue = getAssetValue(targetAsset, values);
  const ideas = [];

  for (const tierId of ["level-up", "even", "break-down"]) {
    for (const plan of getAcquisitionTierPlans(tierId)) {
      const searchContext = buildTradeSearchContext({
        myRoster: meRoster,
        targetAsset,
        values,
        fairnessPct,
        tradeLab,
        maxOutgoingAssetsOverride: plan.maxOutgoingAssets,
      });
      if (!searchContext) continue;

      ideas.push(
        ...suggestTrades({
          myRoster: meRoster,
          theirRoster,
          targetAsset,
          values,
          fairnessPct,
          maxResults: maxResults * 6,
          allowExtraTargetAssets: plan.allowExtraTargetAssets,
          requireExtraTargetAsset: plan.requireExtraTargetAsset,
          maxExtraTargetAssets: plan.maxExtraTargetAssets,
          maxExtraTargetAssetShare: plan.maxExtraTargetAssetShare,
          maxExtraTargetTotalShare: plan.maxExtraTargetTotalShare,
          tradeLab,
          searchContext,
        }).map((idea) => ({
          ...idea,
          counterpartyName: theirRoster.manager.displayName,
          counterpartyRosterId: theirRoster.rosterId,
        }))
      );
    }
  }

  const finalizedIdeas = selectDiverseTradeIdeas(
    dedupeTwoTeamIdeas(ideas).sort((a, b) => compareTradeIdeas(a, b)),
    maxResults,
    values,
    tradeLab.selectedOutgoingAssetIds
  ).map((idea) => enrichTradeIdea({
    idea,
    myRoster: meRoster,
    theirRoster,
    values,
    leagueStrengthBaseline,
  })).sort(compareEnrichedTradeIdeas);

  return {
    kind: "two-team",
    focusAsset: targetAsset,
    primaryCounterpartyName: theirRoster.manager.displayName,
    groups: [{
      title: "Best Trade Ideas",
      subtitle: `Simple offers for ${targetAsset.name}.`,
      emptyText: "No trade ideas fit the current setup.",
      ideas: finalizedIdeas,
    }],
    referenceValue: targetValue,
  };
}

function getAcquisitionTierPlans(tierId) {
  if (tierId === "level-up") {
    return [
      {
        allowExtraTargetAssets: false,
        requireExtraTargetAsset: false,
        maxOutgoingAssets: ELITE_MAX_OUTGOING_PACKAGE_SIZE,
        maxExtraTargetAssets: 0,
        maxExtraTargetAssetShare: 0,
        maxExtraTargetTotalShare: 0,
      },
      {
        allowExtraTargetAssets: true,
        requireExtraTargetAsset: true,
        maxOutgoingAssets: DEFAULT_MAX_OUTGOING_PACKAGE_SIZE,
        maxExtraTargetAssets: 1,
        maxExtraTargetAssetShare: 0.18,
        maxExtraTargetTotalShare: 0.2,
      },
    ];
  }

  if (tierId === "break-down") {
    return [
      {
        allowExtraTargetAssets: true,
        requireExtraTargetAsset: true,
        maxOutgoingAssets: 2,
        maxExtraTargetAssets: 2,
        maxExtraTargetAssetShare: 0.65,
        maxExtraTargetTotalShare: 0.95,
      },
      {
        allowExtraTargetAssets: true,
        requireExtraTargetAsset: true,
        maxOutgoingAssets: 3,
        maxExtraTargetAssets: 3,
        maxExtraTargetAssetShare: 0.5,
        maxExtraTargetTotalShare: 0.85,
      },
    ];
  }

  return [
    {
      allowExtraTargetAssets: false,
      requireExtraTargetAsset: false,
      maxOutgoingAssets: 2,
      maxExtraTargetAssets: 0,
      maxExtraTargetAssetShare: 0,
      maxExtraTargetTotalShare: 0,
    },
    {
      allowExtraTargetAssets: true,
      requireExtraTargetAsset: true,
      maxOutgoingAssets: 2,
      maxExtraTargetAssets: 1,
      maxExtraTargetAssetShare: 0.22,
      maxExtraTargetTotalShare: 0.25,
    },
  ];
}

function generateShopIdeaBuckets({
  meRoster,
  shopAsset,
  values,
  fairnessPct,
  maxResults,
  tradeLab,
  leagueStrengthBaseline,
}) {
  const tierBuckets = {
    "level-up": [],
    even: [],
    "break-down": [],
  };
  const otherRosters = state.normalizedRosters.filter((roster) => roster.rosterId !== meRoster.rosterId);

  otherRosters.forEach((theirRoster) => {
    suggestShopDealsWithRoster({
      meRoster,
      theirRoster,
      shopAsset,
      values,
      fairnessPct,
      tradeLab,
    }).forEach((idea) => {
      tierBuckets[idea.tradeTierId].push(idea);
    });
  });

  const ideas = selectDiverseTradeIdeas(
    dedupeTwoTeamIdeas([
      ...tierBuckets["level-up"],
      ...tierBuckets.even,
      ...tierBuckets["break-down"],
    ]).sort((a, b) => compareTradeIdeas(a, b)),
    maxResults,
    values,
    new Set([shopAsset.assetId])
  ).map((idea) => {
    const theirRoster = state.normalizedRosters.find((roster) => roster.rosterId === idea.counterpartyRosterId);
    if (!theirRoster) return idea;
    return enrichTradeIdea({
      idea,
      myRoster: meRoster,
      theirRoster,
      values,
      leagueStrengthBaseline,
    });
  }).sort(compareEnrichedTradeIdeas);

  return {
    kind: "two-team",
    focusAsset: shopAsset,
    primaryCounterpartyName: "the rest of the league",
    groups: [{
      title: "Best Trade Ideas",
      subtitle: `Best return packages for ${shopAsset.name}.`,
      emptyText: "No trade ideas fit the current setup.",
      ideas,
    }],
  };
}

function suggestShopDealsWithRoster({
  meRoster,
  theirRoster,
  shopAsset,
  values,
  fairnessPct,
  tradeLab,
}) {
  const shopValue = getAssetValue(shopAsset, values);
  if (!Number.isFinite(shopValue)) return [];

  const effectiveFairnessPct = getEffectiveFairnessPct(fairnessPct, tradeLab.tradeVibe);
  const coreAssetIds = getCoreAssetIdSet(meRoster, values);
  const myAssetPool = resolveOutgoingAssetPool({
    myRoster: meRoster,
    values,
    tradeLab,
    targetValue: shopValue,
    coreAssetIds,
  });
  const myPool = [
    shopAsset,
    ...myAssetPool.filter((asset) => asset.assetId !== shopAsset.assetId),
  ];
  const theirPool = buildWindowedCounterpartyPool(theirRoster.assets, values, shopValue);
  if (theirPool.length === 0) return [];

  const requiredOutgoingAssetIds = new Set(
    [shopAsset.assetId, ...tradeLab.selectedOutgoingAssetIds]
      .filter((assetId) => myPool.some((asset) => asset.assetId === assetId))
  );
  const tradeIdeas = [];
  const tierConfigs = [
    { id: "level-up", maxMyAssets: 3, maxTheirAssets: 2, minTheirAssets: 1, myLimit: 90, theirLimit: 90 },
    { id: "even", maxMyAssets: 2, maxTheirAssets: 2, minTheirAssets: 1, myLimit: 90, theirLimit: 90 },
    { id: "break-down", maxMyAssets: 2, maxTheirAssets: 4, minTheirAssets: 2, myLimit: 70, theirLimit: 110 },
  ];

  tierConfigs.forEach((config) => {
    const myPackages = limitPackageCandidates(
      buildPackages(myPool, values, config.maxMyAssets, { requiredAssetIds: requiredOutgoingAssetIds }),
      shopValue,
      config.myLimit,
      { preferMultiple: config.id !== "level-up" }
    );
    const theirPackages = limitPackageCandidates(
      buildPackages(theirPool, values, config.maxTheirAssets),
      shopValue,
      config.theirLimit,
      { preferMultiple: config.id === "break-down", minimumAssets: config.minTheirAssets }
    );

    myPackages.forEach((myPackage) => {
      theirPackages.forEach((theirPackage) => {
        const packageResult = calculatePackageAdjustment({
          myValues: myPackage.values,
          theirValues: theirPackage.values,
          globalMaxValue: getGlobalMaxPlayerValue(values, Math.max(shopValue, theirPackage.totalValue)),
        });
        const pctDiff = calculatePctDiff(packageResult.myAdjustedValue, packageResult.theirAdjustedValue);
        if (pctDiff > effectiveFairnessPct) return;

        const idea = buildShopTradeIdea({
          myPackage,
          theirPackage,
          shopAsset,
          theirRoster,
          values,
          tradeLab,
          pctDiff,
          packageResult,
          coreAssetIds,
        });
        if (idea.tradeTierId !== config.id) return;
        tradeIdeas.push(idea);
      });
    });
  });

  return tradeIdeas;
}

function buildWindowedCounterpartyPool(assets, values, referenceValue) {
  return assets
    .filter(isTradeEligibleAsset)
    .map((asset) => ({ asset, value: getAssetValue(asset, values) }))
    .filter((entry) => Number.isFinite(entry.value))
    .sort((a, b) => {
      const distanceDiff = Math.abs(a.value - referenceValue) - Math.abs(b.value - referenceValue);
      if (distanceDiff !== 0) return distanceDiff;
      return b.value - a.value;
    })
    .slice(0, SHOP_COUNTERPARTY_POOL_LIMIT)
    .map((entry) => entry.asset);
}

function limitPackageCandidates(packages, referenceValue, limit, { preferMultiple = false, minimumAssets = 1 } = {}) {
  return packages
    .map((pkg) => ({
      ...pkg,
      totalValue: pkg.values.reduce((sum, value) => sum + value, 0),
    }))
    .filter((pkg) => pkg.assets.length >= minimumAssets)
    .sort((a, b) => {
      const multiBias = preferMultiple ? b.assets.length - a.assets.length : a.assets.length - b.assets.length;
      const referenceDiff = Math.abs(a.totalValue - referenceValue) - Math.abs(b.totalValue - referenceValue);
      if (referenceDiff !== 0) return referenceDiff;
      if (multiBias !== 0) return multiBias;
      return a.totalValue - b.totalValue;
    })
    .slice(0, limit);
}

function buildShopTradeIdea({
  myPackage,
  theirPackage,
  shopAsset,
  theirRoster,
  values,
  tradeLab,
  pctDiff,
  packageResult,
  coreAssetIds,
}) {
  const tradeTierId = classifyTwoTeamTradeTier({
    myAssets: myPackage.assets,
    theirAssets: theirPackage.assets,
  }, shopAsset, values, { mode: "shop" });
  const marketMyValue = calculatePerceivedPackageValue(myPackage.assets, values, tradeLab);
  const marketTheirValue = calculatePerceivedPackageValue(theirPackage.assets, values, tradeLab);
  const marketDelta = marketTheirValue - marketMyValue;
  const incomingProfile = buildPackageProfile(theirPackage.assets, values);
  const outgoingProfile = buildPackageProfile(myPackage.assets, values);
  const leadIncomingValue = incomingProfile.topValue || 0;
  const exposesCore = myPackage.assets.some((asset) => coreAssetIds.has(asset.assetId) && asset.assetId !== shopAsset.assetId);

  let labScore = 82;
  labScore -= pctDiff * (tradeLab.tradeVibe === "chaos" ? 0.45 : tradeLab.tradeVibe === "aggressive" ? 0.7 : 0.95);
  labScore += Math.max(-20, Math.min(20, marketDelta / 240));
  if (tradeTierId === "level-up" && leadIncomingValue > getAssetValue(shopAsset, values)) labScore += 8;
  if (tradeTierId === "even" && Math.abs(leadIncomingValue - outgoingProfile.topValue) <= Math.max(250, outgoingProfile.topValue * 0.08)) labScore += 6;
  if (tradeTierId === "break-down" && theirPackage.assets.length >= 2) labScore += 8;
  if (theirPackage.assets.some(isFirstRoundPick)) labScore += tradeLab.teamState === "rebuilding" ? 8 : 3;
  if (!exposesCore) labScore += 4;
  if (exposesCore) labScore -= 10;

  return {
    myAssets: myPackage.assets,
    theirAssets: theirPackage.assets,
    ...packageResult,
    pctDiff: Number(pctDiff.toFixed(2)),
    marketMyValue,
    marketTheirValue,
    marketDelta: Math.round(marketDelta),
    marketMetricLabel: "send",
    marketMetricOtherLabel: "receive",
    labScore: clamp(Math.round(labScore), 1, 99),
    primaryAssetId: incomingProfile.leadAssetId,
    primaryAssetValue: incomingProfile.leadAssetValue,
    counterpartyName: theirRoster.manager.displayName,
    counterpartyRosterId: theirRoster.rosterId,
    tradeTierId,
  };
}

function findRosterById(rosterId) {
  return state.normalizedRosters.find((roster) => roster.rosterId === rosterId) || null;
}

function findAssetOnRoster(roster, assetId) {
  return roster?.assets.find((asset) => asset.assetId === assetId) || null;
}

function validateCustomMultiTeamSetup() {
  const setup = resolveCustomMultiTeamSetup();
  return setup.ok ? { ok: true } : setup;
}

function resolveCustomMultiTeamSetup() {
  const meRoster = getMyRoster();
  if (!meRoster) {
    return { ok: false, message: "Choose your team first." };
  }

  const participantRosterIds = [meRoster.rosterId, ...state.customParticipantRosterIds.filter(Boolean)];
  if (participantRosterIds.length < DEFAULT_MULTI_TEAM_COUNT) {
    return { ok: false, message: "Choose at least two other owners for a multi-team trade." };
  }
  if (new Set(participantRosterIds).size !== participantRosterIds.length) {
    return { ok: false, message: "Each team can only appear once in the custom trade builder." };
  }

  const participantRosters = participantRosterIds.map((rosterId) => findRosterById(rosterId)).filter(Boolean);
  if (participantRosters.length !== participantRosterIds.length) {
    return { ok: false, message: "One or more selected teams could not be resolved." };
  }

  return {
    ok: true,
    meRoster,
    participantRosters,
  };
}

function buildOwnerSequenceFromRecipientMap(ownerToRecipient, startRosterId, expectedCount) {
  const sequence = [];
  const visited = new Set();
  let currentRosterId = startRosterId;

  while (!visited.has(currentRosterId)) {
    visited.add(currentRosterId);
    sequence.push(currentRosterId);
    const nextRosterId = ownerToRecipient.get(currentRosterId);
    if (!nextRosterId) return null;
    currentRosterId = nextRosterId;
  }

  if (currentRosterId !== startRosterId) return null;
  if (sequence.length !== expectedCount || visited.size !== expectedCount) return null;
  return sequence;
}

function generateCustomMultiTeamIdeas({
  meRoster,
  values,
  fairnessPct,
  maxResults,
  tradeLab,
}) {
  const setup = resolveCustomMultiTeamSetup();
  if (!setup.ok) {
    return {
      kind: "multi-team",
      teamCount: 0,
      groups: [{
        title: "Multi-Team Ideas",
        subtitle: "Finish picking the owners first.",
        emptyText: setup.message,
        ideas: [],
      }],
    };
  }

  const anchorPlans = buildCustomMultiTeamAnchorPlans({
    meRoster,
    participantRosters: setup.participantRosters,
    values,
    maxPlanCount: Math.max(CUSTOM_MULTI_TEAM_PLAN_LIMIT, maxResults * 4),
  });
  const ideas = anchorPlans.flatMap((plan) => buildMultiTeamIdeasFromAnchors({
    meRoster,
    participantRosters: plan.participantRosters,
    anchorTransfers: plan.anchorTransfers,
    values,
    fairnessPct,
    maxResults,
    tradeLab,
    focusLabel: "blockbuster anchors",
  }));
  const dedupedIdeas = dedupeMultiTeamIdeas(ideas)
    .sort((a, b) => compareMultiTeamIdeas(a, b))
    .slice(0, maxResults);

  return {
    kind: "multi-team",
    teamCount: setup.participantRosters.length,
    groups: [{
      title: `${setup.participantRosters.length}-Team Blockbusters`,
      subtitle: "Automatic blockbuster ideas built across the owners you selected.",
      emptyText: anchorPlans.length === 0
        ? "Could not find enough headline assets across those rosters to sketch a blockbuster."
        : "No multi-team structure stayed close enough to fair value.",
      ideas: dedupedIdeas,
    }],
  };
}

function generateSurpriseBlockbusterIdeas({
  meRoster,
  values,
  fairnessPct,
  maxResults,
  tradeLab,
}) {
  const partnerCount = DEFAULT_MULTI_TEAM_COUNT - 1;
  const otherRosters = state.normalizedRosters.filter((roster) => roster.rosterId !== meRoster.rosterId);
  if (otherRosters.length < partnerCount) {
    return {
      kind: "multi-team",
      teamCount: 0,
      groups: [{
        title: "Surprise Blockbusters",
        subtitle: "Automatic multi-team search",
        emptyText: "This league needs at least three teams for a surprise blockbuster.",
        ideas: [],
      }],
    };
  }

  const participantSets = selectSurpriseBlockbusterParticipantSets({
    otherRosters,
    values,
    partnerCount,
    limit: Math.max(8, maxResults * 4),
  });
  const ideas = [];

  participantSets.forEach((participantSet) => {
    const participantRosters = [meRoster, ...participantSet.rosters];
    const anchorPlans = buildCustomMultiTeamAnchorPlans({
      meRoster,
      participantRosters,
      values,
      maxPlanCount: Math.max(6, maxResults * 3),
    });

    anchorPlans.slice(0, Math.max(4, maxResults * 2)).forEach((plan) => {
      ideas.push(
        ...buildMultiTeamIdeasFromAnchors({
          meRoster,
          participantRosters: plan.participantRosters,
          anchorTransfers: plan.anchorTransfers,
          values,
          fairnessPct,
          maxResults,
          tradeLab,
          focusLabel: "surprise blockbuster",
        })
      );
    });
  });

  const dedupedIdeas = dedupeMultiTeamIdeas(ideas)
    .sort((a, b) => compareMultiTeamIdeas(a, b))
    .slice(0, maxResults);

  return {
    kind: "multi-team",
    teamCount: DEFAULT_MULTI_TEAM_COUNT,
    groups: [{
      title: "Surprise Blockbusters",
      subtitle: "Automatic multi-team ideas. No extra setup.",
      emptyText: participantSets.length === 0
        ? "Could not find enough high-value assets across the league."
        : "No surprise blockbuster stayed close enough to fair value.",
      ideas: dedupedIdeas,
    }],
  };
}

function selectSurpriseBlockbusterParticipantSets({
  otherRosters,
  values,
  partnerCount,
  limit,
}) {
  const scoredRosters = otherRosters
    .map((roster) => ({
      roster,
      score: scoreSurpriseBlockbusterRoster(roster, values),
      topValue: getRosterTopTradeAssetValue(roster, values),
    }))
    .filter((entry) => entry.topValue >= 900)
    .sort((a, b) => b.score - a.score || a.roster.manager.displayName.localeCompare(b.roster.manager.displayName))
    .slice(0, Math.max(6, limit + partnerCount));

  return combinationsOfSize(scoredRosters, partnerCount)
    .map((combo) => {
      const topValues = combo.map((entry) => entry.topValue);
      const maxTopValue = Math.max(...topValues);
      const minTopValue = Math.min(...topValues);
      const spreadPenalty = (maxTopValue - minTopValue) * 0.16;
      return {
        rosters: combo.map((entry) => entry.roster),
        score: combo.reduce((sum, entry) => sum + entry.score, 0) - spreadPenalty,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function scoreSurpriseBlockbusterRoster(roster, values) {
  const entries = roster.assets
    .filter(isTradeEligibleAsset)
    .map((asset) => ({ asset, value: getAssetValue(asset, values) }))
    .filter((entry) => Number.isFinite(entry.value) && entry.value > 0)
    .sort((a, b) => b.value - a.value || a.asset.name.localeCompare(b.asset.name));

  if (entries.length === 0) return 0;

  const top = entries[0]?.value || 0;
  const second = entries[1]?.value || 0;
  const third = entries[2]?.value || 0;
  const firstRoundPickBonus = entries.slice(0, 10).filter((entry) => isFirstRoundPick(entry.asset)).length * 160;
  const youthBonus = entries.slice(0, 8).filter((entry) => isYouthAsset(entry.asset)).length * 70;
  return top * 0.9 + second * 0.34 + third * 0.16 + firstRoundPickBonus + youthBonus;
}

function getRosterTopTradeAssetValue(roster, values) {
  return roster.assets
    .filter(isTradeEligibleAsset)
    .reduce((maxValue, asset) => Math.max(maxValue, getAssetValue(asset, values) || 0), 0);
}

function getCustomMultiTeamAnchorCandidateLimit(participantCount) {
  if (participantCount >= 6) return 1;
  if (participantCount >= 5) return 2;
  return CUSTOM_MULTI_TEAM_BASE_ANCHOR_CANDIDATE_LIMIT;
}

function scoreCustomMultiTeamAnchorCandidate({
  asset,
  value,
  rosterPeakValue,
  blockbusterFloor,
  coreAssetIds,
  isMyRoster = false,
}) {
  let score = value;

  if (value >= blockbusterFloor) {
    score += Math.min(320, value * 0.03);
  } else {
    score -= (blockbusterFloor - value) * 0.18;
  }

  if (value >= rosterPeakValue * 0.92) {
    score -= coreAssetIds.has(asset.assetId) ? 260 : 120;
  } else if (value >= rosterPeakValue * 0.62) {
    score += 90;
  }

  if (coreAssetIds.has(asset.assetId)) score -= 120;
  if (asset.assetType === "pick") score += isFirstRoundPick(asset) ? 190 : 110;
  if (isYouthAsset(asset)) score += 85;
  if (isVeteranAsset(asset)) score -= 40;
  if (isMyRoster && state.selectedOutgoingAssetIds.has(asset.assetId)) score += 260;

  return score;
}

function listCustomMultiTeamAnchorCandidates({
  roster,
  values,
  participantCount,
  isMyRoster = false,
}) {
  const candidateLimit = getCustomMultiTeamAnchorCandidateLimit(participantCount);
  const coreAssetIds = getCoreAssetIdSet(roster, values);
  const eligibleEntries = roster.assets
    .filter(isTradeEligibleAsset)
    .filter((asset) => Number.isFinite(getAssetValue(asset, values)))
    .filter((asset) => !isMyRoster || !state.excludedOutgoingAssetIds.has(asset.assetId))
    .map((asset) => ({
      asset,
      value: getAssetValue(asset, values),
    }))
    .sort((a, b) => b.value - a.value || a.asset.name.localeCompare(b.asset.name));

  if (eligibleEntries.length === 0) return [];

  const rosterPeakValue = eligibleEntries[0].value;
  const blockbusterFloor = Math.max(
    900,
    rosterPeakValue * (participantCount <= DEFAULT_MULTI_TEAM_COUNT ? 0.44 : 0.38)
  );
  const scoredEntries = eligibleEntries
    .map((entry) => ({
      ...entry,
      score: scoreCustomMultiTeamAnchorCandidate({
        asset: entry.asset,
        value: entry.value,
        rosterPeakValue,
        blockbusterFloor,
        coreAssetIds,
        isMyRoster,
      }),
    }))
    .sort((a, b) => b.score - a.score || b.value - a.value || a.asset.name.localeCompare(b.asset.name));

  const picks = scoredEntries.filter((entry) => entry.value >= blockbusterFloor).slice(0, candidateLimit);
  if (picks.length >= candidateLimit || scoredEntries.length <= candidateLimit) return picks.length > 0 ? picks : scoredEntries.slice(0, candidateLimit);

  for (const entry of scoredEntries) {
    if (picks.length >= candidateLimit) break;
    if (picks.some((existing) => existing.asset.assetId === entry.asset.assetId)) continue;
    picks.push(entry);
  }

  return picks;
}

function listCustomMultiTeamSecondaryAnchorCandidates({
  roster,
  values,
  participantCount,
  primaryAsset,
  isMyRoster = false,
}) {
  if (!roster || !primaryAsset) return [];

  const primaryValue = getAssetValue(primaryAsset, values);
  if (!Number.isFinite(primaryValue) || primaryValue <= 0) return [];

  const coreAssetIds = getCoreAssetIdSet(roster, values);
  const minValue = Math.max(325, primaryValue * CUSTOM_MULTI_TEAM_SECONDARY_ANCHOR_MIN_SHARE);
  const maxValue = Math.max(
    900,
    Math.min(primaryValue * CUSTOM_MULTI_TEAM_SECONDARY_ANCHOR_MAX_SHARE, primaryValue - 180)
  );
  const targetValue = clamp(
    primaryValue * (participantCount <= DEFAULT_MULTI_TEAM_COUNT ? 0.42 : 0.34),
    minValue,
    maxValue
  );

  return roster.assets
    .filter(isTradeEligibleAsset)
    .filter((asset) => asset.assetId !== primaryAsset.assetId)
    .filter((asset) => Number.isFinite(getAssetValue(asset, values)))
    .filter((asset) => !isMyRoster || !state.excludedOutgoingAssetIds.has(asset.assetId))
    .map((asset) => ({
      asset,
      value: getAssetValue(asset, values),
    }))
    .filter((entry) => entry.value >= minValue && entry.value <= maxValue)
    .sort((left, right) => {
      const leftScore = Math.abs(left.value - targetValue)
        + (coreAssetIds.has(left.asset.assetId) ? 420 : 0)
        - (left.asset.assetType === "pick" ? 180 : 0)
        - (isYouthAsset(left.asset) ? 70 : 0);
      const rightScore = Math.abs(right.value - targetValue)
        + (coreAssetIds.has(right.asset.assetId) ? 420 : 0)
        - (right.asset.assetType === "pick" ? 180 : 0)
        - (isYouthAsset(right.asset) ? 70 : 0);
      if (leftScore !== rightScore) return leftScore - rightScore;
      return right.value - left.value;
    })
    .slice(0, CUSTOM_MULTI_TEAM_SECONDARY_ANCHOR_LIMIT);
}

function buildCustomMultiTeamCycleOrders({
  meRoster,
  participantRosters,
  limit = CUSTOM_MULTI_TEAM_ORDER_LIMIT,
}) {
  const partnerIds = participantRosters
    .filter((roster) => roster.rosterId !== meRoster.rosterId)
    .map((roster) => roster.rosterId);
  if (partnerIds.length === 0) return [];

  const seen = new Set();
  const orders = [];
  const maxOrderCount = Number.isFinite(limit) ? limit : Number.POSITIVE_INFINITY;
  const permutationLimit = partnerIds.length <= 3 ? Number.POSITIVE_INFINITY : maxOrderCount * 3;

  function pushOrder(partnerOrder) {
    if (orders.length >= maxOrderCount) return;
    const ownerSequence = [meRoster.rosterId, ...partnerOrder];
    const key = ownerSequence.join("|");
    if (seen.has(key)) return;
    seen.add(key);
    orders.push(ownerSequence);
  }

  pushOrder(partnerIds);
  pushOrder([...partnerIds].reverse());
  buildRosterIdPermutations(partnerIds, permutationLimit).forEach(pushOrder);

  return orders;
}

function buildRosterIdPermutations(rosterIds, limit = Number.POSITIVE_INFINITY) {
  if (rosterIds.length <= 1) return [rosterIds];

  const permutations = [];
  const used = new Array(rosterIds.length).fill(false);
  const current = [];

  function walk() {
    if (permutations.length >= limit) return true;
    if (current.length === rosterIds.length) {
      permutations.push([...current]);
      return permutations.length >= limit;
    }

    for (let index = 0; index < rosterIds.length; index += 1) {
      if (used[index]) continue;
      used[index] = true;
      current.push(rosterIds[index]);
      const shouldStop = walk();
      current.pop();
      used[index] = false;
      if (shouldStop) return true;
    }

    return false;
  }

  walk();
  return permutations;
}

function buildCustomMultiTeamPrimaryCycleTransfers({
  ownerSequence,
  primaryAnchorByOwner,
}) {
  return ownerSequence.map((ownerId, sequenceIndex) => ({
    fromRosterId: ownerId,
    toRosterId: ownerSequence[(sequenceIndex + 1) % ownerSequence.length],
    asset: primaryAnchorByOwner.get(ownerId),
    isRequested: true,
  })).filter((transfer) => transfer.asset);
}

function buildCustomMultiTeamAnchorPlanVariants({
  ownerSequence,
  primaryAnchorByOwner,
  secondaryCandidatesByOwner,
}) {
  const baseTransfers = buildCustomMultiTeamPrimaryCycleTransfers({
    ownerSequence,
    primaryAnchorByOwner,
  });
  const variants = [];
  const seen = new Set();

  function pushVariant(extraTransfers = [], variantScore = 0) {
    const anchorTransfers = [...baseTransfers, ...extraTransfers].filter((transfer) => transfer.asset);
    const key = anchorTransfers
      .map((transfer) => `${transfer.fromRosterId}:${transfer.asset.assetId}->${transfer.toRosterId}`)
      .sort()
      .join("|");
    if (seen.has(key)) return;
    seen.add(key);
    variants.push({
      anchorTransfers,
      variantScore,
    });
  }

  pushVariant([], 0);

  ownerSequence.forEach((ownerId, index) => {
    const candidates = secondaryCandidatesByOwner.get(ownerId) || [];
    const primaryRecipientId = ownerSequence[(index + 1) % ownerSequence.length];
    const alternateRecipientId = ownerSequence[(index + 2) % ownerSequence.length];

    candidates.forEach((candidate, candidateIndex) => {
      pushVariant([{
        fromRosterId: ownerId,
        toRosterId: primaryRecipientId,
        asset: candidate.asset,
        isRequested: true,
      }], 150 - candidateIndex * 18);

      if (alternateRecipientId !== ownerId && alternateRecipientId !== primaryRecipientId) {
        pushVariant([{
          fromRosterId: ownerId,
          toRosterId: alternateRecipientId,
          asset: candidate.asset,
          isRequested: true,
        }], 190 - candidateIndex * 18);
      }
    });
  });

  const topSecondaryEntries = ownerSequence
    .map((ownerId, index) => ({
      ownerId,
      index,
      candidate: (secondaryCandidatesByOwner.get(ownerId) || [])[0] || null,
    }))
    .filter((entry) => entry.candidate);
  let pairedVariantCount = 0;

  for (let leftIndex = 0; leftIndex < topSecondaryEntries.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < topSecondaryEntries.length; rightIndex += 1) {
      if (pairedVariantCount >= Math.max(2, ownerSequence.length - 1)) break;

      const leftEntry = topSecondaryEntries[leftIndex];
      const rightEntry = topSecondaryEntries[rightIndex];
      const leftPrimaryRecipientId = ownerSequence[(leftEntry.index + 1) % ownerSequence.length];
      const rightAlternateRecipientId = ownerSequence[(rightEntry.index + 2) % ownerSequence.length];
      const rightRecipientId = rightAlternateRecipientId === rightEntry.ownerId
        ? ownerSequence[(rightEntry.index + 1) % ownerSequence.length]
        : rightAlternateRecipientId;

      pushVariant([
        {
          fromRosterId: leftEntry.ownerId,
          toRosterId: leftPrimaryRecipientId,
          asset: leftEntry.candidate.asset,
          isRequested: true,
        },
        {
          fromRosterId: rightEntry.ownerId,
          toRosterId: rightRecipientId,
          asset: rightEntry.candidate.asset,
          isRequested: true,
        },
      ], 245 - pairedVariantCount * 22);
      pairedVariantCount += 1;
    }
  }

  return variants;
}

function scoreCustomMultiTeamAnchorPlan({
  ownerSequence,
  anchorAssetByOwner,
  values,
  candidateScoreTotal = 0,
}) {
  const anchorValues = ownerSequence
    .map((ownerId) => getAssetValue(anchorAssetByOwner.get(ownerId), values))
    .filter(Number.isFinite);
  if (anchorValues.length !== ownerSequence.length) return Number.NEGATIVE_INFINITY;

  const totalAnchorValue = anchorValues.reduce((sum, value) => sum + value, 0);
  const avgAnchorValue = totalAnchorValue / Math.max(anchorValues.length, 1);
  const maxAnchorValue = Math.max(...anchorValues);
  const minAnchorValue = Math.min(...anchorValues);
  const cyclicalGap = ownerSequence.reduce((sum, ownerId, index) => {
    const previousOwnerId = ownerSequence[(index - 1 + ownerSequence.length) % ownerSequence.length];
    const outgoingValue = getAssetValue(anchorAssetByOwner.get(ownerId), values);
    const incomingValue = getAssetValue(anchorAssetByOwner.get(previousOwnerId), values);
    return sum + Math.abs(outgoingValue - incomingValue);
  }, 0);
  const liquidityBonus = ownerSequence.reduce((sum, ownerId) => {
    const asset = anchorAssetByOwner.get(ownerId);
    if (isFirstRoundPick(asset)) return sum + 120;
    if (asset.assetType === "pick") return sum + 70;
    if (isYouthAsset(asset)) return sum + 45;
    return sum;
  }, 0);

  return (
    candidateScoreTotal * 0.3
    + totalAnchorValue * 0.72
    + avgAnchorValue * 0.88
    + liquidityBonus
    - cyclicalGap * 0.74
    - (maxAnchorValue - minAnchorValue) * 0.42
  );
}

function buildCustomMultiTeamAnchorPlans({
  meRoster,
  participantRosters,
  values,
  maxPlanCount = CUSTOM_MULTI_TEAM_PLAN_LIMIT,
}) {
  const participantCount = participantRosters.length;
  const cycleOrders = buildCustomMultiTeamCycleOrders({
    meRoster,
    participantRosters,
    limit: participantCount <= 4 ? Number.POSITIVE_INFINITY : CUSTOM_MULTI_TEAM_ORDER_LIMIT,
  });
  if (cycleOrders.length === 0) return [];

  const candidateLists = participantRosters.map((roster) => ({
    roster,
    candidates: listCustomMultiTeamAnchorCandidates({
      roster,
      values,
      participantCount,
      isMyRoster: roster.rosterId === meRoster.rosterId,
    }),
  }));
  if (candidateLists.some((entry) => entry.candidates.length === 0)) return [];

  const plans = [];
  const seen = new Set();
  const selection = [];

  function walk(index, candidateScoreTotal) {
    if (index >= candidateLists.length) {
      const anchorAssetByOwner = new Map(selection.map((entry) => [entry.roster.rosterId, entry.candidate.asset]));
      const secondaryCandidatesByOwner = new Map(selection.map((entry) => [
        entry.roster.rosterId,
        listCustomMultiTeamSecondaryAnchorCandidates({
          roster: entry.roster,
          values,
          participantCount,
          primaryAsset: entry.candidate.asset,
          isMyRoster: entry.roster.rosterId === meRoster.rosterId,
        }),
      ]));

      cycleOrders.forEach((ownerSequence) => {
        buildCustomMultiTeamAnchorPlanVariants({
          ownerSequence,
          primaryAnchorByOwner: anchorAssetByOwner,
          secondaryCandidatesByOwner,
        }).forEach((planVariant) => {
          const key = planVariant.anchorTransfers
            .map((transfer) => `${transfer.fromRosterId}:${transfer.asset?.assetId || "none"}->${transfer.toRosterId}`)
            .sort()
            .join("|");
          if (seen.has(key)) return;
          seen.add(key);
          plans.push({
            participantRosters,
            anchorTransfers: planVariant.anchorTransfers,
            score: scoreCustomMultiTeamAnchorPlan({
              ownerSequence,
              anchorAssetByOwner,
              values,
              candidateScoreTotal,
            }) + planVariant.variantScore,
          });
        });
      });
      return;
    }

    const entry = candidateLists[index];
    entry.candidates.forEach((candidate) => {
      selection.push({ roster: entry.roster, candidate });
      walk(index + 1, candidateScoreTotal + candidate.score);
      selection.pop();
    });
  }

  walk(0, 0);

  return plans
    .filter((plan) => Number.isFinite(plan.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPlanCount);
}

function generateAutoMultiTeamIdeas({
  meRoster,
  targetAsset,
  values,
  fairnessPct,
  maxResults,
  tradeLab,
}) {
  const targetOwner = findRosterById(targetAsset.managerRosterId);
  if (!targetOwner) {
    return {
      kind: "multi-team",
      teamCount: 0,
      focusAsset: targetAsset,
      groups: [{
        title: "Multi-Team Routes",
        subtitle: "Automatic helper search",
        emptyText: "Could not resolve the target manager for the selected asset.",
        ideas: [],
      }],
    };
  }

  const requestedTeamCount = clamp(
    Number(el.multiTeamCountSelect?.value || DEFAULT_MULTI_TEAM_COUNT),
    DEFAULT_MULTI_TEAM_COUNT,
    state.normalizedRosters.length
  );
  const helperCount = Math.max(0, requestedTeamCount - 2);
  const helperSets = buildAutoMultiTeamHelperSets({
    meRoster,
    targetOwner,
    helperCount,
    targetValue: getAssetValue(targetAsset, values),
    values,
  });
  const ideas = [];

  helperSets.forEach((helperSet) => {
    buildAutoMultiTeamAnchorPlans({
      meRoster,
      helperSet,
      targetOwner,
      targetAsset,
      values,
      tradeTier: getTradeTier(),
    }).forEach((plan) => {
      ideas.push(
        ...buildMultiTeamIdeasFromAnchors({
          meRoster,
          participantRosters: plan.participantRosters,
          anchorTransfers: plan.anchorTransfers,
          values,
          fairnessPct,
          maxResults,
          tradeLab,
          focusLabel: targetAsset.name,
        })
      );
    });
  });

  const dedupedIdeas = dedupeMultiTeamIdeas(ideas)
    .sort((a, b) => compareMultiTeamIdeas(a, b))
    .slice(0, maxResults);

  return {
    kind: "multi-team",
    focusAsset: targetAsset,
    teamCount: requestedTeamCount,
    groups: [{
      title: `${requestedTeamCount}-Team Routes`,
      subtitle: `Automatic multi-team paths built around landing ${targetAsset.name}.`,
      emptyText: "No multi-team routes cleared the value filters for that target.",
      ideas: dedupedIdeas,
    }],
  };
}

function buildMultiTeamIdeasFromAnchors({
  meRoster,
  participantRosters,
  anchorTransfers,
  values,
  fairnessPct,
  maxResults,
  tradeLab,
  focusLabel,
}) {
  const baseState = createMultiTeamTradeState({
    meRoster,
    participantRosters,
    anchorTransfers,
    values,
  });
  const balanceContext = buildMultiTeamBalanceContext(baseState, values);
  if (!balanceContext) return [];

  const compensationPlans = solveMultiTeamCompensationPlans({
    tradeState: baseState,
    balanceContext,
    meRoster,
    values,
    tradeLab,
    maxResults,
  });
  const ideas = [];

  for (const compensationPlan of compensationPlans) {
    const variantState = cloneMultiTeamTradeState(baseState);
    compensationPlan.transfers.forEach((transfer) => {
      addMultiTeamTransfer(variantState.stateByRosterId, {
        fromRosterId: transfer.fromRosterId,
        toRosterId: transfer.toRosterId,
        asset: transfer.asset,
        kind: "filler",
      });
    });

    const finalizedIdea = finalizeMultiTeamTradeIdea({
      tradeState: variantState,
      meRoster,
      values,
      tradeLab,
      fairnessPct,
      focusLabel,
      balanceContext,
      assignmentMeta: compensationPlan.meta,
    });
    if (finalizedIdea) ideas.push(finalizedIdea);
  }

  return dedupeMultiTeamIdeas(ideas).sort((a, b) => compareMultiTeamIdeas(a, b)).slice(0, maxResults);
}

function createMultiTeamTradeState({ meRoster, participantRosters, anchorTransfers, values }) {
  const stateByRosterId = new Map();

  participantRosters.forEach((roster) => {
    stateByRosterId.set(roster.rosterId, {
      roster,
      outgoingTransfers: [],
      incomingTransfers: [],
      coreAssetIds: getCoreAssetIdSet(roster, values),
    });
  });

  anchorTransfers.forEach((transfer) => {
    addMultiTeamTransfer(stateByRosterId, {
      fromRosterId: transfer.fromRosterId,
      toRosterId: transfer.toRosterId,
      asset: transfer.asset,
      kind: "anchor",
      isRequested: Boolean(transfer.isRequested),
    });
  });

  return {
    meRosterId: meRoster.rosterId,
    participantRosters,
    stateByRosterId,
  };
}

function cloneMultiTeamTradeState(baseState) {
  const clonedMap = new Map();
  baseState.stateByRosterId.forEach((participantState, rosterId) => {
    clonedMap.set(rosterId, {
      roster: participantState.roster,
      outgoingTransfers: participantState.outgoingTransfers.map((transfer) => ({ ...transfer })),
      incomingTransfers: participantState.incomingTransfers.map((transfer) => ({ ...transfer })),
      coreAssetIds: new Set(participantState.coreAssetIds),
    });
  });

  return {
    meRosterId: baseState.meRosterId,
    participantRosters: baseState.participantRosters,
    stateByRosterId: clonedMap,
  };
}

function addMultiTeamTransfer(stateByRosterId, { fromRosterId, toRosterId, asset, kind = "filler", isRequested = false }) {
  if (!asset || fromRosterId == null || toRosterId == null || fromRosterId === toRosterId) return;

  const senderState = stateByRosterId.get(fromRosterId);
  const receiverState = stateByRosterId.get(toRosterId);
  if (!senderState || !receiverState) return;

  const transferRecord = {
    asset,
    fromRosterId,
    toRosterId,
    kind,
    isRequested,
  };
  senderState.outgoingTransfers.push(transferRecord);
  receiverState.incomingTransfers.push(transferRecord);
}

function getMultiTeamParticipantMetrics(tradeState, values) {
  return [...tradeState.stateByRosterId.values()].map((participantState) => {
    const outgoingAssets = participantState.outgoingTransfers.map((transfer) => transfer.asset);
    const incomingAssets = participantState.incomingTransfers.map((transfer) => transfer.asset);
    const outgoingValue = outgoingAssets.reduce((sum, asset) => sum + getAssetValue(asset, values), 0);
    const incomingValue = incomingAssets.reduce((sum, asset) => sum + getAssetValue(asset, values), 0);
    const needReceive = Math.max(0, outgoingValue - incomingValue);
    const needSend = Math.max(0, incomingValue - outgoingValue);

    return {
      roster: participantState.roster,
      outgoingAssets,
      incomingAssets,
      outgoingValue,
      incomingValue,
      needReceive,
      needSend,
    };
  });
}

function solveMultiTeamTradeState(tradeState, { meRoster, values, tradeLab, variantIndex }) {
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const participantMetrics = getMultiTeamParticipantMetrics(tradeState, values);
    const receivers = participantMetrics
      .filter((metric) => metric.needReceive > 140)
      .sort((left, right) => {
        if (variantIndex % 2 === 0) return right.needReceive - left.needReceive;
        return left.needReceive - right.needReceive;
      });
    const debtors = participantMetrics
      .filter((metric) => metric.needSend > 140)
      .sort((left, right) => {
        if (variantIndex % 3 === 0) return right.needSend - left.needSend;
        return left.needSend - right.needSend;
      });

    if (receivers.length === 0 || debtors.length === 0) break;

    const nextMove = selectBestMultiTeamFillerMove({
      tradeState,
      meRoster,
      values,
      tradeLab,
      variantIndex,
      receivers,
      debtors,
    });
    if (!nextMove) break;

    addMultiTeamTransfer(tradeState.stateByRosterId, {
      fromRosterId: nextMove.fromRosterId,
      toRosterId: nextMove.toRosterId,
      asset: nextMove.asset,
      kind: "filler",
    });
  }
}

function selectBestMultiTeamFillerMove({
  tradeState,
  meRoster,
  values,
  tradeLab,
  variantIndex,
  receivers,
  debtors,
}) {
  const bestMoves = [];

  debtors.forEach((debtorMetric) => {
    const participantState = tradeState.stateByRosterId.get(debtorMetric.roster.rosterId);
    const candidates = buildAvailableMultiTeamFillerAssets({
      participantState,
      meRoster,
      values,
      tradeLab,
      variantIndex,
    });
    if (candidates.length === 0) return;

    receivers
      .filter((receiverMetric) => receiverMetric.roster.rosterId !== debtorMetric.roster.rosterId)
      .forEach((receiverMetric) => {
        candidates.forEach((candidateAsset) => {
          const score = scoreMultiTeamFillerMove({
            asset: candidateAsset,
            debtorMetric,
            receiverMetric,
            participantState,
            meRoster,
            values,
            tradeLab,
            variantIndex,
          });
          if (!Number.isFinite(score)) return;
          bestMoves.push({
            fromRosterId: debtorMetric.roster.rosterId,
            toRosterId: receiverMetric.roster.rosterId,
            asset: candidateAsset,
            score,
          });
        });
      });
  });

  bestMoves.sort((left, right) => right.score - left.score);
  return bestMoves[0] || null;
}

function buildAvailableMultiTeamFillerAssets({
  participantState,
  meRoster,
  values,
  tradeLab,
  variantIndex,
  limit = MULTI_TEAM_FILLER_POOL_LIMIT,
}) {
  const sentAssetIds = new Set(participantState.outgoingTransfers.map((transfer) => transfer.asset.assetId));
  const isMyRoster = participantState.roster.rosterId === meRoster.rosterId;

  return participantState.roster.assets
    .filter(isTradeEligibleAsset)
    .filter((asset) => Number.isFinite(getAssetValue(asset, values)))
    .filter((asset) => !sentAssetIds.has(asset.assetId))
    .filter((asset) => !isMyRoster || !state.excludedOutgoingAssetIds.has(asset.assetId))
    .sort((left, right) => {
      const leftScore = scoreMultiTeamAssetLiquidity(left, participantState, meRoster, values, tradeLab, variantIndex);
      const rightScore = scoreMultiTeamAssetLiquidity(right, participantState, meRoster, values, tradeLab, variantIndex);
      if (rightScore !== leftScore) return rightScore - leftScore;
      return sortAssetsByValueDesc(left, right, values);
    })
    .slice(0, limit);
}

function scoreMultiTeamAssetLiquidity(asset, participantState, meRoster, values, tradeLab, variantIndex) {
  const assetValue = getAssetValue(asset, values);
  const isMyRoster = participantState.roster.rosterId === meRoster.rosterId;
  let score = assetValue;

  if (participantState.coreAssetIds.has(asset.assetId)) score -= isMyRoster ? 850 : 420;
  if (isMyRoster && state.selectedOutgoingAssetIds.has(asset.assetId)) score += 280;
  if (asset.assetType === "pick") score += tradeLab.teamState === "rebuilding" ? 90 : 35;
  if (tradeLab.teamState === "contending" && isVeteranAsset(asset)) score += 55;
  if (variantIndex % 3 === 1 && assetValue <= 2500) score += 40;
  if (variantIndex % 3 === 2 && assetValue >= 2500) score += 40;

  return score;
}

function scoreMultiTeamFillerMove({
  asset,
  debtorMetric,
  receiverMetric,
  participantState,
  meRoster,
  values,
  tradeLab,
  variantIndex,
}) {
  const assetValue = getAssetValue(asset, values);
  const targetGap = Math.max(180, Math.min(debtorMetric.needSend, receiverMetric.needReceive));
  const isMyRoster = participantState.roster.rosterId === meRoster.rosterId;
  let score = 10000;

  score -= Math.abs(assetValue - targetGap) * 1.35;
  score -= Math.abs(assetValue - debtorMetric.needSend) * 0.35;
  score -= Math.abs(assetValue - receiverMetric.needReceive) * 0.35;

  if (participantState.coreAssetIds.has(asset.assetId)) score -= isMyRoster ? 900 : 440;
  if (isMyRoster && state.selectedOutgoingAssetIds.has(asset.assetId)) score += 320;
  if (asset.assetType === "pick") score += tradeLab.teamState === "rebuilding" ? 80 : 25;
  if (tradeLab.teamState === "contending" && isVeteranAsset(asset)) score += 45;
  if (variantIndex % 4 === 1 && assetValue <= targetGap * 1.08) score += 55;
  if (variantIndex % 4 === 2 && assetValue >= targetGap * 0.92) score += 55;
  if (variantIndex % 4 === 3 && receiverMetric.roster.rosterId === meRoster.rosterId) score += 45;

  return score;
}

function finalizeMultiTeamTradeIdea({
  tradeState,
  meRoster,
  values,
  tradeLab,
  fairnessPct,
  focusLabel,
  balanceContext = null,
  assignmentMeta = null,
}) {
  const fairnessLimit = getMultiTeamFairnessLimit(fairnessPct, tradeLab, tradeState.participantRosters.length);
  const participants = [];

  for (const participantState of tradeState.stateByRosterId.values()) {
    const outgoingAssets = participantState.outgoingTransfers.map((transfer) => transfer.asset);
    const incomingAssets = participantState.incomingTransfers.map((transfer) => transfer.asset);
    if (outgoingAssets.length === 0 || incomingAssets.length === 0) return null;

    const tradeShape = summarizeMultiTeamParticipantShape(participantState, values);
    const fairnessMetrics = calculateMultiTeamParticipantFairness({
      outgoingAssets,
      incomingAssets,
      values,
      tradeLab,
      tradeShape,
    });
    const pctDiff = fairnessMetrics.pctDiff;
    if (pctDiff > fairnessLimit) return null;

    const sendToNames = [...new Set(
      participantState.outgoingTransfers
        .map((transfer) => findRosterById(transfer.toRosterId)?.manager.displayName)
        .filter(Boolean)
    )];
    const receiveFromNames = [...new Set(
      participantState.incomingTransfers
        .map((transfer) => findRosterById(transfer.fromRosterId)?.manager.displayName)
        .filter(Boolean)
    )];

    participants.push({
      roster: participantState.roster,
      sendToNames,
      receiveFromNames,
      outgoingAssets,
      incomingAssets,
      outgoingAdjustedValue: fairnessMetrics.outgoingRawValue,
      incomingAdjustedValue: fairnessMetrics.incomingRawValue,
      packageAdjustment: fairnessMetrics.packageAdjustment,
      packageAdjustmentSide: fairnessMetrics.packageAdjustmentSide,
      netValueDelta: fairnessMetrics.netValueDelta,
      marketPctDiff: fairnessMetrics.marketPctDiff,
      packageTaxPct: fairnessMetrics.packageTaxPct,
      pctDiff,
      requestedIncomingCount: tradeShape.requestedIncomingCount,
      tradeShape,
    });
  }

  const maxPctDiff = Number(Math.max(...participants.map((participant) => participant.pctDiff)).toFixed(2));
  const avgPctDiff = Number((
    participants.reduce((sum, participant) => sum + participant.pctDiff, 0) / participants.length
  ).toFixed(2));
  const totalAssetsMoved = participants.reduce((sum, participant) => sum + participant.outgoingAssets.length, 0);
  const requestedCount = participants.reduce((sum, participant) => sum + participant.requestedIncomingCount, 0);
  const fillerValueTotal = assignmentMeta?.fillerValueTotal ?? 0;
  const fillerAssetCount = assignmentMeta?.fillerAssetCount ?? 0;
  const fillerPairCount = assignmentMeta?.fillerPairCount ?? 0;
  const senderSplitCount = assignmentMeta?.senderSplitCount ?? 0;
  const receiverSplitCount = assignmentMeta?.receiverSplitCount ?? 0;
  const routingMetrics = collectMultiTeamRoutingMetrics(tradeState);
  const extraAnchorCount = Math.max(0, routingMetrics.anchorTransferCount - tradeState.participantRosters.length);
  const routeSplitCount = routingMetrics.senderSplitCount + routingMetrics.receiverSplitCount;
  const anchorValueTotal = balanceContext?.anchorValueTotal
    ?? participants.reduce((sum, participant) => {
      return sum + participant.outgoingAssets
        .filter((asset) => participantStateHasAssetOfKind(tradeState.stateByRosterId.get(participant.roster.rosterId), asset.assetId, "anchor"))
        .reduce((assetSum, asset) => assetSum + getAssetValue(asset, values), 0);
    }, 0);
  const requestedAnchorValueTotal = balanceContext?.requestedAnchorValueTotal ?? 0;
  const unrequestedAnchorValueTotal = balanceContext?.unrequestedAnchorValueTotal ?? Math.max(0, anchorValueTotal - requestedAnchorValueTotal);
  const requiredCompValue = balanceContext?.totalNeedReceive ?? 0;
  const fillerOverageValue = Math.max(0, fillerValueTotal - requiredCompValue);
  const extraMovedValueTotal = fillerValueTotal + unrequestedAnchorValueTotal;
  const fillerOverageRatio = requiredCompValue > 0 ? fillerOverageValue / requiredCompValue : 0;
  const fillerRatio = anchorValueTotal > 0 ? fillerValueTotal / anchorValueTotal : 0;
  const maxFillerRatio = getMultiTeamMaxFillerRatio(tradeState.participantRosters.length);
  const maxAllowedFillerAssets = tradeState.participantRosters.length + Math.max(1, Math.floor(tradeState.participantRosters.length / 2));
  const maxUnrequestedAnchorRatio = getMultiTeamMaxUnrequestedAnchorRatio(tradeState.participantRosters.length);
  const maxFillerOverageRatio = getMultiTeamMaxFillerOverageRatio(tradeState.participantRosters.length);
  const unrequestedAnchorRatio = requestedAnchorValueTotal > 0
    ? unrequestedAnchorValueTotal / requestedAnchorValueTotal
    : unrequestedAnchorValueTotal > 0 ? Number.POSITIVE_INFINITY : 0;
  const participantShapePenalty = participants.reduce((sum, participant) => sum + evaluateMultiTeamParticipantShape({
    tradeShape: participant.tradeShape,
    participantCount: tradeState.participantRosters.length,
  }).scorePenalty, 0);
  const avgPackageTaxPct = Number((
    participants.reduce((sum, participant) => sum + (participant.packageTaxPct || 0), 0) / participants.length
  ).toFixed(2));

  if (fillerAssetCount > maxAllowedFillerAssets) return null;
  if (fillerRatio > maxFillerRatio && fillerValueTotal > 1800) return null;
  if (unrequestedAnchorRatio > maxUnrequestedAnchorRatio && unrequestedAnchorValueTotal > 1200) return null;
  if (fillerOverageRatio > maxFillerOverageRatio && fillerOverageValue > 900) return null;
  if (fillerPairCount > Math.max(2, tradeState.participantRosters.length - 1)) return null;
  if (participants.some((participant) => !evaluateMultiTeamParticipantShape({
    tradeShape: participant.tradeShape,
    participantCount: tradeState.participantRosters.length,
  }).ok)) return null;

  const labScore = clamp(
    Math.round(
      96
      - maxPctDiff * 0.95
      - avgPctDiff * 0.45
      - fillerRatio * 38
      - unrequestedAnchorRatio * 28
      - fillerOverageRatio * 24
      - avgPackageTaxPct * 0.3
      - fillerAssetCount * 2.8
      - fillerPairCount * 2.9
      - senderSplitCount * 2.7
      - receiverSplitCount * 2.4
      - Math.max(0, totalAssetsMoved - participants.length) * 0.7
      - participantShapePenalty
      + requestedCount * 1.4
      + extraAnchorCount * 4.2
      + Math.min(3, routeSplitCount) * 1.35
    ),
    1,
    99
  );

  const structureTag = extraAnchorCount >= 2
    ? "Chaos Build"
    : extraAnchorCount === 1
      ? "Stacked Anchors"
      : requestedCount >= tradeState.participantRosters.length
        ? "Requested Anchors"
        : "Open Solver";
  const laneTag = routeSplitCount > 0 ? "Multi-Lane" : "Single Lane";

  return {
    teamCount: tradeState.participantRosters.length,
    commonValue: Math.round(
      participants.reduce((sum, participant) => sum + participant.incomingAdjustedValue, 0) / participants.length
    ),
    maxPctDiff,
    avgPctDiff,
    labScore,
    meRosterId: meRoster.rosterId,
    fillerValueTotal: Math.round(fillerValueTotal),
    extraMovedValueTotal: Math.round(extraMovedValueTotal),
    unrequestedAnchorValueTotal: Math.round(unrequestedAnchorValueTotal),
    fillerOverageValue: Math.round(fillerOverageValue),
    fillerAssetCount,
    fillerPairCount,
    fillerRatio: Number(fillerRatio.toFixed(3)),
    unrequestedAnchorRatio: Number.isFinite(unrequestedAnchorRatio) ? Number(unrequestedAnchorRatio.toFixed(3)) : 99,
    extraAnchorCount,
    routeSplitCount,
    participants,
    tags: [
      `${tradeState.participantRosters.length} Team`,
      structureTag,
      laneTag,
      extraMovedValueTotal <= Math.max(1400, requestedAnchorValueTotal * 0.18) ? "Lean Structure" : extraMovedValueTotal <= Math.max(2600, requestedAnchorValueTotal * 0.34) ? "Controlled Structure" : "Heavy Structure",
      maxPctDiff <= fairnessLimit * 0.55 ? "Tight Value" : "Flexible Value",
    ],
    summary: buildMultiTeamSummary(participants, focusLabel),
  };
}

function getMultiTeamFairnessLimit(fairnessPct, tradeLab, participantCount) {
  return getEffectiveFairnessPct(fairnessPct, tradeLab.tradeVibe)
    + MULTI_TEAM_BASE_FAIRNESS_BUFFER
    + Math.max(0, participantCount - DEFAULT_MULTI_TEAM_COUNT) * MULTI_TEAM_PER_TEAM_FAIRNESS_BUFFER;
}

function calculateMultiTeamParticipantFairness({
  outgoingAssets,
  incomingAssets,
  values,
  tradeLab,
  tradeShape,
}) {
  const globalMaxValue = getGlobalMaxPlayerValue(values);
  const outgoingRawValue = outgoingAssets.reduce((sum, asset) => sum + getAssetValue(asset, values), 0);
  const incomingRawValue = incomingAssets.reduce((sum, asset) => sum + getAssetValue(asset, values), 0);
  const outgoingMarketValue = calculatePerceivedPackageValue(outgoingAssets, values, tradeLab);
  const incomingMarketValue = calculatePerceivedPackageValue(incomingAssets, values, tradeLab);
  const packageResult = calculatePackageAdjustment({
    myValues: outgoingAssets.map((asset) => getAssetValue(asset, values)),
    theirValues: incomingAssets.map((asset) => getAssetValue(asset, values)),
    globalMaxValue,
  });
  const rawPctDiff = calculatePctDiff(outgoingRawValue, incomingRawValue);
  const marketPctDiff = calculatePctDiff(outgoingMarketValue, incomingMarketValue);
  const packageTaxPct = Math.max(
    outgoingRawValue,
    incomingRawValue,
    1
  ) > 0
    ? packageResult.packageAdjustment / Math.max(outgoingRawValue, incomingRawValue, 1) * 100
    : 0;
  const marketGapWeight = tradeShape.role === "level-up"
    ? 0.16
    : tradeShape.role === "break-down"
      ? 0.22
      : tradeShape.role === "bridge"
        ? 0.28
        : 0.24;
  const packageTaxWeight = tradeShape.role === "level-up"
    ? 0.16
    : tradeShape.role === "break-down"
      ? 0.08
      : tradeShape.role === "bridge"
        ? 0.12
        : 0.14;

  return {
    outgoingRawValue,
    incomingRawValue,
    outgoingMarketValue,
    incomingMarketValue,
    packageAdjustment: packageResult.packageAdjustment,
    packageAdjustmentSide: packageResult.packageAdjustmentSide || null,
    rawPctDiff: Number(rawPctDiff.toFixed(2)),
    marketPctDiff: Number(marketPctDiff.toFixed(2)),
    packageTaxPct: Number(packageTaxPct.toFixed(2)),
    pctDiff: Number((
      rawPctDiff
      + Math.max(0, marketPctDiff - rawPctDiff) * marketGapWeight
      + packageTaxPct * packageTaxWeight
    ).toFixed(2)),
    netValueDelta: Math.round(incomingRawValue - outgoingRawValue),
  };
}

function participantStateHasAssetOfKind(participantState, assetId, kind) {
  if (!participantState) return false;
  return participantState.outgoingTransfers.some((transfer) => transfer.asset.assetId === assetId && transfer.kind === kind);
}

function collectMultiTeamRoutingMetrics(tradeState) {
  const pairSet = new Set();
  const receiverBySender = new Map();
  const senderByReceiver = new Map();
  let anchorTransferCount = 0;
  let fillerTransferCount = 0;

  tradeState.stateByRosterId.forEach((participantState) => {
    participantState.outgoingTransfers.forEach((transfer) => {
      pairSet.add(`${transfer.fromRosterId}->${transfer.toRosterId}`);
      if (!receiverBySender.has(transfer.fromRosterId)) receiverBySender.set(transfer.fromRosterId, new Set());
      if (!senderByReceiver.has(transfer.toRosterId)) senderByReceiver.set(transfer.toRosterId, new Set());
      receiverBySender.get(transfer.fromRosterId).add(transfer.toRosterId);
      senderByReceiver.get(transfer.toRosterId).add(transfer.fromRosterId);

      if (transfer.kind === "anchor") anchorTransferCount += 1;
      if (transfer.kind === "filler") fillerTransferCount += 1;
    });
  });

  return {
    pairCount: pairSet.size,
    senderSplitCount: [...receiverBySender.values()].reduce((sum, receiverIds) => sum + Math.max(0, receiverIds.size - 1), 0),
    receiverSplitCount: [...senderByReceiver.values()].reduce((sum, senderIds) => sum + Math.max(0, senderIds.size - 1), 0),
    anchorTransferCount,
    fillerTransferCount,
  };
}

function getMultiTeamMaxFillerRatio(participantCount) {
  return MULTI_TEAM_MAX_FILLER_RATIO_BASE
    + Math.max(0, participantCount - DEFAULT_MULTI_TEAM_COUNT) * MULTI_TEAM_MAX_FILLER_RATIO_STEP;
}

function getMultiTeamMaxUnrequestedAnchorRatio(participantCount) {
  return MULTI_TEAM_MAX_UNREQUESTED_ANCHOR_RATIO_BASE
    + Math.max(0, participantCount - DEFAULT_MULTI_TEAM_COUNT) * MULTI_TEAM_MAX_UNREQUESTED_ANCHOR_RATIO_STEP;
}

function getMultiTeamMaxFillerOverageRatio(participantCount) {
  return MULTI_TEAM_MAX_FILLER_OVERAGE_RATIO_BASE
    + Math.max(0, participantCount - DEFAULT_MULTI_TEAM_COUNT) * MULTI_TEAM_MAX_FILLER_OVERAGE_RATIO_STEP;
}

function summarizeMultiTeamParticipantShape(participantState, values) {
  const outgoingTransfers = participantState.outgoingTransfers || [];
  const incomingTransfers = participantState.incomingTransfers || [];
  const outgoingValue = outgoingTransfers.reduce((sum, transfer) => sum + getAssetValue(transfer.asset, values), 0);
  const incomingValue = incomingTransfers.reduce((sum, transfer) => sum + getAssetValue(transfer.asset, values), 0);
  const outgoingAnchorValue = outgoingTransfers
    .filter((transfer) => transfer.kind === "anchor")
    .reduce((sum, transfer) => sum + getAssetValue(transfer.asset, values), 0);
  const requestedIncomingTransfers = incomingTransfers.filter((transfer) => transfer.isRequested);
  const requestedIncomingValue = requestedIncomingTransfers.reduce((sum, transfer) => sum + getAssetValue(transfer.asset, values), 0);
  const incomingProfile = buildPackageProfile(incomingTransfers.map((transfer) => transfer.asset), values);
  const role = inferMultiTeamParticipantRole({
    outgoingAnchorValue,
    requestedIncomingValue,
    requestedIncomingCount: requestedIncomingTransfers.length,
  });

  return {
    outgoingValue,
    incomingValue,
    outgoingAnchorValue,
    outgoingFillerValue: Math.max(0, outgoingValue - outgoingAnchorValue),
    requestedIncomingValue,
    requestedIncomingCount: requestedIncomingTransfers.length,
    incomingNonRequestedValue: Math.max(0, incomingValue - requestedIncomingValue),
    incomingAssetCount: incomingTransfers.length,
    outgoingAssetCount: outgoingTransfers.length,
    incomingFillerAssetCount: incomingTransfers.filter((transfer) => transfer.kind === "filler").length,
    outgoingFillerAssetCount: outgoingTransfers.filter((transfer) => transfer.kind === "filler").length,
    incomingProfile,
    role,
  };
}

function inferMultiTeamParticipantRole({
  outgoingAnchorValue,
  requestedIncomingValue,
  requestedIncomingCount,
}) {
  if (!requestedIncomingCount) return "bridge";
  if (!outgoingAnchorValue || requestedIncomingValue >= outgoingAnchorValue * 1.08) return "level-up";
  if (requestedIncomingValue <= outgoingAnchorValue * 0.82) return "break-down";
  return "even";
}

function evaluateMultiTeamParticipantShape({
  tradeShape,
  participantCount,
}) {
  const loosenessFactor = 1 + Math.max(0, participantCount - DEFAULT_MULTI_TEAM_COUNT) * 0.12;
  const incomingAssetCount = tradeShape.incomingAssetCount;
  const outgoingAssetCount = tradeShape.outgoingAssetCount;
  const extraIncomingValue = tradeShape.incomingNonRequestedValue;
  const incomingProfile = tradeShape.incomingProfile;
  let scorePenalty = 0;

  if (tradeShape.role === "level-up") {
    const maxBonusValue = Math.max(900, tradeShape.requestedIncomingValue * 0.18 * loosenessFactor);
    if (extraIncomingValue > maxBonusValue) return { ok: false, scorePenalty: 0 };
    if (incomingAssetCount > 3 || outgoingAssetCount > 4) return { ok: false, scorePenalty: 0 };
    scorePenalty += extraIncomingValue / 220 + Math.max(0, incomingAssetCount - 2) * 2.8;
  } else if (tradeShape.role === "even") {
    const maxBonusValue = Math.max(1400, tradeShape.requestedIncomingValue * 0.38 * loosenessFactor);
    if (extraIncomingValue > maxBonusValue) return { ok: false, scorePenalty: 0 };
    if (incomingAssetCount > 3 + (participantCount >= 5 ? 1 : 0)) return { ok: false, scorePenalty: 0 };
    scorePenalty += extraIncomingValue / 260 + Math.max(0, incomingAssetCount - 2) * 2.1;
  } else if (tradeShape.role === "break-down") {
    const maxAssets = 4 + (participantCount >= 5 ? 1 : 0);
    const topTwoShare = incomingProfile.totalValue > 0 ? incomingProfile.topTwoValue / incomingProfile.totalValue : 1;
    if (incomingAssetCount > maxAssets || tradeShape.incomingFillerAssetCount > 3 + (participantCount >= 5 ? 1 : 0)) {
      return { ok: false, scorePenalty: 0 };
    }
    if (incomingAssetCount >= 4 && topTwoShare < 0.66) return { ok: false, scorePenalty: 0 };
    scorePenalty += Math.max(0, incomingAssetCount - 3) * 2.2 + Math.max(0, 0.74 - topTwoShare) * 18;
  } else {
    const bridgeGap = Math.abs(tradeShape.incomingValue - tradeShape.outgoingValue);
    const maxBridgeGap = Math.max(1000, Math.max(tradeShape.incomingValue, tradeShape.outgoingValue) * 0.22 * loosenessFactor);
    const maxBridgeAssets = 3 + Math.ceil(Math.max(0, participantCount - DEFAULT_MULTI_TEAM_COUNT) / 2);
    if (incomingAssetCount > maxBridgeAssets || outgoingAssetCount > maxBridgeAssets) return { ok: false, scorePenalty: 0 };
    if (bridgeGap > maxBridgeGap) return { ok: false, scorePenalty: 0 };
    scorePenalty += bridgeGap / 240 + Math.max(0, incomingAssetCount - 2) * 2.6;
  }

  return {
    ok: true,
    scorePenalty,
  };
}

function buildMultiTeamBalanceContext(tradeState, values) {
  const participantMetrics = getMultiTeamParticipantMetrics(tradeState, values);
  const senderMetrics = participantMetrics
    .filter((metric) => metric.needSend > 140)
    .sort((left, right) => right.needSend - left.needSend);
  const receiverMetrics = participantMetrics
    .filter((metric) => metric.needReceive > 140)
    .sort((left, right) => right.needReceive - left.needReceive);
  const anchorValueTotal = [...tradeState.stateByRosterId.values()].reduce((sum, participantState) => {
    return sum + participantState.outgoingTransfers
      .filter((transfer) => transfer.kind === "anchor")
      .reduce((assetSum, transfer) => assetSum + getAssetValue(transfer.asset, values), 0);
  }, 0);
  const requestedAnchorValueTotal = [...tradeState.stateByRosterId.values()].reduce((sum, participantState) => {
    return sum + participantState.outgoingTransfers
      .filter((transfer) => transfer.kind === "anchor" && transfer.isRequested)
      .reduce((assetSum, transfer) => assetSum + getAssetValue(transfer.asset, values), 0);
  }, 0);
  const totalNeedSend = senderMetrics.reduce((sum, metric) => sum + metric.needSend, 0);
  const totalNeedReceive = receiverMetrics.reduce((sum, metric) => sum + metric.needReceive, 0);

  return {
    participantMetrics,
    senderMetrics,
    receiverMetrics,
    anchorValueTotal,
    requestedAnchorValueTotal,
    unrequestedAnchorValueTotal: Math.max(0, anchorValueTotal - requestedAnchorValueTotal),
    totalNeedSend,
    totalNeedReceive,
  };
}

function solveMultiTeamCompensationPlans({
  tradeState,
  balanceContext,
  meRoster,
  values,
  tradeLab,
  maxResults,
}) {
  const participantCount = tradeState.participantRosters.length;
  const candidatePools = buildMultiTeamCompensationCandidatePools({
    tradeState,
    meRoster,
    values,
    tradeLab,
  });
  const basePairSet = new Set(
    [...tradeState.stateByRosterId.values()]
      .flatMap((participantState) => participantState.outgoingTransfers.map((transfer) => `${transfer.fromRosterId}->${transfer.toRosterId}`))
  );
  const baseBalances = new Map(
    balanceContext.participantMetrics.map((metric) => [
      metric.roster.rosterId,
      Math.round(metric.outgoingValue - metric.incomingValue),
    ])
  );
  const initialState = {
    transfers: [],
    balanceByRosterId: baseBalances,
    usedAssetIds: new Set(),
    pairSet: new Set(),
    receiverBySender: new Map(),
    senderByReceiver: new Map(),
    totalCompValue: 0,
    corePenalty: 0,
  };

  const completeStates = [];
  const exploredStates = [];
  const seenStates = new Set();
  const beamWidth = Math.max(MULTI_TEAM_COMPENSATION_BEAM_WIDTH, maxResults * 4);
  const maxCompAssets = participantCount + Math.max(1, Math.floor(participantCount / 2));
  let beam = [initialState];

  function maybeCaptureState(state) {
    exploredStates.push({
      transfers: state.transfers,
      meta: {
        fillerValueTotal: state.totalCompValue,
        fillerAssetCount: state.transfers.length,
        fillerPairCount: state.pairSet.size,
        senderSplitCount: [...state.receiverBySender.values()].reduce((sum, receiverIds) => sum + Math.max(0, receiverIds.size - 1), 0),
        receiverSplitCount: [...state.senderByReceiver.values()].reduce((sum, senderIds) => sum + Math.max(0, senderIds.size - 1), 0),
      },
      stateScore: scoreMultiTeamCompensationState(state, baseBalances, participantCount),
    });

    const stateKey = createMultiTeamCompensationStateKey(state);
    if (seenStates.has(stateKey)) return;
    if (!isMultiTeamCompensationStateViable(state, baseBalances, participantCount)) return;
    seenStates.add(stateKey);
    completeStates.push({
      transfers: state.transfers,
      meta: {
        fillerValueTotal: state.totalCompValue,
        fillerAssetCount: state.transfers.length,
        fillerPairCount: state.pairSet.size,
        senderSplitCount: [...state.receiverBySender.values()].reduce((sum, receiverIds) => sum + Math.max(0, receiverIds.size - 1), 0),
        receiverSplitCount: [...state.senderByReceiver.values()].reduce((sum, senderIds) => sum + Math.max(0, senderIds.size - 1), 0),
      },
      stateScore: scoreMultiTeamCompensationState(state, baseBalances, participantCount),
    });
  }

  maybeCaptureState(initialState);

  for (let depth = 0; depth < maxCompAssets; depth += 1) {
    const nextStates = [];

    beam.forEach((beamState) => {
      const moveCandidates = buildMultiTeamCompensationMoves({
        tradeState,
        beamState,
        baseBalances,
        candidatePools,
        basePairSet,
        meRoster,
        values,
      });

      moveCandidates.forEach((move) => {
        const nextState = applyMultiTeamCompensationMove(beamState, move);
        nextStates.push(nextState);
        maybeCaptureState(nextState);
      });
    });

    if (nextStates.length === 0) break;

    const dedupedStates = [];
    const seenBeamKeys = new Set();
    nextStates
      .sort((left, right) => scoreMultiTeamCompensationState(left, baseBalances, participantCount) - scoreMultiTeamCompensationState(right, baseBalances, participantCount))
      .forEach((state) => {
        const key = createMultiTeamCompensationStateKey(state);
        if (seenBeamKeys.has(key)) return;
        seenBeamKeys.add(key);
        dedupedStates.push(state);
      });
    beam = dedupedStates.slice(0, beamWidth);
  }

  if (completeStates.length === 0) {
    return dedupeMultiTeamCompensationPlans(exploredStates)
      .sort((left, right) => left.stateScore - right.stateScore)
      .slice(0, Math.max(MULTI_TEAM_VARIANT_COUNT, maxResults * 2));
  }

  return dedupeMultiTeamCompensationPlans(completeStates)
    .sort((left, right) => left.stateScore - right.stateScore)
    .slice(0, Math.max(MULTI_TEAM_VARIANT_COUNT, maxResults * 3));
}

function dedupeMultiTeamCompensationPlans(plans) {
  const seen = new Set();
  const deduped = [];

  plans.forEach((plan) => {
    const key = plan.transfers
      .map((transfer) => `${transfer.fromRosterId}>${transfer.toRosterId}:${transfer.asset.assetId}`)
      .sort()
      .join("|");
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(plan);
  });

  return deduped;
}

function buildMultiTeamCompensationCandidatePools({
  tradeState,
  meRoster,
  values,
  tradeLab,
}) {
  const pools = new Map();

  tradeState.stateByRosterId.forEach((participantState, rosterId) => {
    const candidates = buildAvailableMultiTeamFillerAssets({
      participantState,
      meRoster,
      values,
      tradeLab,
      variantIndex: 0,
      limit: MULTI_TEAM_COMPENSATION_ASSET_POOL_LIMIT,
    }).slice(0, MULTI_TEAM_COMPENSATION_ASSET_POOL_LIMIT);
    pools.set(rosterId, candidates);
  });

  return pools;
}

function buildMultiTeamCompensationMoves({
  tradeState,
  beamState,
  baseBalances,
  candidatePools,
  basePairSet,
  meRoster,
  values,
}) {
  const donors = [...beamState.balanceByRosterId.entries()]
    .filter(([, balance]) => balance < -MULTI_TEAM_COMPENSATION_TOLERANCE)
    .sort((left, right) => left[1] - right[1])
    .slice(0, MULTI_TEAM_COMPENSATION_DONOR_LIMIT);
  const recipients = [...beamState.balanceByRosterId.entries()]
    .filter(([, balance]) => balance > MULTI_TEAM_COMPENSATION_TOLERANCE)
    .sort((left, right) => right[1] - left[1])
    .slice(0, MULTI_TEAM_COMPENSATION_RECIPIENT_LIMIT);
  const moveCandidates = [];

  recipients.forEach(([toRosterId, recipientBalance]) => {
    donors.forEach(([fromRosterId, donorBalance]) => {
      if (toRosterId === fromRosterId) return;

      moveCandidates.push(
        ...buildMultiTeamCompensationPackageMoves({
          tradeState,
          beamState,
          candidatePools,
          basePairSet,
          meRoster,
          values,
          fromRosterId,
          toRosterId,
          donorBalance,
          recipientBalance,
        })
      );
    });
  });

  return moveCandidates
    .sort((left, right) => left.score - right.score)
    .slice(0, MULTI_TEAM_COMPENSATION_BRANCH_LIMIT);
}

function buildMultiTeamCompensationPackageMoves({
  tradeState,
  beamState,
  candidatePools,
  basePairSet,
  meRoster,
  values,
  fromRosterId,
  toRosterId,
  donorBalance,
  recipientBalance,
}) {
  const participantState = tradeState.stateByRosterId.get(fromRosterId);
  const availableAssets = (candidatePools.get(fromRosterId) || []).filter((asset) => !beamState.usedAssetIds.has(asset.assetId));
  if (availableAssets.length === 0) return [];

  const targetGap = Math.min(Math.abs(donorBalance), recipientBalance);
  const maxAssets = getMultiTeamCompensationMaxPackageAssets(targetGap);
  const rawPackages = buildPackages(availableAssets, values, Math.min(maxAssets, availableAssets.length))
    .map((pkg) => ({
      assets: pkg.assets,
      values: pkg.values,
      totalValue: pkg.values.reduce((sum, value) => sum + value, 0),
    }))
    .filter((pkg) => pkg.totalValue > 0);
  const seen = new Set();
  const packageMoves = [];

  rawPackages
    .sort((left, right) => {
      const leftGap = Math.abs(left.totalValue - targetGap);
      const rightGap = Math.abs(right.totalValue - targetGap);
      if (leftGap !== rightGap) return leftGap - rightGap;
      if (left.assets.length !== right.assets.length) return left.assets.length - right.assets.length;
      return left.totalValue - right.totalValue;
    })
    .forEach((pkg) => {
      const key = pkg.assets.map((asset) => asset.assetId).sort().join("|");
      if (seen.has(key)) return;
      seen.add(key);

      const score = scoreMultiTeamCompensationPackage({
        pkg,
        participantState,
        fromRosterId,
        toRosterId,
        donorBalance,
        recipientBalance,
        beamState,
        basePairSet,
        meRoster,
        values,
      });
      if (!Number.isFinite(score)) return;

      packageMoves.push({
        fromRosterId,
        toRosterId,
        assets: pkg.assets,
        totalValue: pkg.totalValue,
        score,
      });
    });

  return packageMoves
    .sort((left, right) => left.score - right.score)
    .slice(0, MULTI_TEAM_COMPENSATION_BRANCH_LIMIT);
}

function scoreMultiTeamCompensationPackage({
  pkg,
  participantState,
  fromRosterId,
  toRosterId,
  donorBalance,
  recipientBalance,
  beamState,
  basePairSet,
  meRoster,
  values,
}) {
  const pairKey = `${fromRosterId}->${toRosterId}`;
  const existingPair = basePairSet.has(pairKey) || beamState.pairSet.has(pairKey);
  const totalValue = pkg.totalValue;
  const donorAfter = donorBalance + totalValue;
  const recipientAfter = recipientBalance - totalValue;
  const donorOvershoot = Math.max(0, donorAfter);
  const recipientOvershoot = Math.max(0, -recipientAfter);
  const donorTolerance = Math.max(MULTI_TEAM_MAX_FILLER_OVERSHOOT_BASE, Math.abs(donorBalance) * 0.9);
  const recipientTolerance = Math.max(MULTI_TEAM_MAX_FILLER_OVERSHOOT_BASE, recipientBalance * 0.72);

  if (donorOvershoot > donorTolerance) return Number.POSITIVE_INFINITY;
  if (recipientOvershoot > recipientTolerance) return Number.POSITIVE_INFINITY;

  const senderTargets = beamState.receiverBySender.get(fromRosterId) || new Set();
  const recipientSources = beamState.senderByReceiver.get(toRosterId) || new Set();
  const isMyRoster = fromRosterId === meRoster.rosterId;
  const targetGap = Math.min(Math.abs(donorBalance), recipientBalance);
  const corePenalty = pkg.assets.reduce((sum, asset) => {
    return sum + (participantState.coreAssetIds.has(asset.assetId) ? (isMyRoster ? 980 : 460) : 0);
  }, 0);
  const selectedBonus = isMyRoster
    ? pkg.assets.reduce((sum, asset) => sum + (state.selectedOutgoingAssetIds.has(asset.assetId) ? 190 : 0), 0)
    : 0;
  const microPiecePenalty = pkg.values.reduce((sum, value, index) => sum + (index >= 1 && value < 900 ? 120 : 0), 0);
  const closenessPenalty = Math.abs(totalValue - targetGap) * 1.35;
  const lanePenalty = existingPair ? -140 : 95;
  const senderSplitPenalty = senderTargets.size > 0 && !senderTargets.has(toRosterId) ? 170 : 0;
  const receiverSplitPenalty = recipientSources.size > 0 && !recipientSources.has(fromRosterId) ? 140 : 0;
  const donorFlipPenalty = Math.max(0, donorAfter) * 1.9;
  const recipientFlipPenalty = Math.max(0, -recipientAfter) * 2.25;
  const assetCountPenalty = Math.max(0, pkg.assets.length - 1) * 155;
  const overpayPenalty = Math.max(0, totalValue - targetGap) * 0.82;
  const underpayPenalty = Math.max(0, targetGap - totalValue) * 0.48;
  const valuePenalty = totalValue * 0.18;
  const improvementBonus = (Math.min(Math.abs(donorBalance), totalValue) + Math.min(recipientBalance, totalValue)) * 1.22;

  return (
    closenessPenalty
    + overpayPenalty
    + underpayPenalty
    + valuePenalty
    + lanePenalty
    + senderSplitPenalty
    + receiverSplitPenalty
    + corePenalty
    + assetCountPenalty
    + microPiecePenalty
    + donorFlipPenalty
    + recipientFlipPenalty
    - selectedBonus
    - improvementBonus
  );
}

function getMultiTeamCompensationMaxPackageAssets(targetGap) {
  if (!Number.isFinite(targetGap) || targetGap <= 0) return 1;
  if (targetGap >= 7000) return 4;
  if (targetGap >= 2600) return 3;
  return 2;
}

function applyMultiTeamCompensationMove(beamState, move) {
  const nextBalances = new Map(beamState.balanceByRosterId);
  nextBalances.set(move.fromRosterId, nextBalances.get(move.fromRosterId) + move.totalValue);
  nextBalances.set(move.toRosterId, nextBalances.get(move.toRosterId) - move.totalValue);

  const nextUsedAssetIds = new Set(beamState.usedAssetIds);
  move.assets.forEach((asset) => nextUsedAssetIds.add(asset.assetId));

  const nextPairSet = new Set(beamState.pairSet);
  nextPairSet.add(`${move.fromRosterId}->${move.toRosterId}`);

  const nextReceiverBySender = cloneMapOfSets(beamState.receiverBySender);
  if (!nextReceiverBySender.has(move.fromRosterId)) nextReceiverBySender.set(move.fromRosterId, new Set());
  nextReceiverBySender.get(move.fromRosterId).add(move.toRosterId);

  const nextSenderByReceiver = cloneMapOfSets(beamState.senderByReceiver);
  if (!nextSenderByReceiver.has(move.toRosterId)) nextSenderByReceiver.set(move.toRosterId, new Set());
  nextSenderByReceiver.get(move.toRosterId).add(move.fromRosterId);

  return {
    transfers: [
      ...beamState.transfers,
      ...move.assets.map((asset) => ({
        fromRosterId: move.fromRosterId,
        toRosterId: move.toRosterId,
        asset,
      })),
    ],
    balanceByRosterId: nextBalances,
    usedAssetIds: nextUsedAssetIds,
    pairSet: nextPairSet,
    receiverBySender: nextReceiverBySender,
    senderByReceiver: nextSenderByReceiver,
    totalCompValue: beamState.totalCompValue + move.totalValue,
    corePenalty: beamState.corePenalty,
  };
}

function isMultiTeamCompensationStateViable(state, baseBalances, participantCount) {
  const tolerance = getMultiTeamCompensationTolerance(participantCount);
  let largestPositive = 0;
  let largestNegative = 0;
  let roleFlipValue = 0;

  state.balanceByRosterId.forEach((balance, rosterId) => {
    if (balance > largestPositive) largestPositive = balance;
    if (balance < largestNegative) largestNegative = balance;
    const baseBalance = baseBalances.get(rosterId) || 0;
    if (baseBalance < 0 && balance > tolerance) roleFlipValue += balance;
    if (baseBalance > 0 && balance < -tolerance) roleFlipValue += Math.abs(balance);
  });

  return largestPositive <= tolerance && Math.abs(largestNegative) <= tolerance && roleFlipValue <= tolerance * 1.5;
}

function scoreMultiTeamCompensationState(state, baseBalances, participantCount) {
  let positiveResidual = 0;
  let negativeResidual = 0;
  let roleFlipValue = 0;

  state.balanceByRosterId.forEach((balance, rosterId) => {
    if (balance > 0) positiveResidual += balance;
    if (balance < 0) negativeResidual += Math.abs(balance);
    const baseBalance = baseBalances.get(rosterId) || 0;
    if (baseBalance < 0 && balance > 0) roleFlipValue += balance;
    if (baseBalance > 0 && balance < 0) roleFlipValue += Math.abs(balance);
  });

  const senderSplitCount = [...state.receiverBySender.values()].reduce((sum, receiverIds) => sum + Math.max(0, receiverIds.size - 1), 0);
  const receiverSplitCount = [...state.senderByReceiver.values()].reduce((sum, senderIds) => sum + Math.max(0, senderIds.size - 1), 0);
  const tolerance = getMultiTeamCompensationTolerance(participantCount);
  const unresolvedPenalty = Math.max(0, positiveResidual - tolerance * state.balanceByRosterId.size);

  return (
    unresolvedPenalty * 6.4
    + roleFlipValue * 4.1
    + state.totalCompValue * 1.15
    + state.transfers.length * 165
    + state.pairSet.size * 95
    + senderSplitCount * 145
    + receiverSplitCount * 130
  );
}

function getMultiTeamCompensationTolerance(participantCount) {
  return MULTI_TEAM_COMPENSATION_TOLERANCE + Math.max(0, participantCount - DEFAULT_MULTI_TEAM_COUNT) * 55;
}

function createMultiTeamCompensationStateKey(state) {
  return state.transfers
    .map((transfer) => `${transfer.fromRosterId}>${transfer.toRosterId}:${transfer.asset.assetId}`)
    .sort()
    .join("|");
}

function cloneMapOfSets(source) {
  const clone = new Map();
  source.forEach((value, key) => {
    clone.set(key, new Set(value));
  });
  return clone;
}

function buildMultiTeamPackageVariants({
  tradeState,
  balanceContext,
  meRoster,
  values,
  tradeLab,
}) {
  if (balanceContext.senderMetrics.length === 0 || balanceContext.receiverMetrics.length === 0) {
    return [{
      senderPackages: new Map(),
      totalFillerValue: 0,
      totalFillerAssets: 0,
      packageScore: 0,
    }];
  }

  const senderContexts = balanceContext.senderMetrics.map((metric) => ({
    metric,
    participantState: tradeState.stateByRosterId.get(metric.roster.rosterId),
    packageOptions: buildMultiTeamSenderPackageOptions({
      tradeState,
      metric,
      meRoster,
      values,
      tradeLab,
    }),
  }));

  if (senderContexts.some((context) => context.packageOptions.length === 0)) return [];

  const variants = [];
  const targetTotal = balanceContext.totalNeedReceive;

  function walk(index, senderPackages, totalFillerValue, totalFillerAssets, packageScore) {
    if (index >= senderContexts.length) {
      const totalMismatch = Math.abs(totalFillerValue - targetTotal);
      const overshoot = Math.max(0, totalFillerValue - targetTotal);
      if (overshoot > Math.max(MULTI_TEAM_MAX_FILLER_OVERSHOOT_BASE, targetTotal * 0.18)) return;
      variants.push({
        senderPackages: new Map(senderPackages),
        totalFillerValue,
        totalFillerAssets,
        packageScore: packageScore + totalMismatch * 2.3 + overshoot * 2.8 + totalFillerAssets * 55,
      });
      return;
    }

    const context = senderContexts[index];
    for (const packageOption of context.packageOptions) {
      const nextTotalFillerValue = totalFillerValue + packageOption.totalValue;
      const hardCeiling = targetTotal + Math.max(MULTI_TEAM_MAX_FILLER_OVERSHOOT_BASE, targetTotal * 0.22);
      if (nextTotalFillerValue > hardCeiling) continue;
      senderPackages.set(context.metric.roster.rosterId, packageOption);
      walk(
        index + 1,
        senderPackages,
        nextTotalFillerValue,
        totalFillerAssets + packageOption.assets.length,
        packageScore + packageOption.packagePenalty
      );
      senderPackages.delete(context.metric.roster.rosterId);
    }
  }

  walk(0, new Map(), 0, 0, 0);

  return variants
    .sort((left, right) => left.packageScore - right.packageScore)
    .slice(0, MULTI_TEAM_VARIANT_COUNT);
}

function buildMultiTeamSenderPackageOptions({
  tradeState,
  metric,
  meRoster,
  values,
  tradeLab,
}) {
  const participantState = tradeState.stateByRosterId.get(metric.roster.rosterId);
  const candidateAssets = buildAvailableMultiTeamFillerAssets({
    participantState,
    meRoster,
    values,
    tradeLab,
    variantIndex: 0,
  });
  const maxAssets = getMultiTeamMaxFillerAssetsForGap(metric.needSend);
  const packageTarget = metric.needSend;
  const packages = [];

  packages.push({
    assets: [],
    totalValue: 0,
    packagePenalty: packageTarget * 4.2,
  });

  buildPackages(candidateAssets, values, maxAssets)
    .map((pkg) => ({
      assets: pkg.assets,
      totalValue: pkg.values.reduce((sum, value) => sum + value, 0),
    }))
    .forEach((pkg) => {
      if (pkg.totalValue <= 0) return;
      if (pkg.totalValue > packageTarget + Math.max(MULTI_TEAM_MAX_FILLER_OVERSHOOT_BASE, packageTarget * 0.32)) return;

      const overshoot = Math.max(0, pkg.totalValue - packageTarget);
      const shortfall = Math.max(0, packageTarget - pkg.totalValue);
      const corePenalty = pkg.assets.reduce((sum, asset) => {
        return sum + (participantState.coreAssetIds.has(asset.assetId) ? (participantState.roster.rosterId === meRoster.rosterId ? 520 : 260) : 0);
      }, 0);
      const assetCountPenalty = pkg.assets.length * 165;
      const overshootPenalty = overshoot * 3.8;
      const shortfallPenalty = shortfall * 2.4;
      const rawPenalty = overshootPenalty + shortfallPenalty + assetCountPenalty + corePenalty;

      packages.push({
        assets: pkg.assets,
        totalValue: pkg.totalValue,
        packagePenalty: rawPenalty,
      });
    });

  const deduped = [];
  const seen = new Set();
  for (const pkg of packages.sort((left, right) => {
    if (left.packagePenalty !== right.packagePenalty) return left.packagePenalty - right.packagePenalty;
    if (left.assets.length !== right.assets.length) return left.assets.length - right.assets.length;
    return left.totalValue - right.totalValue;
  })) {
    const key = pkg.assets.map((asset) => asset.assetId).sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(pkg);
    if (deduped.length >= MULTI_TEAM_SENDER_PACKAGE_OPTION_LIMIT) break;
  }

  return deduped;
}

function getMultiTeamMaxFillerAssetsForGap(valueGap) {
  if (!Number.isFinite(valueGap) || valueGap <= 0) return 0;
  if (valueGap >= 6000) return 3;
  if (valueGap >= 2600) return 2;
  return 1;
}

function assignMultiTeamFillers({
  tradeState,
  balanceContext,
  packageVariant,
  values,
}) {
  if (packageVariant.totalFillerAssets === 0) {
    return {
      transfers: [],
      meta: {
        fillerValueTotal: 0,
        fillerAssetCount: 0,
        fillerPairCount: 0,
        senderSplitCount: 0,
        receiverSplitCount: 0,
      },
    };
  }

  const fillerAssets = [...packageVariant.senderPackages.entries()]
    .flatMap(([fromRosterId, pkg]) => pkg.assets.map((asset) => ({
      fromRosterId,
      asset,
      value: getAssetValue(asset, values),
    })))
    .sort((left, right) => right.value - left.value || left.asset.name.localeCompare(right.asset.name));
  const receiverNeeds = new Map(balanceContext.receiverMetrics.map((metric) => [metric.roster.rosterId, metric.needReceive]));
  const basePairSet = new Set(
    [...tradeState.stateByRosterId.values()]
      .flatMap((participantState) => participantState.outgoingTransfers.map((transfer) => `${transfer.fromRosterId}->${transfer.toRosterId}`))
  );

  let bestResult = null;

  function walk(index, remainingNeeds, transfers, fillerPairSet, receiverBySender, senderByReceiver) {
    if (index >= fillerAssets.length) {
      const residualGap = [...remainingNeeds.values()].reduce((sum, gap) => sum + Math.abs(gap), 0);
      const overshootGap = [...remainingNeeds.values()].reduce((sum, gap) => sum + Math.max(0, -gap), 0);
      const fillerPairCount = fillerPairSet.size;
      const senderSplitCount = [...receiverBySender.values()].reduce((sum, receiverIds) => sum + Math.max(0, receiverIds.size - 1), 0);
      const receiverSplitCount = [...senderByReceiver.values()].reduce((sum, senderIds) => sum + Math.max(0, senderIds.size - 1), 0);
      const objective = residualGap * 3.8 + overshootGap * 5.6 + fillerPairCount * 160 + senderSplitCount * 170 + receiverSplitCount * 145 + transfers.length * 28;

      if (!bestResult || objective < bestResult.objective) {
        bestResult = {
          objective,
          transfers: [...transfers],
          meta: {
            fillerValueTotal: packageVariant.totalFillerValue,
            fillerAssetCount: fillerAssets.length,
            fillerPairCount,
            senderSplitCount,
            receiverSplitCount,
          },
        };
      }
      return;
    }

    const fillerAsset = fillerAssets[index];
    const receiverOptions = buildMultiTeamReceiverOptions({
      fillerAsset,
      remainingNeeds,
      basePairSet,
      fillerPairSet,
      receiverBySender,
      senderByReceiver,
    });
    if (receiverOptions.length === 0) return;

    for (const option of receiverOptions) {
      const nextNeeds = new Map(remainingNeeds);
      nextNeeds.set(option.toRosterId, option.remainingAfter);
      const nextTransfers = [...transfers, {
        fromRosterId: fillerAsset.fromRosterId,
        toRosterId: option.toRosterId,
        asset: fillerAsset.asset,
      }];
      const nextPairSet = new Set(fillerPairSet);
      nextPairSet.add(option.pairKey);
      const nextReceiverBySender = new Map(receiverBySender);
      const nextReceiverSet = new Set(nextReceiverBySender.get(fillerAsset.fromRosterId) || []);
      nextReceiverSet.add(option.toRosterId);
      nextReceiverBySender.set(fillerAsset.fromRosterId, nextReceiverSet);
      const nextSenderByReceiver = new Map(senderByReceiver);
      const nextSenderSet = new Set(nextSenderByReceiver.get(option.toRosterId) || []);
      nextSenderSet.add(fillerAsset.fromRosterId);
      nextSenderByReceiver.set(option.toRosterId, nextSenderSet);
      walk(index + 1, nextNeeds, nextTransfers, nextPairSet, nextReceiverBySender, nextSenderByReceiver);
    }
  }

  walk(0, receiverNeeds, [], new Set(), new Map(), new Map());
  return bestResult;
}

function buildMultiTeamReceiverOptions({
  fillerAsset,
  remainingNeeds,
  basePairSet,
  fillerPairSet,
  receiverBySender,
  senderByReceiver,
}) {
  const options = [];
  remainingNeeds.forEach((remainingNeed, toRosterId) => {
    if (toRosterId === fillerAsset.fromRosterId) return;

    const pairKey = `${fillerAsset.fromRosterId}->${toRosterId}`;
    const remainingAfter = remainingNeed - fillerAsset.value;
    const overshoot = Math.max(0, -remainingAfter);
    const maxOvershoot = Math.max(MULTI_TEAM_MAX_FILLER_OVERSHOOT_BASE, remainingNeed * 0.65);
    if (overshoot > maxOvershoot) return;

    const existingPair = basePairSet.has(pairKey) || fillerPairSet.has(pairKey);
    const senderTargets = receiverBySender.get(fillerAsset.fromRosterId) || new Set();
    const receiverSenders = senderByReceiver.get(toRosterId) || new Set();
    const newDestinationPenalty = !existingPair && senderTargets.size > 0 && !senderTargets.has(toRosterId) ? 1 : 0;
    const multiSenderPenalty = receiverSenders.size > 0 && !receiverSenders.has(fillerAsset.fromRosterId) ? 1 : 0;
    const closenessPenalty = Math.abs(fillerAsset.value - remainingNeed);
    const optionScore = closenessPenalty + overshoot * 1.1 + newDestinationPenalty * 260 + multiSenderPenalty * 190 + (existingPair ? -110 : 0);

    options.push({
      toRosterId,
      pairKey,
      remainingAfter,
      optionScore,
    });
  });

  return options
    .sort((left, right) => left.optionScore - right.optionScore)
    .slice(0, MULTI_TEAM_MAX_FILLER_PAIRS_PER_ASSET);
}

function buildCircularRecipientMap(ownerSequence) {
  const recipientMap = new Map();
  ownerSequence.forEach((rosterId, index) => {
    recipientMap.set(rosterId, ownerSequence[(index + 1) % ownerSequence.length]);
  });
  return recipientMap;
}

function buildAutoMultiTeamHelperSets({ meRoster, targetOwner, helperCount, targetValue, values }) {
  if (helperCount === 0) return [[]];

  const rankedHelpers = state.normalizedRosters
    .filter((roster) => roster.rosterId !== meRoster.rosterId && roster.rosterId !== targetOwner.rosterId)
    .map((roster) => ({
      roster,
      score: scoreAutoMultiTeamHelperRoster(roster, targetValue, values, helperCount),
    }))
    .sort((a, b) => b.score - a.score || a.roster.manager.displayName.localeCompare(b.roster.manager.displayName));

  const sets = [];
  const maxStart = Math.max(1, Math.min(4, rankedHelpers.length - helperCount + 1));
  for (let start = 0; start < maxStart; start += 1) {
    const slice = rankedHelpers.slice(start, start + helperCount).map((entry) => entry.roster);
    if (slice.length === helperCount) sets.push(slice);
  }
  if (sets.length === 0 && rankedHelpers.length >= helperCount) {
    sets.push(rankedHelpers.slice(0, helperCount).map((entry) => entry.roster));
  }
  return dedupeHelperRosterSets(sets);
}

function dedupeHelperRosterSets(sets) {
  const seen = new Set();
  const deduped = [];
  sets.forEach((set) => {
    const key = set.map((roster) => roster.rosterId).join("|");
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(set);
  });
  return deduped;
}

function scoreAutoMultiTeamHelperRoster(roster, targetValue, values, helperCount = 1) {
  const bridgeTarget = Math.max(900, targetValue / Math.max(2.4, helperCount + 1.6));
  const helperCap = targetValue * AUTO_MULTI_TEAM_HELPER_ANCHOR_CAP_SHARE;
  const coreAssetIds = getCoreAssetIdSet(roster, values);
  const topAssets = roster.assets
    .filter(isTradeEligibleAsset)
    .map((asset) => ({ asset, value: getAssetValue(asset, values) }))
    .filter((entry) => Number.isFinite(entry.value))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  if (topAssets.length === 0) return Number.NEGATIVE_INFINITY;

  const bestBridgeScore = Math.max(...topAssets.map((entry) => {
    const overCapPenalty = entry.value > helperCap ? (entry.value - helperCap) * 1.1 : 0;
    const corePenalty = coreAssetIds.has(entry.asset.assetId) ? 620 : 0;
    const liquidityBonus = entry.asset.assetType === "pick" ? 140 : isYouthAsset(entry.asset) ? 60 : 0;
    return 10000 - Math.abs(entry.value - bridgeTarget) - overCapPenalty - corePenalty + liquidityBonus;
  }));
  const bridgeDepthBonus = topAssets.filter((entry) => (
    entry.value >= bridgeTarget * 0.55
    && entry.value <= helperCap
    && !coreAssetIds.has(entry.asset.assetId)
  )).length * 55;
  const starPenalty = topAssets.filter((entry) => entry.value > targetValue * 0.82).length * 110;

  return bestBridgeScore + bridgeDepthBonus - starPenalty;
}

function getResolvedMultiTeamTradeTier(tradeTier) {
  return tradeTier === "all" ? "even" : tradeTier;
}

function getAutoMultiTeamMyAnchorTargetValue(targetValue, helperCount, tradeTier) {
  const resolvedTradeTier = getResolvedMultiTeamTradeTier(tradeTier);
  const baseShare = resolvedTradeTier === "level-up"
    ? 0.68
    : resolvedTradeTier === "break-down"
      ? 0.92
      : 0.82;
  return Math.max(900, targetValue * Math.max(0.46, baseShare - helperCount * 0.06));
}

function buildAutoMultiTeamHelperTargetValues({ targetValue, myAnchorValue, helperCount }) {
  if (helperCount <= 0) return [];

  const targets = [];
  let nextTarget = Math.min(
    targetValue * 0.52,
    Math.max(850, (targetValue - myAnchorValue) * 0.72)
  );

  for (let index = 0; index < helperCount; index += 1) {
    const remainingHelpers = helperCount - index;
    const floor = Math.max(450, nextTarget * 0.4, (targetValue - myAnchorValue) / Math.max(remainingHelpers + 1, 2) * 0.55);
    const desiredValue = Math.round(Math.max(floor, nextTarget));
    targets.push(desiredValue);
    nextTarget = Math.max(450, desiredValue * 0.62);
  }

  return targets;
}

function listAutoMultiTeamAnchorCandidates({
  roster,
  targetValue,
  desiredValue,
  values,
  tradeTier,
  usedAssetIds = new Set(),
  protectRosterCore = false,
  isMyRoster = false,
  minValue = 0,
  maxValue = Number.POSITIVE_INFINITY,
  limit = 1,
  preferLiquidity = false,
}) {
  const coreAssetIds = protectRosterCore ? getCoreAssetIdSet(roster, values) : new Set();
  const lockedSelectedAssets = isMyRoster && state.selectedOutgoingAssetIds.size > 0
    ? roster.assets.filter((asset) => state.selectedOutgoingAssetIds.has(asset.assetId) && !usedAssetIds.has(asset.assetId))
    : [];
  if (lockedSelectedAssets.length > 0) {
    return [...lockedSelectedAssets]
      .filter((asset) => getAssetValue(asset, values) >= minValue)
      .sort((a, b) => sortAssetsByValueDesc(a, b, values))
      .slice(0, limit);
  }

  const resolvedTradeTier = getResolvedMultiTeamTradeTier(tradeTier);
  const fallbackDesiredValue = resolvedTradeTier === "level-up"
    ? targetValue * 0.72
    : resolvedTradeTier === "break-down"
      ? targetValue * 1.08
      : targetValue;
  const targetBand = Number.isFinite(desiredValue) && desiredValue > 0 ? desiredValue : fallbackDesiredValue;

  return roster.assets
    .filter(isTradeEligibleAsset)
    .filter((asset) => Number.isFinite(getAssetValue(asset, values)))
    .filter((asset) => !usedAssetIds.has(asset.assetId))
    .filter((asset) => !isMyRoster || !state.excludedOutgoingAssetIds.has(asset.assetId))
    .filter((asset) => {
      const value = getAssetValue(asset, values);
      return value >= minValue && value <= maxValue;
    })
    .sort((left, right) => {
      const leftValue = getAssetValue(left, values);
      const rightValue = getAssetValue(right, values);
      const leftScore = Math.abs(leftValue - targetBand)
        + (leftValue > maxValue ? (leftValue - maxValue) * 1.35 : 0)
        + (coreAssetIds.has(left.assetId) ? 650 : 0)
        - (preferLiquidity && left.assetType === "pick" ? 180 : 0)
        - (preferLiquidity && isYouthAsset(left) ? 60 : 0);
      const rightScore = Math.abs(rightValue - targetBand)
        + (rightValue > maxValue ? (rightValue - maxValue) * 1.35 : 0)
        + (coreAssetIds.has(right.assetId) ? 650 : 0)
        - (preferLiquidity && right.assetType === "pick" ? 180 : 0)
        - (preferLiquidity && isYouthAsset(right) ? 60 : 0);
      if (leftScore !== rightScore) return leftScore - rightScore;
      return rightValue - leftValue;
    })
    .slice(0, limit);
}

function buildAutoMultiTeamAnchorPlans({
  meRoster,
  helperSet,
  targetOwner,
  targetAsset,
  values,
  tradeTier,
}) {
  const targetValue = getAssetValue(targetAsset, values);
  if (!Number.isFinite(targetValue)) return [];

  const helperCount = helperSet.length;
  const myAnchorCandidates = listAutoMultiTeamAnchorCandidates({
    roster: meRoster,
    targetValue,
    desiredValue: getAutoMultiTeamMyAnchorTargetValue(targetValue, helperCount, tradeTier),
    values,
    tradeTier,
    usedAssetIds: new Set([targetAsset.assetId]),
    protectRosterCore: true,
    isMyRoster: true,
    minValue: 750,
    maxValue: targetValue * (getResolvedMultiTeamTradeTier(tradeTier) === "break-down" ? 1.15 : 0.96),
    limit: AUTO_MULTI_TEAM_MY_ANCHOR_CANDIDATE_LIMIT,
  });
  if (myAnchorCandidates.length === 0) {
    myAnchorCandidates.push(
      ...listAutoMultiTeamAnchorCandidates({
        roster: meRoster,
        targetValue,
        desiredValue: targetValue * 0.8,
        values,
        tradeTier,
        usedAssetIds: new Set([targetAsset.assetId]),
        protectRosterCore: true,
        isMyRoster: true,
        minValue: 650,
        maxValue: targetValue * 1.08,
        limit: AUTO_MULTI_TEAM_MY_ANCHOR_CANDIDATE_LIMIT,
      })
    );
  }
  if (myAnchorCandidates.length === 0) return [];

  const plans = [];
  myAnchorCandidates.forEach((myAnchor) => {
    for (let helperVariant = 0; helperVariant < AUTO_MULTI_TEAM_HELPER_ANCHOR_CANDIDATE_LIMIT; helperVariant += 1) {
      const usedAnchorIds = new Set([targetAsset.assetId, myAnchor.assetId]);
      const helperTargets = buildAutoMultiTeamHelperTargetValues({
        targetValue,
        myAnchorValue: getAssetValue(myAnchor, values),
        helperCount,
      });
      const helperAnchors = [];
      let failed = false;

      helperSet.forEach((helperRoster, helperIndex) => {
        const desiredValue = helperTargets[helperIndex] || Math.max(450, targetValue * 0.16);
        const primaryHelperCandidates = listAutoMultiTeamAnchorCandidates({
          roster: helperRoster,
          targetValue,
          desiredValue,
          values,
          tradeTier,
          usedAssetIds: usedAnchorIds,
          minValue: Math.max(350, desiredValue * 0.45),
          maxValue: Math.min(targetValue * AUTO_MULTI_TEAM_HELPER_ANCHOR_CAP_SHARE, desiredValue * 1.45 + 600),
          limit: AUTO_MULTI_TEAM_HELPER_ANCHOR_CANDIDATE_LIMIT,
          preferLiquidity: true,
        });
        const helperCandidate = primaryHelperCandidates[Math.min(helperVariant, primaryHelperCandidates.length - 1)] || listAutoMultiTeamAnchorCandidates({
          roster: helperRoster,
          targetValue,
          desiredValue,
          values,
          tradeTier,
          usedAssetIds: usedAnchorIds,
          minValue: Math.max(300, desiredValue * 0.38),
          maxValue: Math.min(targetValue * 0.82, desiredValue * 1.75 + 900),
          limit: 1,
          preferLiquidity: true,
        })[0];
        if (!helperCandidate) {
          failed = true;
          return;
        }
        helperAnchors.push({
          roster: helperRoster,
          asset: helperCandidate,
          value: getAssetValue(helperCandidate, values),
        });
        usedAnchorIds.add(helperCandidate.assetId);
      });

      if (failed) continue;

      const orderedHelperAnchors = helperAnchors
        .sort((left, right) => right.value - left.value || left.roster.manager.displayName.localeCompare(right.roster.manager.displayName));
      const participantRosters = [meRoster, ...orderedHelperAnchors.map((entry) => entry.roster), targetOwner];
      const anchorAssetByOwner = new Map([
        [meRoster.rosterId, myAnchor],
        [targetOwner.rosterId, targetAsset],
        ...orderedHelperAnchors.map((entry) => [entry.roster.rosterId, entry.asset]),
      ]);
      const ownerSequence = participantRosters.map((roster) => roster.rosterId);
      const anchorTransfers = ownerSequence
        .map((ownerId, index) => ({
          fromRosterId: ownerId,
          toRosterId: ownerSequence[(index + 1) % ownerSequence.length],
          asset: anchorAssetByOwner.get(ownerId),
          isRequested: ownerId === targetOwner.rosterId,
        }))
        .filter((transfer) => transfer.asset);

      if (anchorTransfers.length !== participantRosters.length) continue;
      plans.push({
        participantRosters,
        anchorTransfers,
      });
    }
  });

  return dedupeAutoMultiTeamAnchorPlans(plans).slice(0, AUTO_MULTI_TEAM_MY_ANCHOR_CANDIDATE_LIMIT + 1);
}

function dedupeAutoMultiTeamAnchorPlans(plans) {
  const seen = new Set();
  const deduped = [];
  plans.forEach((plan) => {
    const key = plan.anchorTransfers
      .map((transfer) => `${transfer.fromRosterId}:${transfer.asset.assetId}`)
      .sort()
      .join("|");
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(plan);
  });
  return deduped;
}

function pickAutoMultiTeamAnchorAsset({
  roster,
  targetValue,
  values,
  tradeTier,
  usedAssetIds = new Set(),
  protectRosterCore = false,
  isMyRoster = false,
}) {
  return listAutoMultiTeamAnchorCandidates({
    roster,
    targetValue,
    desiredValue: null,
    values,
    tradeTier,
    usedAssetIds,
    protectRosterCore,
    isMyRoster,
    limit: 1,
  })[0] || null;
}

function buildMultiTeamIdeasFromCycle({
  meRoster,
  participantRosters,
  ownerToRecipient,
  anchorAssetByOwner,
  ownerSequence,
  values,
  fairnessPct,
  maxResults,
  tradeLab,
  focusLabel,
}) {
  const anchorValues = [...anchorAssetByOwner.values()].map((asset) => getAssetValue(asset, values)).filter(Number.isFinite);
  if (anchorValues.length !== participantRosters.length) return [];

  const globalMaxValue = getGlobalMaxPlayerValue(values, Math.max(...anchorValues));
  const commonStartValue = Math.max(...anchorValues);
  const effectiveFairnessPct = getEffectiveFairnessPct(fairnessPct, tradeLab.tradeVibe);
  const lockedAnchorIds = new Set([...anchorAssetByOwner.values()].map((asset) => asset.assetId));
  const ideas = [];

  for (let variantIndex = 0; variantIndex < Math.max(maxResults, MULTI_TEAM_VALUE_VARIANTS); variantIndex += 1) {
    const commonValue = commonStartValue + variantIndex * MULTI_TEAM_VALUE_STEP;
    const outgoingByOwner = new Map();
    let failedVariant = false;

    for (const rosterId of ownerSequence) {
      const roster = findRosterById(rosterId);
      const anchorAsset = anchorAssetByOwner.get(rosterId);
      const packageVariants = buildOutgoingPackageVariantsForCommonValue({
        roster,
        anchorAsset,
        commonValue,
        values,
        participantIsMe: rosterId === meRoster.rosterId,
        lockedAnchorIds,
      });
      const chosenVariant = packageVariants[Math.min(variantIndex, packageVariants.length - 1)] || packageVariants[0];
      if (!chosenVariant) {
        failedVariant = true;
        break;
      }
      outgoingByOwner.set(rosterId, chosenVariant);
    }

    if (failedVariant) continue;

    const senderByRecipient = new Map();
    ownerToRecipient.forEach((recipientId, ownerId) => senderByRecipient.set(recipientId, ownerId));

    const participants = participantRosters.map((roster) => {
      const ownerId = roster.rosterId;
      const senderId = senderByRecipient.get(ownerId);
      const outgoingPackage = outgoingByOwner.get(ownerId);
      const incomingPackage = outgoingByOwner.get(senderId);
      const packageResult = calculatePackageAdjustment({
        myValues: outgoingPackage.values,
        theirValues: incomingPackage.values,
        globalMaxValue,
      });
      const pctDiff = Number(calculatePctDiff(packageResult.myAdjustedValue, packageResult.theirAdjustedValue).toFixed(2));

      return {
        roster,
        sendToName: findRosterById(ownerToRecipient.get(ownerId))?.manager.displayName || "next team",
        receiveFromName: findRosterById(senderId)?.manager.displayName || "previous team",
        outgoingAssets: outgoingPackage.assets,
        incomingAssets: incomingPackage.assets,
        outgoingAdjustedValue: packageResult.myAdjustedValue,
        incomingAdjustedValue: packageResult.theirAdjustedValue,
        packageAdjustment: packageResult.packageAdjustment,
        packageAdjustmentSide: packageResult.packageAdjustmentSide || null,
        pctDiff,
      };
    });

    if (participants.some((participant) => participant.pctDiff > effectiveFairnessPct)) continue;

    const maxPctDiff = Number(Math.max(...participants.map((participant) => participant.pctDiff)).toFixed(2));
    const avgPctDiff = Number((participants.reduce((sum, participant) => sum + participant.pctDiff, 0) / participants.length).toFixed(2));
    const totalExtraAssets = participants.reduce((sum, participant) => sum + Math.max(0, participant.outgoingAssets.length - 1), 0);
    const labScore = clamp(Math.round(91 - maxPctDiff * 1.25 - totalExtraAssets * 1.4 + (participants.length >= 4 ? 2 : 0)), 1, 99);

    ideas.push({
      teamCount: participantRosters.length,
      commonValue,
      maxPctDiff,
      avgPctDiff,
      labScore,
      meRosterId: meRoster.rosterId,
      participants,
      tags: [`${participantRosters.length} Team`, maxPctDiff <= 6 ? "Tight Value" : "Fair Value"],
      summary: buildMultiTeamSummary(participants, focusLabel),
    });
  }

  return dedupeMultiTeamIdeas(ideas).sort((a, b) => compareMultiTeamIdeas(a, b)).slice(0, maxResults);
}

function buildOutgoingPackageVariantsForCommonValue({
  roster,
  anchorAsset,
  commonValue,
  values,
  participantIsMe = false,
  lockedAnchorIds = new Set(),
}) {
  if (!roster || !anchorAsset) return [];

  const requiredExtraAssetIds = participantIsMe
    ? [...state.selectedOutgoingAssetIds].filter((assetId) => assetId !== anchorAsset.assetId && !state.excludedOutgoingAssetIds.has(assetId))
    : [];
  const supplementPool = buildSupplementAssetPool({
    roster,
    values,
    commonValue,
    participantIsMe,
    lockedAnchorIds,
    requiredExtraAssetIds,
  });
  const packagePool = [anchorAsset, ...supplementPool.filter((asset) => asset.assetId !== anchorAsset.assetId)];
  const requiredAssetIds = new Set([anchorAsset.assetId, ...requiredExtraAssetIds]);
  const packages = buildPackages(packagePool, values, 1 + MULTI_TEAM_MAX_EXTRAS_PER_SENDER, { requiredAssetIds })
    .map((pkg) => ({
      ...pkg,
      totalValue: pkg.values.reduce((sum, value) => sum + value, 0),
    }))
    .sort((a, b) => {
      const aDiff = Math.abs(a.totalValue - commonValue);
      const bDiff = Math.abs(b.totalValue - commonValue);
      if (aDiff !== bDiff) return aDiff - bDiff;
      if (a.assets.length !== b.assets.length) return a.assets.length - b.assets.length;
      return a.totalValue - b.totalValue;
    });

  return packages.slice(0, MULTI_TEAM_VALUE_VARIANTS + 1);
}

function buildSupplementAssetPool({
  roster,
  values,
  commonValue,
  participantIsMe = false,
  lockedAnchorIds = new Set(),
  requiredExtraAssetIds = [],
}) {
  const requiredSet = new Set(requiredExtraAssetIds);
  const allCandidates = roster.assets
    .filter(isTradeEligibleAsset)
    .filter((asset) => !lockedAnchorIds.has(asset.assetId))
    .filter((asset) => Number.isFinite(getAssetValue(asset, values)))
    .filter((asset) => !participantIsMe || !state.excludedOutgoingAssetIds.has(asset.assetId));
  const requiredAssets = allCandidates.filter((asset) => requiredSet.has(asset.assetId));
  const optionalAssets = allCandidates
    .filter((asset) => !requiredSet.has(asset.assetId))
    .sort((left, right) => {
      const leftGap = Math.abs(getAssetValue(left, values) - commonValue * 0.32);
      const rightGap = Math.abs(getAssetValue(right, values) - commonValue * 0.32);
      if (leftGap !== rightGap) return leftGap - rightGap;
      return sortAssetsByValueDesc(left, right, values);
    })
    .slice(0, MULTI_TEAM_FILLER_POOL_LIMIT);

  return [...requiredAssets, ...optionalAssets];
}

function buildMultiTeamSummary(participants, focusLabel) {
  const flow = participants
    .map((participant) => {
      const sendTargets = participant.sendToNames?.length ? participant.sendToNames.join(", ") : "the field";
      return `${participant.roster.manager.displayName} to ${sendTargets}`;
    })
    .join(" • ");
  return `Route centered on ${focusLabel}: ${flow}.`;
}

function dedupeMultiTeamIdeas(ideas) {
  const seen = new Set();
  const deduped = [];
  ideas.forEach((idea) => {
    const key = idea.participants
      .map((participant) => `${participant.roster.rosterId}:${participant.outgoingAssets.map((asset) => asset.assetId).sort().join("|")}`)
      .sort()
      .join("::");
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(idea);
  });
  return deduped;
}

function compareMultiTeamIdeas(a, b) {
  const byScore = b.labScore - a.labScore;
  if (byScore !== 0) return byScore;
  const byExtraAnchors = (b.extraAnchorCount || 0) - (a.extraAnchorCount || 0);
  if (byExtraAnchors !== 0) return byExtraAnchors;
  const byRouteSplit = (b.routeSplitCount || 0) - (a.routeSplitCount || 0);
  if (byRouteSplit !== 0) return byRouteSplit;
  const byAddedValue = (a.extraMovedValueTotal || 0) - (b.extraMovedValueTotal || 0);
  if (byAddedValue !== 0) return byAddedValue;
  const byFillerRatio = (a.fillerRatio || 0) - (b.fillerRatio || 0);
  if (byFillerRatio !== 0) return byFillerRatio;
  const byFillerAssets = (a.fillerAssetCount || 0) - (b.fillerAssetCount || 0);
  if (byFillerAssets !== 0) return byFillerAssets;
  const byMaxDiff = a.maxPctDiff - b.maxPctDiff;
  if (byMaxDiff !== 0) return byMaxDiff;
  const byAvgDiff = a.avgPctDiff - b.avgPctDiff;
  if (byAvgDiff !== 0) return byAvgDiff;
  return a.participants.reduce((sum, participant) => sum + participant.outgoingAssets.length, 0)
    - b.participants.reduce((sum, participant) => sum + participant.outgoingAssets.length, 0);
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
  maxExtraTargetAssets = 1,
  maxExtraTargetAssetShare = 0.3,
  maxExtraTargetTotalShare = 0.55,
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
  const requiredOutgoingAssetIds = searchContext?.requiredOutgoingAssetIds
    || new Set(
      [...tradeLab.selectedOutgoingAssetIds].filter((assetId) => myAssetPool.some((asset) => asset.assetId === assetId))
    );
  const myPackages = searchContext?.myPackages || buildPackages(myAssetPool, values, maxOutgoingAssets, {
    requiredAssetIds: requiredOutgoingAssetIds,
  });
  const theirPackages = buildTargetPackages({
    theirRoster,
    targetAsset,
    values,
    allowExtraTargetAssets,
    maxExtraAssets: maxExtraTargetAssets,
    maxExtraAssetShare: maxExtraTargetAssetShare,
    maxExtraTotalShare: maxExtraTargetTotalShare,
  }).filter(
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

function buildTradeSearchContext({ myRoster, targetAsset, values, fairnessPct, tradeLab, maxOutgoingAssetsOverride = null }) {
  const targetValue = getAssetValue(targetAsset, values);
  if (!Number.isFinite(targetValue)) return null;

  const coreAssetIds = getCoreAssetIdSet(myRoster, values);
  const myAssetPool = resolveOutgoingAssetPool({ myRoster, values, tradeLab, targetValue, coreAssetIds });
  if (myAssetPool.length === 0) return null;
  const requiredOutgoingAssetIds = new Set(
    [...tradeLab.selectedOutgoingAssetIds].filter((assetId) => myAssetPool.some((asset) => asset.assetId === assetId))
  );
  const maxOutgoingAssets = maxOutgoingAssetsOverride || getMaxOutgoingPackageSize(targetValue);

  return {
    targetValue,
    coreAssetIds,
    myAssetPool,
    requiredOutgoingAssetIds,
    maxOutgoingAssets,
    myPackages: buildPackages(myAssetPool, values, maxOutgoingAssets, { requiredAssetIds: requiredOutgoingAssetIds }),
    globalMaxValue: Math.max(state.globalMaxPlayerValue || KTC_GLOBAL_MAX_FALLBACK, targetValue),
    effectiveFairnessPct: getEffectiveFairnessPct(fairnessPct, tradeLab.tradeVibe),
  };
}

function resolveOutgoingAssetPool({ myRoster, values, tradeLab, targetValue = 0, coreAssetIds = null }) {
  const pool = myRoster.assets.filter((asset) =>
    isTradeEligibleAsset(asset)
    && (
    !tradeLab.excludedOutgoingAssetIds.has(asset.assetId)
    && (
      (asset.assetType === "player" && tradeLab.allowPlayers)
      || (asset.assetType === "pick" && tradeLab.allowPicks)
    )
    )
  );

  if (tradeLab.selectedOutgoingAssetIds.size > 0) {
    const selectedAssets = pool.filter((asset) => tradeLab.selectedOutgoingAssetIds.has(asset.assetId));
    const optionalAssets = limitOutgoingAssetPool(
      pool.filter((asset) => !tradeLab.selectedOutgoingAssetIds.has(asset.assetId)),
      values,
      targetValue,
      {
        coreAssetIds: coreAssetIds || getCoreAssetIdSet(myRoster, values),
        teamState: tradeLab.teamState,
      }
    );
    return [...selectedAssets, ...optionalAssets];
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

function compareEnrichedTradeIdeas(a, b) {
  const aDelta = a.powerUpgrade?.delta ?? 0;
  const bDelta = b.powerUpgrade?.delta ?? 0;
  if (bDelta !== aDelta) return bDelta - aDelta;

  const aAfterScore = a.powerUpgrade?.after?.score ?? 0;
  const bAfterScore = b.powerUpgrade?.after?.score ?? 0;
  if (bAfterScore !== aAfterScore) return bAfterScore - aAfterScore;

  return compareTradeIdeas(a, b);
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

function buildFallbackTradeTags(idea) {
  const tags = [];
  if (idea.powerUpgrade?.delta >= 5) tags.push("Power Spike");
  if (idea.powerUpgrade?.delta > 0) tags.push("Upgrade");
  if (idea.theirAssets?.length < idea.myAssets?.length) tags.push("Consolidation");
  if (idea.theirAssets?.length > idea.myAssets?.length) tags.push("Depth Return");
  if (idea.theirAssets?.some(isFirstRoundPick) || idea.myAssets?.some(isFirstRoundPick)) tags.push("Pick Leverage");
  if (idea.pctDiff <= 6) tags.push("Tight Value");
  if (tags.length === 0) tags.push("Fair Market");
  return [...new Set(tags)].slice(0, 4);
}

function buildFallbackTradeSummary(idea) {
  if (idea.powerUpgrade?.summary) return idea.powerUpgrade.summary;
  const incoming = formatAssetNameList(idea.theirAssets || []);
  const outgoing = formatAssetNameList(idea.myAssets || []);
  return `You turn ${outgoing} into ${incoming} while keeping the adjusted-value gap at ${idea.pctDiff}%.`;
}

function buildFallbackTradePitch(idea) {
  const incoming = formatAssetNameList(idea.theirAssets || []);
  const outgoing = formatAssetNameList(idea.myAssets || []);
  if (idea.powerUpgrade?.delta > 0) {
    return `I can move ${outgoing} because ${incoming} gives my roster a cleaner weekly build without pushing the value out of range.`;
  }
  return `This is close enough on value to be a real conversation, but I would treat it as a preference deal rather than a must-send offer.`;
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

function buildPackages(assets, values, maxAssets, { requiredAssetIds = new Set() } = {}) {
  const valuedAssets = assets
    .map((asset) => ({ asset, value: getAssetValue(asset, values) }))
    .filter((entry) => Number.isFinite(entry.value));
  const requiredEntries = valuedAssets.filter((entry) => requiredAssetIds.has(entry.asset.assetId));
  const optionalEntries = valuedAssets.filter((entry) => !requiredAssetIds.has(entry.asset.assetId));
  const requiredCount = requiredEntries.length;

  if (requiredCount > maxAssets) return [];

  const packages = [];
  const minimumPackageSize = requiredCount > 0 ? requiredCount : 1;
  const maxOptionalAssets = Math.min(maxAssets - requiredCount, optionalEntries.length);

  for (let size = minimumPackageSize; size <= Math.min(maxAssets, valuedAssets.length); size++) {
    const optionalSize = size - requiredCount;
    if (optionalSize < 0 || optionalSize > maxOptionalAssets) continue;
    const combos = optionalSize === 0 ? [[]] : combinationsOfSize(optionalEntries, optionalSize);
    for (const combo of combos) {
      const fullCombo = [...requiredEntries, ...combo];
      packages.push({
        assets: fullCombo.map((entry) => entry.asset),
        values: fullCombo.map((entry) => entry.value),
      });
    }
  }
  return packages;
}

function buildTargetPackages({
  theirRoster,
  targetAsset,
  values,
  allowExtraTargetAssets,
  maxExtraAssets,
  maxExtraAssetShare = 0.3,
  maxExtraTotalShare = 0.55,
}) {
  const targetValue = getAssetValue(targetAsset, values);
  if (!Number.isFinite(targetValue)) return [];

  const packages = [{ assets: [targetAsset], values: [targetValue] }];
  if (!allowExtraTargetAssets) return packages;

  const maxThrowInValue = Math.max(900, Math.round(targetValue * maxExtraAssetShare));
  const maxThrowInTotalValue = Math.max(maxThrowInValue, Math.round(targetValue * maxExtraTotalShare));
  const extras = theirRoster.assets
    .filter((asset) => asset.assetId !== targetAsset.assetId)
    .filter(isTradeEligibleAsset)
    .map((asset) => ({ asset, value: getAssetValue(asset, values) }))
    .filter((entry) => Number.isFinite(entry.value) && entry.value <= maxThrowInValue)
    .sort((a, b) => a.value - b.value);

  for (let size = 1; size <= Math.min(maxExtraAssets, extras.length); size++) {
    for (const combo of combinationsOfSize(extras, size)) {
      const comboTotal = combo.reduce((sum, entry) => sum + entry.value, 0);
      if (comboTotal > maxThrowInTotalValue) continue;
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

function formatSignedNumber(value) {
  const numericValue = Number(value) || 0;
  return `${numericValue > 0 ? "+" : ""}${formatNumber(numericValue)}`;
}

function getAssetValue(asset, values) {
  const exact = values[asset.assetId];
  if (Number.isFinite(exact)) return applyElitePlayerValuePremium(asset, exact);

  if (asset.assetType === "pick") {
    const resolvedPickValue = resolvePickAssetValue(asset, values);
    if (Number.isFinite(resolvedPickValue)) return resolvedPickValue;
  }

  return applyElitePlayerValuePremium(asset, estimatedValue(asset));
}

function applyElitePlayerValuePremium(asset, baseValue) {
  if (asset?.assetType !== "player" || !Number.isFinite(baseValue)) return baseValue;

  const premiumTier = ELITE_VALUE_PREMIUM_TIERS.find((tier) => baseValue >= tier.floor);
  if (!premiumTier) return baseValue;

  return Math.round(baseValue * premiumTier.multiplier);
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
    .filter((asset) => asset.assetType === "player" && isTradeEligibleAsset(asset))
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

function normalizeRosters(league, rosters, users, players, previousContext = { league: null, users: [], rosters: [] }, tradedPicks = [], currentDraftContext = null) {
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
      const assignedDraftSlot = resolveAssignedDraftSlot(
        pick,
        currentDraftContext,
        finishInfo,
        previousContext?.league
      );
      return {
        assetId: `pick:${pick.season}:r${pick.round}:${pick.original_owner || "any"}`,
        valueAssetId: buildPickValueAssetId(pick, pickBucket),
        valueBucket: pickBucket,
        name: formatPickName(pick, { userById, rosterById, previousFinishLookup, pickBucket, assignedDraftSlot }),
        assetType: "pick",
        raw: {
          ...pick,
          ktcBucket: pickBucket,
          assignedDraftSlot: assignedDraftSlot?.slot ?? null,
          assignedDraftSlotLabel: assignedDraftSlot?.label ?? null,
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

function formatAssignedPickSlot(round, slot, totalSlots = 0) {
  const roundNumber = Number(round);
  const slotNumber = Number(slot);
  if (!Number.isFinite(roundNumber) || !Number.isFinite(slotNumber)) return "";
  const padWidth = Math.max(2, String(Math.max(0, totalSlots)).length);
  return `${roundNumber}.${String(slotNumber).padStart(padWidth, "0")}`;
}

function resolveAssignedDraftSlot(pick, currentDraftContext, finishInfo = null, previousLeague = null) {
  const rosterKey = normalizeRosterIdKey(pick?.original_owner);
  if (rosterKey && currentDraftContext && String(pick?.season || "") === String(currentDraftContext.season || "")) {
    const slot = currentDraftContext.slotByRosterId?.get(rosterKey);
    if (Number.isFinite(slot)) {
      return {
        slot,
        totalSlots: Number(currentDraftContext.totalSlots) || 0,
        label: formatAssignedPickSlot(pick?.round, slot, currentDraftContext.totalSlots),
      };
    }
  }

  const pickSeason = Number(pick?.season);
  const previousSeason = Number(previousLeague?.season);
  const finishRank = Number(finishInfo?.rank);
  const totalTeams = Number(finishInfo?.totalTeams);
  if (
    Number.isFinite(pickSeason)
    && Number.isFinite(previousSeason)
    && pickSeason === previousSeason + 1
    && Number.isFinite(finishRank)
    && Number.isFinite(totalTeams)
    && totalTeams > 0
  ) {
    const slot = totalTeams - finishRank + 1;
    if (Number.isFinite(slot) && slot >= 1 && slot <= totalTeams) {
      return {
        slot,
        totalSlots: totalTeams,
        label: formatAssignedPickSlot(pick?.round, slot, totalTeams),
      };
    }
  }

  return null;
}

function buildPickValueAssetId(pick, pickBucket = "any") {
  const bucket = Number(pick?.round) === 1 ? normalizePickBucket(pickBucket) : "any";
  return `pick:${pick.season}:r${pick.round}:${bucket}`;
}

function formatPickName(pick, { userById, rosterById, previousFinishLookup, pickBucket = "any", assignedDraftSlot = null }) {
  const details = [];
  const ownerName = resolvePickOwnerName(pick.original_owner, rosterById, userById);
  if (ownerName) details.push(`from ${ownerName}`);

  const finishLabel = resolvePreviousFinishLabel(pick.original_owner, rosterById, previousFinishLookup);
  if (finishLabel) details.push(finishLabel);

  const suffix = details.length ? ` (${details.join(", ")})` : "";
  if (assignedDraftSlot?.label) {
    return `${pick.season} ${assignedDraftSlot.label}${suffix}`;
  }
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
      state.tradedPicks,
      state.currentDraftContext
    );
    pruneSelectedOutgoingAssets();
    pruneExcludedOutgoingAssets();
  }

  if (rerender) {
    renderPlayerSearch();
    renderPowerDashboard();
    renderLeagueAnalyticsDashboard();
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
