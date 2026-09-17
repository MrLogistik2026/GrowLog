/**
 * (v1.5.279) Kachel „Erntedatum" = harvestCountdown, wie „Ernte in" daneben.
 *
 * Der Fehler: Die Kachel rechnete ihr Datum selbst mit c.iceDays — draußen gibt es keine IceFlush-Phase, das Datum lag drei
 * Tage hinter „Ernte in 10 ±5d".
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

// Zyklus mit Plan-Ernte in 10 Tagen; liest die Kacheln „Ernte in" und „Erntedatum" (Profi-Startseite).
const LAGE = (growType) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = false;
  const c = addCyc({ name: 'Kachel', seedType: 'auto', medium: 'erde', growType: '${growType}' });
  c.potSize = 11; c.plantCount = 1;
  let gefunden = false;
  for (let d = 40; d <= 140; d++) {
    c.startDate = isoPlus(todayISO(), -(d - 1));
    const hc = harvestCountdown(c);
    if (hc && hc.daysRemaining === 10) { gefunden = true; break; }
  }
  if (!gefunden) return JSON.stringify({ fehlt: true });
  saveS();
  renderDash();
  const box = (lbl) => { const b = [...document.querySelectorAll('#scr-dash .stat-box')].find(x => { const l = x.querySelector('.stat-lbl'); return l && l.textContent.trim().startsWith(lbl); });
    return b ? b.querySelector('.stat-val').textContent.trim() : null; };
  const hc = harvestCountdown(c);
  return JSON.stringify({ kachel: box('Erntedatum'), ernteIn: box('Ernte in'), soll: fmtDE(hc.harvestISO, { day: '2-digit', month: 'short' }), iceLen: iceLenFor(c) });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  console.log('\nA - Draußen: kein IceFlush, Erntedatum wie „Ernte in"');
  const a = JSON.parse(E(LAGE('outdoor')));
  pruef('Outdoor-Lage gefunden', !a.fehlt, JSON.stringify(a));
  if (!a.fehlt) {
    pruef('Draußen gibt es keine IceFlush-Tage', a.iceLen === 0, a.iceLen);
    pruef('Kachel „Erntedatum" = harvestCountdown (' + a.soll + ')', a.kachel === a.soll, a.kachel + ' / ' + a.soll + ' / Ernte in ' + a.ernteIn);
  }

  console.log('\nB - Drinnen: Gegenprobe');
  const b = JSON.parse(E(LAGE('indoor')));
  if (!b.fehlt) pruef('Kachel „Erntedatum" = harvestCountdown (' + b.soll + ')', b.kachel === b.soll, b.kachel + ' / ' + b.soll);

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
