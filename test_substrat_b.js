// (v1.5.XXX) „CalMag Pflicht“ gilt in Coco nur bei ungepuffertem Substrat (ANBAU.md 7.1, 3; UEBERGABE 10 „CalMag-Reste“).
//
// Befund (Fachprüfung 30.10.2026): Die CANNA-Coco-Vorlage nannte CalMag „Pflicht in Coco!“, „durchgehend Pflicht“, „daher Pflicht“; Wizard und
// Lexikon-Anzucht übernahmen es. Ungepuffertes Coco bindet Calcium aus der Lösung; vorgepuffertes ist mit Calcium vorbeladen und verhält
// sich anfangs neutraler. Der Satz braucht seine Gültigkeitsbedingung (Regel 1). Keine Dosis ändert sich.
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
  const { E, errors } = await lade();
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const Q = require('fs').readFileSync(process.env.GS_INDEX || require('path').join(__dirname, 'index.html'), 'utf8');
  const v = JSON.parse(E(`JSON.stringify(FERT_PRESETS.canna_coco)`));
  const alles = [v.mixInfo, v.drainInfo, ...(v.products || []).map(p => p.note || ''), ...Object.values(v.weekFocus || {}).map(f => f.tip || '')].join(' ‖ ');
  pruefe(!/Pflicht in Coco|durchgehend Pflicht|daher Pflicht/.test(alles), 'canna_coco: kein „Pflicht“ ohne Bedingung (' + (alles.match(/.{20}Pflicht.{20}/) || [''])[0] + ')');
  pruefe(/ungepuffert/.test(v.mixInfo) && /ungepuffert/.test(v.drainInfo), 'mixInfo und drainInfo nennen die Bedingung „ungepuffert“');
  const cal = (v.products || []).find(p => p.name === 'CalMag');
  pruefe(cal && /ungepuffert/.test(cal.note), 'Produktnotiz CalMag nennt die Bedingung');
  pruefe(/vorgepuffert/.test(v.drainInfo), 'drainInfo nennt, dass vorgepuffertes Coco anfangs neutraler ist');
  pruefe(/weichem Wasser|RO-/.test(v.drainInfo), 'drainInfo nennt Wasser (RO/weich) als zweite Bedingung');
  pruefe(!/CalMag Pflicht · jeder Guss/.test(Q), 'Wizard-Zeile der CANNA-Coco-Vorlage ohne „CalMag Pflicht“');
  pruefe(!/A+B Mineral · CalMag bei ungepuffertem Coco/.test(Q) && /A\+B Mineral · mit CalMag · jeder Guss ist ein Feed/.test(Q), 'Wizard-Zeile: „mit CalMag“ (der Plan dosiert es in jeder Woche)');
  pruefe(!/braucht es (anfangs )?kaum|braucht sie anfangs kaum/.test(Q), 'Nirgends „braucht es kaum“ für vorgepuffertes Coco');
  pruefe(/CalMag laut Plan dazugeben/.test(v.weekFocus[1].tip) && /neutraler/.test(v.weekFocus[1].tip) && /weichem Wasser/.test(v.weekFocus[1].tip), 'Woche 1: CalMag laut Plan, vorgepuffert „neutraler“, weiches Wasser in jedem Substrat');
  pruefe(/CalMag in kleiner Menge laut Plan oder Flasche/.test(Q) && !/~0\.3 ml\/L\), kein voller/.test(Q), 'Lexikon Sämling Coco: CalMag laut Plan oder Flasche, ohne feste Dosis');
  pruefe(!/Coco: Vom ersten Tag an Vegi-Dünger \+ CalMag/.test(Q), 'Lexikon Anzucht: kein pauschales „Coco … + CalMag“');
  pruefe(!/Ab Tag 1 leichte CalMag-Lösung \(~0\.3 ml\/L\), kein voller Dünger/.test(Q), 'Lexikon Sämling: CalMag-Lösung an Bedingung geknüpft');
  // Dosen unverändert (Fingerabdruck der CalMag-Dosen je Woche)
  const sch = JSON.parse(E(`JSON.stringify(FERT_PRESETS.canna_coco.schedule)`));
  pruefe(sch[2].CalMag === 0.4 && sch[9].CalMag === 0.3 && sch[1].CalMag === 0.3, 'CalMag-Dosen unverändert (0,3 / 0,4 / 0,3)');
  pruefe(/Light-Mix: vorgedüngt, braucht in den ersten zwei bis drei Wochen praktisch nichts/.test(Q) && !/Ab Woche 2 mit halber Dosis/.test(Q), 'Lexikon Light-Mix nach ANBAU.md 13.2');
  pruefe(errors.length === 0, 'Keine JS-Fehler');
  console.log(fehler.length ? 'FEHLER (' + fehler.length + ' von ' + n + '):\n - ' + fehler.join('\n - ') : 'OK (' + n + ' Prüfungen)');
  process.exit(fehler.length ? 1 : 0);
})();
