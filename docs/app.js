const API_BASE = "https://api.sleeper.app/v1";
const SAMPLE_VALUES_PATH = "./data/ktc_values_sample.csv";
const PLAYERS_CACHE_KEY = "fda_players_nfl_cache_v1";
const PLAYERS_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const KTC_RAW_BASE = 0.10;
const KTC_RAW_ELITE_WEIGHT = 0.04;
const KTC_RAW_TRADE_WEIGHT = 0.09;
const KTC_RAW_DEPTH_WEIGHT = 0.24;
const KTC_GLOBAL_MAX_FALLBACK = 9999;

const state = {
  leagueId: "",
  leagueName: "",
  users: [],
  rosters: [],
  players: {},
  normalizedRosters: [],
  meRosterId: null,
  targetAsset: null,
  values: {},
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
  playerSearch: document.querySelector("#player-search"),
  playerResults: document.querySelector("#player-results"),
  settingsSection: document.querySelector("#settings-section"),
  fairnessInput: document.querySelector("#fairness-input"),
  maxResultsInput: document.querySelector("#max-results-input"),
  ktcUrlInput: document.querySelector("#ktc-url-input"),
  generateBtn: document.querySelector("#generate-btn"),
  resultsSection: document.querySelector("#results-section"),
  resultsSubtitle: document.querySelector("#results-subtitle"),
  resultsList: document.querySelector("#results-list"),
};

el.loadLeagueBtn.addEventListener("click", loadLeague);
el.copyLeagueIdBtn?.addEventListener("click", copyHelperLeagueId);
el.playerSearch.addEventListener("input", renderPlayerSearch);
el.meSelect.addEventListener("change", () => {
  state.meRosterId = Number(el.meSelect.value);
  renderPlayerSearch();
});
el.generateBtn.addEventListener("click", generateTradeIdeas);

let leagueLoadAnimationTimer = null;
let leagueLoadStartedAt = 0;
let copyFeedbackTimer = null;

