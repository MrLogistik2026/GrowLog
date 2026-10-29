// (v1.5.466) UX-Befund 29.10.2026 „Gießtag-Routine“, Punkt 10: „Nächster Gießtag“ stand doppelt auf der Startseite.
// Falsch: An einem Tag ohne Gießen (Einsteiger) sagte das Banner „Nächster Gießtag: in 2 Tagen“ und darunter die Zyklus-Karte
// „💧 Nächster Gießtag Samstag … in 2d“. Warum: Banner (quietBanner) und Karte in renderDash rechneten es unabhängig voneinander.
// Gefunden: UX-Prüfung Gießtag-Routine (giesstag_2026-10-29.txt). Richtig: genau einmal, die Karte mit Datum bleibt.
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
  // Einsteiger, Tag 22 (kein Gießtag, keine Aktion): Banner „Heute alles ruhig“ + Zyklus-Karte „Nächster Gießtag“.
  const zaehle = (tag) => JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S.beginnerMode = true;
    const heute = todayISO();
    const c = addCyc({ name: 'Test', startDate: isoPlus(heute, -${tag - 1}), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id;
    renderDash();
    const t = document.getElementById('dash-body').textContent;
    return JSON.stringify({ n: (t.match(/Nächster Gießtag/g) || []).length, ruhig: t.indexOf('Heute alles ruhig') >= 0, datum: /Nächster Gießtag[^·]*· in [0-9]+d/.test(t) }); })()`));
  for (const tag of [22, 23, 25]) {
    const r = zaehle(tag);
    pruefe(r.ruhig, 'Tag ' + tag + ': „Heute alles ruhig“ fehlt (Testlage verschoben)');
    pruefe(r.n === 1, 'Tag ' + tag + ': „Nächster Gießtag“ steht ' + r.n + 'x statt 1x auf der Startseite');
    pruefe(r.datum, 'Tag ' + tag + ': die Karte mit Wochentag und „in Nd“ fehlt');
  }

  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
