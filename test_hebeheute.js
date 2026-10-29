// (v1.5.439) Befund B04 der Diagnose-Prüfung vom 08.10.2026: Eine Hebe-Test-Messung von HEUTE schließt die Gegenerklärung aus (ANBAU.md 15, Regel 2).
// Heute „Voll“ -> kein Wassermangel; heute „Trocken“ -> weder Überwässerung noch Trauermücken; dieselbe Messung von gestern -> bleibt.
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
  const liste = (restPct, tageZurueck) => JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; const heute = todayISO();
    const c = addCyc({ name: 'Test', startDate: isoPlus(heute, -20), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id;
    const tag = isoPlus(heute, -${tageZurueck}); S.entries[tag] = { cycleData: {} }; S.entries[tag].cycleData[c.id] = { restPct: ${restPct} };
    const ctx = buildDiagnosticContext(c);
    const r = diagnoseProblems({ location: ['allLeaves'], colors: [], shapes: ['crispy'] }, ctx);
    return JSON.stringify(r.map(x => x.problem.id)); })()`));

  let l = liste(95, 0);
  pruefe(!l.includes('underwatering'), 'A heute Voll: Wassermangel steht noch in der Liste: ' + l);
  pruefe(l.includes('overwatering'), 'A heute Voll: Überwässerung fehlt: ' + l);
  l = liste(20, 0);
  pruefe(!l.includes('overwatering'), 'B heute Trocken: Überwässerung steht noch in der Liste: ' + l);
  pruefe(!l.includes('fungus_gnats'), 'B heute Trocken: Trauermücken stehen noch in der Liste: ' + l);
  pruefe(l.includes('underwatering'), 'B heute Trocken: Wassermangel fehlt: ' + l);
  l = liste(95, 1);
  pruefe(l.includes('underwatering'), 'C gestern Voll: Wassermangel fehlt in der Liste: ' + l);
  l = liste(20, 1);
  pruefe(l.includes('overwatering'), 'D gestern Trocken: Überwässerung fehlt in der Liste: ' + l);

  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log(fehler.length ? 'FEHL (' + fehler.length + '/' + n + ')\n' + fehler.join('\n') : 'OK (' + n + ' Prüfungen)');
  process.exit(fehler.length ? 1 : 0);
})();
