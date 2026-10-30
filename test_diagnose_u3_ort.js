// (v1.5.490) Ort-Abschlag in der Diagnose: Wer einen Ort gewählt hat und der Eintrag passt zu keinem, bekommt die halbe Punktzahl.
//
// Befund (Diagnose-Umbau U3, ANBAU.md 6.1 „oben oder unten?“, 15): „Neue Blätter + hängend“ in der Blüte nannte die Knospenfäule
// (NOTFALL, 38 %) ohne gewählte Blüten, „Stängel + hängend“ stellte sie an Platz 1. „Alle Blätter“ gilt als jedes Blatt (und
// umgekehrt), sonst würden Überdüngung und Wassermangel bei „Alte/Neue Blätter“ gestraft. Faktor 0,5 gemessen: Platz 1 mit falschem
// Ort trotz passender Alternative 398 → 30 von 2400 Fällen (0,6 und 0,67: 165 und 170).
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

  const abschlag = (x) => x.grund.some((g) => /Ort passt nicht/.test(g));
  // 1. Neue Blätter + hängend (Blüte): Knospenfäule ohne Blüten raus
  let r = diag(['newLeaves'], [], ['wilting'], { phase: 'bloom' });
  pruefe(platz(r, 'bud_rot') < 0 || r.find((x) => x.id === 'bud_rot').pct <= 25, 'Neue Blätter + hängend: Knospenfäule ohne gewählte Blüten nicht mehr bei 38 % (' + ids(r).join(',') + ')');
  pruefe(r[0].id === 'heat_stress', 'Neue Blätter + hängend: Hitzestress bleibt vorn (' + r[0].id + ')');
  // 2. Stängel + hängend: nicht die Knospenfäule zuerst
  r = diag(['stem'], [], ['wilting'], { phase: 'bloom' });
  pruefe(r[0].id !== 'bud_rot', 'Stängel + hängend: Knospenfäule nicht an Platz 1 (' + r[0].id + ')');
  pruefe(r[0].id === 'light_deficiency', 'Stängel + hängend: ein Eintrag mit Ort Stängel steht vorn (' + r[0].id + ')');
  const bud = r.find((x) => x.id === 'bud_rot');
  pruefe(!bud || (bud.pct <= 25 && abschlag(bud)), 'Stängel + hängend: Knospenfäule hat die halbe Punktzahl und sagt warum');
  // 3. Passt der Ort, gibt es keinen Abschlag
  r = diag(['buds'], [], ['wilting'], { phase: 'bloom' });
  const b3 = r.find((x) => x.id === 'bud_rot');
  pruefe(!!b3 && !abschlag(b3) && b3.pct >= 60, 'Blüten + hängend: Knospenfäule ohne Abschlag (' + JSON.stringify(b3) + ')');
  // 4. „Alle Blätter“ gilt als jedes Blatt und umgekehrt
  r = diag(['oldLeaves'], [], ['wilting'], { phase: 'bloom', restLow: true });
  const uw = r.find((x) => x.id === 'underwatering');
  pruefe(!!uw && !abschlag(uw), 'Alte Blätter + hängend: Wassermangel (Ort „Alle Blätter“) ohne Abschlag');
  r = diag(['allLeaves'], ['purple'], ['crispy'], { phase: 'bloom' });
  const pk = r.filter((x) => x.id === 'p_deficiency' || x.id === 'k_deficiency');
  pruefe(pk.length > 0 && !pk.some(abschlag), 'Alle Blätter + lila + trocken: Phosphor und Kalium (Ort „Alte Blätter“) ohne Abschlag');
  r = diag(['newLeaves'], [], ['burnTips'], { phase: 'bloom' });
  pruefe(r.some((x) => x.id === 'nutrient_burn' && !abschlag(x)), 'Neue Blätter + Spitzen: Überdüngung ohne Abschlag');
  pruefe(!r.some((x) => x.id === 'k_deficiency' && !abschlag(x)), 'Neue Blätter + Spitzen: Kalium-Mangel (nur alte Blätter) nur mit Abschlag');
  // 5. Ohne gewählten Ort gibt es nie einen Abschlag
  r = diag([], ['yellow'], ['wilting'], { phase: 'bloom' });
  pruefe(r.length > 0 && !r.some(abschlag), 'Ohne Ort: kein Abschlag');
  // 6. Punktzahl: genau die Hälfte
  const mit = diag(['stem'], [], ['wilting'], { phase: 'bloom' }).find((x) => x.id === 'bud_rot');
  pruefe(!!mit && Math.abs(mit.score - (1 / 3 + 0.05) * 0.5) < 1e-9, 'Abschlag = Faktor 0,5 auf die Punktzahl (' + (mit && mit.score) + ')');

  // Klassische Bilder bleiben auf Platz 1 (ANBAU.md 4, 6.1, 8.2, 13)
  for (const [name, o, f, s, ctx, ok] of KLASSIK) { const x = diag(o, f, s, ctx); pruefe(ok.includes(x[0] && x[0].id), 'Klassisch: ' + name + ' → ' + ids(x).slice(0, 3).join(', ') + ' (erwartet ' + ok.join('/') + ')'); }

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || "(System)"} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
