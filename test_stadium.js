/**
 * (v1.5.271) Stadium der Zyklus-Karte von der Spülphase bis zum Trocknen.
 *
 * Der Fehler: stageForCycle führte die Phase ice mit Trocknen und Curing unter Stadium 9 — am IceFlush-Tag stand auf der
 * Startseite „Trocknung · Tag 114", bevor überhaupt geschnitten wird.
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

// Zyklus so datieren, dass heute der Plan-Erntetag + versatz ist (negativ = davor); gibt Phase, Stadium und Startseite zurück.
const LAGE = (versatz) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = true;
  const c = addCyc({ name: 'Stadium', seedType: 'auto', medium: 'erde' });
  c.potSize = 11; c.plantCount = 1;
  let gefunden = false;
  for (let d = 80; d <= 160; d++) {
    c.startDate = isoPlus(todayISO(), -(d - 1));
    if (getAction(todayISO(), c) === 'ernte') { gefunden = true; break; }
  }
  if (!gefunden) return JSON.stringify({ fehlt: true });
  c.startDate = isoPlus(c.startDate, -(${versatz}));
  saveS();
  const heute = todayISO(), p = phase(heute, c), n = stageForCycle(c, heute);
  renderDash();
  return JSON.stringify({ ph: p.ph, iceDay: p.iceDay || null, a: getAction(heute, c), n, name: STAGE_NAMES[n],
    dash: document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ') });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  const lauf = (v) => JSON.parse(E(LAGE(v)));

  console.log('\nA - Stadium von der Spülphase bis zum Trocknen');
  const faelle = [];
  for (let v = -6; v <= 2; v++) { const x = lauf(v); if (!x.fehlt) faelle.push(Object.assign({ v }, x)); }
  pruef('Lagen gefunden', faelle.length === 9, faelle.length);
  const eis = faelle.filter(f => f.ph === 'ice');
  pruef('Es gibt IceFlush-Tage im Plan', eis.length >= 1, faelle.map(f => f.v + ':' + f.ph).join(' '));
  const tag1 = eis.find(f => f.iceDay === 1);
  if (tag1) pruef('IceFlush-Tag: Stadium „Spülphase", nicht „Trocknung"', tag1.n === 7 && tag1.name === 'Spülphase' && !/Trocknung/.test(tag1.dash), tag1.name);
  const dunkel = eis.filter(f => f.iceDay > 1);
  pruef('Dunkelphase: Stadium „Ernte"', dunkel.length > 0 && dunkel.every(f => f.n === 8 && !/Trocknung/.test(f.dash)), dunkel.map(f => f.iceDay + ':' + f.name).join(' '));
  const spuel = faelle.filter(f => f.ph === 'flush');
  pruef('Spülen: Stadium „Spülphase" wie bisher', spuel.every(f => f.n === 7), spuel.map(f => f.name).join(' '));
  const ernte = faelle.find(f => f.ph === 'harvest');
  pruef('Erntetag: Stadium „Ernte" wie bisher', ernte && ernte.n === 8, ernte && ernte.name);
  const trocken = faelle.filter(f => f.ph === 'dry');
  pruef('Trocknen (ohne Beleg fürs Stehen): „Trocknung" wie bisher', trocken.length > 0 && trocken.every(f => f.n === 9), trocken.map(f => f.name).join(' '));

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
