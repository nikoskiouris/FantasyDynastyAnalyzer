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
const DEFAULT_MULTI_TEAM_COUNT = 3;
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
  customParticipantWants: {},
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
  tradeModeSelect: document.querySelector("#trade-mode-select"),
  tradeTierSelect: document.querySelector("#trade-tier-select"),
  customTeamCountWrap: document.querySelector("#custom-team-count-wrap"),
  customTeamCountSelect: document.querySelector("#custom-team-count-select"),
  tradeModeHelp: document.querySelector("#trade-mode-help"),
  playerSearchLabel: document.querySelector("#player-search-label"),
  targetSearchShell: document.querySelector("#target-search-shell"),
  targetChip: document.querySelector("#target-chip"),
  targetChipLabel: document.querySelector("#target-chip-label"),
  clearTargetBtn: document.querySelector("#clear-target-btn"),
  playerSearch: document.querySelector("#player-search"),
  playerResults: document.querySelector("#player-results"),
  multiCustomPanel: document.querySelector("#multi-custom-panel"),
  multiCustomTeamSlots: document.querySelector("#multi-custom-team-slots"),
  multiCustomWants: document.querySelector("#multi-custom-wants"),
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
el.tradeModeSelect?.addEventListener("change", () => {
  invalidateResults();
  syncTradeModeUi();
});
el.tradeTierSelect?.addEventListener("change", invalidateResults);
el.customTeamCountSelect?.addEventListener("change", () => {
  invalidateResults();
  syncTradeModeUi();
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
  syncTradeModeUi();
});
el.generateBtn.addEventListener("click", generateTradeIdeas);

renderSessionSnapshot();
syncTradeModeUi();

let leagueLoadAnimationTimer = null;
let leagueLoadStartedAt = 0;
let copyFeedbackTimer = null;

function invalidateResults() {
  el.resultsSection.classList.add("hidden");
}

function getTradeMode() {
  return el.tradeModeSelect?.value || "acquire";
}

function getTradeTier() {
  return el.tradeTierSelect?.value || "all";
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
}

function renderSessionSnapshot() {
  // Session snapshot UI was intentionally removed in the simplified layout.
}

function buildCountSelectOptions(selectEl, minCount, maxCount, selectedValue, labelBuilder) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  for (let value = minCount; value <= maxCount; value += 1) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = labelBuilder(value);
    selectEl.appendChild(option);
  }
  selectEl.value = String(clamp(Number(selectedValue) || minCount, minCount, maxCount));
}

function hydrateMultiTeamControls() {
  const totalTeams = state.normalizedRosters.length;
  if (totalTeams < DEFAULT_MULTI_TEAM_COUNT) return;

  buildCountSelectOptions(
    el.customTeamCountSelect,
    2,
    Math.max(2, totalTeams - 1),
    el.customTeamCountSelect?.value || 2,
    (value) => `${value} other team${value === 1 ? "" : "s"}`
  );
  trimCustomParticipantState();
}

function trimCustomParticipantState() {
  const meRosterId = Number(el.meSelect?.value || state.meRosterId || 0);
  const requestedCount = clamp(
    Number(el.customTeamCountSelect?.value || state.customParticipantRosterIds.length || 2),
    2,
    Math.max(2, state.normalizedRosters.length - 1)
  );
  const availableRosterIds = new Set(
    state.normalizedRosters
      .map((roster) => roster.rosterId)
      .filter((rosterId) => rosterId !== meRosterId)
  );
  const nextRosterIds = [];
  for (const rosterId of state.customParticipantRosterIds) {
    if (nextRosterIds.length >= requestedCount) break;
    if (!availableRosterIds.has(rosterId) || nextRosterIds.includes(rosterId)) continue;
    nextRosterIds.push(rosterId);
  }
  while (nextRosterIds.length < requestedCount) {
    nextRosterIds.push(null);
  }
  state.customParticipantRosterIds = nextRosterIds;

  const participantKeys = new Set([String(meRosterId)]);
  nextRosterIds.filter(Boolean).forEach((rosterId) => participantKeys.add(String(rosterId)));
  state.customParticipantWants = Object.fromEntries(
    Object.entries(state.customParticipantWants).filter(([rosterId]) => participantKeys.has(String(rosterId)))
  );
}

