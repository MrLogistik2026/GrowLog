// (v1.5.437) Der Diagnose-Kontext liest den Hebe-Test nach dem Gießpunkt des Substrats.
//
// buildDiagnosticContext setzte „Topf nass“ ab 65 und „Topf trocken“ unter 25 Restgewicht — die Erde-Werte, auch für Coco.
// Bei Coco ist der Gießpunkt „Mittel“ (70, GIESSPUNKT.coco 60–85): Ein welker Coco-Topf am Gießpunkt wurde als
// „Erde dauer-feucht“ gelesen und hob Überwässerung, Wurzelfäule und Trauermücken an; „Bald“ (50) und „Knapp“ (30) liegen
// unter dem Coco-Gießpunkt und zählten trotzdem nicht als trocken (ANBAU.md 1.2, 7.1; Regel 1: Substrat ist Eingangsgröße).
// Gefunden von der Diagnose-Prüfung am 08.10.2026 (Befund B05).
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

  // Hebe-Test-Knöpfe: Voll 95 · Mittel 70 · Bald 50 · Knapp 30 · Trocken 20
  const KNOEPFE = { Voll: 95, Mittel: 70, Bald: 50, Knapp: 30, Trocken: 20 };
  const lies = (medium, rest) => JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; const heute = todayISO();
    const c = addCyc({ name: 'Test', startDate: isoPlus(heute, -50), seedType: 'auto', growType: 'indoor', medium: '${medium}', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id;
    S.entries[heute] = { cycleData: {} }; S.entries[heute].cycleData[c.id] = { restPct: ${rest} };
    const ctx = buildDiagnosticContext(c); return JSON.stringify({ nass: !!ctx.restHigh, trocken: !!ctx.restLow }); })()`));

  // Erde: unverändert 65/25 — nass bei Voll und Mittel, trocken nur bei Trocken
  const ERDE = { Voll: [true, false], Mittel: [true, false], Bald: [false, false], Knapp: [false, false], Trocken: [false, true] };
  for (const [k, [nass, trocken]] of Object.entries(ERDE)) {
    const r = lies('erde', KNOEPFE[k]);
    pruefe(r.nass === nass && r.trocken === trocken, `E Erde „${k}“: nass ${r.nass}/${nass}, trocken ${r.trocken}/${trocken}`);
  }
  // Coco: Gießpunkt „Mittel“ ist weder nass noch trocken; nass nur „Voll“, trocken ab unter 60 (Bald, Knapp, Trocken)
  const COCO = { Voll: [true, false], Mittel: [false, false], Bald: [false, true], Knapp: [false, true], Trocken: [false, true] };
  for (const [k, [nass, trocken]] of Object.entries(COCO)) {
    const r = lies('coco', KNOEPFE[k]);
    pruefe(r.nass === nass && r.trocken === trocken, `C Coco „${k}“: nass ${r.nass}/${nass}, trocken ${r.trocken}/${trocken}`);
  }
  // Wirkung in der Diagnose: welker Coco-Topf am Gießpunkt hebt die Überwässerung nicht an
  const boost = JSON.parse(E(`(function(){ const c = S.cycles[0]; const heute = todayISO(); c.medium = 'coco';
    S.entries[heute].cycleData[c.id] = { restPct: 70 }; const ctx = buildDiagnosticContext(c);
    const r = diagnoseProblems({ location: ['allLeaves'], colors: [], shapes: ['wilting'] }, ctx);
    const ow = r.find(x => x.problem.id === 'overwatering'); return JSON.stringify({ grund: ow ? ow.contextReasons : null }); })()`));
  pruefe(!(boost.grund || []).some((g) => /feucht/i.test(g)), 'D Coco am Gießpunkt: Überwässerung bekommt noch den Grund „feucht“: ' + JSON.stringify(boost.grund));

  pruefe(!errors.length, 'Skriptfehler: ' + errors.slice(0, 3).join(' | '));
  if (fehler.length) { console.log(`test_hebekontext: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_hebekontext: alle ${n} Prüfungen grün`);
  process.exit(0);
})().catch((e) => { console.log('test_hebekontext abgebrochen:', (e && e.stack) || e); process.exit(1); });
