// (v1.5.452) Substrat, Samentüten-Wochen und Samentyp gehen beim „Sichern“ der Einstellungen nicht mehr verloren.
//
// setCycleMedium, ddSeed und _onSeedTypeChange schrieben in den Entwurf, ohne das Feld als angefasst zu markieren. Seit
// v1.5.86 schreibt saveDraft nur angefasste Felder zurück: Die Vorschau zeigte die neue Kette, „Sichern“ verwarf sie still,
// und „Änderungen sichern“ blieb stehen. Gefunden bei der Bedien-Prüfung „Einstellungen und Kopplung“ am 29.10.2026.
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
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  // Sichern; eine Rückfrage (Plan-Notizen, Pflanzen) wie ein Nutzer bestätigen
  const sichern = async () => { E('saveDraft()'); await warte(60); E('typeof _modalResolve === "function" && _modalResolve(true)'); await warte(80); };
  const neu = () => E(`(function(){ S.cycles = []; S.entries = {}; S._seedlingProtocolShown = true; S.beginnerMode = false;
    const c = addCyc({ name: 'Test', startDate: isoPlus(todayISO(), -20), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c];
    selId = c.id; draft = {}; draftTouched = {}; goTo('set'); renderSet(); return c.id; })()`);

  // 1. Substrat Erde → Coco: Substrat und Gießrhythmus des Substrats werden gespeichert
  neu();
  const vorher = JSON.parse(E('JSON.stringify({ m: S.cycles[0].medium, i: S.cycles[0].intBloom })'));
  const coco = JSON.parse(E("JSON.stringify(mediumIntervals('coco'))"));
  E("setCycleMedium('coco')");
  await sichern();
  const c1 = JSON.parse(E('JSON.stringify({ m: S.cycles[0].medium, i: S.cycles[0].intBloom })'));
  pruefe(vorher.m === 'erde' && c1.m === 'coco', `Substrat gespeichert (vorher ${vorher.m}, nachher ${c1.m})`);
  pruefe(c1.i === coco.bloom, `Gießrhythmus Blüte nach Coco (${c1.i}, erwartet ${coco.bloom})`);
  pruefe(E("JSON.stringify(draftTouched) === '{}' || Object.keys(draftTouched).every(k => JSON.stringify(draft[k]) === JSON.stringify(S.cycles[0][k]))"),
    'Nach dem Sichern steht kein ungesicherter Unterschied mehr');

  // 2. Samentüten-Wochen: Wochenangabe und daraus abgeleitete Blütetage werden gespeichert
  neu();
  const bluete0 = E('S.cycles[0].bloomDays');
  E("ddSeed('seedWeeksHi', 17)");
  const bluetEntwurf = E('draft.bloomDays');
  await sichern();
  pruefe(E('S.cycles[0].seedWeeksHi') === 17, 'Samentüten-Wochen gespeichert (' + E('S.cycles[0].seedWeeksHi') + ')');
  pruefe(bluetEntwurf !== bluete0 && E('S.cycles[0].bloomDays') === bluetEntwurf, `Blütetage aus der Tüte gespeichert (${bluete0} → Entwurf ${bluetEntwurf} → ${E('S.cycles[0].bloomDays')})`);

  // 3. Samentyp Automatic → photoperiodisch
  neu();
  E("_onSeedTypeChange('photo')");
  await sichern();
  pruefe(E('S.cycles[0].seedType') === 'photo', 'Samentyp gespeichert (' + E('S.cycles[0].seedType') + ')');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