function syncTradeModeUi() {
  hydrateMultiTeamControls();
  trimCustomParticipantState();

  const mode = getTradeMode();
  const searchEnabled = mode !== "multi-custom";
  const showCustomBuilder = mode === "multi-custom";
  const showTierSelector = mode !== "multi-custom";
  const selectedAsset = getCurrentPrimaryAsset();
  const copyByMode = {
    acquire: {
      help: "Pick a player or pick you want from another team. The generator will build level-up, even, or break-down offers around that target.",
      label: "Which player or pick do you want?",
    },
    shop: {
      help: "Pick one of your own assets and the generator will search the league for strong return packages.",
      label: "Which player or pick do you want to shop?",
    },
    "multi-custom": {
      help: "Pick the owners involved, then lock in the must-have incoming piece for each team. The solver will add the balancing pieces around those anchors.",
      label: "Multi-team builder",
    },
  };

  el.customTeamCountWrap?.classList.toggle("hidden", !showCustomBuilder);
  el.multiCustomPanel?.classList.toggle("hidden", !showCustomBuilder);
  el.tradeTierSelect?.closest("label")?.classList.toggle("hidden", !showTierSelector);
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

  renderCustomMultiTeamBuilder();
}

function renderCustomMultiTeamBuilder() {
  if (!el.multiCustomPanel || !el.multiCustomTeamSlots || !el.multiCustomWants) return;
  if (getTradeMode() !== "multi-custom") return;

  renderCustomParticipantTeamSlots();
  renderCustomMultiTeamWantSelectors();
}

function renderCustomParticipantTeamSlots() {
  const meRoster = getMyRoster();
  if (!el.multiCustomTeamSlots) return;
  el.multiCustomTeamSlots.innerHTML = `<p class="muted small builder-note">1. Choose the other owners who should be part of this trade.</p>`;

  if (!meRoster) {
    el.multiCustomTeamSlots.innerHTML = `<p class="muted small">Choose your team first.</p>`;
    return;
  }

  const requestedCount = clamp(
    Number(el.customTeamCountSelect?.value || state.customParticipantRosterIds.length || 2),
    2,
    Math.max(2, state.normalizedRosters.length - 1)
  );
  trimCustomParticipantState();

  for (let index = 0; index < requestedCount; index += 1) {
    const selectedRosterId = state.customParticipantRosterIds[index];
    const selectedSet = new Set(
      state.customParticipantRosterIds
        .filter((rosterId, rosterIndex) => rosterIndex !== index && Number.isFinite(rosterId))
    );
    const card = document.createElement("div");
    card.className = "multi-team-slot-card";

    const label = document.createElement("label");
    label.innerHTML = `
      Other team ${index + 1}
      <select data-team-slot-index="${index}"></select>
    `;
    const select = label.querySelector("select");

    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Choose an owner";
    select.appendChild(blank);

    state.normalizedRosters
      .filter((roster) => roster.rosterId !== meRoster.rosterId)
      .slice()
      .sort((a, b) => a.manager.displayName.localeCompare(b.manager.displayName))
      .forEach((roster) => {
        if (selectedSet.has(roster.rosterId)) return;
        const option = document.createElement("option");
        option.value = String(roster.rosterId);
        option.textContent = roster.manager.displayName;
        select.appendChild(option);
      });

    if (Number.isFinite(selectedRosterId)) {
      select.value = String(selectedRosterId);
    }
    select.addEventListener("change", (event) => handleCustomParticipantTeamChange(index, event.target.value));
    card.appendChild(label);
    el.multiCustomTeamSlots.appendChild(card);
  }
}

function handleCustomParticipantTeamChange(index, rosterIdValue) {
  const rosterId = rosterIdValue ? Number(rosterIdValue) : null;
  state.customParticipantRosterIds[index] = rosterId;
  const validParticipantKeys = new Set(
    [String(getMyRoster()?.rosterId || "")]
      .concat(state.customParticipantRosterIds.filter(Boolean).map((value) => String(value)))
  );
  state.customParticipantWants = Object.fromEntries(
    Object.entries(state.customParticipantWants).filter(([participantId]) => validParticipantKeys.has(String(participantId)))
  );
  invalidateResults();
  renderCustomMultiTeamBuilder();
}

