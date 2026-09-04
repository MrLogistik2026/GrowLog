// Die Wochenfrage muss die FOLGEN beider Antworten zeigen, nicht nur die Regel.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-08-22');
  const r = JSON.parse(ev(`(function(){
    const c = S.cycles[0];
    c.anzuchtDays = 28; c.bloomDays = 77; c.flushDays = 7; c.iceDays = 2; c.harvestDays = 1;
    S.beginnerMode = true; S.entries = {};
    const out = {}, fehler = [];
    const stelleAuf = (wechselTag) => { c.startDate = isoPlus(todayISO(), -(wechselTag - 1)); delete c.planWeekAck; delete c.planHoldUntil; saveS(); };
    const b = () => planWeekBounds(c);

    // Fall A: Wechsel ohne Dosisänderung (Woche 13 → 14)
    c.startDate = isoPlus(todayISO(), -98); saveS();
    const wechselA = b().find(x => x > 90) + 1;
    stelleAuf(wechselA);
    openEntry(todayISO());
    let t = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
    out.A_frage = /ist durch. Weiter zu Woche/.test(t);
    out.A_weiterBlock = /Wenn du weitergehst/.test(t);
    out.A_dranBlock = /Wenn du dranbleibst/.test(t);
    out.A_gleich = /Dosierung bleibt gleich/.test(t);
    out.A_ernteBleibt = /Ernte bleibt Tag 115/.test(t);
    out.A_ernteRueckt = /Ernte Tag 115 → 118/.test(t);
    out.A_spuelRueckt = /Spülen Tag 106 → 109/.test(t);
    if (!out.A_frage) fehler.push('A: keine Wochenfrage');
    if (!out.A_weiterBlock || !out.A_dranBlock) fehler.push('A: eine der beiden Folgen fehlt');
    if (!out.A_gleich) fehler.push('A: unveränderte Dosierung wird nicht benannt');
    if (!out.A_ernteBleibt) fehler.push('A: „Ernte bleibt" fehlt');
    if (!out.A_ernteRueckt || !out.A_spuelRueckt) fehler.push('A: verschobene Termine fehlen');
    if (/Spülen und Ernte rücken mit\\./.test(t)) fehler.push('A: alter Pauschaltext steht noch da');

    // Fall B: Wechsel MIT Dosisänderung (Woche 14 → 15: Bio-Grow und Silica fallen weg)
    // Wochengrenzen sind 0-indiziert: bounds[13] ist das Ende von Woche 14.
    const wechselB = b()[13] + 1;   // erster Tag von Woche 15
    stelleAuf(wechselB);
    openEntry(todayISO());
    t = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
    out.B_woche = fertPlanWeek(c, todayISO());
    out.B_bioGrowWeg = /Bio-Grow .* → weg/.test(t);
    out.B_silicaWeg = /Silica Force .* → weg/.test(t);
    out.B_biobloomRunter = /Bio-Bloom 1 → 0,75/.test(t);
    if (out.B_woche !== 15) fehler.push('B: nicht auf dem Wechsel zu Woche 15 (' + out.B_woche + ')');
    if (!out.B_bioGrowWeg) fehler.push('B: Wegfall von Bio-Grow wird nicht gezeigt');
    if (!out.B_silicaWeg) fehler.push('B: Wegfall von Silica wird nicht gezeigt');
    if (!out.B_biobloomRunter) fehler.push('B: Reduktion von Bio-Bloom wird nicht gezeigt');
    if (/Dosierung bleibt gleich/.test(t)) fehler.push('B: behauptet fälschlich unveränderte Dosierung');

    // Beide Knöpfe weiterhin da, plus Hinweis auf Umkehrbarkeit
    out.knoepfe = /Weiter zu Woche/.test(t) && /Noch dranbleiben/.test(t);
    out.umkehrbar = /rückgängig machen/.test(t);
    if (!out.knoepfe) fehler.push('ein Knopf fehlt');
    if (!out.umkehrbar) fehler.push('Hinweis auf Umkehrbarkeit fehlt');
    return JSON.stringify({ out, fehler });
  })()`));
  Object.entries(r.out).forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  console.log(r.fehler.length ? 'FAIL\n  ' + r.fehler.join('\n  ') : 'OK wochenfolgen');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(r.fehler.length ? 1 : 0);
})();
