// (v1.5.481) Gießtag-Prüfung 29.10.2026, Punkt 8: In der Mischreihenfolge braucht jedes Produkt einen eigenen Tap (toggleMixCheck).
// Neuer Knopf „✓ Alles wie im Plan gemischt“ in der Kopfzeile: setzt alle Haken der Plan-Produkte mit ihrer Plan-Menge — als
// BESTÄTIGT (kein _suggestedDoses, „✓“ statt „~“, Bilanz zählt „gegeben“); Plan-Dosis 0 bleibt unberührt; zweiter Tap ändert nichts;
// eine selbst eingetippte Menge bleibt stehen.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

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
  await warte(80);
  w.toast = () => {};
  const E = (s) => w.eval(s);
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const q = (sel) => [...w.document.querySelectorAll('#scr-entry ' + sel)];

  const info = JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S.beginnerMode = true;
    const heute = todayISO();
    const c = addCyc({ name: 'Test', startDate: isoPlus(heute, -45), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id;
    return JSON.stringify({ id: c.id, heute }); })()`));
  E(`loadPreset('rainbow_auto')`); await warte(40);
  E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(80);
  const cid = info.id;
  const tage = JSON.parse(E(`(function(){ const c = S.cycles[0]; const aus = [];
    for (let i = 40; i >= 0 && aus.length < 2; i--) { const iso = isoPlus(todayISO(), -i); const p = phase(iso, c);
      if (!p || !isGiessTag(iso, c)) continue; const a = getAction(iso, c); if (a !== 'giess' && a !== 'giess_anz') continue;
      if (getFeedWaterEffective(c, p, iso, {}) === 'water') continue;
      const d = getWeekDoses(c.id, fertPlanWeek(c, iso, p), c) || {};
      if (Object.values(d).filter(x => x > 0).length >= 3) aus.push(iso); }
    return JSON.stringify(aus); })()`));
  pruefe(tage.length === 2, 'Vorbereitung: zwei Düngertage gefunden: ' + tage.join(','));
  const [tagA, tagB] = tage;
  const oeffnen = async (iso) => { E(`setDebugDate('${iso}')`); E(`openEntry('${iso}')`); await warte(150); };
  const zeichen = () => q('.mix-chk').map(e => e.textContent.trim());
  const knopf = () => q('button').find(b => /mixAllesPlan/.test(b.getAttribute('onclick') || ''));
  const cdVon = (iso) => JSON.parse(E(`JSON.stringify(S.entries['${iso}'] && S.entries['${iso}'].cycleData['${cid}'] || {})`));

  // --- A: frischer Tag, Einsteiger ---
  await oeffnen(tagA);
  pruefe(zeichen().every(z => z === '○' || z === '∅'), 'A0 vorher noch nichts abgehakt: ' + zeichen().join(' '));
  pruefe(!!knopf() && /Alles wie im Plan gemischt/.test(knopf().textContent), 'A1 Knopf „✓ Alles wie im Plan gemischt“ in der Kopfzeile der Mischreihenfolge');
  const planZeilen = q('.mix-calc').filter(f => parseFloat(f.dataset.plan) > 0).map(f => ({ prod: f.dataset.prod, plan: parseFloat(f.dataset.plan), w: parseFloat(f.dataset.water), unit: f.dataset.unit, dez: parseInt(f.dataset.decimals, 10) }));
  const nullZeilen = q('.mix-calc').filter(f => !(parseFloat(f.dataset.plan) > 0)).map(f => f.dataset.prod);
  pruefe(planZeilen.length >= 3, 'A2 mindestens 3 Plan-Produkte (' + planZeilen.length + ')');
  if (knopf()) knopf().click();
  await warte(150);
  const z1 = zeichen();
  const anzHaken = z1.filter(z => z === '✓').length;
  pruefe(anzHaken === planZeilen.length && !z1.includes('~') && !z1.includes('○'), `A3 alle ${planZeilen.length} Plan-Produkte „✓“, keines „~“ oder „○“: ` + z1.join(' '));
  const cd = cdVon(tagA);
  const abw = planZeilen.filter(z => Math.abs((parseFloat((cd.doses || {})[z.prod]) || -1) - E(`calcDose(${z.plan}, ${z.w}, ${JSON.stringify(z.unit)}, ${isFinite(z.dez) ? z.dez : 1})`)) > 0.0001);
  pruefe(abw.length === 0, 'A4 cd.doses stimmt mit der Plan-Menge überein, Abweichungen: ' + abw.map(z => z.prod).join(','));
  pruefe(planZeilen.every(z => (cd.mixChecks || {})[z.prod] === true), 'A5 alle Plan-Produkte in mixChecks');
  pruefe(!cd._suggestedDoses || Object.keys(cd._suggestedDoses).length === 0, 'A6 kein _suggestedDoses-Kennzeichen: ' + JSON.stringify(cd._suggestedDoses));
  pruefe(nullZeilen.every(p => !(cd.mixChecks || {})[p] && !((cd.doses || {})[p] > 0)), 'A7 Produkte mit Plan-Dosis 0 unberührt');
  const bil = JSON.parse(E(`JSON.stringify(calcCycleConsumption(S.cycles[0]))`));
  pruefe(bil.length >= 3 && bil.every(b => b.totalSuggested === 0 && b.totalMeasured > 0), 'A8 Bilanz zählt die Mengen als gegeben (nicht als Vorschlag): ' + JSON.stringify(bil.map(b => [b.name, b.totalMeasured, b.totalSuggested])));
  // zweiter Tap: nichts wird weggenommen
  if (knopf()) knopf().click();
  await warte(150);
  pruefe(zeichen().filter(z => z === '✓').length === planZeilen.length, 'A9 zweiter Tap nimmt nichts weg: ' + zeichen().join(' '));

  // --- B: Tag mit Vorschlag („Erledigt“) + eine eigene Menge ---
  E(`setDebugDate('${tagB}')`);
  E(`markTodayDone('${cid}', '${tagB}')`); await warte(80);
  await oeffnen(tagB);
  pruefe(zeichen().includes('~'), 'B0 nach „Erledigt“ stehen „~“-Zeilen: ' + zeichen().join(' '));
  const erstes = q('.mix-calc').find(f => parseFloat(f.dataset.plan) > 0);
  const eigenProd = erstes.dataset.prod;
  erstes.value = '7.7';
  E(`editISO = '${tagB}'; uMixDoseTotal(document.querySelector('#scr-entry .mix-calc[data-prod="${eigenProd}"]'))`); await warte(150);
  if (knopf()) knopf().click();
  await warte(150);
  const z2 = zeichen();
  pruefe(!z2.includes('~') && !z2.includes('○'), 'B1 nach dem Knopf kein „~“ mehr: ' + z2.join(' '));
  const cdB = cdVon(tagB);
  pruefe(!cdB._suggestedDoses || Object.keys(cdB._suggestedDoses).length === 0, 'B2 Vorschläge sind bestätigt');
  pruefe(Math.abs(parseFloat(cdB.doses[eigenProd]) - 7.7) < 0.001, 'B3 eigene Menge 7.7 bleibt stehen: ' + cdB.doses[eigenProd]);

  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach(f => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})().catch((e) => { console.log('  FEHL abgebrochen: ' + ((e && e.stack) || e)); process.exit(1); });
