/**
 * (v1.5.154) Nachhol-Zähler, Nachhol-Assistent und „Erledigt" kennen den Sättigungsguss an Tag 1.
 *
 * Der Fehler (Befund der Prüf-Agenten, gegengeprüft): countMissingPastWateringDays, backfillPast
 * und markTodayDone führten eine eigene Gießtag-Liste ohne 'saettigung'. isGiessTag kennt ihn seit
 * v1.5.119. Folge: Der Zähler meldete 4 statt 5 fehlende Güsse, der Nachhol-Assistent ließ Tag 1
 * leer und bot ihn danach nie wieder an, und „Erledigt" setzte an Tag 1 nur den Haken — der größte
 * Wassereintrag in den Sämlingstopf fehlte im Verlauf.
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
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

const START = '2026-06-01';
const NEU = `(function(){
  S.cycles = []; S.entries = {};
  const c = addCyc({ name: 'Sättigung', seedType: 'auto', medium: 'erde' });
  c.startDate = '${START}'; c.startMethod = 'saturated';
  setDebugDate('2026-06-20'); saveS();
  return c.id;
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  console.log('\nA - Der Nachhol-Zähler');
  E(NEU);
  const a = JSON.parse(E(`(function(){
    const c = S.cycles[0]; const tage = [];
    for (let i = 0; i < 19; i++) { const iso = isoPlus(c.startDate, i); if (isGiessTag(iso, c)) tage.push({ tag: i + 1, a: getAction(iso, c) }); }
    return JSON.stringify({ tage, zaehler: countMissingPastWateringDays(c) });
  })()`));
  console.log('    Gießtage bis zum 20.06.: ' + a.tage.map(t => 'Tag ' + t.tag + ' (' + t.a + ')').join(', ') + ' · Zähler: ' + a.zaehler);
  pruef('Prüflage: Tag 1 ist der Sättigungsguss', a.tage[0] && a.tage[0].tag === 1 && a.tage[0].a === 'saettigung', JSON.stringify(a.tage[0]));
  pruef('Der Zähler meldet alle Gießtage, auch Tag 1', a.zaehler === a.tage.length, a.zaehler + ' statt ' + a.tage.length);

  console.log('\nB - Der Nachhol-Assistent');
  E(`backfillPast(S.cycles[0].id)`); await warte(40); E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(200);
  const b = JSON.parse(E(`(function(){
    const c = S.cycles[0]; const iso = '${START}'; const cd = S.entries[iso] && S.entries[iso].cycleData && S.entries[iso].cycleData[c.id];
    const dosen = cd && cd.doses ? Object.values(cd.doses).filter(v => v > 0).length : null;
    return JSON.stringify({ water: cd ? cd.water : null, soll: String(waterSuggestion(c, phase(iso, c), iso)), vorgeschlagen: !!(cd && cd._suggested && cd._suggested.water), dosen, danach: countMissingPastWateringDays(c) });
  })()`));
  console.log('    Tag 1 nach dem Nachholen: ' + JSON.stringify(b));
  pruef('Tag 1 bekommt die Sättigungsmenge', b.water === b.soll && Number(b.soll) > 0, b.water + ' / ' + b.soll);
  pruef('… als Vorschlag gekennzeichnet, ohne Dünger', b.vorgeschlagen && !b.dosen, JSON.stringify(b));
  pruef('Danach fehlt kein Gießtag mehr', b.danach === 0, b.danach);

  console.log('\nC - „Erledigt" am Tag des Sättigungsgusses');
  E(NEU);
  const c = JSON.parse(E(`(function(){
    const c = S.cycles[0]; const iso = '${START}';
    markTodayDone(c.id, iso);
    const cd = S.entries[iso].cycleData[c.id];
    // Gegenprobe: ein Tag ohne Guss
    let ohne = null;
    for (let i = 1; i < 8; i++) { const d = isoPlus(c.startDate, i); if (!isGiessTag(d, c)) { markTodayDone(c.id, d); ohne = { d, a: getAction(d, c), water: S.entries[d].cycleData[c.id].water || null }; break; } }
    return JSON.stringify({ water: cd.water || null, soll: String(waterSuggestion(c, phase(iso, c), iso)), vorgeschlagen: !!(cd._suggested && cd._suggested.water), haken: !!cd._doneTodo, ohne });
  })()`));
  console.log('    ' + JSON.stringify(c));
  pruef('„Erledigt" trägt die Sättigungsmenge ein', c.haken && c.water === c.soll, c.water + ' / ' + c.soll);
  pruef('… als Vorschlag gekennzeichnet', c.vorgeschlagen);
  pruef('Gegenprobe: an einem Tag ohne Guss bleibt das Wasser leer', c.ohne && c.ohne.water === null, JSON.stringify(c.ohne));

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
