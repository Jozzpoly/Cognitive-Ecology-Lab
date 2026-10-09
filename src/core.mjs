// Deterministic, deliberately SMALL carrier for studying cognition cooperation.
// World facts and private experience are distinct. No learned model is simulated.
export const SITES = Object.freeze([
  Object.freeze({ id: "west", name: "Zachód", x: 2, y: 2 }),
  Object.freeze({ id: "east", name: "Wschód", x: 10, y: 2 }),
]);
export const DEPOT = Object.freeze({ x: 6, y: 7 });
export const POLICIES = Object.freeze(["habit", "cooldown", "recall"]);
const SPEED = 0.45;
const round = n => Math.round(n * 1000) / 1000;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const trim = (items, length) => { if (items.length > length) items.splice(0, items.length - length); };

export function createWorld(seed = 1, policy = "habit") {
  assert(POLICIES.includes(policy), "unknown policy");
  const s = Number(seed) >>> 0;
  return {
    seed: s, tick: 0, policy,
    stations: {
      west: { stock: 0, max: 3, restockEvery: 92, nextRestock: 78 + s % 17 },
      east: { stock: 3, max: 3, restockEvery: 43, nextRestock: 31 + (s * 7) % 12 },
    },
    actor: {
      x: DEPOT.x, y: DEPOT.y, carrying: false, target: null,
      skipOnce: null, deliveries: 0, emptyTrips: 0, distance: 0,
      consultations: 0, decisions: [], episodes: [], path: [{ x: DEPOT.x, y: DEPOT.y }],
      lastReason: "Jeszcze nie podjęto decyzji", lastAdvice: null,
    },
    events: [],
  };
}

// Strict actor-private input. Researcher-only station stock and replenishment times
// MUST NOT enter this view. Site coordinates represent known locations, not live stocks.
export function privateView(world) {
  const a = world.actor;
  return {
    tick: world.tick,
    self: { x: round(a.x), y: round(a.y), carrying: a.carrying },
    memories: a.episodes.map(e => ({ ...e })),
    choices: SITES.map(({ id, x, y }) => ({ id, x, y })),
  };
}

export function recallAdvice(view) {
  const rankings = view.choices.map(site => {
    const travel = distance(view.self, site);
    const latest = [...view.memories].reverse().find(m => m.siteId === site.id);
    let estimate = 0;
    if (latest) {
      const age = Math.max(0, view.tick - latest.tick);
      const relevance = Math.max(0, 1 - age / 110);
      estimate = (latest.outcome === "empty" ? -7 : 1.5) * relevance;
    }
    return { siteId: site.id, score: -travel + estimate, support: latest?.id ?? null };
  });
  rankings.sort((a, b) => b.score - a.score || a.siteId.localeCompare(b.siteId));
  return { preferred: rankings[0].siteId, rankings };
}

function chooseSite(world) {
  const a = world.actor;
  const view = privateView(world);
  let ranked = view.choices.map(s => ({
    siteId: s.id, score: -distance(view.self, s), support: null,
  }));
  let reason = "Najbliższe znane miejsce";
  if (world.policy === "cooldown") {
    ranked = ranked.map(r => {
      const lastEmpty = [...view.memories].reverse().find(
        m => m.siteId === r.siteId && m.outcome === "empty",
      );
      const tooRecent = lastEmpty && view.tick - lastEmpty.tick < 53;
      return { ...r, score: r.score - (tooRecent ? 8 : 0), support: lastEmpty?.id ?? null };
    });
    reason = "Lokalna reguła: odłóż niedawno puste miejsce";
  } else if (world.policy === "recall") {
    const advice = recallAdvice(view);
    ranked = advice.rankings;
    a.consultations++;
    a.lastAdvice = { tick: world.tick, ...advice };
    reason = "Osobny doradca wspomnień (bez dostępu do World)";
  } else {
    a.lastAdvice = null;
  }
  if (a.skipOnce) {
    ranked = ranked.map(r => ({
      ...r, score: r.score - (r.siteId === a.skipOnce ? 1000 : 0),
    }));
  }
  ranked.sort((a, b) => b.score - a.score || a.siteId.localeCompare(b.siteId));
  const chosen = ranked[0];
  a.target = chosen.siteId;
  a.decisions.push({ tick: world.tick, target: chosen.siteId, reason, support: chosen.support });
  trim(a.decisions, 80);
  a.lastReason = reason + (chosen.support ? " · dowód " + chosen.support : "");
  a.skipOnce = null;
}

