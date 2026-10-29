// (v1.5.460) Befund 8: Das „?“-Hilfeblatt hatte ohne Suche nur „Schließen“ und „Sichern & kopieren“ — kein Einstieg für ein Pflanzenproblem. Jetzt eine Zeile „Meine Pflanze hat ein Problem“ über der Suche (Ziel: Pflanzen-Check wie auf der Startseite).
// Gefunden: UX-Prüfung „Hilfe finden und Navigation“ 29.10.2026 (.claude/notizen/ux/hilfe_2026-10-29.txt, Punkt 8).
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
  E(`S.cycles = []; openHelp()`);
  const box = w.document.getElementById('help-box');
  const knopf = w.document.getElementById('help-problem');
  pruefe(!!knopf && /Meine Pflanze hat ein Problem/.test(knopf.textContent), 'A Hilfeblatt ohne Suche hat keinen Einstieg „Meine Pflanze hat ein Problem"');
  const suche = w.document.getElementById('help-q');
  pruefe(!!knopf && !!suche && (knopf.compareDocumentPosition(suche) & 4) !== 0, 'B Einstieg steht nicht über der Suche');
  const ruf = E(`(function(){ let g = 0; const a = window.openSymptomChecker; openSymptomChecker = function(){ g++; };
    document.getElementById('help-problem') && document.getElementById('help-problem').click(); openSymptomChecker = a; return g; })()`);
  pruefe(ruf === 1, 'C Knopf ruft openSymptomChecker nicht genau 1x auf (' + ruf + ')');
  pruefe(w.document.getElementById('help-sheet').style.display === 'none', 'D Hilfeblatt bleibt nach dem Druck offen');
  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '-') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
