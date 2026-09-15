/**
 * (v1.5.173) Das „Erntereif"-Zeichen der Trichom-Karte folgt der eigenen Reife-Regel und dem Bernstein-Ziel.
 *
 * Die Karte zeigte „✅ Erntereif!" bei milchig ≥ 60 % und Bernstein ≥ 10 % — eine feste Zahl. Dieselbe Karte
 * rechnet aber seit v1.5.40 mit „milchig-dominant = Klar ≤ 10 %" (RIPE_CLEAR_DONE) und dem Bernstein-Ziel aus
 * den Einstellungen (Patrick: 5 %). Folgen: Bei 25 % klar, 62 % milchig und 13 % Bernstein stand „Erntereif"
 * — ein Viertel der Trichome unfertig, nach ANBAU.md 11 der teuerste Fehler. Bei 8 % klar und 6 % Bernstein
 * (Ziel 5 % erreicht) stand nur „Fast bereit".
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

const TAG = '2026-08-27';   // Tag 104, späte Blüte — die Trichom-Karte steht dort

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`setDebugDate('${TAG}')`);

  const karte = async (clear, milky, amber, ziel) => {
    E(`(function(){ const c = S.cycles[0]; c.targetAmber = ${ziel};
      if (!S.entries['${TAG}']) S.entries['${TAG}'] = { cycleData: {} };
      if (!S.entries['${TAG}'].cycleData) S.entries['${TAG}'].cycleData = {};
      if (!S.entries['${TAG}'].cycleData[c.id]) S.entries['${TAG}'].cycleData[c.id] = {};
      S.entries['${TAG}'].cycleData[c.id].trichomes = { clear: ${clear}, milky: ${milky}, amber: ${amber} };
      openEntry('${TAG}'); })()`);
    await warte(150);
    const t = E(`(function(){ const k = document.querySelector('[data-sect="trichome"]'); return k ? k.textContent.replace(/\\s+/g, ' ') : '(keine Karte)'; })()`);
    // Geprüft wird die ganze Karte; zur Anzeige nur das Zeichen selbst
    const zeichen = (t.match(/✅ (Erntereif|Milchig-dominant)[^◀▶]{0,110}|⏳ Fast bereit|Noch zu viel klar[^!]*!/) || ['(kein Zeichen)'])[0];
    return { t, zeichen };
  };

  console.log('\nA - Die Karte an Tag 104 mit gesetzten Werten');
  {
    const a = await karte(25, 62, 13, 5);
    pruef('25 % klar, 62 % milchig, 13 % Bernstein: nicht „Erntereif" — ein Viertel ist unfertig', !/✅ (Erntereif|Milchig-dominant)/.test(a.t) && /Fast bereit/.test(a.t), a.zeichen);
    const b = await karte(8, 86, 6, 5);
    pruef('8 % klar, 6 % Bernstein, Ziel 5 %: „Erntereif — … Bernstein-Ziel (5 %) ist erreicht"', /✅ Erntereif — kaum noch klare Trichome, dein Bernstein-Ziel \(5 %\) ist erreicht/.test(b.t), b.zeichen);
    const d = await karte(8, 88, 4, 5);
    pruef('8 % klar, 4 % Bernstein, Ziel 5 %: „Milchig-dominant — reif", Ziel noch nicht erreicht', /✅ Milchig-dominant — reif · Bernstein 4 % von deinem Ziel 5 %/.test(d.t) && !/Erntereif/.test(d.t), d.zeichen);
    const e = await karte(5, 85, 10, 15);
    pruef('5 % klar, 10 % Bernstein, Ziel 15 %: reif, aber nicht „Erntereif"', /✅ Milchig-dominant — reif/.test(e.t) && !/Erntereif/.test(e.t), e.zeichen);
  }

  console.log('\nB - Quelltext');
  {
    const src = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    pruef('Keine feste Schwelle „milchig ≥ 60 und Bernstein ≥ 10" mehr', !/trich\.milky >= 60 && trich\.amber >= 10/.test(src));
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
