// (v1.5.454) Banner „Aktion verpasst“: „Gestern wurde ein Gieß-Tag nicht eingetragen.“ statt „In den letzten 1 Tagen …“.
//
// Gefunden bei der Anfänger-Prüfung am 29.10.2026 (Tag 10: „In den letzten 1 Tagen wurden Gieß-Tage nicht eingetragen.“).
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

  // Der Banner-Text steht im Quelltext von renderDash; geprüft wird die Unterscheidung für einen Tag.
  const q = E('renderDash.toString()');
  pruefe(/oldest === 1 \? 'Gestern wurde ein Gieß-Tag nicht eingetragen\.'/.test(q), 'Ein Tag: „Gestern wurde ein Gieß-Tag nicht eingetragen.“');
  pruefe(!/>In den letzten \$\{cycleEntries\[0\]\.oldest\} Tagen/.test(q), 'Kein „In den letzten ${…} Tagen“ ohne Unterscheidung');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
