// (v1.5.492) Diagnose: Die Phase schließt aus, sie zeichnet nicht aus — jede passende Ursache bekommt denselben Phasen-Punkt; kein curlUp beim Foto-Bleaching; Feld vorrang für die Wasser-Ursachen.
//
// Befund (Diagnose-Umbau U1, ANBAU.md 8.2, 13.1, 13.2, 15): Einträge ohne Phasenliste (Wurzelfäule, Überwässerung, Spinnmilben) bekamen nie den Phasen-Punkt;
// sie hingen an der Datenpflege, nicht am Bild. „Alle Blätter hängend“ in der Blüte nannte den Hitzestress ohne Temperatur vor
// Wurzelfäule und Überwässerung; „Alte Blätter + Flecken + Spinnweben“ den Magnesium-Mangel vor den Spinnmilben; „Neue Blätter +
// Taco“ hatte Foto-Bleaching gleichauf mit dem Hitzestress, obwohl Taco das Bild des thermischen Stresses ist (Bleichen färbt weiß).
// Bei Gleichstand der Wasser-Ursachen gilt jetzt Überwässerung vor Überdüngung vor Wassermangel.
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

  const phase = (x) => x.grund.some((g) => /passt zur Phase/.test(g));
  // 1. Foto-Bleaching ohne curlUp, Profilbreite unverändert
  pruefe(E(`PROBLEMS.find(p => p.id === 'photo_bleaching').symptoms.shape.indexOf('curlUp')`) === -1, 'Foto-Bleaching führt kein curlUp mehr');
  pruefe(E(`PROBLEMS.find(p => p.id === 'photo_bleaching').breite`) === 7, 'Foto-Bleaching: breite bleibt 7');
  let r = diag(['newLeaves'], [], ['curlUp'], { phase: 'bloom' });
  pruefe(r[0].id === 'heat_stress' && platz(r, 'photo_bleaching') < 0, 'Neue Blätter + Taco: Hitzestress vorn, kein Foto-Bleaching (' + ids(r).join(',') + ')');
  // 2. Die Phase schließt aus, sie zeichnet nicht aus: jede Ursache, die zur Phase passen kann, bekommt denselben Punkt — auch
  //    die ohne Phasenliste. Gemessen wird der Unterschied mit und ohne Phase im Kontext.
  const punkt = (o, f, s, ph, id) => { const a = diag(o, f, s, { phase: ph }).find((x) => x.id === id), b = diag(o, f, s, {}).find((x) => x.id === id);
    return a && b ? Math.round((a.score - b.score) * 100) : null; };
  pruefe(punkt(['allLeaves'], [], ['wilting'], 'bloom', 'heat_stress') === 5 && punkt(['allLeaves'], [], ['wilting'], 'bloom', 'root_rot') === 5,
    'Blüte: Hitzestress (mit Liste) und Wurzelfäule (ohne Liste) bekommen denselben Phasen-Punkt');
  pruefe(punkt(['allLeaves'], [], ['wilting'], 'bloom', 'overwatering') === 5, 'Überwässerung hat keine Phasenliste mehr und bekommt den Punkt auch in der Blüte');
  pruefe(punkt(['buds'], [], ['wilting'], 'bloom', 'bud_rot') === 5, 'Knospenfäule (nur Blüte, Spülen) bekommt ihn in der Blüte');
  pruefe(punkt(['oldLeaves'], ['yellow'], [], 'vegi', 'k_deficiency') === 0, 'Kalium (nur Blüte) bekommt ihn im Wachstum nicht');
  // Gemessen und verworfen (30.10.2026): „Punkt nur für enge Listen“ — die beiden Bilder, an denen es falsch wurde
  r = diag(['oldLeaves'], ['yellow'], [], { phase: 'bloom' });
  pruefe(r[0].id === 'n_deficiency', 'Alte Blätter gelb (Blüte), ohne braune Ränder: Stickstoff vor Kalium (' + ids(r).join(',') + ')');
  r = diag(['newLeaves'], ['yellow'], [], { phase: 'bloom', phHigh: true });
  pruefe(['ph_lockout', 'iron_deficiency'].includes(r[0].id) && ['ph_lockout', 'iron_deficiency'].includes(r[1].id),
    'Neue Blätter gelb + pH hoch: pH-Lockout und Eisen auf Platz 1 und 2, Foto-Bleaching dahinter (' + ids(r).join(',') + ')');
  // 3. Wasser-Ursachen: Überwässerung vor Überdüngung vor Wassermangel, wo alles gleich ist
  r = diag(['allLeaves'], [], ['wilting'], { phase: 'bloom' });
  pruefe(platz(r, 'overwatering') >= 0 && platz(r, 'overwatering') < platz(r, 'underwatering'), 'Alle hängend (Blüte): Überwässerung vor Wassermangel (' + ids(r).join(',') + ')');
  pruefe(platz(r, 'root_rot') < platz(r, 'overwatering'), 'Wurzelfäule (kritisch) bleibt vor allen (' + ids(r).join(',') + ')');
  pruefe(platz(r, 'heat_stress') < 0 || platz(r, 'heat_stress') > platz(r, 'underwatering'), 'Hitzestress ohne Temperatur steht nicht mehr vor den Wasser-Ursachen');
  r = diag(['allLeaves'], [], ['wilting'], { phase: 'bloom', restHigh: true, ecDeltaPos: true });
  pruefe(platz(r, 'overwatering') < platz(r, 'nutrient_burn'), 'Topf schwer + Drain-EC hoch (hängend): Überwässerung vor Überdüngung (' + ids(r).join(',') + ')');
  r = diag(['allLeaves'], [], ['wilting'], { phase: 'bloom', ecDeltaPos: true });
  pruefe(r[0].id === 'nutrient_burn', 'Nur Drain-EC hoch (hängend): Überdüngung bleibt vorn, B01 (' + ids(r).join(',') + ')');
  // 4. Spinnmilben vor Magnesium bei Flecken + Spinnweben
  for (const ph of ['vegi', 'bloom']) { r = diag(['oldLeaves'], ['spots'], ['webs'], { phase: ph }); pruefe(r[0].id === 'spider_mites', 'Alte Blätter + Flecken + Spinnweben (' + ph + '): Spinnmilben vorn (' + ids(r).join(',') + ')'); }
  // 5. Messwerte der B-Fixes gelten weiter
  r = diag(['allLeaves'], [], ['wilting'], { phase: 'bloom', restHigh: true, restHeute: true });
  pruefe(platz(r, 'underwatering') < 0, 'B04: Topf heute schwer schließt den Wassermangel aus');
  r = diag(['allLeaves'], [], ['wilting'], { phase: 'bloom', restLow: true, restHeute: true });
  pruefe(platz(r, 'overwatering') < 0 && platz(r, 'fungus_gnats') < 0, 'B04: Topf heute leicht schließt Überwässerung und Trauermücken aus');
  // 6. Reihenfolge-Eigenschaft: bei sonst Gleichstand zählt vorrang vor der Profilbreite
  const orte = ['oldLeaves', 'newLeaves', 'allLeaves', 'buds', 'stem', 'roots'];
  const formen = ['curlDown', 'curlUp', 'wilting', 'crispy', 'burnTips', 'spotted', 'holed', 'webs'];
  let paare = 0, falsch = 0;
  for (const o of orte) for (const s of formen) for (const ctx of [{ phase: 'bloom' }, { phase: 'vegi' }, { phase: 'bloom', restHigh: true }]) {
    const x = diag([o], ['yellow', 'brown'], [s], ctx);
    for (let i = 0; i + 1 < x.length; i++) { const a = x[i], b = x[i + 1];
      if (a.score === b.score && a.mess === b.mess && a.ctxBoost === b.ctxBoost && a.abdeckung === b.abdeckung && a.rang === b.rang) { paare++; if (a.vorrang < b.vorrang) falsch++; } } }
  pruefe(paare > 20, 'Raster enthält Gleichstände (' + paare + ')');
  pruefe(falsch === 0, 'Gleichstand: vorrang nie aufsteigend (' + falsch + ' Verstöße bei ' + paare + ' Paaren)');

  // Klassische Bilder bleiben auf Platz 1 (ANBAU.md 4, 6.1, 8.2, 13)
  for (const [name, o, f, s, ctx, ok] of KLASSIK) { const x = diag(o, f, s, ctx); pruefe(ok.includes(x[0] && x[0].id), 'Klassisch: ' + name + ' → ' + ids(x).slice(0, 3).join(', ') + ' (erwartet ' + ok.join('/') + ')'); }

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || "(System)"} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