function buildCustomWantOptionsForRoster(rosterId) {
  const allParticipantRosterIds = [getMyRoster()?.rosterId, ...state.customParticipantRosterIds].filter(Boolean);
  const participantSet = new Set(allParticipantRosterIds);
  return state.normalizedRosters
    .filter((roster) => participantSet.has(roster.rosterId) && roster.rosterId !== rosterId)
    .slice()
    .sort((a, b) => a.manager.displayName.localeCompare(b.manager.displayName))
    .map((roster) => ({
      rosterId: roster.rosterId,
      managerName: roster.manager.displayName,
      assets: [...roster.assets]
        .filter(isTradeEligibleAsset)
        .sort((a, b) => sortAssetsByValueDesc(a, b, state.values)),
    }));
}

function renderCustomMultiTeamWantSelectors() {
  if (!el.multiCustomWants) return;
  el.multiCustomWants.innerHTML = `<p class="muted small builder-note">2. For each team, choose the player or pick that absolutely needs to come back to them.</p>`;

  const meRoster = getMyRoster();
  if (!meRoster) {
    el.multiCustomWants.innerHTML = `<p class="muted small">Choose your team first.</p>`;
    return;
  }

  const chosenPartnerIds = state.customParticipantRosterIds.filter(Boolean);
  if (chosenPartnerIds.length !== state.customParticipantRosterIds.length) {
    el.multiCustomWants.innerHTML = `<p class="muted small">Pick the other owners first, then lock in the main piece each team should receive.</p>`;
    return;
  }

  const participantRosters = [
    meRoster,
    ...chosenPartnerIds
      .map((rosterId) => state.normalizedRosters.find((roster) => roster.rosterId === rosterId))
      .filter(Boolean),
  ];

  participantRosters.forEach((roster) => {
    const card = document.createElement("div");
    card.className = "multi-team-want-card";

    const label = document.createElement("label");
    label.innerHTML = `
      ${roster.rosterId === meRoster.rosterId ? "Locked-in asset for you" : `Locked-in asset for ${roster.manager.displayName}`}
      <select data-want-roster-id="${roster.rosterId}"></select>
    `;
    const select = label.querySelector("select");

    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Choose a player or pick that must be included";
    select.appendChild(blank);

    buildCustomWantOptionsForRoster(roster.rosterId).forEach((group) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group.managerName;
      group.assets.forEach((asset) => {
        const option = document.createElement("option");
        option.value = asset.assetId;
        option.textContent = `${asset.name} • ${formatAssetSecondaryLabel(asset, state.values)}`;
        option.dataset.ownerRosterId = String(group.rosterId);
        optgroup.appendChild(option);
      });
      select.appendChild(optgroup);
    });

    const existingWant = state.customParticipantWants[String(roster.rosterId)] || "";
    if (existingWant) select.value = existingWant;
    select.addEventListener("change", (event) => handleCustomParticipantWantChange(roster.rosterId, event.target.value));

    const helperRow = document.createElement("div");
    helperRow.className = "participant-pill-row";
    helperRow.innerHTML = `<span class="participant-pill">${roster.manager.displayName}</span>`;
    card.appendChild(helperRow);
    card.appendChild(label);
    el.multiCustomWants.appendChild(card);
  });
}

