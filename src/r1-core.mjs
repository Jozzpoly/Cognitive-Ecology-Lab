// R1 Incident Cell: separate, clocked, authored cognition processes sharing one actuator.
// A replaceable falsification specimen, NOT a trained agent, LLM, Jev or ReflexBrain.
export const WIDTH = 19, HEIGHT = 13;
export const BASE = Object.freeze({ x: 9, y: 6 });
export const MODULES = Object.freeze(['dispatch', 'planner', 'guardian']);
export const MODE = Object.freeze(['coalition', 'local']);
const SITES = Object.freeze([{ x: 2, y: 2 }, { x: 16, y: 2 }, { x: 2, y: 10 }, { x: 16, y: 10 }, { x: 9, y: 2 }, { x: 9, y: 10 }]);
const initialWalls = () => {
  const cells = new Set();
  for (let y = 1; y <= 11; y++) {
    if (![3, 9].includes(y)) cells.add(`6,${y}`);
    if (![5, 10].includes(y)) cells.add(`12,${y}`);
  }
  return cells;
};
const key = (x, y) => `${x},${y}`;
const inside = (x, y) => x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;
const taxi = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const copy = p => ({ x: p.x, y: p.y });
const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const near = p => dirs.map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy })).filter(p => inside(p.x, p.y));
const assert = (p, msg) => { if (!p) throw new Error(msg); };
const keep = (arr, n = 70) => { while (arr.length > n) arr.shift(); };
const intensity = (hazards, x, y) => hazards.reduce((level, h) => Math.max(level, taxi(h, { x, y }) <= h.radius ? h.power : 0), 0);
const append = (w, type, text, detail = '') => { w.logs.push({ t: w.t, type, text, detail }); keep(w.logs, 60); };
const rand = w => { w.rng = (Math.imul(w.rng, 1664525) + 1013904223) >>> 0; return w.rng / 4294967296; };

export function createCell({ seed = 19, mode = 'coalition', modules = {} } = {}) {
  assert(MODE.includes(mode), 'invalid mode');
  const w = {
    seed: Number(seed) >>> 0, rng: Number(seed) >>> 0 || 1, t: 0, mode,
    modules: { dispatch: true, planner: true, guardian: true, ...modules },
    actor: { ...BASE, hp: 100, targetId: null, steps: 0, hits: 0, repairs: 0, idle: 0, trace: [copy(BASE)] },
    incidents: [], walls: initialWalls(), hazards: [],
    known: { walls: new Set(), clear: new Set(), heat: new Map() },
    cognition: {
      pilot: { calls: 0, last: null }, dispatch: { calls: 0, last: null, chosen: null },
      planner: { calls: 0, pending: [], last: null, route: null, accepted: 0, rejected: 0 },
      guardian: { calls: 0, veto: 0, last: null },
      broker: { disagreement: 0, deliberation: 0, local: 0 },
    },
    resolved: 0, expired: 0, interventions: [], logs: [], serial: 0, jamUntil: 0,
  };
  spawnIncident(w, SITES[0], 100);
  spawnIncident(w, SITES[3], 75);
  append(w, 'system', 'Powołano komórkę reagowania', 'Moduły mają różne zegary i ograniczenia wiedzy');
  return w;
}
function spawnIncident(w, pos, ttl = 120) {
  const open = w.incidents.find(i => i.x === pos.x && i.y === pos.y && i.ttl > 0);
  if (open) { open.ttl = Math.max(open.ttl, ttl); return open; }
  const i = { id: ++w.serial, x: pos.x, y: pos.y, born: w.t, ttl, deadline: w.t + ttl };
  w.incidents.push(i); keep(w.incidents, 18); append(w, 'world', `Nowy alarm #${i.id}`, `${pos.x},${pos.y} · ważny ${ttl} ticków`);
  return i;
}

