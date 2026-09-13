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

    // Fall A: Wechsel ohne Dosisänderung (Woche 9 → 10 im Rainbow-Plan, beide Bio-Bloom 1,2)
    // (v1.5.133) Vorher Woche 13 → 14 im Sensi-Plan, der durch den Rainbow-Plan ersetzt ist.
    // Wochengrenzen sind 0-indiziert: bounds[8] ist das Ende von Woche 9.
    c.startDate = isoPlus(todayISO(), -98); saveS();
    const wechselA = b()[8] + 1;   // erster Tag von Woche 10
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

    // Fall B: Wechsel MIT Dosisänderung (Woche 12 → 13, die Rampe: Bio-Grow und Silica fallen
    // weg, Bio-Bloom geht von 1,2 auf 0,5). bounds[11] ist das Ende von Woche 12.
    const wechselB = b()[11] + 1;   // erster Tag von Woche 13
    stelleAuf(wechselB);
    openEntry(todayISO());
    t = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
    out.B_woche = fertPlanWeek(c, todayISO());
    out.B_bioGrowWeg = /Bio-Grow .* → weg/.test(t);
    out.B_silicaWeg = /Silica Force .* → weg/.test(t);
    out.B_biobloomRunter = /Bio-Bloom 1,2 → 0,5/.test(t);
    if (out.B_woche !== 13) fehler.push('B: nicht auf dem Wechsel zu Woche 13 (' + out.B_woche + ')');
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
