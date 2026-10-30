// (v1.5.491) Diagnose: Bei gleicher Punktzahl gewinnt, wer mehr der gewählten Merkmale trifft (Abdeckung), vor dem Schweregrad.
//
// Befund (Diagnose-Umbau U2): „Weiß + Gelb oben“ in der Blüte nannte die Überdüngung („Düngung halbieren“) vor dem Foto-Bleaching,
// obwohl nur dieses beide Farben trifft (ANBAU.md 8.2: Bleichen unterscheiden, nicht düngen). Die Punktzahl zählt Bereiche (Ort,
// Farbe, Form), nicht Merkmale.
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
  // diag(Orte, Farben, Formen, Kontext) -> Top 5 mit allem, was die Sortierung liest
  const diag = (o, f, s, ctx) => JSON.parse(E(`JSON.stringify(diagnoseProblems(${JSON.stringify({ location: o, colors: f, shapes: s })}, ${JSON.stringify(ctx || {})}).map(function (x) {
    return { id: x.problem.id, pct: Math.round(x.score * 100), score: x.score, mess: x.mess, ctxBoost: x.ctxBoost, abdeckung: x.abdeckung, vorrang: x.vorrang, rang: x.rang, grund: x.contextReasons }; }))`));
  const ids = (r) => r.map((x) => x.id);
  const platz = (r, id) => ids(r).indexOf(id);
  // Klassische Bilder: [Name, Orte, Farben, Formen, Kontext, erlaubt auf Platz 1]
  const KLASSIK = [
    ['Eisen: neue Blätter gelb + pH hoch', ['newLeaves'], ['yellow'], [], { phase: 'bloom', phHigh: true }, ['iron_deficiency', 'ph_lockout']],
    ['Magnesium: alte Blätter gelb + Flecken-Muster', ['oldLeaves'], ['yellow'], ['spotted'], { phase: 'bloom' }, ['mg_deficiency']],
    ['Calcium: neue Blätter braun/Flecken + Luft feucht', ['newLeaves'], ['brown', 'spots'], ['spotted'], { phase: 'bloom', humidityHigh: true }, ['ca_deficiency']],
    ['Spinnmilben: Flecken + Spinnweben', ['allLeaves'], ['spots'], ['webs'], {}, ['spider_mites']],
    ['Knospenfäule: Blüten braun + Luft feucht', ['buds'], ['brown', 'spots'], [], { phase: 'bloom', humidityHigh: true }, ['bud_rot']],
    ['Hitzestress: Taco oben + zu warm', ['newLeaves'], ['brown'], ['curlUp'], { phase: 'bloom', tempHot: true, tempWarm: true }, ['light_burn', 'heat_stress']],
    ['Foto-Bleaching: weiß oben', ['newLeaves'], ['white'], [], { phase: 'bloom' }, ['photo_bleaching']],
    ['Foto-Bleaching: weiße Blüten', ['buds'], ['white'], [], { phase: 'bloom' }, ['photo_bleaching']],
    ['Überwässerung: hängend + Topf schwer (Wachstum)', ['allLeaves'], [], ['wilting'], { phase: 'vegi', restHigh: true, restHeute: true }, ['overwatering', 'root_rot']],
    ['Wassermangel: hängend + Topf leicht', ['allLeaves'], [], ['wilting'], { phase: 'bloom', restLow: true, restHeute: true }, ['underwatering']],
    ['Überdüngung: Spitzen braun + Drain-EC hoch', ['allLeaves'], ['brown'], ['burnTips'], { phase: 'bloom', ecDeltaPos: true }, ['nutrient_burn']],
    ['Stickstoff-Überschuss: dunkelgrün + nach unten', ['allLeaves'], ['darkGreen'], ['curlDown'], { phase: 'bloom' }, ['n_excess']],
  ];

  let r = diag(['newLeaves'], ['white', 'yellow'], [], { phase: 'bloom' });
  pruefe(r[0].id === 'photo_bleaching', 'Weiß + Gelb oben (Blüte): Foto-Bleaching vorn (' + ids(r).join(',') + ')');
  pruefe(r[0].abdeckung === 3, 'Foto-Bleaching trifft Ort und beide Farben: Abdeckung 3 (' + r[0].abdeckung + ')');
  pruefe(platz(r, 'nutrient_burn') > 0, 'Überdüngung steht nicht mehr vor dem Foto-Bleaching');
  r = diag(['newLeaves'], ['paleGreen', 'white'], [], { phase: 'bloom' });
  pruefe(r[0].id === 'photo_bleaching', 'Hellgrün + Weiß oben: Foto-Bleaching vor Lichtmangel (' + ids(r).join(',') + ')');
  // Mit „zu warm“ entscheidet weiter der Messwert (ANBAU.md 15: Messung schlägt Symptom)
  r = diag(['newLeaves'], ['white', 'yellow'], [], { phase: 'bloom', tempHot: true, tempWarm: true });
  pruefe(['light_burn', 'photo_bleaching'].includes(r[0].id) && platz(r, 'photo_bleaching') <= 1, 'Weiß + Gelb oben + zu warm: Lichtbrand/Bleaching vorn, Messwert zählt (' + ids(r).join(',') + ')');
  // Reihenfolge-Eigenschaft über ein Raster: gleiche Punkte, gleicher Messwert, gleicher Kontext → mehr Abdeckung zuerst
  const orte = ['oldLeaves', 'newLeaves', 'allLeaves', 'buds', 'stem', 'roots'];
  const farben = ['yellow', 'brown', 'paleGreen', 'white', 'darkGreen', 'purple', 'red', 'spots'];
  const formen = ['curlDown', 'curlUp', 'wilting', 'crispy', 'burnTips', 'spotted', 'holed', 'webs'];
  let paare = 0, falsch = 0, nrFalsch = 0;
  for (const o of orte) for (const f of farben) for (const f2 of farben) { if (f >= f2) continue; for (const s of formen) for (const ctx of [{ phase: 'bloom' }, {}]) {
    const x = diag([o], [f, f2], [s], ctx);
    for (let i = 0; i + 1 < x.length; i++) { const a = x[i], b = x[i + 1];
      if (a.score === b.score && a.mess === b.mess && a.ctxBoost === b.ctxBoost) { paare++; if (a.abdeckung < b.abdeckung) falsch++; }
      if (a.score < b.score) nrFalsch++; } } }
  pruefe(paare > 500, 'Raster enthält Gleichstände (' + paare + ')');
  pruefe(falsch === 0, 'Gleichstand: Abdeckung nie aufsteigend (' + falsch + ' Verstöße bei ' + paare + ' Paaren)');
  pruefe(nrFalsch === 0, 'Punktzahl bleibt vorrangig sortiert');

  // Klassische Bilder bleiben auf Platz 1 (ANBAU.md 4, 6.1, 8.2, 13)
  for (const [name, o, f, s, ctx, ok] of KLASSIK) { const x = diag(o, f, s, ctx); pruefe(ok.includes(x[0] && x[0].id), 'Klassisch: ' + name + ' → ' + ids(x).slice(0, 3).join(', ') + ' (erwartet ' + ok.join('/') + ')'); }

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || "(System)"} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
