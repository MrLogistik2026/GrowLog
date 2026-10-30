// (v1.5.503) Helles Thema: Kalenderzellen und Hinweiskarten der Startseite folgen dem Thema.
//
// Kalenderzellen hatten feste Dunkelwerte (#151515, #1a1a1a, dunkle Aktionsfarben) — im hellen Thema waren 27 von 36 Zellen schwarz
// und der weiße „heute“-Rand verschwand; Hinweiskarten standen fest auf #101000/#1a1000 mit Text bei Kontrast 2,16 : 1. Bewertung vom
// 30.10.2026, Technik-Befund 2. Im Browser nachgemessen: hell 0 von 31 Zellen dunkel, dunkles Thema unverändert.
// jsdom löst keine CSS-Variablen auf — geprüft werden die Inline-Farben und die Regeln für das helle Thema.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');

(async () => {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => null; w.navigator.vibrate = () => true; w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {}; w.alert = () => {}; w.print = () => {}; },
  });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  w.toast = () => {};
  const E = (s) => w.eval(s);
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const DUNKEL = /#151515|#1a1a1a|#2a1f08|#082028|#0a2428|#1f1408|#1e1a04|#150820|#1a1010|#101000|#1a1000|#001020|#001a00/i;

  // Kalender mit Gieß-, Spül-, Ernte- und Plan-Tagen
  E(`(function(){ S.cycles = []; S.entries = {}; S._seedlingProtocolShown = true;
    const c = addCyc({ name: 'K', startDate: isoPlus(todayISO(), -90), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11, plantCount: 1 }, { still: true });
    S.cycles = [c]; document.documentElement.setAttribute('data-theme', 'light'); goTo('cal'); })()`);
  const zellen = E(`JSON.stringify([...document.querySelectorAll('.cal-cell')].map(z => z.getAttribute('style') || ''))`);
  const dunkleZellen = JSON.parse(zellen).filter(s => DUNKEL.test(s));
  pruefe(JSON.parse(zellen).length > 20, 'Prüflage: Kalender gezeichnet');
  pruefe(dunkleZellen.length === 0, 'Keine Kalenderzelle mit fester Dunkelfarbe (' + dunkleZellen.length + '): ' + (dunkleZellen[0] || '').slice(0, 120));
  const css = E(`[...document.querySelectorAll('style')].map(s => s.textContent).join(' ')`);
  pruefe(/:root\[data-theme="light"\] \.cal-cell \{ background: var\(--card2\)/.test(css), 'Regel: helle Kalenderzelle');
  pruefe(/:root\[data-theme="light"\] \.cal-cell\.today \{ border-color: var\(--text\)/.test(css), 'Regel: „heute“ im hellen Thema dunkel umrandet');
  pruefe(/:root\[data-theme="auto"\] \.cal-cell \{ background: var\(--card2\)/.test(css), 'Regel auch für „auto“ bei hellem System');
  // Hinweiskarten: Quelltext ohne feste Fast-Schwarz-Flächen
  const src = E(`renderDash.toString() + (typeof _dashAlertHTML === 'function' ? _dashAlertHTML.toString() : '')`);
  const app = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');
  pruefe(!/const bg = \{ warn: '#1a1000'/.test(app), 'Hinweiskarten ohne feste Dunkelflächen');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
