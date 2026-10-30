// (v1.5.486) Die Vorschau über „Änderungen sichern“ zählt einen heute noch offenen Gießtag als nächsten Guss.
//
// Vorher suchte sie mit nextGiessTag erst ab morgen: Bei Topf 11 → 15 L stand „Menge am nächsten Gießtag 2,6 → 3,2 L“ für den
// übernächsten Gießtag, während die Menge von heute um ein Viertel sprang — ohne Zeile dazu. Bedien-Prüfung 30.10.2026, Befund 7
// (ANWEISUNG.md: Wirkung sichtbar machen, mit Datum und Zahl).
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
  const zone = () => ((w.document.getElementById('cyc-save-zone') || {}).textContent || '').replace(/\s+/g, ' ');

  // Zyklus so anlegen, dass heute ein Gießtag in der Blüte ist; alle Güsse bis gestern eingetragen; dann die Einstellungen öffnen
  const lage = (heuteGegossen) => E(`(function(){ S._seedlingProtocolShown = true; S.beginnerMode = true;
    for (let t = 50; t <= 62; t++) {
      S.cycles = []; S.entries = {};
      const c = addCyc({ name: 'Test', startDate: isoPlus(todayISO(), -(t - 1)), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
        plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c];
      if (getAction(todayISO(), c) !== 'giess') continue;
      for (let d = 0; d < t - 1; d++) { const iso = isoPlus(c.startDate, d); if (isGiessTag(iso, c)) { S.entries[iso] = { cycleData: {} }; S.entries[iso].cycleData[c.id] = { water: 1500 }; } }
      if (${heuteGegossen}) { S.entries[todayISO()] = { cycleData: {} }; S.entries[todayISO()].cycleData[c.id] = { water: 1500 }; }
      selId = c.id; draft = {}; draftTouched = {}; goTo('set'); renderSet(); return c.id;
    }
    return null; })()`);

  // 1. Heute Gießtag, noch nicht gegossen: Topf 11 → 15 L nennt die Menge von heute
  const id = lage(false);
  pruefe(!!id, 'Prüflage: heute Gießtag in der Blüte');
  const vorher = E(`Math.round(waterSuggestion(S.cycles[0], phase(todayISO(), S.cycles[0]), todayISO()))`);
  E(`dd('potSize', 15)`);
  const z = zone();
  pruefe(/Menge am nächsten Gießtag \(heute\)/.test(z), 'Vorschau nennt „Menge am nächsten Gießtag (heute)“ — ' + z.slice(0, 220));
  // Die genannte neue Menge ist die, die nach dem Sichern heute gilt
  E('saveDraft()'); await new Promise((r) => setTimeout(r, 60)); E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await new Promise((r) => setTimeout(r, 80));
  const nachher = E(`Math.round(waterSuggestion(S.cycles[0], phase(todayISO(), S.cycles[0]), todayISO()))`);
  const liter = (ml) => ml >= 1000 ? String(Math.round(ml / 100) / 10).replace('.', ',') + ' L' : ml + ' ml';
  pruefe(nachher !== vorher, 'Prüflage: die Menge von heute ändert sich mit dem Topf (' + vorher + ' → ' + nachher + ')');
  pruefe(z.includes(liter(vorher) + ' → ' + liter(nachher)), `Vorschau „${liter(vorher)} → ${liter(nachher)}“ steht da — ` + z.slice(0, 220));
  // 2. Heute schon gegossen: der nächste Gießtag ist wieder ein späterer (Gegenprobe, kein „(heute)“)
  lage(true);
  E(`dd('potSize', 15)`);
  const z2 = zone();
  pruefe(!/\(heute\)/.test(z2), 'Heute schon gegossen: kein „(heute)“ — ' + z2.slice(0, 220));

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
