/**
 * (v1.5.199) Reste des Finisher-Bands nach v1.5.195.
 *
 * Der Fehler: v1.5.195 hat das eigene Restgewicht-Band der letzten zwei Wochen vor der Ernte abgeschafft — derselbe
 * Gießpunkt bis zur Ernte. Zwei Stellen rechneten weiter damit: Die Dryback-Vorhersage (drybackForecast) zielte in diesen
 * Tagen auf 35 % statt auf den Gießpunkt („Finisher ~35 %, bewusster Stress-Korridor"), und der Hebe-Test trug im Eintrag
 * ein rotes Schild „FINISHER", als gälten dort andere Grenzen. Einen trockeneren Topf vor der Ernte stützt kein belegter
 * Mechanismus (ANBAU.md 14).
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
async function abschnitt(titel, fn) {
  console.log('\n' + titel);
  try { await fn(); } catch (e) { pruef(titel + ' — lief ohne Fehler', false, String(e && e.message || e).slice(0, 160)); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`S.beginnerMode = false`);

  // Ein Blütetag im Finisher-Fenster (≤ 14 Tage vor der Ernte), ein Blütetag davor, der IceFlush-Tag.
  const T = JSON.parse(E(`(function(){ const c = S.cycles[0]; const t = {};
    for (let i = 40; i < 120; i++) { const d = isoPlus(c.startDate, i - 1); const p = phase(d, c); const cx = contextFor(c, d);
      if (p && p.ph === 'bloom' && cx && cx.isFinisher && !t.fin) t.fin = d;
      if (p && p.ph === 'bloom' && cx && !cx.isFinisher && i === 60) t.normal = d;
      if (getAction(d, c) === 'ice' && !t.ice) t.ice = d; }
    return JSON.stringify(t); })()`));

  await abschnitt('A - Dryback-Vorhersage', async () => {
    pruef('Prüflage: Finisher-Blütetag, normaler Blütetag und IceFlush-Tag gefunden', !!T.fin && !!T.normal && !!T.ice, JSON.stringify(T));
    // Trocknungsrate und Klima festhalten, damit nur das Ziel zählt: 10 Prozentpunkte je Tag, Anker 55 %.
    const r = JSON.parse(E(`(function(){ _waterConsumptionInfo = function () { return { ratePctPerDay: 10, rateSamples: 3 }; };
      _vpdFactorForDay = function () { return 1; };
      const c = S.cycles[0]; const aus = {};
      ['${T.fin}', '${T.normal}'].forEach(function (d) {
        if (!S.entries[d]) S.entries[d] = { cycleData: {} }; if (!S.entries[d].cycleData) S.entries[d].cycleData = {};
        if (!S.entries[d].cycleData[c.id]) S.entries[d].cycleData[c.id] = { doses: {} };
        const cd = S.entries[d].cycleData[c.id]; delete cd.liftAfterPct; cd.restPct = '55';
        aus[d] = drybackForecast(c, phase(d, c), d); });
      return JSON.stringify(aus); })()`));
    const fin = r[T.fin], normal = r[T.normal];
    pruef('Finisher-Blütetag: Ziel ist der Gießpunkt (30 %), nicht 35 %', !!fin && fin.targetPct === 30, JSON.stringify(fin));
    pruef('Finisher-Blütetag: bei 55 % und 10 Punkten je Tag gießen in 3 Tagen (vorher 2)', !!fin && fin.days === 3, JSON.stringify(fin));
    pruef('Normaler Blütetag unverändert: Ziel 30 %, 3 Tage', !!normal && normal.targetPct === 30 && normal.days === 3, JSON.stringify(normal));
  });

  await abschnitt('B - Hebe-Test im Eintrag', async () => {
    E(`setDebugDate('${T.ice}'); openEntry('${T.ice}')`);
    await warte(150);
    const txt = E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
    pruef('IceFlush-Tag (im Finisher-Fenster): Hebe-Test ohne Schild „FINISHER"', /Hebe-Test/.test(txt) && !/FINISHER/.test(txt),
      (txt.match(/.{0,30}FINISHER.{0,30}/) || ['(Hebe-Test fehlt?)'])[0]);
  });

  await abschnitt('C - Quelltext', async () => {
    const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    const alt = ['isFinisher ? 35', '>FINISHER</span>'].filter(s => code.includes(s));
    pruef('Kein Finisher-Ziel 35 % und kein FINISHER-Schild mehr im Code', alt.length === 0, alt.join(' | '));
  });

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
