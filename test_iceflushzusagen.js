/**
 * (v1.5.192) Unbelegte Zusagen um IceFlush, Dunkelphase und Ernte.
 *
 * Der Fehler: ANBAU.md 14 hält fest, dass für IceFlush und Dunkelphase kein Trichom-, THC- oder Potenzeffekt belegt ist —
 * belegt ist nur, dass Terpene unter Licht und Wärme verdunsten. Das Lexikon sagte trotzdem: „Cannabinoide und Terpene sind
 * nachts maximal konzentriert (Pflanze hat hochgepumpt)" (zweimal), „der Trichom-Effekt funktioniert trotzdem", IceFlush und
 * Dunkelheit „ergeben einen Synergie-Effekt — alle Reserven gehen in die Blüten", „kurze Lichtimpulse machen den Effekt
 * zunichte", der Effekt der Dunkelphase sei „in Studien teilweise widersprüchlich nachgewiesen". Das Banner in der
 * Dunkelphase: „Pflanze produziert auf Hochtouren Trichome". Dazu Physik, die nicht aufgeht: „Salze werden ausgespült" und
 * „nach dem Schmelzen Drain-EC messen — sollte < 0,4 sein", obwohl das Schmelzwasser im abgetrockneten Topf bleibt;
 * „grünes Licht wird nicht photosynthetisch verarbeitet" (Terashima et al. 2009); Zahlen ohne Messung (8–12 °C im Topf,
 * Botrytis „in 24 h").
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
const kurz = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 260);
const treffer = (text, re) => { const m = String(text || '').match(re); return m ? m[0] : null; };

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  const L = JSON.parse(E(`(function(){ const alle = LEXIKON.flatMap(function (c) { return c.items; });
    const g = function (t) { const i = alle.find(function (x) { return x.t === t; }); return i ? [i.brief, i.mechanism, i.practice, i.pitfall].join(' ') : null; };
    return JSON.stringify({ dunkel: g('Dunkelphase vor der Ernte (24–72 h)'), ice: g('IceFlush'), schnitt: g('Erntetag — Schnitttechnik'), botrytis: g('Schimmel (Botrytis)') }); })()`));

  await abschnitt('A - Lexikon „Dunkelphase vor der Ernte"', async () => {
    const alt = /hochgepumpt|nicht photosynthetisch verarbeitet|klar messbarer Terpen-Erhalt|UV-Restlicht reicht|Effekt zunichte|Effekt zerstört|innerhalb von 24 h|sich zu wehren|teilweise widersprüchlich nachgewiesen/;
    pruef('Keine unbelegte Zusage und keine Zahl ohne Messung mehr', !!L.dunkel && !alt.test(L.dunkel), treffer(L.dunkel, alt));
    pruef('Grünes Licht mit Quelle richtiggestellt, „hochpumpen" als nicht belegt benannt',
      /Terashima et al\. 2009/.test(L.dunkel || '') && /„hochpumpt", ist nicht belegt/.test(L.dunkel || ''), kurz(L.dunkel));
  });

  await abschnitt('B - Lexikon „IceFlush"', async () => {
    const alt = /nahenden Winter|Notfall-Modus|Salze werden ausgespült|biologisch wirksamer|ergeben einen Synergie-Effekt|Trichom-Effekt funktioniert|bereit den Effekt zu nutzen|sonst kein Effekt|nice to have|Nach dem Schmelzen Drain-EC messen|8–12/;
    pruef('Keine unbelegte Zusage, kein Drain-EC nach dem Schmelzen, keine Topftemperatur ohne Messung', !!L.ice && !alt.test(L.ice), treffer(L.ice, alt));
    pruef('Das Schmelzwasser bleibt im Topf — kein Drain, nichts ausgespült', /bleibt im abgetrockneten Topf/.test(L.ice || '') && /eine Drain-EC-Messung gibt es hier nicht/.test(L.ice || ''), kurz(L.ice));
  });

  await abschnitt('C - Lexikon „Erntetag — Schnitttechnik" und „Botrytis"', async () => {
    const alt = /hochgepumpt|kostet messbar Aroma|mit dem Wasser auch Terpene/;
    pruef('Schnitttechnik: kein „hochgepumpt", kein „kostet messbar Aroma", kein „mit dem Wasser auch Terpene"', !!L.schnitt && !alt.test(L.schnitt), treffer(L.schnitt, alt));
    pruef('Botrytis: kein „Tötet Buds in 24h"', !!L.botrytis && !/Tötet Buds in 24h/.test(L.botrytis) && /binnen Tagen/.test(L.botrytis), kurz(L.botrytis));
  });

  await abschnitt('D - Banner in der Dunkelphase (Tageseintrag)', async () => {
    const D = '2026-09-07';
    E(`setDebugDate('${D}'); S.beginnerMode = false; openEntry('${D}')`);
    await warte(200);
    const letzter = E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
    E(`S.cycles[0].__iceDaysAlt = S.cycles[0].iceDays; S.cycles[0].iceDays = 3; openEntry('${D}')`);
    await warte(200);
    const mitte = E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
    E(`S.cycles[0].iceDays = S.cycles[0].__iceDaysAlt; delete S.cycles[0].__iceDaysAlt`);
    pruef('Banner erscheint (letzter Dunkeltag)', /Pitch-Black-Dunkelphase/.test(letzter), kurz(letzter).slice(0, 120));
    pruef('Letzter Dunkeltag: kein „jede Stunde kostet Terpene"', /Letzter Dunkel-Tag/.test(letzter) && !/jede Stunde kostet Terpene/.test(letzter));
    pruef('Mittlerer Dunkeltag: kein „auf Hochtouren Trichome", dafür die Luftfeuchte', /Pitch-Black-Dunkelphase/.test(mitte) && !/Hochtouren Trichome/.test(mitte) && /höchstens 60 %/.test(mitte),
      (mitte.match(/Pitch-Black-Dunkelphase[^.]*\.[^.]*\.[^.]*\./) || [''])[0]);
  });

  await abschnitt('E - Im Quelltext', async () => {
    const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    const alt = ['hochgepumpt', 'Trichom-Effekt funktioniert', 'auf Hochtouren Trichome', 'nicht photosynthetisch verarbeitet', 'ergeben einen Synergie-Effekt',
      'Salze werden ausgespült', 'Nach dem Schmelzen Drain-EC messen', 'kostet messbar Aroma', 'Tötet Buds in 24h', 'jede Stunde kostet Terpene'].filter(s => code.includes(s));
    pruef('Keine der alten Zusagen mehr im Code', alt.length === 0, alt.join(' | '));
  });

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
