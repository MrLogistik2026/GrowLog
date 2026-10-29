// (v1.5.449) Die Begründungen der Diagnose sagen, was der Messwert trägt — „Drain“ statt „Runoff“, „Topf schwer“ statt „Erde dauer-feucht“.
//
// Unter „Warum diese Hypothese“ standen „EC-Runoff steigend“ (der Kontext meint: Drain-EC über dem 1,6-Fachen, nicht „steigend“),
// „Runoff-pH driftet hoch“ und „Erde dauer-feucht“ (ein einzelner Hebe-Test). Die App-Nomenklatur ist „Drain“ (ANWEISUNG.md), und
// eine Aussage, die der Wert nicht trägt, ist keine (Regel 2). Diagnose-Prüfung vom 08.10.2026, Befund B12.
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

  const gruende = (sym, ctx) => JSON.parse(E(`JSON.stringify([].concat(...diagnoseProblems(${JSON.stringify(sym)}, ${JSON.stringify(ctx)}).map(x => x.contextReasons)))`));
  const HAENGEND = { location: ['allLeaves'], colors: [], shapes: ['wilting'] };
  let g = gruende(HAENGEND, { phase: 'bloom', restHigh: true, restHeute: true });
  pruefe(g.includes('Topf schwer (heute gemessen)'), 'Topf heute schwer: „Topf schwer (heute gemessen)“ — ' + g.join(' | '));
  g = gruende(HAENGEND, { phase: 'bloom', restHigh: true });
  pruefe(g.includes('Topf schwer (letzte Messung)'), 'Ältere Messung: „Topf schwer (letzte Messung)“ — ' + g.join(' | '));
  g = gruende({ location: ['allLeaves'], colors: ['brown'], shapes: ['burnTips'] }, { phase: 'bloom', ecDeltaPos: true });
  pruefe(g.includes('Drain-EC zu hoch'), 'Drain-EC: „Drain-EC zu hoch“ — ' + g.join(' | '));
  g = gruende({ location: ['newLeaves'], colors: ['yellow'], shapes: [] }, { phase: 'bloom', runoffDriftHigh: true });
  pruefe(g.includes('Drain-pH weit über dem Gießwasser'), 'Drain-pH: „Drain-pH weit über dem Gießwasser“ — ' + g.join(' | '));

  // Kein „Runoff“ und kein „dauer-feucht“ in irgendeiner Begründung
  const labels = JSON.parse(E('JSON.stringify({ l: Object.keys(DIAG_LABELS.location), c: Object.keys(DIAG_LABELS.color), s: Object.keys(DIAG_LABELS.shape) })'));
  const LAGEN = [{ phase: 'bloom', restHigh: true }, { phase: 'bloom', restLow: true }, { phase: 'bloom', ecDeltaPos: true }, { phase: 'bloom', ecDeltaNeg: true },
    { phase: 'bloom', runoffDriftHigh: true }, { phase: 'bloom', runoffDriftLow: true }];
  const alt = new Set();
  for (const l of labels.l) for (const c of labels.c) for (const lage of LAGEN) {
    for (const r of gruende({ location: [l], colors: [c], shapes: [] }, lage)) if (/Runoff|dauer-feucht|Erde sehr trocken/.test(r)) alt.add(r);
  }
  for (const l of labels.l) for (const s of labels.s) for (const lage of LAGEN) {
    for (const r of gruende({ location: [l], colors: [], shapes: [s] }, lage)) if (/Runoff|dauer-feucht|Erde sehr trocken/.test(r)) alt.add(r);
  }
  pruefe(alt.size === 0, 'Begründungen ohne „Runoff“ und „dauer-feucht“ — ' + [...alt].join(' · '));

  // Der Startseiten-Hinweis sagt „Drain“, und „sehr trocken“ heißt beim Coco nicht „Erde“
  const hinweisQuelle = E('getDiagnosticHints.toString()');
  pruefe(!/Runoff/.test(hinweisQuelle) && !/Erde ist sehr trocken/.test(hinweisQuelle), 'Startseiten-Hinweis ohne „Runoff“ und „Erde ist sehr trocken“');
  // Die Kontext-Zeile über dem Ergebnis („📊 Kontext aus …“) sagt dasselbe
  const schritt4 = E('renderDiagStep4.toString()');
  pruefe(!/'Erde feucht'|'Erde trocken'|'EC steigt'/.test(schritt4) && /Topf schwer/.test(schritt4) && /Drain-EC hoch/.test(schritt4), 'Kontext-Zeile: „Topf schwer/leicht“, „Drain-EC hoch“');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