async function loadLeague() {
  const leagueId = el.leagueId.value.trim();
  if (!leagueId) {
    setStatus("Please enter a league ID.");
    return;
  }

  startLeagueLoadingUi();
  state.targetAsset = null;
  el.resultsList.innerHTML = "";

  try {
    const [league, users, rosters] = await loadLeagueCoreData(leagueId);

    state.leagueId = leagueId;
    state.leagueName = league?.name || `League ${leagueId}`;
    state.users = users;
    state.rosters = rosters;
    state.players = {};
    state.normalizedRosters = normalizeRosters(rosters, users, state.players);

    hydrateManagerSelector();
    el.identitySection.classList.remove("hidden");
    el.playerSection.classList.remove("hidden");
    el.settingsSection.classList.remove("hidden");
    setStatus(`Loaded ${state.leagueName}. Player names are still syncing...`, { loading: true });

    loadPlayersWithCache()
      .then((players) => {
        state.players = players;
        state.normalizedRosters = normalizeRosters(state.rosters, state.users, players);
        hydrateManagerSelector();
        setStatus(`Loaded ${state.leagueName}. Choose your team to continue.`, { ok: true });
      })
      .catch((err) => {
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

  return [byKey.league, byKey.users, byKey.rosters];
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
  renderPlayerSearch();
}

function renderPlayerSearch() {
  if (!state.meRosterId) return;
  const meRosterId = Number(el.meSelect.value || state.meRosterId);
  state.meRosterId = meRosterId;
  const q = el.playerSearch.value.trim().toLowerCase();

  const candidates = state.normalizedRosters
    .filter((r) => r.rosterId !== meRosterId)
    .flatMap((r) => r.assets.filter((a) => a.assetType === "player").map((a) => ({ ...a, managerName: r.manager.displayName, managerRosterId: r.rosterId })))
    .filter((a) => !q || a.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 150);

  el.playerResults.innerHTML = "";

  if (candidates.length === 0) {
    el.playerResults.innerHTML = `<div class="player-item muted">No players found.</div>`;
    return;
  }

  for (const asset of candidates) {
    const row = document.createElement("div");
    row.className = `player-item ${state.targetAsset?.assetId === asset.assetId ? "selected" : ""}`;
    row.innerHTML = `<strong>${asset.name}</strong><br/><span class="muted">Manager: ${asset.managerName}</span>`;
    row.addEventListener("click", () => {
      state.targetAsset = asset;
      renderPlayerSearch();
    });
    el.playerResults.appendChild(row);
  }
}

async function generateTradeIdeas() {
  if (!state.meRosterId) {
    alert("Load a league first.");
    return;
  }
  if (!state.targetAsset) {
    alert("Select a target player first.");
    return;
  }

  const meRoster = state.normalizedRosters.find((r) => r.rosterId === state.meRosterId);
  const theirRoster = state.normalizedRosters.find((r) => r.rosterId === state.targetAsset.managerRosterId);
  if (!meRoster || !theirRoster) {
    alert("Could not resolve rosters.");
    return;
  }

  const fairnessPct = Number(el.fairnessInput.value || 20);
  const maxResults = Number(el.maxResultsInput.value || 4);

  try {
    state.values = await loadValues(el.ktcUrlInput.value.trim());
  } catch (err) {
    alert(`Could not load valuation source. ${err.message}`);
    return;
  }

  const ideas = suggestTrades({
    myRoster: meRoster,
    theirRoster,
    targetAsset: state.targetAsset,
    values: state.values,
    fairnessPct,
    maxResults,
  });

  el.resultsSection.classList.remove("hidden");
  el.resultsSubtitle.textContent = `${meRoster.manager.displayName} acquiring ${state.targetAsset.name} from ${theirRoster.manager.displayName}`;

  if (ideas.length === 0) {
    el.resultsList.innerHTML = `<p class="muted">No fair offers found once KTC package adjustment is applied. Increase fairness % or change target.</p>`;
    return;
  }

  el.resultsList.innerHTML = ideas
    .map(
      (idea, idx) => `
      <article class="trade-card">
        <h3>Idea ${idx + 1}</h3>
        <p><strong>You send:</strong> ${idea.myAssets.map((a) => a.name).join(", ")}</p>
        <p><strong>You receive:</strong> ${idea.theirAssets.map((a) => a.name).join(", ")}</p>
        <p class="muted">Base value: you ${idea.myBaseValue} vs them ${idea.theirBaseValue}</p>
        <p class="muted">Package adjustment: ${formatPackageAdjustment(idea)}</p>
        <p class="muted">KTC-style total: you ${idea.myAdjustedValue} vs them ${idea.theirAdjustedValue} (diff ${idea.pctDiff}%)</p>
        <p class="muted">Add value to even: ${idea.evenValue}</p>
      </article>`
    )
    .join("");
}

function suggestTrades({ myRoster, theirRoster, targetAsset, values, fairnessPct, maxResults }) {
  const targetValue = getAssetValue(targetAsset, values);
  if (!targetValue) return [];

  const globalMaxValue = getGlobalMaxPlayerValue(values, targetValue);
  const valuedAssets = myRoster.assets.filter((asset) => Number.isFinite(getAssetValue(asset, values)));
  const combos = [];

  valuedAssets.forEach((asset) => combos.push([asset]));
  for (let i = 0; i < valuedAssets.length; i++) {
    for (let j = i + 1; j < valuedAssets.length; j++) {
      combos.push([valuedAssets[i], valuedAssets[j]]);
    }
  }
  for (let i = 0; i < valuedAssets.length; i++) {
    for (let j = i + 1; j < valuedAssets.length; j++) {
      for (let k = j + 1; k < valuedAssets.length; k++) {
        combos.push([valuedAssets[i], valuedAssets[j], valuedAssets[k]]);
      }
    }
  }

  const rawIdeas = [];
  for (const myAssets of combos) {
    const myValues = myAssets.map((asset) => getAssetValue(asset, values));
    const packageResult = calculatePackageAdjustment({
      myValues,
      theirValues: [targetValue],
      globalMaxValue,
    });
    const pctDiff = calculatePctDiff(packageResult.myAdjustedValue, packageResult.theirAdjustedValue);
    if (pctDiff <= fairnessPct) {
      rawIdeas.push({
        myAssets,
        theirAssets: [targetAsset],
        ...packageResult,
        pctDiff: Number(pctDiff.toFixed(2)),
      });
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const idea of rawIdeas) {
    const key = idea.myAssets.map((asset) => asset.assetId).sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(idea);
  }

  deduped.sort((a, b) => {
    const byDiff = Math.abs(a.pctDiff) - Math.abs(b.pctDiff);
    if (byDiff !== 0) return byDiff;

    const byEvenValue = a.evenValue - b.evenValue;
    if (byEvenValue !== 0) return byEvenValue;

    return a.myAssets.length - b.myAssets.length;
  });

  return deduped.slice(0, maxResults);
}

function formatPackageAdjustment(idea) {
  if (!idea.packageAdjustment) return "none";
  const side = idea.packageAdjustmentSide === "my" ? "your side" : "their side";
  return `+${idea.packageAdjustment} on ${side}`;
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

function getAssetValue(asset, values) {
  const exact = values[asset.assetId];
  if (Number.isFinite(exact)) return exact;

  if (asset.assetType === "pick") {
    const anyId = asset.assetId.replace(/:[^:]+$/, ":any");
    if (Number.isFinite(values[anyId])) return values[anyId];
  }

  return estimatedValue(asset);
}

function estimatedValue(asset) {
  if (asset.assetType === "pick") return 2200;

  const position = (asset.raw?.position || asset.raw?.fantasy_positions?.[0] || "").toUpperCase();
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

function normalizeRosters(rosters, users, players) {
  const userById = new Map(users.map((u) => [u.user_id, u]));

  return rosters.map((roster) => {
    const owner = userById.get(roster.owner_id) || {};
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
      name: `${pick.season} Round ${pick.round} Pick`,
      assetType: "pick",
      raw: pick,
    }));

    return {
      rosterId: roster.roster_id,
      manager: {
        userId: roster.owner_id || "unknown",
        displayName: owner.display_name || owner.username || `Roster ${roster.roster_id}`,
      },
      assets: [...playerAssets, ...pickAssets],
    };
  });
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
