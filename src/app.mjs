import { SITES, DEPOT, POLICIES, createExperiment, advance, intervene, summary } from "./core.mjs";

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const validPolicy = (name, fallback) => POLICIES.includes(name) ? name : fallback;
const names = { habit: "Lokalny nawyk", cooldown: "Prosty cooldown", recall: "Doradca wspomnień" };
let seed = Number(params.get("seed") ?? 17);
if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) seed = 17;
$("seed").value = seed;
$("policy-a").value = validPolicy(params.get("left"), "habit");
$("policy-b").value = validPolicy(params.get("right"), "recall");
let exp = createExperiment({ seed, left: $("policy-a").value, right: $("policy-b").value });
let paused = false, elapsed = 0, prev = performance.now(), lastUiTick = -1;
const setText = (id, text) => { $(id).textContent = String(text); };
function reset() {
  const raw = Number($("seed").value);
  if (!Number.isInteger(raw) || raw < 0 || raw > 0xffffffff) {
    $("seed").value = String(seed);
    setText("copy-status", "Ziarno musi być liczbą całkowitą 0–4294967295.");
    return;
  }
  seed = raw;
  exp = createExperiment({ seed, left: $("policy-a").value, right: $("policy-b").value });
  elapsed = 0;
  lastUiTick = -1;
  setText("copy-status", "");
  paint();
}
function syncPause() {
  $("toggle").textContent = paused ? "Wznów" : "Pauza";
}
$("reset").addEventListener("click", reset);
$("policy-a").addEventListener("change", reset);
$("policy-b").addEventListener("change", reset);
$("toggle").addEventListener("click", () => { paused = !paused; syncPause(); });
$("step").addEventListener("click", () => { paused = true; syncPause(); advance(exp, 1); paint(); });
for (const button of document.querySelectorAll("[data-site]")) {
  button.addEventListener("click", () => {
    intervene(exp, button.dataset.site, button.dataset.action);
    paint();
  });
}
$("copy").addEventListener("click", async () => {
  const url = new URL(location.href);
  url.search = new URLSearchParams({ seed: String(seed), left: exp.left.policy, right: exp.right.policy }).toString();
  try {
    await navigator.clipboard.writeText(url.href);
    setText("copy-status", "Skopiowano ustawienia. Interwencje na żywo nie są w tym URL zapisywane.");
  } catch {
    setText("copy-status", "Link z ustawieniami: " + url.href + " (interwencje nie są zapisane)");
  }
});
const canvases = { a: $("world-a"), b: $("world-b") };
function scene(canvas, world, tint) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(240, rect.width);
  const height = width * 0.75;
  const dpr = Math.min(2, devicePixelRatio || 1);
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const margin = Math.max(22, width * 0.07);
  const scale = Math.min((width - margin * 2) / 12, (height - margin * 2) / 9);
  const ox = (width - 12 * scale) / 2, oy = (height - 9 * scale) / 2;
  const px = x => ox + x * scale, py = y => oy + y * scale;
  ctx.fillStyle = "#0c1828";
  ctx.fillRect(ox, oy, 12 * scale, 9 * scale);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#203246";
  for (let i = 0; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(px(i), py(0)); ctx.lineTo(px(i), py(9)); ctx.stroke(); }
  for (let i = 0; i <= 9; i++) { ctx.beginPath(); ctx.moveTo(px(0), py(i)); ctx.lineTo(px(12), py(i)); ctx.stroke(); }

  const a = world.actor;
  ctx.strokeStyle = tint + "80";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  a.path.forEach((p, i) => { if (i === 0) ctx.moveTo(px(p.x), py(p.y)); else ctx.lineTo(px(p.x), py(p.y)); });
  ctx.stroke();
  const currentTarget = a.carrying ? DEPOT : SITES.find(s => s.id === a.target);
  if (currentTarget) {
    ctx.setLineDash([5, 5]); ctx.strokeStyle = "#ffffff55"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(px(a.x), py(a.y)); ctx.lineTo(px(currentTarget.x), py(currentTarget.y)); ctx.stroke(); ctx.setLineDash([]);
  }

  for (const site of SITES) {
    const stock = world.stations[site.id].stock;
    ctx.fillStyle = stock ? "#275c5c" : "#62413d";
    ctx.strokeStyle = stock ? "#67beb7" : "#d38b6c";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px(site.x), py(site.y), scale * .5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "bold " + Math.max(13, scale * .43) + "px ui-sans-serif, sans-serif";
    ctx.fillStyle = "#e8f4f8"; ctx.fillText(String(stock), px(site.x), py(site.y));
    ctx.fillStyle = "#a9bcd0"; ctx.font = Math.max(10, scale * .23) + "px ui-sans-serif, sans-serif";
    ctx.fillText(site.name, px(site.x), py(site.y) - scale * .83);
  }
  ctx.fillStyle = "#263f5c"; ctx.strokeStyle = "#638cac"; ctx.lineWidth = 2;
  ctx.fillRect(px(DEPOT.x) - scale * .43, py(DEPOT.y) - scale * .43, scale * .86, scale * .86);
  ctx.strokeRect(px(DEPOT.x) - scale * .43, py(DEPOT.y) - scale * .43, scale * .86, scale * .86);
  ctx.fillStyle = "#dcebf9"; ctx.font = Math.max(10, scale * .21) + "px ui-sans-serif, sans-serif";
  ctx.textAlign = "center"; ctx.fillText("BAZA", px(DEPOT.x), py(DEPOT.y) + scale * .87);
  ctx.fillStyle = tint; ctx.strokeStyle = "#e8f5fc"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(px(a.x), py(a.y), Math.max(7, scale * .23), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (a.carrying) { ctx.fillStyle = "#f8d28c"; ctx.fillRect(px(a.x) - 3, py(a.y) - 11, 6, 6); }
  ctx.textAlign = "left"; ctx.font = "10px ui-monospace,monospace"; ctx.fillStyle = "#8da6c0";
  ctx.fillText("WORLD TRUTH / DEBUGGER", ox + 7, oy + 15);
}
function appendEvents(id, events) {
  const el = $(id), items = events.slice(-4).reverse();
  el.replaceChildren();
  for (const event of items) {
    const li = document.createElement("li");
    const time = document.createElement("span");
    time.textContent = "#" + event.tick;
    const msg = document.createElement("div");
    msg.textContent = event.message;
    li.append(time, msg);
    el.append(li);
  }
}
function panel(letter, world, color) {
  setText("title-" + letter, names[world.policy]);
  scene(canvases[letter], world, color);
  const m = summary(world);
  setText("deliveries-" + letter, m.deliveries);
  setText("empty-" + letter, m.emptyTrips);
  setText("distance-" + letter, m.distance.toFixed(0));
  setText("advice-" + letter, m.consultations);
  setText("reason-" + letter, world.actor.lastReason);
  appendEvents("events-" + letter, world.events);
}
function paint() {
  panel("a", exp.left, "#7fdce1");
  panel("b", exp.right, "#efbc87");
  setText("current-tick", "TICK " + String(exp.left.tick).padStart(4, "0") + " · seed " + seed);
  const d = summary(exp.left), e = summary(exp.right);
  const deliveryGap = e.deliveries - d.deliveries;
  const text = exp.firstDivergenceTick === null
    ? "Na razie ruch obu aktorów pozostaje identyczny."
    : "Pierwsza rozbieżność stanów aktorów: tick " + exp.firstDivergenceTick + ". " +
      "B − A: " + (deliveryGap >= 0 ? "+" : "") + deliveryGap + " dostaw, " +
      (e.emptyTrips - d.emptyTrips >= 0 ? "+" : "") + (e.emptyTrips - d.emptyTrips) +
      " pustych wypraw. To opis obserwacji, nie ocena jakości modelu.";
  setText("difference", text);
  lastUiTick = exp.left.tick;
}
function frame(now) {
  const dt = Math.min(250, now - prev);
  prev = now;
  if (!paused) {
    elapsed += dt * Number($("speed").value);
    let count = 0;
    while (elapsed >= 85 && count < 80) { advance(exp, 1); elapsed -= 85; count++; }
  }
  if (exp.left.tick !== lastUiTick) paint();
  requestAnimationFrame(frame);
}
syncPause(); paint(); requestAnimationFrame(frame);
