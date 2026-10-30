// (v1.5.438) Bei Punktgleichstand in der Diagnose schlägt ein Messwert den Phasen-Bonus.
//
// diagnoseProblems gibt jedem Eintrag, dessen Phasenliste passt, +5 Punkte. Die Liste ['vegi','bloom'] trifft aber fast
// immer zu und belegt nichts. Bei Gleichstand entschied der höhere Kontext-Bonus, und da zählten Phase und Messwert
// gleich: „Alle Blätter hängend, Blüte, Topf nass“ nannte den Hitzestress ohne jede Temperatur gleichauf mit der
// Überwässerung und vor den Trauermücken; „neue Blätter gelb, pH zu hoch“ nannte den pH-Lockout erst auf Platz 4.
// Gefunden von der Diagnose-Prüfung am 08.10.2026 (Befund B02; ANBAU.md 15: Messung schlägt Symptom).
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

  // Treffer mit Punktzahl und der Frage, ob ihr Kontext etwas aussagt (alles außer „passt zur Phase“).
  const d = (sym, ctx) => JSON.parse(E(`JSON.stringify(diagnoseProblems(${JSON.stringify(sym)}, ${JSON.stringify(ctx)})
    .map(x => ({ id: x.problem.id, p: Math.round(x.score * 1000),
      // (v1.5.490) Der Ort-Abschlag („gewählter Ort passt nicht …“) ist eine Begründung, aber kein Messwert, der etwas stützt.
      sagt: x.contextReasons.some(r => !r.startsWith('passt zur Phase') && !r.startsWith('in der späten Blüte') && !r.startsWith('gewählter Ort passt nicht')) })))`));
  const platz = (liste, id) => { const i = liste.findIndex((x) => x.id === id); return i < 0 ? 99 : i; };
  const zeig = (liste) => liste.map((x) => x.id + ' ' + x.p / 10).join(' | ');

  const HAENGEND = { location: ['allLeaves'], colors: [], shapes: ['wilting'] };

  // 1. Hängend, Blüte, Topf nass: Hitzestress hat keine Temperatur, nur die Phase — er steht hinter allen
  //    Ursachen, die der nasse Topf stützt.
  let r = d(HAENGEND, { phase: 'bloom', restHigh: true });
  for (const id of ['overwatering', 'root_rot', 'fungus_gnats']) {
    pruefe(platz(r, id) < platz(r, 'heat_stress'), `Blüte + nass: ${id} vor Hitzestress — ${zeig(r)}`);
  }
  // 2. Dasselbe in der Vegi.
  r = d(HAENGEND, { phase: 'vegi', restHigh: true });
  pruefe(platz(r, 'overwatering') === 0, `Vegi + nass: Überwässerung auf Platz 1 — ${zeig(r)}`);
  pruefe(platz(r, 'fungus_gnats') < platz(r, 'heat_stress'), `Vegi + nass: Trauermücken vor Hitzestress — ${zeig(r)}`);
  // 3. Topf trocken: Wassermangel vorn, wie bisher.
  r = d(HAENGEND, { phase: 'bloom', restLow: true });
  pruefe(platz(r, 'underwatering') === 0, `Blüte + trocken: Wassermangel auf Platz 1 — ${zeig(r)}`);
  // 4. Neue Blätter gelb, pH zu hoch: der pH-Lockout vor den Einträgen, die nur die Phase haben.
  r = d({ location: ['newLeaves'], colors: ['yellow'], shapes: [] }, { phase: 'bloom', phHigh: true });
  pruefe(platz(r, 'iron_deficiency') === 0, `pH hoch: Eisen-Mangel auf Platz 1 — ${zeig(r)}`);
  pruefe(platz(r, 'ph_lockout') === 1, `pH hoch: pH-Lockout auf Platz 2 — ${zeig(r)}`);
  // 5. Zu warm: der Hitzestress hat jetzt eine Temperatur und steht vorn.
  r = d(HAENGEND, { phase: 'bloom', tempHot: true, tempWarm: true });
  pruefe(platz(r, 'heat_stress') === 0, `Blüte + zu warm: Hitzestress auf Platz 1 — ${zeig(r)}`);

  // 6. Regel über alle Einzelauswahlen (je ein Ort, eine Farbe oder Form) und neun Lagen: Bei gleicher Punktzahl
  //    steht nie ein Eintrag mit aussagekräftigem Kontext hinter einem, der nur die Phase hat.
  const labels = JSON.parse(E('JSON.stringify({ l: Object.keys(DIAG_LABELS.location), c: Object.keys(DIAG_LABELS.color), s: Object.keys(DIAG_LABELS.shape) })'));
  const LAGEN = [{ phase: 'vegi' }, { phase: 'bloom' }, { phase: 'bloom', restHigh: true }, { phase: 'vegi', restLow: true },
    { phase: 'bloom', ecDeltaPos: true }, { phase: 'bloom', tempHot: true, tempWarm: true }, { phase: 'bloom', phHigh: true },
    { phase: 'bloom', humidityHigh: true }, { phase: 'bloom', daysToHarvestLow: true, spaetbluete: true }];
  let faelle = 0; const verstoss = [];
  for (const l of labels.l) for (const c of [null, ...labels.c]) for (const s of [null, ...labels.s]) for (const lage of LAGEN) {
    const liste = d({ location: [l], colors: c ? [c] : [], shapes: s ? [s] : [] }, lage);
    faelle++;
    for (let i = 0; i < liste.length; i++) for (let j = i + 1; j < liste.length; j++) {
      if (liste[i].p === liste[j].p && liste[j].sagt && !liste[i].sagt && verstoss.length < 5) {
        verstoss.push(`${l}/${c}/${s} ${JSON.stringify(lage)}: ${liste[j].id} hinter ${liste[i].id}`);
      }
    }
  }
  pruefe(faelle > 1000, `Regel: genug Fälle durchlaufen (${faelle})`);
  pruefe(verstoss.length === 0, `Regel: Messwert vor Phase bei Gleichstand — ${verstoss.join(' · ')}`);

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
