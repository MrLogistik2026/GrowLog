// (v1.5.XXX) Diagnose-Reste: Mehltau und Foto-Bleaching nebeneinander mit Unterscheidungskriterium, „Löcher“ ohne Fantasietreffer,
// „Neue Blätter + gelb“ ohne pH mit Eisen und Calcium unter den ersten fünf (ANBAU.md 6.1, 8.2, 13.5, 15).
//
// Befund (Fachprüfung 30.10.2026): „Weiß + Flecken“ nannte Foto-Bleaching mit 100 % vor Echtem Mehltau mit 77 % (kein Hinweis, wie man sie
// trennt); „Löcher“ ist wählbar, kein Eintrag führt es — Ergebnis waren Treffer nach dem Ort allein (Wurzelfäule, Spinnmilben, je 38 %);
// bei „Neue Blätter + gelb“ ohne pH-Angabe standen Eisen- und Calcium-Mangel nicht in den ersten fünf, obwohl die unbeweglichen Nährstoffe
// nach ANBAU.md 6.1 genau dort auftreten.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');
async function lade() {
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
  return { w, E: (s) => w.eval(s), errors };
}

(async () => {
  const { w, E, errors } = await lade();
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const diag = (sym, ctx) => JSON.parse(E(`JSON.stringify(diagnoseProblems(${JSON.stringify(sym)}, ${JSON.stringify(ctx || {})}).map(function (x) { return { id: x.problem.id, score: x.score }; }))`));
  const ids = (sym, ctx) => diag(sym, ctx).map(x => x.id);
  // 1. Weiß + Flecken: beide Bilder stehen oben, bei hoher Luftfeuchte zuerst der Mehltau
  const aw = ids({ location: ['allLeaves'], colors: ['white'], shapes: ['spotted'] }, { phase: 'bloom', humidityHigh: true });
  pruefe(aw[0] === 'powdery_mildew' && aw[1] === 'photo_bleaching', 'Weiß + Flecken, alle Blätter, feucht: Mehltau, dann Bleaching (' + aw.slice(0, 3) + ')');
  const awd = diag({ location: ['allLeaves'], colors: ['white'], shapes: ['spotted'] }, { phase: 'bloom' });
  const m = awd.find(x => x.id === 'powdery_mildew'), b = awd.find(x => x.id === 'photo_bleaching');
  pruefe(m && b && m.score === b.score, 'Weiß + Flecken, alle Blätter: Mehltau und Bleaching gleich bewertet (' + (m && m.score) + ' / ' + (b && b.score) + ')');
  pruefe(ids({ location: ['buds'], colors: ['white'], shapes: ['spotted'] }, { phase: 'bloom' })[0] === 'photo_bleaching', 'Weiß + Flecken an den Blüten: Foto-Bleaching zuerst');
  pruefe(ids({ location: ['newLeaves'], colors: ['white'], shapes: [] }, { phase: 'bloom' })[0] === 'photo_bleaching', 'Weiß oben (Bild „Weiß oben“): Foto-Bleaching bleibt zuerst');
  // Beide Texte tragen das Unterscheidungskriterium
  const texte = JSON.parse(E(`JSON.stringify(PROBLEMS.filter(function (p) { return p.id === 'powdery_mildew' || p.id === 'photo_bleaching'; }).map(function (p) { return [p.id, p.description]; }))`));
  const tx = Object.fromEntries(texte);
  pruefe(/abwischen/.test(tx.powdery_mildew) && /Bleaching/.test(tx.powdery_mildew), 'Mehltau-Text: abwischbar, Abgrenzung zum Bleaching');
  pruefe(/abwischen/.test(tx.photo_bleaching) && /Mehltau/.test(tx.photo_bleaching), 'Bleaching-Text: nicht abwischbar, Abgrenzung zum Mehltau');
  // 2. „Löcher“: ehrlich leer, wenn es das einzige Merkmal ist
  for (const o of ['allLeaves', 'newLeaves', 'oldLeaves']) pruefe(ids({ location: [o], colors: [], shapes: ['holed'] }, { phase: 'bloom' }).length === 0, 'Löcher, ' + o + ': kein Fantasietreffer');
  pruefe(ids({ location: ['allLeaves'], colors: ['yellow'], shapes: ['holed'] }, { phase: 'bloom' }).length > 0, 'Löcher + gelb: die Farbe wird weiter gewertet');
  // Anzeige: Rückmeldung nennt „Löcher“
  const schritt4 = (loc, col, shp) => { E(`diagState.location = ${JSON.stringify(loc)}; diagState.colors = ${JSON.stringify(col)}; diagState.shapes = ${JSON.stringify(shp)}; diagState.cycleId = null;`); return E('renderDiagStep4()').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); };
  const s1 = schritt4(['allLeaves'], [], ['holed']);
  pruefe(/Keine klare Übereinstimmung/.test(s1) && /Löcher/.test(s1), 'Ergebnisseite „Löcher“: „Keine klare Übereinstimmung“, nennt „Löcher“');
  pruefe(/kennt die App nicht/.test(s1) && /Lupe/.test(s1) && /Foto/.test(s1) && /nicht, dass es harmlos ist/.test(s1) && !/muss nicht schlimm sein/.test(s1) && !/Einträge in der Liste/.test(s1), 'Ergebnisseite „Löcher“: Handgriff (Lupe, Foto), „nicht harmlos“, kein „muss nicht schlimm sein“, keine Programmiersprache');
  const s2 = schritt4(['allLeaves'], ['yellow'], ['holed']);
  pruefe(/Wahrscheinlichste Ursachen/.test(s2) && /Löcher/.test(s2) && /kennt die App nicht und hat sie nicht mitgewertet — gewertet sind nur die anderen Merkmale/.test(s2), 'Ergebnisseite „Löcher + gelb“: Hinweis, dass „Löcher“ nicht mitgewertet ist');
  const s3 = schritt4(['allLeaves'], ['yellow'], ['wilting']);
  pruefe(!/gewertet sind nur die anderen Merkmale/.test(s3), 'Ohne Form ohne Bild kein Hinweis');
  // 3. Neue Blätter + gelb ohne pH: Eisen und Calcium unter den ersten fünf
  for (const ph of ['bloom', 'vegi']) { const r = ids({ location: ['newLeaves'], colors: ['yellow'], shapes: [] }, { phase: ph }); pruefe(r.includes('iron_deficiency') && r.includes('ca_deficiency'), 'Neue Blätter + gelb (' + ph + '), ohne pH: Eisen und Calcium in den ersten fünf (' + r + ')'); }
  const mitPh = ids({ location: ['newLeaves'], colors: ['yellow'], shapes: [] }, { phase: 'bloom', phHigh: true });
  pruefe(['iron_deficiency', 'ph_lockout'].includes(mitPh[0]), 'Mit pH zu hoch: Eisen oder pH-Lockout zuerst (' + mitPh[0] + ')');
  // Alte Blätter gelb bleibt Stickstoff/Magnesium; Schädlinge bleiben vorn
  pruefe(['n_deficiency', 'mg_deficiency', 'k_deficiency'].includes(ids({ location: ['oldLeaves'], colors: ['yellow'], shapes: [] }, { phase: 'bloom' })[0]), 'Alte Blätter gelb: weiter ein beweglicher Nährstoff zuerst');
  pruefe(ids({ location: ['newLeaves'], colors: ['spots'], shapes: ['webs'] }, {})[0] === 'spider_mites', 'Spinnweben: Spinnmilben bleiben vorn (NOTFALL vor Nährstoff)');
  pruefe(ids({ location: ['newLeaves'], colors: ['brown'], shapes: ['burnTips'] }, { phase: 'bloom', tempHot: true })[0] === 'light_burn', 'Verbrannte Spitzen oben + zu warm: Lichtbrand zuerst (Messwert schlägt Ort)');
  pruefe(errors.length === 0, 'Keine JS-Fehler: ' + errors.slice(0, 2).join(' | '));
  console.log(fehler.length ? 'FEHLER (' + fehler.length + ' von ' + n + '):\n - ' + fehler.join('\n - ') : 'OK (' + n + ' Prüfungen)');
  process.exit(fehler.length ? 1 : 0);
})();
