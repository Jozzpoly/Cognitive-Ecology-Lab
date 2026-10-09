import { WIDTH, HEIGHT, BASE, createCell, advanceCell, interveneCell, compareWithoutModules, summaryCell } from './r1-core.mjs';
import { GUIDES, buildGuide } from './r1-guides.mjs';
import { makeSession, replaySession } from './r1-replay.mjs';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const rawSeed = Number(params.get('seed') ?? 19);
const seed = Number.isInteger(rawSeed) && rawSeed >= 0 && rawSeed <= 4294967295 ? rawSeed : 19;
const toolNames = { inspect:'Sprawdź pole', ignite: 'Zapłon', wall: 'Przeszkoda', alarm: 'Alarm', cool: 'Ugaś' };
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
let activeGuide = null, viewMode = 'world', ghost = null, tileSelection = null;
let initialControls = {mode:'coalition', modules:{dispatch:true,planner:true,guardian:true}};
let chronicle=[];
$('seed').value = String(seed);
const canvas = $('arena'), ctx = canvas.getContext('2d');

function invalidateComparison() {
  if (!ghost) return;
  ghost = null;
  $('compare-status').textContent = 'Świat zmienił się po porównaniu — przelicz kontrprzebieg.';
  $('compare-output').replaceChildren();
  document.documentElement.dataset.r1CompareReady = 'false';
}
function begin() {
  const next = Number($('seed').value);
  if (!Number.isInteger(next) || next < 0 || next > 4294967295) {
    $('seed').value = String(world.seed); return;
  }
  activeGuide = null; ghost = null; tileSelection = null;
  for (const button of document.querySelectorAll('[data-guide]')) button.classList.remove('selected');
  $('guide-title').textContent = 'Tryb swobodny — wybierz scenariusz powyżej';
  $('guide-explain').textContent = 'Cel: patrz, który proces i dlaczego zmienił ruch.';
  $('guide-result').textContent = '';
  initialControls = {mode:$('mode').value,modules:{dispatch:$('dispatch-on').checked,planner:$('planner-on').checked,guardian:$('guardian-on').checked}};
  world = createCell({ seed: next, mode: initialControls.mode, modules: initialControls.modules });
  chronicle=[];
  lastShown = -1;
  acc = 0;
  $('compare-status').textContent = 'Nie uruchomiono kontrprzebiegu w tej sesji.';
  $('compare-output').replaceChildren();
  render();
}
$('reset').addEventListener('click', begin);
$('mode').addEventListener('change', () => { invalidateComparison(); world.mode = $('mode').value;
  chronicle.push({tick:world.t,type:'mode',mode:world.mode}); render(); });
