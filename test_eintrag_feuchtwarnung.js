// (v1.5.485) Der Eintrag warnt „Topf war noch feucht … Nächstes Mal warten“ nur, wo die App vor dem Guss selbst „heute nicht
// gießen“ gesagt hätte (giessenLautMessung: voll oder feucht) oder an einem Tag ohne Gießtag über dem Gießpunkt gegossen wurde.
//
// Vorher galt jedes „Mittel“ (≥ 70) als zu früh gegossen — auch am Gießtag, an dem die Startseite bei „Mittel“ gießen lässt
// (v1.5.284: ein Knopf belegt keine drei Tage Reserve). Bedien-Prüfung 30.10.2026, Befund 1: Startseite „etwa 1500 ml gießen“,
// nach „Erledigt“ im Eintrag „Topf war noch feucht (~70 %) … Nächstes Mal warten“.
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

  // Zyklus in der Blüte (Erde), alle Güsse bis gestern eingetragen; sucht einen Tag mit bzw. ohne Gießtag ab Tag 40
  const lage = (giesstag, extra) => JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S._seedlingProtocolShown = true; S.beginnerMode = true;
    const c = addCyc({ name: 'Test', startDate: isoPlus(todayISO(), -60), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; ${extra || ''}
    let ziel = null;
    for (let d = 40; d <= 58 && !ziel; d++) { const iso = isoPlus(c.startDate, d - 1); if ((getAction(iso, c) === 'giess') === ${giesstag}) ziel = iso; }
    for (let d = 0; d < 60; d++) { const iso = isoPlus(c.startDate, d); if (iso >= ziel) break;
      if (isGiessTag(iso, c)) { S.entries[iso] = { cycleData: {} }; S.entries[iso].cycleData[c.id] = { water: 1500 }; } }
    setDebugDate(ziel);
    return JSON.stringify({ id: c.id, iso: ziel });
  })()`));
  const messen = (L, cdJs) => JSON.parse(E(`(function(){ const c = S.cycles[0], iso = ${JSON.stringify(L.iso)};
    if (!S.entries[iso]) S.entries[iso] = { cycleData: {} };
    S.entries[iso].cycleData[c.id] = ${cdJs};
    const vorher = giessenLautMessung(c, iso, true);
    const w = getEntryWarnings(S.entries[iso].cycleData[c.id], phase(iso, c), S.entries[iso], c, iso);
    return JSON.stringify({ feucht: w.some(x => /Topf war noch feucht/.test(x.text)), vorher, giesstag: isGiessTag(iso, c) });
  })()`));

  // 1. Gießtag, Hebe-Test „Mittel“ vor dem Guss, dann gegossen: keine Warnung (die App hat selbst gießen lassen)
  const L1 = lage(true);
  pruefe(!!L1.iso, 'Prüflage: Gießtag zwischen Tag 40 und 58');
  const m1 = messen(L1, `{ restPct: LIFT_FEEL_VALUES.medium, _restPctUserSet: true, water: 1500 }`);
  pruefe(m1.giesstag && (!m1.vorher || m1.vorher.giessen !== false), 'Prüflage: am Gießtag sagt die Messung „Mittel“ nicht „nicht gießen“ — ' + JSON.stringify(m1.vorher));
  pruefe(!m1.feucht, 'Gießtag + „Mittel“ + gegossen: keine Warnung „Topf war noch feucht“');
  // 2. Gießtag mit der Waage, Topf noch voll (100 %), trotzdem gegossen: Warnung (die Startseite hätte „nicht gießen“ gesagt)
  const L2 = lage(true, `c.weightMode = 'scale'; c.saturatedWeight = 9000; c.dryWeight = 5000;`);
  const m2 = messen(L2, `{ weightG: 9000, water: 1500 }`);
  pruefe(m2.vorher && m2.vorher.giessen === false, 'Prüflage: Waage voll → vor dem Guss „nicht gießen“ — ' + JSON.stringify(m2.vorher));
  pruefe(m2.feucht, 'Gießtag + Waage voll + gegossen: Warnung bleibt');
  // 3. Tag ohne Gießtag, „Mittel“, gegossen: Warnung (über dem Gießpunkt, kein Tempo-Grund)
  const L3 = lage(false);
  pruefe(!!L3.iso, 'Prüflage: Tag ohne Gießtag zwischen Tag 40 und 58');
  const m3 = messen(L3, `{ restPct: LIFT_FEEL_VALUES.medium, _restPctUserSet: true, water: 1500 }`);
  pruefe(!m3.giesstag && m3.feucht, 'Kein Gießtag + „Mittel“ + gegossen: Warnung — ' + JSON.stringify(m3));
  // 4. Gießtag, „Knapp“: keine Warnung (Gegenprobe)
  const m4 = messen(L1, `{ restPct: LIFT_FEEL_VALUES.low, _restPctUserSet: true, water: 1500 }`);
  pruefe(!m4.feucht, 'Gießtag + „Knapp“: keine Warnung');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
