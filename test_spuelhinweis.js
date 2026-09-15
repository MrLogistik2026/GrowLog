/**
 * (v1.5.183) „Spülung in N Tagen" zählt bis zum ersten Spültag.
 *
 * Beim Durchsehen der anzuchtDays-Stellen gesehen: getAlerts rechnete rem = Blütetage − Blütetag. Am Blütetag 63
 * von 70 stand „Spülung in 7 Tagen" — gespült wird ab Blütetag 71, also in 8 Tagen. Am letzten Blütetag (Spülen
 * morgen) stand gar nichts, am vorletzten „Spülung in 1 Tagen".
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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler (leerer Speicher)', errors.length === 0, errors[0]);

  for (const bloom of [70, 49]) {
    console.log(`\nAutomatic, Anzucht 21, Blüte ${bloom}`);
    const r = JSON.parse(E(`(function(){
      const start = '2026-03-01';
      const c = { id: 'sh${bloom}', name: 'Auto', active: true, startDate: start, seedType: 'auto', growType: 'indoor', medium: 'erde',
        anzuchtDays: 21, bloomDays: ${bloom}, flushDays: 8, iceDays: 3, harvestDays: 1, dryDays: 7, cureDays: 21,
        intAnzucht: 3, intBloom: 3, intFlush: 4, intIce: 2, intErnte: 1, intDry: 1, offsetHistory: [], skippedDays: [], plants: [], plantCount: 1 };
      S.cycles = [c]; S.entries = {};
      const iso = (t) => isoPlus(start, t - 1);
      let F = null;
      for (let t = 1; t < 200; t++) { const p = phase(iso(t), c); if (p && p.ph === 'flush') { F = t; break; } }
      const hinweise = [];
      for (let t = F - 12; t <= F; t++) { setDebugDate(iso(t)); getAlerts(c).filter(a => /Spülung/.test(a.text)).forEach(a => hinweise.push([t, a.text])); }
      setDebugDate(null);
      return JSON.stringify({ F, hinweise });
    })()`));
    const tage = r.hinweise.map(h => h[0]);
    const soll = Array.from({ length: 7 }, (_, i) => r.F - 7 + i);
    pruef(`Hinweis an genau den 7 Tagen vor dem ersten Spültag (Tag ${r.F})`, JSON.stringify(tage) === JSON.stringify(soll), `an Tag ${tage.join(', ')}`);
    const falsch = r.hinweise.filter(([t, txt]) => {
      const m = txt.match(/Spülung in (\d+) Tagen/);
      if (m) return t + Number(m[1]) !== r.F;
      return !(/Spülung morgen/.test(txt) && t + 1 === r.F);
    });
    pruef('Jede Angabe zählt bis zum ersten Spültag', r.hinweise.length > 0 && falsch.length === 0, falsch.map(([t, txt]) => `Tag ${t}: ${txt}`).join(' | '));
    pruef('Kein „in 1 Tagen"', !r.hinweise.some(([, txt]) => /\b1 Tagen/.test(txt)), r.hinweise.map(h => h[1]).join(' | '));
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
