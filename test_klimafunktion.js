/**
 * (v1.5.207) Eine Klimafunktion für die Gießmenge.
 *
 * Der Befund (Gießmengen-Prüfung, Runde 3, Schritt 10): Neben klimaTranspiration (Oren et al. 1999, v1.5.205) rechnete
 * _vpdFactorForDay weiter in Stufen 0,85 / 0,95 / 1,0 / 1,15 / 1,25 gegen ein seit v1.5.187 eingefrorenes altes VPD-Band — im
 * Anker-Weg, im Verbrauchsmodell, in der Dryback-Vorhersage, auf dem alten Weg (Spülen, Outdoor) und für „Klima-justiert".
 * Gleiches Klima ergab je nach Blütestufe verschiedene Faktoren, und die Spülmenge schwankte um −15 bis +25 % mit einem Band,
 * das es nicht mehr gibt.
 *
 * Jetzt: _klimaTagFaktor aus klimaTranspiration, nur als Verhältnis; auf dem alten Weg ohne eigenen Guss kein Klimafaktor.
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

  const r = JSON.parse(E(`(function(){ const c = S.cycles[0]; const aus = {};
    aus.alt = typeof _vpdFactorForDay !== 'undefined' || typeof _vpdFaktorBand !== 'undefined';
    const d = '2026-07-20'; const e = S.entries[d] || (S.entries[d] = { cycleData: {} });
    const tag = function (t, rh) { if (t === null) { delete e.temp; delete e.humidity; } else { e.temp = String(t); e.humidity = String(rh); }
      return (typeof _klimaTagFaktor === 'function') ? _klimaTagFaktor(d) : null; };
    aus.f26 = tag(26, 45); aus.soll26 = klimaTranspiration(calcVPD(26, 45)); aus.f2455 = tag(24, 55); aus.ohne = tag(null);
    // Spülgang (Tag 107): dieselbe Menge bei jedem Klima
    const sp = isoPlus(c.startDate, 106); const es = S.entries[sp] || (S.entries[sp] = { cycleData: {} });
    const menge = function (t, rh) { if (t === null) { delete es.temp; delete es.humidity; } else { es.temp = String(t); es.humidity = String(rh); }
      setDebugDate(sp); return waterSuggestion(c, phase(sp, c), sp); };
    aus.ph = phase(sp, c).ph; aus.spuel = [menge(30, 30), menge(20, 80), menge(null)];
    return JSON.stringify(aus); })()`));
  pruef('Die alten Klimafunktionen gibt es nicht mehr (_vpdFactorForDay, _vpdFaktorBand)', r.alt === false);
  pruef('Tagesfaktor aus klimaTranspiration: 26 °C / 45 % wie klimaTranspiration, Vorlagenpaar 24/55 und ohne Messung 1',
    r.f26 !== null && Math.abs(r.f26 - r.soll26) < 1e-9 && r.f2455 === 1 && r.ohne === 1, JSON.stringify(r));
  pruef('Spülgang: dieselbe Menge bei 30 °C/30 %, 20 °C/80 % und ohne Klima', r.ph === 'flush' && r.spuel[0] === r.spuel[1] && r.spuel[1] === r.spuel[2], JSON.stringify(r.spuel));

  const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
  pruef('Kein Aufruf der alten Stufen mehr im Code', !/_vpdFactorForDay\(|_vpdFaktorBand\(/.test(code));
  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