// Perception envelope. Dispatch receives globally broadcast distress signals, but no hidden hazards.
// Pilot knows the broadcast location, not whether it can reach it. Mapper sees only observed cells.
export function privateSignals(w) {
  return w.incidents.map(i => ({ id: i.id, x: i.x, y: i.y, deadline: i.deadline }));
}
export function privateMap(w) {
  return {
    t: w.t, actor: copy(w.actor),
    walls: [...w.known.walls], clear: [...w.known.clear],
    heat: [...w.known.heat].map(([cell, obs]) => [cell, { ...obs }]),
  };
}
export function perceive(w) {
  const radius = 3;
  for (let y = w.actor.y - radius; y <= w.actor.y + radius; y++) for (let x = w.actor.x - radius; x <= w.actor.x + radius; x++) {
    if (!inside(x, y) || taxi(w.actor, { x, y }) > radius) continue;
    const k = key(x, y);
    if (w.walls.has(k)) { w.known.walls.add(k); w.known.clear.delete(k); }
    else { w.known.clear.add(k); w.known.walls.delete(k); }
    w.known.heat.set(k, { power: intensity(w.hazards, x, y), seen: w.t });
  }
}
function greedy(from, to, forbidden = new Set()) {
  if (!to) return null;
  const n = near(from).filter(p => !forbidden.has(key(p.x, p.y)));
  n.sort((a, b) => taxi(a, to) - taxi(b, to) || a.y - b.y || a.x - b.x);
  return n[0] || null;
}
// The cheap local baseline is NOT made helpless on purpose: it sees nearby
// obstacles, avoids revisiting recent cells, and can escape a blocked direct route.
function pilotStep(view, goal) {
  const a = view.actor;
  if (!goal) return null;
  const walls = new Set(view.walls || []);
  const candidates = near(a).filter(p => !walls.has(key(p.x, p.y)));
  const visits = new Map();
  for (const p of (view.recent || []).slice(-20)) visits.set(key(p.x, p.y), (visits.get(key(p.x, p.y)) || 0) + 1);
  candidates.sort((a, b) => {
    const merit = p => taxi(p, goal) + (visits.get(key(p.x, p.y)) || 0) * 2.1;
    return merit(a) - merit(b) || a.y - b.y || a.x - b.x;
  });
  return candidates[0] || null;
}
export function pilotProposal(view) {
  if (!view.signals.length) return { target: null, step: null };
  const best = [...view.signals].sort((a, b) => taxi(view.actor, a) - taxi(view.actor, b) || a.id - b.id)[0];
  return { target: best.id, step: pilotStep(view, best) };
}
export function dispatchProposal(view) {
  if (!view.signals.length) return { target: null, reason: 'Brak aktywnych alarmów' };
  const tasks = [...view.signals].sort((a, b) => {
    const slack = task => task.deadline - view.t - taxi(view.actor, task) * 3;
    return slack(a) - slack(b) || a.id - b.id;
  });
  return { target: tasks[0].id, reason: 'Najmniejszy zapas czasu na dojazd' };
}
function evidenceRisk(snapshot, x, y) {
  const v = snapshot.heat.find(([cell]) => cell === key(x, y));
  if (!v) return 0; // unknown is not known-safe; zero is neutral routing cost here
  const [, obs] = v;
  const fresh = Math.max(0, 1 - (snapshot.t - obs.seen) / 35);
  return obs.power * fresh;
}
// No world access: planning over a captured private snapshot. Unknown walls remain risks.
export function plannerProposal(snapshot, goal) {
  if (!goal) return { path: [], goalId: null, fromTick: snapshot.t };
  const start = snapshot.actor;
  const frontier = [{ x: start.x, y: start.y, score: 0 }];
  const came = new Map(), cost = new Map([[key(start.x, start.y), 0]]);
  while (frontier.length) {
    frontier.sort((a, b) => a.score - b.score || a.y - b.y || a.x - b.x);
    const current = frontier.shift();
    if (current.x === goal.x && current.y === goal.y) break;
    for (const next of near(current)) {
      const k = key(next.x, next.y);
      if (snapshot.walls.includes(k)) continue;
      const danger = evidenceRisk(snapshot, next.x, next.y);
      const step = 1 + (danger >= 2 ? 20 : danger * 2);
      const newCost = cost.get(key(current.x, current.y)) + step;
      if (!cost.has(k) || newCost < cost.get(k)) {
        cost.set(k, newCost); came.set(k, key(current.x, current.y));
        frontier.push({ ...next, score: newCost + taxi(next, goal) });
      }
    }
  }
  const end = key(goal.x, goal.y);
  if (!cost.has(end)) return { path: [], goalId: goal.id, fromTick: snapshot.t };
  const rev = [end]; let cur = end;
  while (cur !== key(start.x, start.y)) {
    cur = came.get(cur); if (!cur) break; rev.push(cur);
  }
  const path = rev.reverse().map(v => { const [x, y] = v.split(',').map(Number); return { x, y }; });
  return { path, goalId: goal.id, fromTick: snapshot.t };
}
function broker(w, goal, pilot) {
  const c = w.cognition, a = w.actor;
  if (!goal) return null;
  const view = { actor: copy(a), walls: [...w.known.walls], recent: a.trace.map(copy) };
  let step = pilot.target === goal.id ? pilot.step : pilotStep(view, goal);
  let via = 'Pilot';
  if (w.mode === 'coalition' && w.modules.planner && c.planner.route) {
    const route = c.planner.route;
    const at = route.path.findIndex(p => p.x === a.x && p.y === a.y);
    if (route.goalId !== goal.id || w.t - route.fromTick > 38 || at < 0 || at + 1 >= route.path.length) {
      c.planner.rejected++;
      append(w, 'refused', 'Odrzucono nieaktualny plan', 'Cel / pozycja / wiek nie zgadza się z rzeczywistością');
      c.planner.route = null;
    } else {
      const proposed = route.path[at + 1];
      if (taxi(a, proposed) === 1) {
        if (!step || step.x !== proposed.x || step.y !== proposed.y) c.broker.disagreement++;
        step = proposed; via = 'Kartograf'; c.planner.accepted++;
      }
    }
  }
  if (step && w.mode === 'coalition' && w.modules.guardian) {
    c.guardian.calls++;
    const blocked = w.known.walls.has(key(step.x, step.y));
    // Only adjacent legal perception used; nonlocal World truth is never inspected by guardian.
    const local = w.known.heat.get(key(step.x, step.y));
    const sensedRisk = local && local.seen === w.t ? local.power : 0;
    if (blocked || sensedRisk >= 2) {
      c.guardian.veto++;
      c.broker.disagreement++;
      const safe = near(a).filter(p => !w.known.walls.has(key(p.x, p.y)) &&
        (w.known.heat.get(key(p.x, p.y))?.power ?? 0) < 2);
      safe.sort((a, b) => taxi(a, goal) - taxi(b, goal) || a.y - b.y || a.x - b.x);
      const alternate = safe[0] || null;
      append(w, 'veto', 'Strażnik zakwestionował trasę', `${blocked ? 'Zablokowana komórka' : 'Wysoka temperatura'}; ${alternate ? 'wybrano objazd' : 'postój'}`);
      step = alternate; via = 'Strażnik';
    }
    c.guardian.last = { t: w.t, blocked, danger: sensedRisk, veto: blocked || sensedRisk >= 2 };
  }
  if (step) append(w, 'move', `Ruch: ${via}`, `${a.x},${a.y} → ${step.x},${step.y} · alarm #${goal.id}`);
  return step;
}

