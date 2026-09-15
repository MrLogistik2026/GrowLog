/**
 * (v1.5.201) Die Drain-Menge im Gieß-Guide aus DRAIN_ZIEL.
 *
 * Der Fehler (Befund der Gießmengen-Prüfung, Runde 3): Der Gieß-Guide im Eintrag rechnete die Drain-Menge als 10 % der
 * Gießmenge — beim Öffnen und live beim Tippen („2100 ml → 210 ml Drain"). Zwei Zeilen tiefer sagte dieselbe Gießanleitung
 * „15–20% Drain bei jedem Guss", und das Drain-Ziel der App ist DRAIN_ZIEL (15–20 %, ANBAU.md 5.1). Wer der Zahl folgte,
 * hörte bei der Hälfte des Ziels auf — und unter 10 % ist eine Drain-Messung gar keine.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');

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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`S.beginnerMode = false`);

  const r0 = JSON.parse(E(`(function(){ const c = S.cycles[0];
    for (let i = 40; i < 100; i++) { const d = isoPlus(c.startDate, i - 1); if (getAction(d, c) === 'giess') return JSON.stringify({ d: d, id: c.id, ziel: DRAIN_ZIEL }); }
    return JSON.stringify({}); })()`));
  pruef('Prüflage: Blüte-Gießtag ab Tag 40 gefunden', !!r0.d, JSON.stringify(r0));
  const { min, max } = r0.ziel || { min: 15, max: 20 };

  E(`setDebugDate('${r0.d}'); openEntry('${r0.d}')`);
  await warte(200);
  const lese = () => JSON.parse(E(`JSON.stringify({ w: (document.querySelector('.live-water[data-cycle="${r0.id}"]') || {}).textContent || null,
    dr: (document.querySelector('.live-drain[data-cycle="${r0.id}"]') || {}).textContent || null })`));
  const a = lese();
  const w = parseFloat(a.w);
  const soll = (ml) => `${Math.round(ml * min / 100)}–${Math.round(ml * max / 100)}`;
  pruef(`Beim Öffnen: Drain-Spanne ${min}–${max} % der angezeigten Menge statt 10 %`, isFinite(w) && a.dr === soll(w), JSON.stringify(a) + ' erwartet ' + (isFinite(w) ? soll(w) : '?'));

  const txt = E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
  pruef('Gießanleitung nennt das Drain-Ziel aus DRAIN_ZIEL', txt.includes(`${min}–${max} % Drain bei jedem Guss`), (txt.match(/🚿 Drain:.{0,60}/) || ['(fehlt)'])[0]);

  E(`(function(){ const el = document.getElementById('water-calc-${r0.id}'); el.value = '3000'; updateCalc('${r0.id}'); })()`);
  const b = lese();
  pruef(`Live beim Tippen: 3000 ml → ${soll(3000)} ml Drain`, b.w === '3000' && b.dr === soll(3000), JSON.stringify(b));

  const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
  const alt = ['guidePerPlant * 0.1', 'ml / plants * 0.1', '15–20% Drain bei jedem Guss. Drain-Wasser'].filter(s => code.includes(s));
  pruef('Keine feste 10-%-Drain-Rechnung mehr im Gieß-Guide', alt.length === 0, alt.join(' | '));

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
