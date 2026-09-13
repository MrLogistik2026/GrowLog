/**
 * (v1.5.138) Die Kopfkarte „Dünger & Wochenplan" in den Einstellungen nennt Name und Wochenzahl
 * des aufgeschlagenen Plans, statt fest „12 Wochen" und notfalls einen internen Schlüssel.
 *
 * Gefunden beim Einbau des Rainbow-Plans: Der Plan hat 15 Wochen, die Karte sagte 12. Und für
 * Patricks behaltene Kopie „Sensi Amnesia XXL Auto (V3.4.7)" — ihre Vorlage gibt es seit
 * v1.5.133 nicht mehr — fiel der Name auf den Schlüssel `sensi_amnesia_auto` zurück.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const V347_ID = 'fp_1782241910561';
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

// Liest die Kopfkarte: die erste Karte in den Einstellungen, die den Düngeplan öffnet.
const KARTE = (planId) => `(function(){
  S._activePlanId = ${JSON.stringify(planId)}; syncActivePlanToGlobals(); renderSet();
  const k = Array.from(document.querySelectorAll('#scr-set [onclick="openDuenger()"]')).find(x => /Dünger & Wochenplan/.test(x.textContent));
  const pl = getActivePlan();
  return JSON.stringify({ text: k ? k.textContent.replace(/\\s+/g, ' ').trim() : null, name: pl && pl.name,
    wochen: Object.keys((pl && pl.schedule) || {}).length });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`setDebugDate('2026-09-13')`);
  E(`loadPreset('rainbow_auto')`);
  await warte(30);
  E(`_modalResolve && _modalResolve(true)`);
  await warte(60);
  const rbId = E(`(S.fertPlans.find(p => p.presetKey === 'rainbow_auto') || {}).id`);
  pruef('Rainbow-Plan angelegt', !!rbId);

  console.log('\nA - Rainbow aufgeschlagen: 15 Wochen');
  const rb = JSON.parse(E(KARTE(rbId)));
  pruef('Karte gefunden', !!rb.text, rb.text);
  pruef('Plan hat 15 Wochen', rb.wochen === 15, rb.wochen);
  pruef('Karte nennt „15 Wochen"', /· 15 Wochen/.test(rb.text || ''), rb.text);
  pruef('… und nicht „12 Wochen"', !/12 Wochen/.test(rb.text || ''), rb.text);
  pruef('… mit dem Plan-Namen', (rb.text || '').includes('Rainbow Düngeplan (v1.0)'), rb.text);

  console.log('\nB - BioBizz Official aufgeschlagen: bleibt bei seinen Wochen');
  const bio = JSON.parse(E(KARTE(BIO_ID)));
  pruef('Karte nennt die Wochenzahl des Plans (' + bio.wochen + ')', new RegExp('· ' + bio.wochen + ' Wochen').test(bio.text || ''), bio.text);

  console.log('\nC - Behaltene V3.4.7-Kopie ohne Vorlage: Name statt Schlüssel');
  const v = JSON.parse(E(KARTE(V347_ID)));
  pruef('Kopie ist da und aufgeschlagen', v.name === 'Sensi Amnesia XXL Auto (V3.4.7)', v.name);
  pruef('Karte nennt den Plan-Namen', (v.text || '').includes('Sensi Amnesia XXL Auto (V3.4.7)'), v.text);
  pruef('… nicht den internen Schlüssel', !/sensi_amnesia_auto/.test(v.text || ''), v.text);
  pruef('… und seine Wochenzahl (' + v.wochen + ')', new RegExp('· ' + v.wochen + ' Wochen').test(v.text || ''), v.text);

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