function handleCustomParticipantWantChange(rosterId, assetId) {
  if (!assetId) {
    delete state.customParticipantWants[String(rosterId)];
  } else {
    state.customParticipantWants[String(rosterId)] = assetId;
  }
  invalidateResults();
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
  state.customParticipantWants = {};
  state.tradedPicks = [];
  state.currentDraftContext = null;
  if (el.includeAssetsToggle) el.includeAssetsToggle.checked = false;
  if (el.excludeAssetsToggle) el.excludeAssetsToggle.checked = false;
  if (el.includeAssetSearch) el.includeAssetSearch.value = "";
  if (el.excludeAssetSearch) el.excludeAssetSearch.value = "";
  if (el.playerSearch) el.playerSearch.value = "";
  if (el.includeAssetsDetails) el.includeAssetsDetails.open = false;
  if (el.excludeAssetsDetails) el.excludeAssetsDetails.open = false;
  renderSessionSnapshot();
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
    hydrateMultiTeamControls();
    syncTradeModeUi();
    renderSessionSnapshot();
    el.identitySection.classList.remove("hidden");
    el.playerSection.classList.remove("hidden");
    el.builderSection.classList.remove("hidden");
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
        }, state.tradedPicks, state.currentDraftContext);
        hydrateManagerSelector();
        hydrateMultiTeamControls();
        syncTradeModeUi();
        renderOutgoingAssetSearch();
        setStatus(`Loaded ${state.leagueName}. Choose your team to continue.`, { ok: true });
      })
      .catch((err) => {
        hydrateMultiTeamControls();
        syncTradeModeUi();
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
  hydrateMultiTeamControls();
  renderPlayerSearch();
  renderOutgoingAssetSearch();
  renderCustomMultiTeamBuilder();
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
  if (mode === "multi-custom") {
    syncTargetSearchUi();
    return;
  }

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
    ? "Leave this off unless you want every offer to include specific assets."
    : count > 0
      ? `Every offer will include these ${count} selected asset${count === 1 ? "" : "s"}, and the generator can add more if needed.`
      : "Turn this on if you want every offer to include specific assets you choose.";
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
  if (mode === "multi-custom") {
    const customValidation = validateCustomMultiTeamSetup();
    if (!customValidation.ok) {
      alert(customValidation.message);
      return;
    }
  }
  if (el.includeAssetsToggle?.checked && state.selectedOutgoingAssetIds.size === 0) {
    alert("Choose at least one player or pick to anchor offers around, or turn that option off.");
    return;
  }

  const fairnessPct = DEFAULT_FAIRNESS_PCT;
  const maxResults = clamp(Number(el.maxResultsInput?.value || 3), 1, 6);
  const tradeLab = getTradeLabSettings();

  try {
    setButtonLoading(el.generateBtn, true, "Building trade ideas...");
    await ensureValuesLoaded("");
    await waitForNextPaint();
    const leagueStrengthBaseline = mode === "multi-custom"
      ? null
      : buildLeagueStrengthBaseline({
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
    } else if (mode === "multi-custom") {
      resultPayload = generateCustomMultiTeamIdeas({
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
  if (mode === "multi-custom") {
    const participantCount = payload?.teamCount || 0;
    return `${meRoster.manager.displayName} building a ${participantCount}-team framework${suffix}`;
  }
  return `${meRoster.manager.displayName} targeting ${payload?.focusAsset?.name || "a target"} from ${payload?.primaryCounterpartyName || "another manager"}${suffix}`;
}

function buildNoIdeasMessage(tradeLab, mode = "acquire") {
  const advice = [];
  if (tradeLab.selectedOutgoingAssetIds.size > 0) advice.push("require fewer included assets");
  if (tradeLab.excludedOutgoingAssetIds.size > 0) advice.push("exclude fewer assets");
  if (mode === "shop") {
    advice.push("shop a different asset");
  } else if (mode === "multi-custom") {
    advice.push("change one of the locked-in assets");
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

function renderTradeCard(idea, index, values) {
  const evenValueLabel = formatEvenValueDisplay(idea);
  const isInitiallyOpen = index === 0;
  const marketLabel = idea.marketMetricLabel || "you";
  const marketOtherLabel = idea.marketMetricOtherLabel || "them";
  return `
    <details class="trade-card" ${isInitiallyOpen ? "open" : ""}>
      <summary class="trade-card-summary">
        <div>
          <h3>Idea ${index + 1}</h3>
          ${idea.counterpartyName ? `<p class="trade-card-context">with ${idea.counterpartyName}</p>` : ""}
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
            ${marketLabel} ${formatNumber(idea.marketMyValue)} vs ${marketOtherLabel} ${formatNumber(idea.marketTheirValue)} (${idea.marketDelta >= 0 ? "+" : ""}${formatNumber(idea.marketDelta)})
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
  const groups = getRequestedTierIds().map((tierId) => {
    const copy = getTradeTierCopy(tierId, "acquire", targetAsset.name);
    const ideas = [];

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
          maxResults: maxResults * 5,
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

    const finalizedIdeas = selectDiverseTradeIdeas(
      dedupeTwoTeamIdeas(ideas)
        .filter((idea) => classifyTwoTeamTradeTier(idea, targetAsset, values, { mode: "acquire" }) === tierId)
        .sort((a, b) => compareTradeIdeas(a, b)),
      maxResults,
      values,
      tradeLab.selectedOutgoingAssetIds
    ).map((idea) => enrichTradeIdea({
      idea,
      myRoster: meRoster,
      theirRoster,
      values,
      leagueStrengthBaseline,
    }));

    return {
      ...copy,
      ideas: finalizedIdeas,
    };
  });

  return {
    kind: "two-team",
    focusAsset: targetAsset,
    primaryCounterpartyName: theirRoster.manager.displayName,
    groups,
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

  const groups = getRequestedTierIds().map((tierId) => {
    const copy = getTradeTierCopy(tierId, "shop", shopAsset.name);
    const ideas = selectDiverseTradeIdeas(
      dedupeTwoTeamIdeas(tierBuckets[tierId])
        .sort((a, b) => compareTradeIdeas(a, b)),
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
    });

    return {
      ...copy,
      ideas,
    };
  });

  return {
    kind: "two-team",
    focusAsset: shopAsset,
    primaryCounterpartyName: "the rest of the league",
    groups,
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

  const anchorTransfers = [];
  const wantedAssetIds = new Set();

  for (const recipientRoster of participantRosters) {
    const wantedAssetId = state.customParticipantWants[String(recipientRoster.rosterId)];
    if (!wantedAssetId) {
      return { ok: false, message: `Choose the locked-in asset for ${recipientRoster.rosterId === meRoster.rosterId ? "your side" : recipientRoster.manager.displayName}.` };
    }
    if (wantedAssetIds.has(wantedAssetId)) {
      return { ok: false, message: "The same locked-in asset cannot be assigned to two teams." };
    }

    const ownerRoster = participantRosters.find((roster) => roster.assets.some((asset) => asset.assetId === wantedAssetId));
    if (!ownerRoster) {
      return { ok: false, message: "Each locked-in asset has to come from one of the owners in this trade." };
    }
    const wantedAsset = findAssetOnRoster(ownerRoster, wantedAssetId);
    if (!isTradeEligibleAsset(wantedAsset)) {
      return { ok: false, message: "Kickers and defenses cannot be locked into trades." };
    }
    if (ownerRoster.rosterId === recipientRoster.rosterId) {
      return { ok: false, message: `${recipientRoster.manager.displayName} cannot ask to receive an asset already on that roster.` };
    }
    wantedAssetIds.add(wantedAssetId);
    anchorTransfers.push({
      fromRosterId: ownerRoster.rosterId,
      toRosterId: recipientRoster.rosterId,
      asset: wantedAsset,
      isRequested: true,
    });
  }

  if (anchorTransfers.length !== participantRosters.length) {
    return { ok: false, message: "Pick one locked-in incoming asset for every team in the trade." };
  }

  return {
    ok: true,
    meRoster,
    participantRosters,
    anchorTransfers,
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
        subtitle: "Finish the owner and locked-in asset setup first.",
        emptyText: setup.message,
        ideas: [],
      }],
    };
  }

  const ideas = buildMultiTeamIdeasFromAnchors({
    meRoster,
    participantRosters: setup.participantRosters,
    anchorTransfers: setup.anchorTransfers,
    values,
    fairnessPct,
    maxResults,
    tradeLab,
    focusLabel: "custom build",
  });

  return {
    kind: "multi-team",
    teamCount: setup.participantRosters.length,
    groups: [{
      title: `${setup.participantRosters.length}-Team Build`,
      subtitle: "Each team gets the locked-in asset you chose, and the solver fills in the rest around that framework.",
      emptyText: "No multi-team structure stayed close enough to fair value.",
      ideas,
    }],
  };
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
    ),
    1,
    99
  );

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
    participants,
    tags: [
      `${tradeState.participantRosters.length} Team`,
      requestedCount >= tradeState.participantRosters.length ? "Requested Anchors" : "Open Solver",
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

  const requiredExtraAssetIds = participantIsMe && el.includeAssetsToggle?.checked
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
