// (v1.5.500) Die Diagnose bewertet „pH der letzten Tage hoch/niedrig“ nach dem Ziel des Substrats.
//
// buildDiagnosticContext galt fest „über 6,6 hoch, unter 6,0 niedrig“ — die Erde-Grenzen für jedes Substrat. Coco mit 5,8/5,9 (im
// eigenen Ziel 5,8–6,2) hieß „pH-Werte liegen niedrig“ und setzte den pH-Lockout mit 77 % auf Platz 1; Coco mit 6,5 (Lockout-Bereich)
// blieb stumm. Bewertung vom 30.10.2026 (Fach-Befund 2, Profi-Befund 3); ANBAU.md 4 und Regel 1 (jede Schwelle braucht ihre
// Gültigkeitsbedingung). Gegenprobe: Erde bleibt bei 6,6 / 6,0.
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
  const E = (s) => w.eval(s);
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };

  // Zyklus mit drei gemessenen pH-Werten in den letzten Tagen
  const ctx = (medium, ph) => JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S._seedlingProtocolShown = true;
    const c = addCyc({ name: 'P', startDate: isoPlus(todayISO(), -50), seedType: 'auto', growType: 'indoor', medium: '${medium}', potSize: 11, plantCount: 1 }, { still: true });
    S.cycles = [c]; c.medium = '${medium}';
    for (const d of [1, 3, 5]) { const iso = isoPlus(todayISO(), -d); S.entries[iso] = { cycleData: {} }; S.entries[iso].cycleData[c.id] = { water: 1500, ph: '${ph}' }; }
    const k = buildDiagnosticContext(c);
    const top = diagnoseProblems({ location: ['newLeaves'], colors: ['yellow'], shapes: [] }, k).slice(0, 2).map(x => x.problem.id);
    return JSON.stringify({ hoch: !!k.phHigh, tief: !!k.phLow, top });
  })()`));

  const faelle = [
    ['erde', '6.3', false, false], ['erde', '6.7', true, false], ['erde', '5.9', false, true],
    ['coco', '5.8', false, false], ['coco', '5.9', false, false], ['coco', '6.2', false, false], ['coco', '6.5', true, false], ['coco', '5.5', false, true],
  ];
  for (const [m, ph, hoch, tief] of faelle) {
    const r = ctx(m, ph);
    pruefe(r.hoch === hoch && r.tief === tief, `${m} pH ${ph}: hoch ${hoch}, niedrig ${tief} — ist ${JSON.stringify(r)}`);
  }
  const coco59 = ctx('coco', '5.9');
  pruefe(coco59.top[0] !== 'ph_lockout', 'Coco 5,9 (im Ziel): pH-Lockout nicht auf Platz 1 — ' + coco59.top.join(','));

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
