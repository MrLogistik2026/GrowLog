/**
 * (v1.5.282) Hinweis „Ernte ca." aus _ernteTermin.
 *
 * Der Fehler (Bewertung vom 17.09.2026, Hebel 1 #15): „Ernte ca. 29. Sept. (in 12d)" neben „Ernte in min. 19 d · ab 06. Okt." —
 * der Hinweis rechnete sein Datum selbst und las die Trichom-Messung nie.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function fakeCtx() {
  const noop = () => {};
  return { canvas: null, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '',
    textBaseline: '', globalAlpha: 1, lineCap: '', lineJoin: '', shadowBlur: 0, shadowColor: '',
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop, arcTo: noop,
    rect: noop, fill: noop, stroke: noop, fillRect: noop, clearRect: noop, strokeRect: noop,
    save: noop, restore: noop, translate: noop, rotate: noop, scale: noop, setTransform: noop,
    fillText: noop, strokeText: noop, drawImage: noop, clip: noop, setLineDash: noop,
    quadraticCurveTo: noop, bezierCurveTo: noop, measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }), getImageData: () => ({ data: [] }) };
}

async function load() {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true;
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.print = () => {};
    },
  });
  const window = dom.window;
  if (window.document.readyState !== 'complete') {
    await new Promise((r) => { window.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  }
  await new Promise((r) => setTimeout(r, 80));
  return { window, errors, E: (s) => window.eval(s) };
}

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

// Heute = Plan-Erntetag − vorErnte; trich: [{ t: tageZurueck, k, m, b }]. Gibt die Hinweise und _ernteTermin zurück.
const LAGE = (opt) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = false;
  const c = addCyc({ name: 'Hinweis', seedType: 'auto', medium: 'erde', growType: '${opt.growType || 'indoor'}' });
  c.potSize = 11; c.plantCount = 1; c.targetAmber = ${opt.ziel || 5};
  const heute = todayISO();
  let gef = false;
  for (let d = 40; d <= 200; d++) {
    c.startDate = isoPlus(heute, -(d - 1));
    const h = harvestCountdown(c, heute);
    if (h && isoDiff(h.harvestISO, heute) === ${opt.vorErnte}) { gef = true; break; }
  }
  if (!gef) return JSON.stringify({ fehlt: true });
  ${JSON.stringify(opt.trich || [])}.forEach(t => {
    const iso = isoPlus(heute, -t.t);
    S.entries[iso] = { cycleData: { [c.id]: { trichomes: { clear: t.k, milky: t.m, amber: t.b } } } };
  });
  saveS();
  const et = _ernteTermin(c, heute);
  const fmt = (i) => fmtDE(i, { day: '2-digit', month: 'short' });
  return JSON.stringify({ basis: et && et.basis, plan: fmt(harvestCountdown(c, heute).harvestISO), mess: et && et.iso ? fmt(et.iso) : null,
    hinweise: getAlerts(c).map(x => x.text) });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  const lauf = (opt) => JSON.parse(E(LAGE(opt)));
  // Reifereihe: Bernstein langsam (1 → 2 % in 8 Tagen), Klar 40 → 30 — das Ziel 5 % liegt nach dem Plan.
  const reihe = (off) => [{ t: off + 8, k: 40, m: 59, b: 1 }, { t: off + 4, k: 35, m: 63.5, b: 1.5 }, { t: off, k: 30, m: 68, b: 2 }];
  const ernteHinweis = (r) => r.hinweise.find(h => /^Ernte (ca\.|nach Plan)/.test(h)) || '';

  console.log('\nA - Plan-Ernte in 12 Tagen, frische Reihe: Bernstein-Ziel später');
  const a = lauf({ vorErnte: 12, trich: reihe(0) });
  pruef('Lage gefunden', !a.fehlt, JSON.stringify(a).slice(0, 80));
  if (!a.fehlt) {
    pruef('_ernteTermin „messung"', a.basis === 'messung', a.basis);
    const h = ernteHinweis(a);
    pruef('Hinweis nennt Plan-Datum und den Tag fürs Bernstein-Ziel', h.startsWith('Ernte nach Plan ' + a.plan) && h.includes('dein Bernstein-Ziel von 5 %') && h.includes('frühestens am ' + a.mess), h);
    pruef('Kein „Ernte ca." neben dem späteren Tag', !a.hinweise.some(x => /^Ernte ca\./.test(x)), a.hinweise.join(' | '));
  }

  console.log('\nB - Wie A, letzte Messung 5 Tage alt');
  const b = lauf({ vorErnte: 12, trich: reihe(5) });
  if (!b.fehlt) pruef('Alte Messung: Plan-Datum wie bisher', b.basis === 'plan' && ernteHinweis(b) === 'Ernte ca. ' + b.plan + ' (in 12d)', ernteHinweis(b));

  console.log('\nC - Ohne Messung');
  const cc = lauf({ vorErnte: 12 });   // drinnen liegen die letzten 11 Tage in Spülen und IceFlush — dort gibt es den Hinweis nicht
  if (!cc.fehlt) pruef('Ohne Messung: „Ernte ca. <Plan> (in 12d)"', ernteHinweis(cc) === 'Ernte ca. ' + cc.plan + ' (in 12d)', ernteHinweis(cc));

  console.log('\nD - Draußen, ohne Messung');
  const d = lauf({ vorErnte: 10, growType: 'outdoor' });
  if (!d.fehlt) pruef('Draußen: Datum aus derselben Quelle wie die Kachel', ernteHinweis(d) === 'Ernte ca. ' + d.plan + ' (in 10d)', ernteHinweis(d));

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
