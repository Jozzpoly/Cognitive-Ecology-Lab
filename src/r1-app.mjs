import { WIDTH, HEIGHT, BASE, createCell, advanceCell, interveneCell, compareWithoutModules, summaryCell } from './r1-core.mjs';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const rawSeed = Number(params.get('seed') ?? 19);
const seed = Number.isInteger(rawSeed) && rawSeed >= 0 && rawSeed <= 4294967295 ? rawSeed : 19;
const toolNames = { ignite: 'Zapłon', wall: 'Przeszkoda', alarm: 'Alarm', cool: 'Ugaś' };
const labels = { pilot: 'PILOT', dispatch: 'DYSPOZYTOR', planner: 'KARTOGRAF', guardian: 'STRAŻNIK' };
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
let world = createCell({ seed });
let stopped = false;
let tool = 'ignite';
let speed = 1;
let acc = 0;
let previous = performance.now();
let lastShown = -1;
let activeTab = 'timeline';
$('seed').value = String(seed);
const canvas = $('arena'), ctx = canvas.getContext('2d');

function begin() {
  const next = Number($('seed').value);
  if (!Number.isInteger(next) || next < 0 || next > 4294967295) {
    $('seed').value = String(world.seed); return;
  }
  world = createCell({ seed: next, mode: $('mode').value,
    modules: { dispatch: $('dispatch-on').checked, planner: $('planner-on').checked, guardian: $('guardian-on').checked } });
  lastShown = -1;
  acc = 0;
  $('compare-status').textContent = 'Nie uruchomiono kontrprzebiegu w tej sesji.';
  $('compare-output').replaceChildren();
  render();
}
$('reset').addEventListener('click', begin);
$('mode').addEventListener('change', () => { world.mode = $('mode').value; render(); });
for (const module of ['dispatch', 'planner', 'guardian']) {
  $(module + '-on').addEventListener('change', () => {
    world.modules[module] = $(module + '-on').checked;
    world.logs.push({ t: world.t, type: 'system', text: module + (world.modules[module] ? ' włączony' : ' odłączony'), detail: 'Konfiguracja zmieniona podczas działania' });
    render();
  });
}
$('pause').addEventListener('click', () => { stopped = !stopped; $('pause').textContent = stopped ? '▶ Wznów' : 'Ⅱ Pauza'; });
$('step').addEventListener('click', () => { stopped = true; $('pause').textContent = '▶ Wznów'; advanceCell(world, 1); render(); });
$('speed').addEventListener('change', () => { speed = Number($('speed').value); });
$('jam').addEventListener('click', () => { interveneCell(world, { kind: 'jam' }); render(); });
for (const button of document.querySelectorAll('[data-tool]')) button.addEventListener('click', () => {
  tool = button.dataset.tool;
  for (const b of document.querySelectorAll('[data-tool]')) b.classList.toggle('selected', b === button);
  $('tool-status').textContent = 'Kliknij mapę: ' + toolNames[tool];
});
for (const button of document.querySelectorAll('[data-tab]')) button.addEventListener('click', () => {
  activeTab = button.dataset.tab;
  for (const b of document.querySelectorAll('[data-tab]')) b.classList.toggle('selected', b === button);
  render();
});
$('compare').addEventListener('click', () => {
  const button = $('compare'); button.disabled = true;
  $('compare-status').textContent = 'Odtwarzanie tych samych interwencji bez koalicji…';
  requestAnimationFrame(() => {
    try {
      const result = compareWithoutModules(world);
      const delta = result.live.resolved - result.control.resolved;
      const metrics = [
        ['Opanowane alarmy', result.live.resolved, result.control.resolved],
        ['Utracone alarmy', result.live.expired, result.control.expired],
        ['Wejścia w zagrożenie', result.live.hits, result.control.hits],
        ['Przebyta droga', result.live.steps, result.control.steps],
        ['Postój bez ruchu', result.live.idle, result.control.idle],
      ];
      const table = document.createElement('table');
      table.innerHTML = '<thead><tr><th>Wymiar</th><th>Obecny przebieg</th><th>Bez koalicji</th></tr></thead>';
      const tbody = document.createElement('tbody');
      for (const [name, a, b] of metrics) {
        const tr = document.createElement('tr');
        for (const value of [name, a, b]) { const td = document.createElement('td'); td.textContent = String(value); tr.append(td); }
        tbody.append(tr);
      }
      table.append(tbody);
      $('compare-output').replaceChildren(table);
      $('compare-status').textContent = `Tick ${world.t} · ${result.eventCount} interwencji w identycznych chwilach · Δ opanowanych: ${delta >= 0 ? '+' : ''}${delta}. To ograniczone porównanie, nie dowód przewagi AI.`;
      document.documentElement.dataset.r1CompareReady = 'true';
    } catch (e) { $('compare-status').textContent = 'Porównanie nie powiodło się: ' + e.message; }
    button.disabled = false;
  });
});
canvas.addEventListener('click', event => {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / WIDTH, rect.height / HEIGHT);
  const ox = (rect.width - WIDTH * scale) / 2, oy = (rect.height - HEIGHT * scale) / 2;
  const x = Math.floor((event.clientX - rect.left - ox) / scale);
  const y = Math.floor((event.clientY - rect.top - oy) / scale);
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  interveneCell(world, { kind: tool, x, y });
  render();
});

