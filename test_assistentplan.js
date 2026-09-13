/**
 * (v1.5.137) Ein Plan aus dem Assistenten bekommt dasselbe Gerüst wie über „Vorlage laden".
 *
 * Der Fehler: `_wizFinish` legte einen Plan aus einer Vorlage ohne `weekPhases`,
 * `phaseSkeleton`, `weekDayBounds`, `ecTargets` und `feedWaterRhythm` an. `loadPreset` kopiert
 * diese Felder seit v1.5.50/51/94 — der Assistent hatte seine eigene, ältere Kopie des
 * Anlege-Codes und bekam keine davon mit.
 *
 * Nachgestellt beim Einbau des Rainbow-Plans, mit „BioBizz Light" (der Empfehlung des
 * Assistenten für Einsteiger) und dem Cup-Sieger-Plan: direkt nach dem Assistenten fehlten alle
 * fünf Felder. Das Rückgrat kam beim nächsten App-Start über die Migration nach, der
 * Dünger/Wasser-Rhythmus nie — ein Plan mit Wasser-Tagen düngte damit bei jedem Guss.
 *
 * Geprüft wird jede Vorlage, nicht nur die angebotenen: Der Anlege-Weg ist für alle derselbe.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const FELDER = ['weekPhases', 'phaseSkeleton', 'weekDayBounds', 'ecTargets', 'feedWaterRhythm'];

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
      w.localStorage.setItem('growsmart_v4', BACKUP);
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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  const r = JSON.parse(E(`(function(){
    const FELDER = ${JSON.stringify(FELDER)};
    const norm = (v) => JSON.stringify(v == null ? null : v);
    const out = {};
    Object.keys(FERT_PRESETS).forEach(key => {
      const pr = FERT_PRESETS[key];
      S.cycles = []; S.entries = {};
      S.fertPlans = S.fertPlans.filter(p => p.presetKey !== key);
      saveS();
      _wizAnswers = { name: 'Test ' + key, seedType: 'auto', growType: key === 'biobizz_outdoor' ? 'outdoor' : 'indoor',
        medium: pr.medium || 'erde', fertPresetKey: key, potSize: 11, plants: 2 };
      try { _wizFinish(); } catch (e) { out[key] = { fehler: e.message }; return; }
      const pl = S.fertPlans.find(p => p.presetKey === key);
      const zyklus = S.cycles.find(c => c.name === 'Test ' + key);
      if (!pl) { out[key] = { fehler: 'kein Plan angelegt' }; return; }
      const fehlt = FELDER.filter(f => norm(pl[f]) !== norm(pr[f]));
      out[key] = { fehlt, zyklusHaengtDran: !!zyklus && zyklus.fertPlanId === pl.id,
        wochen: Object.keys(pl.schedule || {}).length, vorlageWochen: Object.keys(pr.schedule || {}).length };
    });
    // Nach dem Neuladen: bleibt der Rhythmus erhalten?
    saveS(); loadS();
    const nachLaden = {};
    Object.keys(FERT_PRESETS).forEach(key => {
      const pl = S.fertPlans.find(p => p.presetKey === key);
      nachLaden[key] = pl ? norm(pl.feedWaterRhythm) === norm(FERT_PRESETS[key].feedWaterRhythm) : null;
    });
    return JSON.stringify({ out, nachLaden, mitRhythmus: Object.keys(FERT_PRESETS).filter(k => FERT_PRESETS[k].feedWaterRhythm) });
  })()`));

  console.log('\nA - Jede Vorlage: der Assistent kopiert das ganze Gerüst');
  for (const [key, o] of Object.entries(r.out)) {
    if (o.fehler) { pruef(key + ': angelegt', false, o.fehler); continue; }
    pruef(key + ': Rückgrat, Skelett, Tagesgrenzen, EC-Ziele, Rhythmus wie in der Vorlage', o.fehlt.length === 0, 'fehlt: ' + o.fehlt.join(', '));
    pruef(key + ': Zyklus hängt am neuen Plan, alle Wochen da', o.zyklusHaengtDran && o.wochen === o.vorlageWochen, JSON.stringify(o));
  }

  console.log('\nB - Der Dünger/Wasser-Rhythmus übersteht den Neustart');
  console.log('  (Vorlagen mit Rhythmus: ' + r.mitRhythmus.join(', ') + ')');
  pruef('Es gibt überhaupt Vorlagen mit Rhythmus', r.mitRhythmus.length > 0);
  for (const key of r.mitRhythmus) pruef(key + ': Rhythmus nach dem Neuladen noch da', r.nachLaden[key] === true, String(r.nachLaden[key]));

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