export function advanceCell(w, count = 1) {
  assert(Number.isInteger(count) && count >= 0 && count <= 20000, 'invalid ticks');
  for (let i = 0; i < count; i++) tick(w);
  return w;
}
function tick(w) {
  w.t++;
  const c = w.cognition, a = w.actor;
  if (w.t % 105 === 0) { const site = SITES[Math.floor(rand(w) * SITES.length)]; spawnIncident(w, site, 80 + Math.floor(rand(w) * 60)); }
  if (w.t % 160 === 0) {
    const spot = { x: 2 + Math.floor(rand(w) * 15), y: 1 + Math.floor(rand(w) * 11), radius: 1, power: 3, until: w.t + 75 };
    w.hazards.push(spot); append(w, 'world', 'Nowe lokalne zagrożenie', `${spot.x},${spot.y}`);
  }
  w.hazards = w.hazards.filter(h => h.until > w.t);
  for (const i of w.incidents) if (i.deadline <= w.t) { w.expired++; append(w, 'world', `Alarm #${i.id} utracony`, 'Termin minął'); }
  w.incidents = w.incidents.filter(i => i.deadline > w.t);
  perceive(w);
  const signals = privateSignals(w);
  if (w.t % 11 === 1 && w.mode === 'coalition' && w.modules.dispatch) {
    c.dispatch.calls++;
    c.dispatch.last = { ...dispatchProposal({ t: w.t, actor: copy(a), signals }), t: w.t };
    append(w, 'proposal', 'Dyspozytor ocenił priorytety', c.dispatch.last.reason);
  }
  if (w.t % 23 === 1 && w.mode === 'coalition' && w.modules.planner && c.planner.pending.length < 2) {
    const assigned = signals.find(i => i.id === c.dispatch.last?.target) || signals.find(i => i.id === c.pilot.last?.target) || signals[0];
    if (assigned) {
      const snapshot = privateMap(w);
      const job = { created: w.t, ready: w.t + 7 + (w.seed % 5), output: plannerProposal(snapshot, assigned) };
      c.planner.pending.push(job); c.planner.calls++;
      append(w, 'proposal', 'Kartograf rozpoczął analizę', `Odpowiedź za ${job.ready - w.t} ticków · alarm #${assigned.id}`);
    }
  }
  if (w.mode === 'coalition' && w.modules.planner) for (const job of [...c.planner.pending]) {
    if (w.t < job.ready) continue;
    c.planner.pending.splice(c.planner.pending.indexOf(job), 1);
    if (w.t < w.jamUntil) { append(w, 'refused', 'Utracono odpowiedź kartografa', 'Zakłócenie łączności'); continue; }
    c.planner.last = { t: w.t, ...job.output };
    c.planner.route = job.output;
    append(w, 'reply', 'Plan dotarł do brokera', `Długość ${job.output.path.length}; dane z t=${job.created}`);
  }
  if (w.t % 3 !== 0) return;
  c.pilot.calls++;
  const pilot = pilotProposal({ actor: copy(a), signals, walls: [...w.known.walls], recent: a.trace.map(copy) });
  c.pilot.last = { ...pilot, t: w.t };
  let selected = signals.find(s => s.id === pilot.target) || null;
  if (w.mode === 'coalition' && w.modules.dispatch) {
    const dist = signals.find(s => s.id === c.dispatch.last?.target);
    if (dist && w.t - c.dispatch.last.t <= 20) {
      if (selected && selected.id !== dist.id) c.broker.disagreement++;
      selected = dist;
      c.broker.deliberation++;
    }
  } else c.broker.local++;
  a.targetId = selected?.id ?? null;
  if (!selected) { a.idle++; return; }
  const step = w.mode === 'local' ? pilot.step : broker(w, selected, pilot);
  if (!step) { a.idle++; return; }
  if (w.walls.has(key(step.x, step.y))) {
    a.idle++; append(w, 'blocked', 'Zatrzymanie na przeszkodzie', `${step.x},${step.y}`); return;
  }
  a.x = step.x; a.y = step.y; a.steps++;
  a.trace.push(copy(a)); keep(a.trace, 90);
  const heat = intensity(w.hazards, a.x, a.y);
  if (heat >= 2) {
    a.hp = Math.max(0, a.hp - 12); a.hits++;
    append(w, 'damage', 'Wykonawca wszedł w zagrożenie', `Utrata 12 integralności · HP ${a.hp}`);
  }
  if (selected.x === a.x && selected.y === a.y) {
    const idx = w.incidents.findIndex(i => i.id === selected.id);
    if (idx >= 0) {
      w.incidents.splice(idx, 1); w.resolved++; a.repairs++;
      append(w, 'success', `Alarm #${selected.id} opanowany`, `Pozostało ${selected.deadline - w.t} ticków`);
      c.planner.route = null;
    }
  }
  // Always render continuing world: damage affects metric but does not freeze the agent.
}

