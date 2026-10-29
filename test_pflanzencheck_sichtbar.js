// (v1.5.458) Befund 1: „Meine Pflanze sieht schlecht aus“ (Pflanzen-Check) stand im Einsteiger-Modus nur hinter „Mehr anzeigen“, im Profi-Modus direkt. Wer ein Problem hat, fand keine Tür (und die FAQ „Blätter werden gelb“ verwies darauf). Jetzt in beiden Modi sichtbar, nie doppelt.
// Gefunden: UX-Prüfung „Hilfe finden und Navigation“ 29.10.2026 (.claude/notizen/ux/hilfe_2026-10-29.txt, Punkte 1 und 7).
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
  const dash = (beginner, mehrOffen) => E(`(function(){ S.cycles = []; S.entries = {}; const heute = todayISO();
    const c = addCyc({ name: 'Test', startDate: isoPlus(heute, -20), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id;
    S.beginnerMode = ${beginner}; if (!S._setUI) S._setUI = {}; S._setUI.dashMore = ${mehrOffen};
    renderDash(); return document.getElementById('dash-body').innerHTML; })()`);
  const zaehle = (h) => (h.match(/Meine Pflanze sieht schlecht aus/g) || []).length;
  let h = dash(true, false);
  pruefe(h.includes('Mehr anzeigen'), 'Annahme: Einsteiger-Startseite hat „Mehr anzeigen"');
  pruefe(zaehle(h) === 1, 'A Einsteiger, Bereich zu: Knopf sollte 1x sichtbar sein, ist ' + zaehle(h) + 'x da');
  const iK = h.indexOf('Meine Pflanze sieht schlecht aus'), iM = h.indexOf('Mehr anzeigen');
  pruefe(iK > -1 && iM > -1 && iK < iM, 'B Knopf steht nicht außerhalb (vor) dem zugeklappten „Mehr anzeigen"');
  h = dash(true, true);
  pruefe(zaehle(h) === 1, 'C Einsteiger, Bereich offen: Knopf sollte genau 1x da sein, ist ' + zaehle(h) + 'x da');
  h = dash(false, false);
  pruefe(zaehle(h) === 1, 'D Profi: Knopf sollte 1x da sein, ist ' + zaehle(h) + 'x da');
  pruefe(!HTML.includes('Starte den <b>Pflanzen-Check</b> auf dem Dashboard'), 'E FAQ „Blätter werden gelb" nennt den Knopf nicht mit seinem Namen');
  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '-') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
