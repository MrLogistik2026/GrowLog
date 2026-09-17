/**
 * (v1.5.287) Ein gemessen ausgelassener Guss ist nicht verpasst: gussFaellig für Nachholen, „überfällig", Zählung und Serie.
 *
 * Der Fehler (Bewertung vom 17.09.2026, Hebel 1 #10): Hebe-Test „Voll" an einem Gießtag, nicht gegossen — am Folgetag
 * „1 Aktion verpasst", danach „Gießen überfällig!", und der Nachhol-Assistent bot „~0 ml, pH 6.4" zum Eintragen an.
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

async function ladeMitSicherung() {
  const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
  const vc = new VirtualConsole();
  const fehler = [];
  vc.on('jsdomError', (e) => { const m = String((e && e.message) || e); if (!/Not implemented/i.test(m)) fehler.push(m); });
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.print = () => {};
      w.localStorage.setItem('growsmart_v4', BACKUP);
    },
  });
  const window = dom.window;
  if (window.document.readyState !== 'complete') {
    await new Promise((r) => { window.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  }
  await new Promise((r) => setTimeout(r, 80));
  return { E: (s) => window.eval(s), fehler };
}

// Gießtag G in der Blüte, Güsse an G−2h und G−h (h = Gießabstand). An G: messung (restPct) und optional weitere Felder.
// Danach wird das Datum auf G+1 … G+4 gestellt und gefragt: Nachholen, „überfällig", fehlende Gießtage, Serie.
const LAGE = (opt) => `(function(){
  const G = '2026-07-15';
  setDebugDate(G);
  S.cycles = []; S.entries = {}; S.beginnerMode = true;
  const c = addCyc({ name: 'Kalender', seedType: 'auto', medium: 'erde', growType: 'indoor' });
  c.potSize = 11; c.plantCount = 1; c.weightMode = 'lift';
  let gefunden = false;
  for (let d = 45; d <= 95; d++) {
    c.startDate = isoPlus(G, -(d - 1));
    const p0 = phase(G, c);
    if (p0 && p0.ph === 'bloom' && getAction(G, c) === 'giess') { gefunden = true; break; }
  }
  if (!gefunden) return JSON.stringify({ fehlt: 'kein Gießtag' });
  const h = _gussIv(c, G, 'bloom');
  S.entries[isoPlus(G, -2 * h)] = { cycleData: { [c.id]: { water: '2000' } } };
  S.entries[isoPlus(G, -h)] = { cycleData: { [c.id]: { water: '2000' } } };
  const anG = ${JSON.stringify(opt.anG || {})};
  if (Object.keys(anG).length) S.entries[G] = { cycleData: { [c.id]: Object.assign({}, anG) } };
  const extra = ${JSON.stringify(opt.extra || {})};
  Object.keys(extra).forEach(k => { S.entries[isoPlus(G, Number(k))] = { cycleData: { [c.id]: Object.assign({}, extra[k]) } }; });
  saveS();
  if (getAction(G, c) !== 'giess') return JSON.stringify({ fehlt: 'G nach dem Eintragen: ' + getAction(G, c) });
  const tage = [1, 2, 3, 4].map(i => {
    setDebugDate(isoPlus(G, i));
    const kand = getCatchupCandidates(c).map(x => x.iso + ' ' + x.action);
    const alerts = getAlerts(c).map(x => x.text);
    return { i, kand, gKand: kand.some(k => k.startsWith(G)), ueber: alerts.filter(t => /überfällig/.test(t)), gUeber: alerts.some(t => /Geplant war der 15\\.07\\./.test(t)),
      fehlen: countMissingPastWateringDays(c), serie: calcStreak(c), nachsterGiesstag: getAction(isoPlus(G, h), c) };
  });
  setDebugDate(isoPlus(G, 1));
  const fehlenOhneG = (function(){ const alt = S.entries[G]; S.entries[G] = { cycleData: { [c.id]: { water: '2000' } } }; const n = countMissingPastWateringDays(c); if (alt) S.entries[G] = alt; else delete S.entries[G]; return n; })();
  setDebugDate(null);
  return JSON.stringify({ h, tage, fehlenOhneG });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  const lage = (opt) => { try { return JSON.parse(E(LAGE(opt))); } catch (e) { return { fehlt: 'Ausnahme: ' + e.message }; } };

  for (const [name, rest] of [['„Voll" (95 %)', 95], ['„Voll" unter 95 (90 %)', 90]]) {
    console.log(`\nA - Gießtag mit Hebe-Test ${name}, nicht gegossen`);
    const x = lage({ anG: { restPct: rest } });
    pruef('Lage angelegt', !x.fehlt, x.fehlt);
    if (x.fehlt) continue;
    pruef('Nachholen: der Tag steht an G+1 bis G+4 nicht in der Liste', x.tage.every(t => !t.gKand), x.tage.map(t => t.i + ':' + t.kand.join('/')).join(' | '));
    pruef('Kein „Gießen überfällig! Geplant war der 15.07."', x.tage.every(t => !t.gUeber), x.tage.map(t => t.ueber.join('/')).join(' | '));
    pruef('Fehlende Gießtage zählen ihn nicht mit', x.tage[0].fehlen === x.fehlenOhneG, x.tage[0].fehlen + ' gegen ' + x.fehlenOhneG);
    pruef('Die Serie bricht an ihm nicht (zwei Güsse davor)', x.tage[0].serie >= 2, x.tage.map(t => t.serie).join(','));
    pruef('Der nächste Kalender-Gießtag bleibt einen Gießabstand nach G', x.tage[0].nachsterGiesstag === 'giess', x.tage[0].nachsterGiesstag);
  }

  console.log('\nB - Gegenproben: ohne Messung, mit „Mittel" (70 %) und „Bald" (50 %) ist der Guss verpasst');
  for (const [name, anG] of [['ohne Messung', {}], ['„Mittel"', { restPct: 70 }], ['„Bald"', { restPct: 50 }]]) {
    const x = lage({ anG });
    if (x.fehlt) { pruef('Lage ' + name + ' angelegt', false, x.fehlt); continue; }
    pruef(name + ': an G+1 im Nachholen', x.tage[0].gKand, x.tage[0].kand.join('/'));
    pruef(name + ': an G+2 „Gießen überfällig! Geplant war der 15.07."', x.tage[1].gUeber, x.tage[1].ueber.join('/'));
    pruef(name + ': zählt als fehlender Gießtag', x.tage[0].fehlen === x.fehlenOhneG + 1, x.tage[0].fehlen + ' gegen ' + x.fehlenOhneG);
    pruef(name + ': die Serie bricht', x.tage[0].serie === 0, x.tage[0].serie);
  }

  console.log('\nC - Ein Eintrag mit 0 ml ist kein Guss');
  const cc = lage({ extra: { 1: { water: '0' } } });
  if (!cc.fehlt) pruef('0 ml an G+1 blendet „überfällig" für G nicht aus', cc.tage[1].gUeber && cc.tage[3].gUeber, cc.tage.map(t => t.i + ':' + t.ueber.join('/')).join(' | '));
  else pruef('Lage C angelegt', false, cc.fehlt);

  console.log('\nD - Patricks Sicherung: IceFlush ohne Eintrag wird nicht nachgefragt');
  const P = await ladeMitSicherung();
  const d = JSON.parse(P.E(`(function(){
    const c = S.cycles.find(x => x.active);
    const tage = ['2026-09-07', '2026-09-08'].map(t => { setDebugDate(t); return getCatchupCandidates(c).map(x => x.iso + ' ' + x.action); });
    const eis = []; for (let i = 0; i < 20; i++) { const k = isoPlus('2026-08-25', i); if (getAction(k, c) === 'ice') eis.push(k); }
    setDebugDate(null);
    return JSON.stringify({ tage, eis });
  })()`));
  pruef('Patricks Zyklus hat einen IceFlush-Tag', d.eis.length > 0, d.eis.join(','));
  pruef('Am 07. und 08.09. kein IceFlush im Nachholen', d.tage.every(t => !t.some(k => / ice$/.test(k))), d.tage.map(t => t.join('/')).join(' | '));

  pruef('Keine JS-Fehler im Lauf', errors.length === 0 && P.fehler.length === 0, errors[0] || P.fehler[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