// Owner interventions are world-authority only. They are NOT directly dispatched
// to cognition: those processes must obtain observations through their own envelopes.
export function interveneCell(w, event, record = true) {
  const { kind, x, y } = event;
  assert(['ignite', 'cool', 'wall', 'alarm', 'jam'].includes(kind), 'unknown intervention');
  if (kind !== 'jam') assert(Number.isInteger(x) && Number.isInteger(y) && inside(x, y), 'invalid location');
  if (kind === 'ignite') { w.hazards.push({ x, y, radius: 1, power: 3, until: w.t + 90 }); append(w, 'world', 'Owner: zapłon', `${x},${y}`); }
  else if (kind === 'cool') { w.hazards = w.hazards.filter(h => taxi(h, { x, y }) > 2); append(w, 'world', 'Owner: ugaszono obszar', `${x},${y}`); }
  else if (kind === 'wall') {
    if ((x === BASE.x && y === BASE.y) || (x === w.actor.x && y === w.actor.y)) return w;
    const k = key(x, y); if (w.walls.has(k)) w.walls.delete(k); else w.walls.add(k);
    append(w, 'world', 'Owner: przebudowa przejścia', `${x},${y}`);
  } else if (kind === 'alarm') spawnIncident(w, { x, y }, 85);
  else if (kind === 'jam') { w.jamUntil = w.t + 70; append(w, 'world', 'Owner: zagłuszono kartografa', 'Przez 70 ticków'); }
  if (record) w.interventions.push({ tick: w.t, kind, x, y });
  return w;
}

export function compareWithoutModules(w) {
  const control = createCell({ seed: w.seed, mode: 'local' });
  let t = 0;
  for (const event of w.interventions) {
    advanceCell(control, event.tick - t);
    interveneCell(control, event, false);
    t = event.tick;
  }
  advanceCell(control, w.t - t);
  return { control: summaryCell(control), live: summaryCell(w), matchedTicks: w.t, eventCount: w.interventions.length };
}
export function summaryCell(w) {
  return { tick: w.t, resolved: w.resolved, expired: w.expired, hits: w.actor.hits,
    health: w.actor.hp, steps: w.actor.steps, idle: w.actor.idle,
    proposals: w.cognition.dispatch.calls, plans: w.cognition.planner.calls,
    accepted: w.cognition.planner.accepted, rejected: w.cognition.planner.rejected,
    guardianVeto: w.cognition.guardian.veto, disagreements: w.cognition.broker.disagreement };
}