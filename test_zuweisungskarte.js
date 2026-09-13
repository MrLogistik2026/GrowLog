/**
 * (v1.5.139) Der Hinweis „Dieser Plan ist deinem Grow noch nicht zugewiesen" bietet keinen Zyklus
 * mehr an, dessen Düngung vorbei ist.
 *
 * Gefunden bei der Vorführung im Browser: Patrick lädt den Rainbow-Plan, während Run 01 trocknet.
 * v1.5.134 lässt Run 01 dabei richtig an „BioBizz Official" — aber der Düngeplan-Bildschirm zeigt
 * sofort eine orange Karte mit großem grünem Knopf: „Rainbow Düngeplan (v1.0)" für „Sensi Amnesia
 * XXL Auto" übernehmen. Ein Tipp darauf hätte dessen Vergangenheit doch umgeschrieben. Die Karte
 * zählte jeden aktiven Zyklus als „laufend", mit ihrer eigenen Kopie der Regel.
 *
 * Was bleiben muss: Mitten im Grow warnt die Karte weiter, und ein noch nicht gestarteter Zyklus
 * wird weiter angeboten.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const BIO_ID = 'fp_1788458746438';

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
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

// Rendert den Düngeplan-Bildschirm und liest die Zuweisungs-Karte samt der Zyklen, die ihr Knopf anbietet.
const KARTE = `(function(){
  renderDuenger();
  const t = document.getElementById('scr-duenger').textContent.replace(/\\s+/g, ' ');
  const knoepfe = Array.from(document.querySelectorAll('#scr-duenger button[onclick^="assignActivePlanToCycle("]'))
    .map(b => (b.getAttribute('onclick').match(/assignActivePlanToCycle\\('([^']*)'/) || [])[1]);
  return JSON.stringify({ karte: /noch nicht zugewiesen/.test(t), knoepfe, aufgeschlagen: (getActivePlan() || {}).name });
})()`;

async function mitRainbow() {
  const r = await load();
  r.E(`setDebugDate('2026-09-13')`);
  r.E(`loadPreset('rainbow_auto')`);
  await warte(30);
  r.E(`_modalResolve && _modalResolve(true)`);
  await warte(60);
  return r;
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  console.log('\nA - Rainbow geladen, während Run 01 trocknet (13.09.2026, Tag 121)');
  {
    const { E, errors } = await mitRainbow();
    pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
    const lage = JSON.parse(E(`JSON.stringify({ phase: phase(todayISO(), S.cycles[0]).ph, plan: S.cycles[0].fertPlanId })`));
    pruef('Ausgangslage: Trocknen, Run 01 bleibt an BioBizz (v1.5.134)', lage.phase === 'dry' && lage.plan === BIO_ID, JSON.stringify(lage));
    const k = JSON.parse(E(KARTE));
    pruef('Rainbow ist aufgeschlagen', k.aufgeschlagen === 'Rainbow Düngeplan (v1.0)', k.aufgeschlagen);
    pruef('Keine Karte „noch nicht zugewiesen"', !k.karte);
    pruef('Kein Knopf, der Rainbow dem trocknenden Zyklus gibt', k.knoepfe.length === 0, k.knoepfe.join(','));
  }

  console.log('\nB - Mitten in der Blüte warnt die Karte weiter');
  {
    const { E } = await mitRainbow();
    E(`setDebugDate('2026-08-01')`);   // Tag 78
    const k = JSON.parse(E(KARTE));
    pruef('Ausgangslage: Blüte', E(`phase(todayISO(), S.cycles[0]).ph`) === 'bloom');
    pruef('Karte erscheint', k.karte);
    pruef('Knopf bietet Run 01 an', k.knoepfe.length === 1 && k.knoepfe[0] === E('S.cycles[0].id'), k.knoepfe.join(','));
  }

  console.log('\nC - Neben dem trocknenden Run 01 wird nur der neue, noch nicht gestartete Run 02 angeboten');
  {
    const { E } = await mitRainbow();
    E(`(function(){
      const c = addCyc({ name: 'Rainbow Run 02', seedType: 'auto', medium: 'erde' });
      c.id = 'run02'; c.startDate = '2026-10-01'; c.fertPlanId = '${BIO_ID}'; saveS();
    })()`);
    const k = JSON.parse(E(KARTE));
    pruef('Karte erscheint', k.karte);
    pruef('Nur Run 02 ist im Angebot', k.knoepfe.length === 1 && k.knoepfe[0] === 'run02', k.knoepfe.join(','));
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
