const API_BASE = "https://api.sleeper.app/v1";
const SAMPLE_VALUES_PATH = "./data/ktc_values_sample.csv";

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
  leagueStatus: document.querySelector("#league-status"),
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
el.playerSearch.addEventListener("input", renderPlayerSearch);
el.meSelect.addEventListener("change", () => {
  state.meRosterId = Number(el.meSelect.value);
  renderPlayerSearch();
});
el.generateBtn.addEventListener("click", generateTradeIdeas);

async function loadLeague() {
  const leagueId = el.leagueId.value.trim();
  if (!leagueId) {
    setStatus("Please enter a league ID.");
    return;
  }

  setStatus("Loading league, rosters, and players...", false);
  state.targetAsset = null;
  state.resultsList.innerHTML = "";

  try {
    const [league, users, rosters, players] = await Promise.all([
      apiGet(`/league/${leagueId}`),
      apiGet(`/league/${leagueId}/users`),
      apiGet(`/league/${leagueId}/rosters`),
      apiGet(`/players/nfl`),
    ]);

    state.leagueId = leagueId;
    state.leagueName = league?.name || `League ${leagueId}`;
    state.users = users;
    state.rosters = rosters;
    state.players = players;
    state.normalizedRosters = normalizeRosters(rosters, users, players);

    hydrateManagerSelector();
    el.identitySection.classList.remove("hidden");
    el.playerSection.classList.remove("hidden");
    el.settingsSection.classList.remove("hidden");
    setStatus(`Loaded ${state.leagueName}. Choose your team to continue.`, true);
  } catch (err) {
    setStatus(`Could not load league data. ${err.message}`);
  }
}

function hydrateManagerSelector() {
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

  if (state.normalizedRosters.length > 0) {
    state.meRosterId = state.normalizedRosters[0].rosterId;
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
    el.resultsList.innerHTML = `<p class="muted">No fair offers found with current settings/value data. Increase fairness % or change target.</p>`;
    return;
  }

  el.resultsList.innerHTML = ideas
    .map(
      (idea, idx) => `
      <article class="trade-card">
        <h3>Idea ${idx + 1}</h3>
        <p><strong>You send:</strong> ${idea.myAssets.map((a) => a.name).join(", ")}</p>
        <p><strong>You receive:</strong> ${idea.theirAssets.map((a) => a.name).join(", ")}</p>
        <p class="muted">Value: you ${idea.myValue} vs them ${idea.theirValue} (diff ${idea.pctDiff}%)</p>
      </article>`
    )
    .join("");
}

function suggestTrades({ myRoster, theirRoster, targetAsset, values, fairnessPct, maxResults }) {
  const targetValue = getAssetValue(targetAsset, values);
  if (!targetValue) return [];

  const valuedAssets = myRoster.assets.filter((a) => getAssetValue(a, values));
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
    const myValue = myAssets.reduce((sum, a) => sum + getAssetValue(a, values), 0);
    const pctDiff = Math.abs(myValue - targetValue) / Math.max(myValue, targetValue) * 100;
    if (pctDiff <= fairnessPct) {
      rawIdeas.push({
        myAssets,
        theirAssets: [targetAsset],
        myValue,
        theirValue: targetValue,
        pctDiff: Number(pctDiff.toFixed(2)),
      });
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const idea of rawIdeas) {
    const key = idea.myAssets.map((a) => a.assetId).sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(idea);
  }

  deduped.sort((a, b) => {
    const byDiff = Math.abs(a.pctDiff) - Math.abs(b.pctDiff);
    if (byDiff !== 0) return byDiff;
    return a.myAssets.length - b.myAssets.length;
  });

  return deduped.slice(0, maxResults);
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

async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Sleeper API returned ${response.status}`);
  }
  return response.json();
}

function setStatus(message, ok = false) {
  el.leagueStatus.textContent = message;
  el.leagueStatus.className = `status ${ok ? "ok" : "muted"}`;
}