function text(id, value) { $(id).textContent = String(value); }
function drawing() {
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(320, bounds.width);
  const height = width * HEIGHT / WIDTH;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const scale = Math.min(width / WIDTH, height / HEIGHT);
  const ox = (width - WIDTH * scale) / 2, oy = (height - HEIGHT * scale) / 2;
  const px = (x) => ox + x * scale, py = y => oy + y * scale;
  ctx.fillStyle = '#0a1423'; ctx.fillRect(0, 0, width, height);
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const k = `${x},${y}`;
    ctx.fillStyle = (x + y) % 2 === 0 ? '#142438' : '#17283b';
    ctx.fillRect(px(x) + 1, py(y) + 1, scale - 2, scale - 2);
    if (world.walls.has(k)) {
      ctx.fillStyle = '#3f5063'; ctx.fillRect(px(x) + 3, py(y) + 3, scale - 6, scale - 6);
      ctx.strokeStyle = '#61778d'; ctx.lineWidth = 1; ctx.strokeRect(px(x) + 3, py(y) + 3, scale - 6, scale - 6);
    }
  }
  for (const heat of world.hazards) {
    const cx = px(heat.x + .5), cy = py(heat.y + .5);
    const radius = (heat.radius + .7) * scale;
    const g = ctx.createRadialGradient(cx, cy, scale * .12, cx, cy, radius);
    g.addColorStop(0, '#ff694e99'); g.addColorStop(.45, '#e5533c7c'); g.addColorStop(1, '#e5533c00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, 2 * Math.PI); ctx.fill();
  }
  // Planned output is a proposal, drawn differently from executed trace.
  if (world.cognition.planner.route?.path?.length > 1 && world.modules.planner) {
    ctx.strokeStyle = '#6cc9fc'; ctx.lineWidth = Math.max(2, scale * .065); ctx.setLineDash([scale * .22, scale * .14]);
    ctx.beginPath();
    world.cognition.planner.route.path.forEach((p, i) => {
      if (i === 0) ctx.moveTo(px(p.x + .5), py(p.y + .5)); else ctx.lineTo(px(p.x + .5), py(p.y + .5));
    }); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.strokeStyle = '#91f2d55e'; ctx.lineWidth = Math.max(2, scale * .055);
  ctx.beginPath(); world.actor.trace.forEach((p, i) => {
    if (i === 0) ctx.moveTo(px(p.x + .5), py(p.y + .5)); else ctx.lineTo(px(p.x + .5), py(p.y + .5));
  }); ctx.stroke();
  // Global distress beacons — lawful broadcasts, NOT actor's hazard knowledge.
  for (const alarm of world.incidents) {
    const x = px(alarm.x + .5), y = py(alarm.y + .5);
    const remaining = alarm.deadline - world.t;
    const urgent = remaining < 25;
    ctx.fillStyle = urgent ? '#faae7b' : '#f0ce86';
    ctx.strokeStyle = '#121f2c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, scale * .31, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#152332'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.max(11, scale * .33)}px system-ui`; ctx.fillText('!', x, y);
    ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#f3e2cb'; ctx.font = `bold ${Math.max(10, scale * .22)}px system-ui`;
    ctx.fillText(`#${alarm.id} ${remaining}`, x, y - scale * .39);
    if (alarm.id === world.actor.targetId) {
      ctx.strokeStyle = '#f5d086'; ctx.lineWidth = 2;
      ctx.strokeRect(px(alarm.x) + 1, py(alarm.y) + 1, scale - 2, scale - 2);
    }
  }
  ctx.fillStyle = '#1e5362'; ctx.strokeStyle = '#79d6df'; ctx.lineWidth = 2;
  ctx.fillRect(px(BASE.x) + 4, py(BASE.y) + 4, scale - 8, scale - 8);
  ctx.strokeRect(px(BASE.x) + 4, py(BASE.y) + 4, scale - 8, scale - 8);
  const a = world.actor, x = px(a.x + .5), y = py(a.y + .5);
  ctx.fillStyle = '#7becba'; ctx.shadowBlur = 14; ctx.shadowColor = '#7becba';
  ctx.beginPath(); ctx.arc(x, y, scale * .29, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#113526'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.max(10, scale * .25)}px system-ui`; ctx.fillText('◆', x, y);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f1f6fa'; ctx.font = `bold ${Math.max(11, scale * .22)}px system-ui`;
  ctx.fillText(`HP ${a.hp}`, x, y - scale * .48);
  // Debug-visible sensing circle: privately known area, not a World-wide vision.
  ctx.strokeStyle = '#91f2d51b'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y, 3 * scale, 0, Math.PI * 2); ctx.stroke();
  ctx.textAlign = 'left'; ctx.fillStyle = '#95abc0'; ctx.font = `bold ${Math.max(9, scale * .18)}px ui-monospace,monospace`;
  ctx.fillText('WORLD / OBSERVER VIEW', px(.4), py(.6));
  ctx.textAlign = 'right'; ctx.fillText(`T=${world.t}`, px(18.7), py(.6));
}
function logPanel() {
  const container = $('trace'); container.replaceChildren();
  if (activeTab === 'timeline') {
    const selected = [...world.logs].reverse().filter(x => x.type !== 'move').slice(0, 11);
    for (const event of selected) {
      const row = document.createElement('div'); row.className = 'trace-row ' + event.type;
      const time = document.createElement('span'); time.className = 'trace-time'; time.textContent = String(event.t).padStart(3, '0');
      const content = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = event.text;
      const detail = document.createElement('small'); detail.textContent = event.detail;
      content.append(title, detail); row.append(time, content); container.append(row);
    }
  } else {
    const c = world.cognition;
    const blocks = [
      ['Pilot / natychmiast', c.pilot.last ? `Alarm #${c.pilot.last.target ?? 'brak'}; decyzje ${c.pilot.calls}` : 'Czeka na odczyt'],
      ['Dyspozytor / co 11 ticków', c.dispatch.last ? `Alarm #${c.dispatch.last.target ?? 'brak'} · ${c.dispatch.last.reason}` : 'Czeka na cykl'],
      ['Kartograf / opóźniony', `Wysłano ${c.planner.calls}; w drodze ${c.planner.pending.length}; odebrane ${c.planner.accepted}; odrzucone ${c.planner.rejected}`],
      ['Strażnik / przy ruchu', `Interwencje ${c.guardian.veto}; obserwacje ${c.guardian.calls}`],
      ['Broker / rozbieżności', `Wykryte ${c.broker.disagreement}; wybrano priorytet dyspozytora ${c.broker.deliberation} razy`],
    ];
    for (const [name, detail] of blocks) {
      const row = document.createElement('div'); row.className = 'trace-row';
      const c = document.createElement('div'); const title = document.createElement('strong'); title.textContent = name;
      const d = document.createElement('small'); d.textContent = detail; c.append(title, d); row.append(c); container.append(row);
    }
  }
}
function render() {
  const s = summaryCell(world);
  text('resolved', s.resolved); text('expired', s.expired); text('hits', s.hits); text('interventions', world.interventions.length);
  text('tick', world.t); text('health', world.actor.hp + '%');
  text('pilot-calls', world.cognition.pilot.calls); text('dispatch-calls', world.cognition.dispatch.calls); text('planner-calls', world.cognition.planner.calls);
  text('planner-accepted', world.cognition.planner.accepted); text('planner-rejected', world.cognition.planner.rejected);
  text('guardian-veto', world.cognition.guardian.veto); text('conflicts', world.cognition.broker.disagreement);
  text('signals', world.incidents.length + ' alarmów w terenie');
  text('pending', world.cognition.planner.pending.length + ' plan(ów) w drodze');
  text('jam-status', world.jamUntil > world.t ? `Łączność zakłócona przez ${world.jamUntil - world.t} ticków` : 'Łączność aktywna');
  document.documentElement.dataset.r1Ready = 'true';
  document.documentElement.dataset.r1Tick = String(world.t);
  drawing(); logPanel(); lastShown = world.t;
}
function animation(now) {
  const delta = Math.min(220, Math.max(0, now - previous)); previous = now;
  if (!stopped) {
    acc += delta * speed;
    let n = Math.min(35, Math.floor(acc / 100));
    if (n > 0) { advanceCell(world, n); acc -= n * 100; }
  }
  if (lastShown !== world.t) render();
  requestAnimationFrame(animation);
}
if (params.get('smoke') === '1') {
  // Deliberate browser smoke test: deterministic intervention followed by live compare.
  interveneCell(world, { kind: 'ignite', x: 10, y: 6 });
  advanceCell(world, 150);
  $('compare').click();
}
render(); requestAnimationFrame(animation);