/**
 * (v1.5.211) Das Spülende setzt der Plan, kein Drain-EC-Wert (Begriffe-Prüfung, Schritt 7).
 *
 * Die IceFlush-Checkliste verlangte „Drain EC nach letztem Spülen ≤ 0.4 mS/cm", das Lexikon führte eine Stufentabelle bis
 * „EC ≤ 0.4: sauber, Spülung abgeschlossen", die CANNA-Coco-Vorlage „Drain-EC ≤0.4 anstreben". Unter den EC des Wassers, mit dem
 * gespült wird, kann der Drain nicht fallen, und in Erde steigt er nach dem Spülen wieder, weil die Erde nachliefert
 * (ANBAU.md 5.1). Die Schwelle war dort unerreichbar und trieb zu zusätzlichen Güssen vor dem Hard-Dryback.
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
const ISO = '2026-09-05';   // Patricks vorgezogener IceFlush-Tag

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  console.log('\nA - IceFlush-Checkliste');
  let r = null;
  try {
    r = JSON.parse(E(`(function(){ const c = S.cycles[0]; setDebugDate('${ISO}');
      if (!S.entries['${ISO}']) S.entries['${ISO}'] = { cycleData: {} };
      if (!S.entries['${ISO}'].cycleData[c.id]) S.entries['${ISO}'].cycleData[c.id] = {};
      const cd = S.entries['${ISO}'].cycleData[c.id];
      const text = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ');
      cd._iceflushChecks = {};
      const leer = text(_renderIceFlushPanel(c, '${ISO}'));
      cd._iceflushChecks = { drain_ec: true, trichomes: true };
      const zwei = text(_renderIceFlushPanel(c, '${ISO}'));
      return JSON.stringify({ leer: (leer.match(/Voraussetzungen \\(\\d+\\/\\d+\\)/) || [''])[0], zwei: (zwei.match(/Voraussetzungen \\(\\d+\\/\\d+\\)/) || [''])[0],
        drainEc: /Drain EC|0\\.4 mS/.test(leer), ausschnitt: leer.slice(0, 160) }); })()`));
  } catch (e) { pruef('Checkliste lässt sich darstellen', false, String(e && e.message || e).slice(0, 160)); }
  if (r) {
    pruef('Kein Punkt „Drain EC ≤ 0.4 mS/cm" mehr', r.drainEc === false, r.ausschnitt);
    pruef('Sieben Voraussetzungen: „(0/7)"', r.leer === 'Voraussetzungen (0/7)', r.leer);
    pruef('Ein gespeichertes Drain-EC-Häkchen zählt nicht: „(1/7)" mit Trichome', r.zwei === 'Voraussetzungen (1/7)', r.zwei);
  }

  console.log('\nB - Quelltext ohne Kommentare');
  const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
  pruef('Keine Schwelle „≤ 0,4 mS/cm", keine Stufentabelle „EC ≤ 0.4: sauber", kein „Drain-EC ≤0.4 anstreben"',
    !/≤\s*0[.,]4\s*mS/.test(code) && !/EC ≤ 0\.4:<\/b>/.test(code) && !/Drain-EC ≤0\.4 anstreben/.test(code));
  const req = (code.match(/const required = \[([^\]]*)\]/) || [])[1] || '';
  pruef('„Tag ausfüllen" am IceFlush fragt drain_ec nicht mehr ab', req.length > 0 && !/drain_ec/.test(req), req);

  console.log('\nC - Lexikon und Vorlage');
  // Das Lexikon ist nach Kategorien verschachtelt — gesucht wird deshalb im ganzen Lexikon.
  const t = JSON.parse(E(`(function(){ const lex = JSON.stringify(LEXIKON);
    return JSON.stringify({ plan: (lex.match(/Spülende setzt (deshalb )?der Plan/g) || []).length, iceDrain: /Drain EC vom letzten Spülen/.test(lex), ice: /Voraussetzungen vor dem IceFlush/.test(lex),
      canna: (FERT_PRESETS.canna_coco && FERT_PRESETS.canna_coco.weekFocus[10] || {}).tip || '' }); })()`));
  pruef('Lexikon „Spülung": das Spülende setzt der Plan (Punkt 3 und Schritt 5)', t.plan >= 2, 'n=' + t.plan);
  pruef('Lexikon „IceFlush": keine Drain-EC-Voraussetzung', t.ice === true && t.iceDrain === false);
  pruef('CANNA-Coco, Woche 10: „Das Spülende setzt der Plan"', /Das Spülende setzt der Plan/.test(t.canna), t.canna);

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
