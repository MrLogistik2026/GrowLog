// (v1.5.440) Hängende Blätter bei gemessen hohem Drain-EC: Die Diagnose nennt die Überdüngung.
//
// ANBAU.md 1 und 5: Schlaffe Blätter heißen Trockenheit, Überwässerung oder osmotischer Entzug — bei zu viel Salz verliert die
// Pflanze Wasser an das Substrat und welkt wie im trockenen Topf. `nutrient_burn` kannte die Form „hängend“ nicht; bei
// „alle Blätter hängend“ fehlte die Überdüngung deshalb auch dann, wenn der Drain-EC gültig über dem 1,6-Fachen lag
// (Diagnose-Prüfung vom 08.10.2026, Befund B01).
// Die erste Fassung (hängend immer) wurde am 29.10.2026 gemessen und verworfen: In 108 von 4686 Fällen sprang die
// Überdüngung ohne jeden Messwert auf Platz 1, auch vor Ursachen, die eine Messung stützt (Hitze bei „zu warm“, Wurzelfäule
// bei nassem Topf, Eisen bei pH hoch). Jetzt zählt „hängend“ für sie nur mit gemessen hohem Drain-EC (`shapeWenn`).
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

  const HAENGEND_WORT = E("DIAG_LABELS.shape.wilting.label");
  // Treffer mit Punktzahl und der Frage, ob „hängend“ unter den getroffenen Symptomen steht.
  const d = (sym, ctx) => JSON.parse(E(`JSON.stringify(diagnoseProblems(${JSON.stringify(sym)}, ${JSON.stringify(ctx)})
    .map(x => ({ id: x.problem.id, p: Math.round(x.score * 100), h: x.matchedReasons.some(r => r.includes(${JSON.stringify(HAENGEND_WORT)})) })))`));
  const platz = (liste, id) => { const i = liste.findIndex((x) => x.id === id); return i < 0 ? 99 : i; };
  const zeig = (liste) => liste.map((x) => x.id + ' ' + x.p).join(' | ');
  const HAENGEND = { location: ['allLeaves'], colors: [], shapes: ['wilting'] };

  // 1. Drain-EC gemessen zu hoch: Überdüngung vorn, „hängend“ als Grund genannt.
  let r = d(HAENGEND, { phase: 'bloom', ecDeltaPos: true });
  pruefe(platz(r, 'nutrient_burn') === 0, `Drain-EC hoch: Überdüngung auf Platz 1 — ${zeig(r)}`);
  pruefe(r.length && r[0].h, `Drain-EC hoch: „${HAENGEND_WORT}“ steht unter den Gründen`);
  // 2. Dazu ein nasser Topf: Überdüngung, Wurzelfäule und Überwässerung oben (ANBAU.md 5: welk im nassen Topf).
  r = d(HAENGEND, { phase: 'bloom', ecDeltaPos: true, restHigh: true });
  pruefe(platz(r, 'nutrient_burn') < 3 && platz(r, 'overwatering') < 3 && platz(r, 'root_rot') < 3,
    `Drain-EC hoch + nass: Überdüngung, Überwässerung, Wurzelfäule auf den ersten drei Plätzen — ${zeig(r)}`);
  // 3. Ein trockener Topf: Wassermangel bleibt in der Liste.
  r = d(HAENGEND, { phase: 'bloom', ecDeltaPos: true, restLow: true });
  pruefe(platz(r, 'underwatering') < 3, `Drain-EC hoch + trocken: Wassermangel unter den ersten drei — ${zeig(r)}`);
  // 4. Ohne Drain-EC zählt „hängend“ für die Überdüngung nicht — in keiner Einzelauswahl und keiner Lage.
  const labels = JSON.parse(E('JSON.stringify({ l: Object.keys(DIAG_LABELS.location), c: Object.keys(DIAG_LABELS.color) })'));
  const LAGEN = [{}, { phase: 'vegi' }, { phase: 'bloom' }, { phase: 'bloom', restHigh: true }, { phase: 'bloom', restLow: true },
    { phase: 'bloom', tempHot: true, tempWarm: true }, { phase: 'bloom', phHigh: true }, { phase: 'bloom', humidityHigh: true }];
  let faelle = 0; const verstoss = [];
  for (const l of labels.l) for (const c of [null, ...labels.c]) for (const lage of LAGEN) {
    const liste = d({ location: [l], colors: c ? [c] : [], shapes: ['wilting'] }, lage);
    faelle++;
    const nb = liste.find((x) => x.id === 'nutrient_burn');
    if (nb && nb.h && verstoss.length < 5) verstoss.push(`${l}/${c} ${JSON.stringify(lage)}`);
  }
  pruefe(faelle > 300, `Regel: genug Fälle (${faelle})`);
  pruefe(verstoss.length === 0, `Ohne Drain-EC zählt „hängend“ für die Überdüngung — ${verstoss.join(' · ')}`);
  // 5. Verbrannte Spitzen wie bisher, auch ohne Drain-EC.
  r = d({ location: ['allLeaves'], colors: ['brown'], shapes: ['burnTips'] }, { phase: 'bloom' });
  pruefe(platz(r, 'nutrient_burn') === 0, `Verbrannte Spitzen: Überdüngung auf Platz 1 — ${zeig(r)}`);

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
