// (v1.5.465) UX-Befund 29.10.2026 „Gießtag-Routine“, Punkt 9: Der Hebe-Test sprach an zwei Stellen zwei Sprachen.
// Falsch: Eintragsleiste „Voll frisch / Mittel feucht / … / Trocken kritisch“, Guss-Blatt (openGussHebe) „Schwer wie frisch gegossen /
// Noch gut schwer / … / Federleicht“ — gleiche Schlüssel full/medium/soon/low/dry. Warum: jede Stelle hatte ihre eigene Liste.
// Gefunden: UX-Prüfung Gießtag-Routine (giesstag_2026-10-29.txt). Richtig: eine Tabelle LIFT_FEEL_TEXTE, gleiche Kurzwörter.
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
  // Eintragsleiste (Tag 12) und Guss-Blatt für denselben Zyklus öffnen, Kurzwörter je Stufe vergleichen.
  const r = JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S.beginnerMode = false;
    const heute = todayISO();
    const c = addCyc({ name: 'Test', startDate: isoPlus(heute, -11), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id;
    openEntry(heute);
    const leiste = {};
    document.querySelectorAll('#scr-entry button[onclick^="setLiftFeel"]').forEach(b => {
      const f = b.getAttribute('onclick').split("'")[3]; const sp = b.querySelectorAll('span'); leiste[f] = sp[1].textContent.trim(); });
    openGussHebe(c.id, heute);
    const guss = {};
    document.querySelectorAll('[data-day-picker] button[onclick^="gussHebeSet"]').forEach(b => {
      const f = b.getAttribute('onclick').split("'")[5]; const t = b.querySelector('span').textContent.trim();
      guss[f] = t.slice(t.indexOf(' ') + 1); });
    return JSON.stringify({ leiste, guss }); })()`));
  const erwartet = { full: 'Voll', medium: 'Mittel', soon: 'Bald', low: 'Knapp', dry: 'Trocken' };
  for (const f of Object.keys(erwartet)) {
    pruefe(r.leiste[f] === erwartet[f], 'Eintragsleiste ' + f + ': erwartet „' + erwartet[f] + '“, steht „' + r.leiste[f] + '“');
    pruefe(r.guss[f] === erwartet[f], 'Guss-Blatt ' + f + ': erwartet „' + erwartet[f] + '“, steht „' + r.guss[f] + '“');
  }
  pruefe(JSON.stringify(Object.keys(r.leiste).sort()) === JSON.stringify(Object.keys(r.guss).sort()), 'Beide Stellen haben nicht dieselben Stufen');

  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
