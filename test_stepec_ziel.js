// (v1.5.464) UX-Befund 29.10.2026 „Gießtag-Routine“, Punkt 3: stepEC startete bei fest 1,4 statt beim Ziel.
// Falsch: Leeres EC-Feld mit Platzhalter 0,8 (Ziel) sprang beim ersten „+“ auf 1,41 und wurde als Messung gespeichert.
// Warum: stepPH startet seit v1.5.411 beim Platzhalter; stepEC hatte „Default 1.4“ fest im Code.
// Gefunden: UX-Prüfung Gießtag-Routine (giesstag_2026-10-29.txt). Richtig: Wert = Platzhalter ± ein Schritt.
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
  // Tag 24 (Erde, indoor, ohne Plan, nach der Vordüngung): Ziel-EC der Tabelle als Platzhalter; Einheit wählbar.
  const lauf = (einheit, dir) => JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S.beginnerMode = false; S.ecUnit = ${JSON.stringify(einheit)};
    const heute = todayISO();
    const c = addCyc({ name: 'Test', startDate: isoPlus(heute, -23), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id;
    openEntry(heute);
    const el = document.getElementById('ec-' + c.id);
    if (!el) return JSON.stringify({ fehlt: true });
    el.value = '';
    const ph = parseFloat(el.placeholder);
    stepEC(c.id, ${dir});
    return JSON.stringify({ ph, wert: parseFloat(el.value), schritt: ecUnitDef().step }); })()`));

  let r = lauf('mS', 1);
  pruefe(!r.fehlt, 'A EC-Feld fehlt im Eintrag');
  pruefe(r.ph > 0.3 && r.ph < 2, 'A Platzhalter sollte ein Tabellenwert über 0 sein, ist ' + r.ph + ' (Testlage verschoben)');
  pruefe(Math.abs(r.wert - (r.ph + r.schritt)) < 0.0051, 'A leeres Feld, „+“ in mS: erwartet ' + (r.ph + r.schritt).toFixed(2) + ', steht ' + r.wert);
  r = lauf('mS', -1);
  pruefe(Math.abs(r.wert - (r.ph - r.schritt)) < 0.0051, 'B leeres Feld, „−“ in mS: erwartet ' + (r.ph - r.schritt).toFixed(2) + ', steht ' + r.wert);
  r = lauf('uS', 1);
  pruefe(Math.abs(r.wert - (r.ph + r.schritt)) < 0.5, 'C leeres Feld, „+“ in µS: erwartet ' + (r.ph + r.schritt) + ', steht ' + r.wert);

  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