for (const module of ['dispatch', 'planner', 'guardian']) {
  $(module + '-on').addEventListener('change', () => {
    invalidateComparison();
    world.modules[module] = $(module + '-on').checked;
    chronicle.push({tick:world.t,type:'module',module,enabled:world.modules[module]});
    world.logs.push({ t: world.t, type: 'system', text: module + (world.modules[module] ? ' włączony' : ' odłączony'), detail: 'Konfiguracja zmieniona podczas działania' });
    render();
  });
}
$('pause').addEventListener('click', () => { stopped = !stopped; $('pause').textContent = stopped ? '▶ Wznów' : 'Ⅱ Pauza'; });
$('step').addEventListener('click', () => { stopped = true; $('pause').textContent = '▶ Wznów'; invalidateComparison(); advanceCell(world, 3); render(); });
$('speed').addEventListener('change', () => { speed = Number($('speed').value); });
function recordLatestIntervention(previous) {
  if(world.interventions.length>previous){const a=world.interventions[world.interventions.length-1];
    chronicle.push({tick:a.tick,type:'world',kind:a.kind,x:a.x,y:a.y});}
}
$('jam').addEventListener('click', () => { invalidateComparison(); const before=world.interventions.length;
  interveneCell(world, { kind: 'jam' }); recordLatestIntervention(before); render(); });
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
  // Freeze the exact decision state before drawing a matched-time Pilot ghost.
  stopped = true; $('pause').textContent = '▶ Wznów';
  const button = $('compare'); button.disabled = true;
  $('compare-status').textContent = 'Odtwarzanie tych samych interwencji bez koalicji…';
  requestAnimationFrame(() => {
    try {
      const result = compareWithoutModules(world);
      ghost = result.ghost;
      document.documentElement.dataset.r1GhostReady='true';
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
      if (activeGuide) {
        const harm = result.control.hits-result.live.hits;
        const throughput = delta>0?'koalicja opanowała więcej alarmów':delta<0?'sam Pilot opanował więcej alarmów':'oba przebiegi opanowały tyle samo alarmów';
        const safety = harm>0?'Strażnik i koalicja ograniczyli kontakty z ogniem o '+harm:
          harm<0?'koalicja doznała więcej kontaktów z zagrożeniami':'obie wersje odnotowały tyle samo kontaktów z ogniem';
        $('guide-result').textContent = 'Wynik tego przebiegu: '+throughput+' ('+result.live.resolved+' vs '+result.control.resolved+'). '+safety+
          '. Obejrzyj teraz pomarańczowy ślad samego Pilota na mapie; nie jest to dowód ogólnej wyższości.';
      }
      document.documentElement.dataset.r1CompareReady = 'true';
      render();
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
  if (tool === 'inspect') { tileSelection = {x,y}; render(); return; }
  invalidateComparison(); const before=world.interventions.length;
  interveneCell(world, { kind: tool, x, y }); recordLatestIntervention(before);
  render();
});



const sessionStatus = msg => $('session-status').textContent=msg;
async function captureSession(){
  const pack=makeSession(world,initialControls,chronicle);
  try{
    const r=await fetch('./build.json',{cache:'no-store'});
    if(r.ok){const meta=await r.json();if(/^[a-f0-9]{40}$/.test(meta.sha))pack.sourceSha=meta.sha;}
  }catch{/* local developer server has no manifest */}
  return pack;
}
$('export-session').addEventListener('click',async ()=>{
  try{
    const pack=await captureSession();
    if(pack.chronicle.length>200||pack.until>10000) throw new Error('Przekroczono limit zapisu. Zacznij nową serię.');
    $('session-data').value=JSON.stringify(pack,null,2);
    sessionStatus('Zapis gotowy. Zawiera historię działań i testowalne liczniki, bez prywatnych sekretów.');
  }catch(e){sessionStatus('Zapis niedostępny: '+e.message);}
});
$('download-session').addEventListener('click',async ()=>{
  try{
    const pack=await captureSession();
    if(pack.chronicle.length>200||pack.until>10000)throw new Error('Przekroczono limit 200 działań / 10000 ticków');
    const blob=new Blob([JSON.stringify(pack,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');
    a.href=url;a.download='cognitive-ecology-r1-'+pack.seed+'-t'+pack.until+'.json';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    sessionStatus('Pobrano opis eksperymentu, nie snapshot fikcyjnej pamięci mózgów.');
  }catch(e){sessionStatus('Eksport nieudany: '+e.message);}
});
$('import-session').addEventListener('click',()=>{
  try{
    const raw=$('session-data').value;
    if(raw.length>60000)throw new Error('Zbyt duży plik JSON');
    const pack=JSON.parse(raw);const result=replaySession(pack);
    world=result.world;initialControls={mode:pack.initial.mode,modules:{...pack.initial.modules}};
    chronicle=pack.chronicle.map(x=>({...x}));activeGuide=null;ghost=null;tileSelection=null;acc=0;lastShown=-1;
    stopped=true;$('pause').textContent='▶ Wznów';
    $('seed').value=String(world.seed);$('mode').value=world.mode;
    for(const module of ['dispatch','planner','guardian'])$(module+'-on').checked=world.modules[module];
    for(const button of document.querySelectorAll('[data-guide]'))button.classList.remove('selected');
    $('guide-title').textContent='Odtworzony eksperyment · t='+world.t;
    $('guide-explain').textContent='Możesz porównywać, oglądać wiedzę i kontynuować odtwarzany świat.';
    $('guide-result').textContent=result.verified===true?'Wynik odtworzony zgodnie z licznikami.':result.verified===false?'Wynik RÓŻNI się od zapisu — sprawdź wersję kodu.':'Brak zapisanych liczników do porównania.';
    $('compare-status').textContent='Po imporcie uruchom kontrprzebieg na aktualnym kodzie.';
    $('compare-output').replaceChildren();
    document.documentElement.dataset.r1CompareReady='false';
    document.documentElement.dataset.r1GhostReady='false';
    sessionStatus(result.verified===true?'Odtwarzanie PASS (liczniki zgodne).':'Odtworzone, ale weryfikacja liczników niepotwierdzona lub FAIL.');
    render();
  }catch(e){sessionStatus('Odtwarzanie odrzucone: '+e.message);}
});

const scenarioById = id => GUIDES.find(g => g.id === id);
function loadGuide(id) {
  const spec = scenarioById(id);
  if (!spec) return;
  const proposedSeed = Number($('seed').value);
  const nextSeed = Number.isInteger(proposedSeed) && proposedSeed >= 0 && proposedSeed <= 4294967295 ? proposedSeed : 19;
  world = buildGuide(id, { seed: nextSeed });
  activeGuide = id; ghost = null; tileSelection = null; acc = 0; lastShown = -1;
  initialControls={mode:'coalition',modules:{dispatch:true,planner:true,guardian:true}};
  chronicle=world.interventions.map(a=>({tick:a.tick,type:'world',kind:a.kind,x:a.x,y:a.y}));
  stopped = true;
  $('pause').textContent = '▶ Wznów';
  $('mode').value = 'coalition';
  for (const module of ['dispatch','planner','guardian']) $(module + '-on').checked = true;
  for (const button of document.querySelectorAll('[data-guide]')) button.classList.toggle('selected',button.dataset.guide === id);
  $('guide-title').textContent = spec.title + ' · start t=' + world.t;
  $('guide-explain').textContent = spec.hint;
  $('guide-result').textContent = 'Pauza. Wybierz „Do ważnej decyzji” lub „Wznów”.';
  document.documentElement.dataset.r1GuideReady = id;
  $('compare-status').textContent = 'Kontrprzebieg nie został jeszcze wykonany.';
  $('compare-output').replaceChildren();
  $('tile-info').textContent = 'Kliknij „Sprawdź pole”, aby porównać wiedzę aktora i stan świata.';
  render();
}
for (const button of document.querySelectorAll('[data-guide]')) {
  button.addEventListener('click', () => loadGuide(button.dataset.guide));
}
$('guide-free').addEventListener('click', () => {
  $('mode').value = 'coalition'; begin(); stopped = true; $('pause').textContent = '▶ Wznów'; render();
});
$('next-event').addEventListener('click', () => {
  stopped = true; $('pause').textContent = '▶ Wznów'; invalidateComparison();
  const focus = activeGuide ? scenarioById(activeGuide).focus : null;
  const signals = new Set(['veto','refused','damage','blocked','success']);
  let found = null;
  for (let tick = 0; tick < 180; tick++) {
    const old = world.logs.length ? world.logs[world.logs.length - 1] : null;
    advanceCell(world, 1);
    const latest = world.logs[world.logs.length - 1];
    if (latest && latest !== old && signals.has(latest.type) && (!focus || latest.type === focus || latest.type === 'success')) {
      found = latest; break;
    }
  }
  $('guide-result').textContent = found ? ('Zatrzymano t=' + world.t + ': ' + found.text) :
    ('Po 180 tickach brak szukanego zdarzenia. Spróbuj ponownie albo zmień warunki.');
  render();
});
$('jump-outcome').addEventListener('click', () => {
  if (!activeGuide) { $('guide-result').textContent = 'Najpierw wybierz gotowy scenariusz.'; return; }
  stopped = true; $('pause').textContent = '▶ Wznów'; invalidateComparison();
  const at = scenarioById(activeGuide).endTick;
  if (world.t < at) advanceCell(world, at - world.t);
  $('guide-result').textContent = 'Osiągnięto tick ' + world.t + '. Uruchamiam porównanie ze sprawnym Pilotem…';
  render(); $('compare').click();
});
$('view-world').addEventListener('click', () => { viewMode='world'; render(); });
$('view-private').addEventListener('click', () => { viewMode='private'; document.documentElement.dataset.r1PrivateReady='true'; render(); });
$('ghost-on').addEventListener('change', render);
function tileInspector() {
  if (!tileSelection) return;
  const {x,y} = tileSelection, k = x+','+y;
  const isSeen = world.known.clear.has(k) || world.known.walls.has(k);
  const seen = world.known.heat.get(k);
  const wall = world.walls.has(k);
  const hazard = world.hazards.some(h => Math.abs(h.x-x)+Math.abs(h.y-y) <= h.radius && h.power >= 2);
  const age = seen ? world.t - seen.seen : null;
  $('tile-info').textContent = 'Pole '+k+' · Prawda: '+(wall?'ściana':'przejście')+(hazard?', zagrożenie':'')+
    ' · Wiedza wykonawcy: '+(!isSeen ? 'NIEZNANE' : (world.known.walls.has(k) ? 'widziana ściana' : 'widziane przejście'))+
    (age!==null ? (' · ostatni odczyt '+age+' ticków temu'+(seen.power>=2?', widziano ogień':'')) : '');
}
function decisionInspector() {
  const b = world.cognition.broker.last;
  if (!b) { $('decision-why').textContent = 'Czekamy na pierwszą decyzję Pilota (co 3 ticki).'; return; }
  const moduleOn = n => world.mode==='coalition'&&world.modules[n];
  const words = [
    'Tick '+b.t+' → alarm #'+b.targetId+'.',
    'Pilot: '+(b.pilotTargetId===null?'bez celu':('#'+b.pilotTargetId))+
      (b.pilotStep ? (' · proponowany krok '+b.pilotStep.x+','+b.pilotStep.y) : ' · bez kroku')+'.',
    'Dyspozytor: '+(moduleOn('dispatch') ? ('propozycja #'+(b.dispatchTargetId ?? '—')) : 'wyłączony')+'.',
    'Kartograf: '+(moduleOn('planner') ? ('trasa #'+(b.plannerTargetId ?? 'brak aktualnej')) : 'wyłączony')+'.',
    'Strażnik: '+(moduleOn('guardian') ? (b.guardianVeto?'VETO, wymusił zmianę':'nie zawetował') : 'wyłączony')+'.',
    'Ostatecznie: '+b.winner+(b.step ? (' → '+b.step.x+','+b.step.y) : ' · postój')+'.',
  ];
  $('decision-why').textContent = words.join(' ');
}

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
    if (world.walls.has(k) && (viewMode === 'world' || world.known.walls.has(k))) {
      ctx.fillStyle = '#3f5063'; ctx.fillRect(px(x) + 3, py(y) + 3, scale - 6, scale - 6);
      ctx.strokeStyle = '#61778d'; ctx.lineWidth = 1; ctx.strokeRect(px(x) + 3, py(y) + 3, scale - 6, scale - 6);
    }
    if (viewMode === 'private' && !world.known.clear.has(k) && !world.known.walls.has(k)) {
      ctx.fillStyle = '#060b14ec';ctx.fillRect(px(x)+1,py(y)+1,scale-2,scale-2);
    }
  }
  const shownHeat = viewMode === 'world' ? world.hazards :
    [...world.known.heat].filter(([,v])=>v.power >= 2 && world.t-v.seen <= 35)
      .map(([cell,v])=>{const [x,y]=cell.split(',').map(Number);return {x,y,radius:0,power:v.power};});
  for (const heat of shownHeat) {
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
  if (ghost && $('ghost-on').checked) {
    ctx.strokeStyle='#f7bc85b0';ctx.lineWidth=Math.max(2,scale*.09);ctx.setLineDash([scale*.12,scale*.15]);
    ctx.beginPath();ghost.trail.forEach((p,i)=>{if(i===0)ctx.moveTo(px(p.x+.5),py(p.y+.5));else ctx.lineTo(px(p.x+.5),py(p.y+.5));});ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='#f7bc85';ctx.lineWidth=3;ctx.strokeRect(px(ghost.actor.x)+4,py(ghost.actor.y)+4,scale-8,scale-8);
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
  ctx.fillText(viewMode === 'world' ? 'WORLD / OBSERVER VIEW' : 'PRIVATE / OBSERVED + STALE', px(.4), py(.6));
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
  $('view-world').classList.toggle('selected',viewMode==='world');
  $('view-private').classList.toggle('selected',viewMode==='private');
  $('view-description').textContent = viewMode==='world' ? 'Widzisz pełną prawdę symulacji — procesy NIE mają takiej wiedzy.' : 'Nieznane pola są zasłonięte. Ogień to tylko świeży zapis zmysłowy, nie wszechwiedza.';
  tileInspector(); decisionInspector();
  document.documentElement.dataset.r1Ready = 'true';
  document.documentElement.dataset.r1Tick = String(world.t);
  drawing(); logPanel(); lastShown = world.t;
}
function animation(now) {
  const delta = Math.min(220, Math.max(0, now - previous)); previous = now;
  if (!stopped) {
    acc += delta * speed;
    let n = Math.min(35, Math.floor(acc / 100));
    if (n > 0) { invalidateComparison(); advanceCell(world, n); acc -= n * 100; }
  }
  if (lastShown !== world.t) render();
  requestAnimationFrame(animation);
}
if (params.get('tour') === 'shield') {
  loadGuide('shield');
  $('view-private').click();
  $('jump-outcome').click();
}
if (params.get('replaySmoke') === '1') {
  // Browser-integrated exercise: export the actual action chronology and replay it
  // through the same validation path used by Owner's pasted session.
  (async () => {
    const pack = await captureSession();
    $('session-data').value = JSON.stringify(pack);
    $('import-session').click();
    // A fresh counterfactual must be computed after importing the historic state.
    $('compare').click();
    document.documentElement.dataset.r1ReplayReady =
      $('session-status').textContent.includes('PASS') ? 'true' : 'false';
  })().catch(()=>{document.documentElement.dataset.r1ReplayReady='false';});
}
if (params.get('smoke') === '1' && !params.has('tour')) {
  // Deliberate browser smoke test: deterministic intervention followed by live compare.
  interveneCell(world, { kind: 'ignite', x: 10, y: 6 });
  advanceCell(world, 150);
  $('compare').click();
}
render(); requestAnimationFrame(animation);