function addEvent(world, message, kind = "actor") {
  world.events.push({ tick: world.tick, message, kind });
  trim(world.events, 60);
}

function record(world, siteId, outcome) {
  const a = world.actor;
  const e = { id: world.tick + ":" + siteId + ":" + outcome, tick: world.tick, siteId, outcome };
  a.episodes.push(e);
  trim(a.episodes, 32);
  addEvent(world, (siteId === "west" ? "Zachód" : "Wschód") + ": " +
    (outcome === "empty" ? "brak zasobu" : "pobrano zasób"));
}

function moveToward(actor, target) {
  const dx = target.x - actor.x, dy = target.y - actor.y;
  const length = Math.hypot(dx, dy);
  const step = Math.min(SPEED, length);
  if (length > 0) {
    actor.x += (dx / length) * step;
    actor.y += (dy / length) * step;
    actor.distance += step;
  }
  actor.path.push({ x: actor.x, y: actor.y });
  trim(actor.path, 105);
  return length <= SPEED + 1e-9;
}

function advanceWorld(world) {
  world.tick++;
  for (const site of SITES) {
    const state = world.stations[site.id];
    if (world.tick >= state.nextRestock) {
      if (state.stock < state.max) {
        state.stock++;
        addEvent(world, site.name + ": niezależne odnowienie zasobu", "world");
      }
      state.nextRestock += state.restockEvery;
    }
  }
  const a = world.actor;
  if (a.carrying) {
    if (moveToward(a, DEPOT)) {
      a.deliveries++;
      a.carrying = false;
      a.target = null;
      a.lastReason = "Dostarczono zasób";
      addEvent(world, "Dostawa zakończona");
    }
    return;
  }
  if (!a.target) chooseSite(world);
  const target = SITES.find(s => s.id === a.target);
  if (moveToward(a, target)) {
    const state = world.stations[target.id];
    if (state.stock > 0) {
      state.stock--;
      record(world, target.id, "stock");
      a.carrying = true;
      a.target = null;
    } else {
      a.emptyTrips++;
      record(world, target.id, "empty");
      a.skipOnce = target.id;
      a.target = null;
    }
  }
}

export function createExperiment({ seed = 1, left = "habit", right = "recall" } = {}) {
  return {
    seed: Number(seed) >>> 0,
    left: createWorld(seed, left),
    right: createWorld(seed, right),
    firstDivergenceTick: null,
    interventions: [],
  };
}

export function advance(experiment, ticks = 1) {
  assert(Number.isInteger(ticks) && ticks >= 0 && ticks <= 10000, "invalid ticks");
  for (let i = 0; i < ticks; i++) {
    advanceWorld(experiment.left);
    advanceWorld(experiment.right);
    if (experiment.firstDivergenceTick === null) {
      const a = experiment.left.actor, b = experiment.right.actor;
      if (Math.abs(a.x - b.x) > 1e-8 || Math.abs(a.y - b.y) > 1e-8 ||
          a.carrying !== b.carrying || a.target !== b.target) {
        experiment.firstDivergenceTick = experiment.left.tick;
      }
    }
  }
  return experiment;
}

// Same external intervention applied to both World instances, even after their
// histories diverged. It is NOT transmitted to the agents' private memories.
export function intervene(experiment, siteId, action) {
  assert(SITES.some(s => s.id === siteId), "unknown site");
  assert(action === "fill" || action === "drain", "unknown intervention");
  for (const world of [experiment.left, experiment.right]) {
    world.stations[siteId].stock = action === "fill" ? 3 : 0;
    addEvent(world, (siteId === "west" ? "Zachód" : "Wschód") +
      (action === "fill" ? ": Owner uzupełnił" : ": Owner opróżnił"), "world");
  }
  experiment.interventions.push({ tick: experiment.left.tick, siteId, action });
  return experiment;
}

export function summary(world) {
  const a = world.actor;
  return {
    tick: world.tick, deliveries: a.deliveries, emptyTrips: a.emptyTrips,
    distance: round(a.distance), consultations: a.consultations,
    memories: a.episodes.length,
  };
}
