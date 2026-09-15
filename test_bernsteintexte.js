/**
 * (v1.5.172) Kein Text knüpft die Ernte an eine feste Bernstein-Menge oder erklärt Bernstein zum Optimum.
 *
 * ANBAU.md 11: Klar = zu früh. Milchig = höchster THCA-Gehalt. Bernstein ist Abbau (THCA → CBNA), die Wirkung
 * wird ruhiger, die Potenz sinkt — wie viel davon, ist eine Zielentscheidung des Growers, keine Optimierung
 * der App. Zu früh ernten ist der teuerste Fehler. Befund der Prüf-Agentin zum Erntefenster (15.09.2026),
 * danach der ganze Quelltext durchsucht: 13 Stellen sagten etwas anderes, darunter
 * „erste bernsteinfarbene = jetzt ernten", „bei ~10–15 % Bernstein ernten", „THC-Maximum bei milchigen
 * Trichomen + ~10 % Amber" und als „Typisches Ziel" „70 % milchig, 30 % klar".
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

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  console.log('\nA - Quelltext (ohne Kommentarzeilen)');
  {
    const src = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8')
      .split(/\r?\n/).map((z, i) => ({ nr: i + 1, z })).filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.z));
    const muster = [
      [/bernstein\w*\s*=\s*jetzt/i, '„bernsteinfarbene = jetzt ernten"'],
      [/~?\d+(\s*[–-]\s*\d+)?\s*%\s*(Bernstein|Amber)\s+ernten/i, '„bei ~X % Bernstein ernten"'],
      [/THC-Maximum[^<]{0,40}\+\s*~?\d+\s*%\s*(Amber|Bernstein)/i, '„THC-Maximum bei milchig + X % Amber"'],
      [/Bernstein-Quote[^.]{0,30}erwünscht/i, '„Bernstein-Quote … erwünscht"'],
      [/Ideal zur Ernte/i, '„Ideal zur Ernte: …"'],
      [/Reise zur Ernte\s*\d/i, '„ab erstem Bernstein X Tage bis zur Ernte"'],
      [/eher früher ernten/i, '„eher früher ernten" (Sortenregel)'],
      [/\d+\s*%\s*milchig,\s*\d+\s*%\s*klar/i, 'Ernte-Ziel mit klaren Trichomen'],
      [/Ernten wenn ~?\d+\s*%\s*milchig/i, '„Ernten wenn ~X % milchig"'],
      [/milchig\s*=\s*perfekt/i, '„milchig = perfekt"'],
      [/bernsteinfarben\?\s*Zeit zum Schneiden/i, '„bernsteinfarben? Zeit zum Schneiden"'],
      [/\(perfekt\)/, '„Milchig (perfekt)" in der Trichom-Karte'],
    ];
    for (const [re, name] of muster) {
      const treffer = src.filter(x => re.test(x.z)).map(x => 'Zeile ' + x.nr + ': ' + x.z.trim().slice(0, 100));
      pruef('Kein ' + name, treffer.length === 0, treffer.join(' | '));
    }
  }

  console.log('\nB - Erntezähler-Hinweis mit Patricks Zyklus');
  {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0];
      const a = harvestCountdown(c, '2026-08-10'), b = harvestCountdown(c, '2026-09-06');
      return JSON.stringify({ aS: a && a.status, aT: a && a.tooltip, bS: b && b.status, bT: b && b.tooltip }); })()`));
    pruef(`Vor dem Fenster (${r.aS}): „wie viel Bernstein, entscheidest du"`, r.aS === 'upcoming' && /entscheidest du/.test(r.aT || ''), r.aT);
    pruef(`Im Fenster (${r.bS}): Schnitt an „kaum noch klare" und das eigene Bernstein-Ziel`, r.bS === 'harvest-window' && /Bernstein-Ziel/.test(r.bT || '') && /klare/.test(r.bT || ''), r.bT);
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
