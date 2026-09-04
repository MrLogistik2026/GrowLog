// Jeder Düngeplan dehnt sich auf die tatsächliche Blütedauer.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-09-02');
  const r = JSON.parse(ev(`(function(){
    const out = {}, fehler = [];

    // 1) Jeder Plan hat ein vollständiges, sinnvoll geordnetes Rückgrat
    const ordnung = { anzucht: 0, bloom: 1, flush: 2, ice: 3 };
    Object.keys(FERT_PRESETS).forEach(k => {
      const p = FERT_PRESETS[k];
      const wochen = Object.keys(p.schedule).length;
      if (!Array.isArray(p.weekPhases)) { fehler.push(k + ': kein weekPhases'); return; }
      if (p.weekPhases.length !== wochen) fehler.push(k + ': ' + p.weekPhases.length + ' Etiketten für ' + wochen + ' Wochen');
      let letzte = -1;
      p.weekPhases.forEach((ph, i) => {
        if (!(ph in ordnung)) { fehler.push(k + ': unbekannte Phase „' + ph + '"'); return; }
        if (ordnung[ph] < letzte) fehler.push(k + ': Phasen laufen rückwärts bei Woche ' + (i + 1));
        letzte = Math.max(letzte, ordnung[ph]);
      });
      if (p.weekPhases[0] !== 'anzucht') fehler.push(k + ': beginnt nicht mit der Anzucht');
      if (!p.weekPhases.includes('bloom')) fehler.push(k + ': keine Blütewoche');
    });
    out.plaene = Object.keys(FERT_PRESETS).length;

    // 2) Dehnung: lange Blüte darf nicht auf der letzten Blütewoche hängenbleiben
    const c = S.cycles[0];
    const pruefe = (presetKey, bloomDays) => {
      c.startDate = isoPlus(todayISO(), -109); c.anzuchtDays = 21; c.bloomDays = bloomDays;
      const np = JSON.parse(JSON.stringify(FERT_PRESETS[presetKey]));
      np.id = 'p_' + presetKey + '_' + bloomDays; S.fertPlans.push(np); c.fertPlanId = np.id; saveS();
      const wochen = [];
      for (let d = 22; d <= 21 + bloomDays; d++) wochen.push(fertPlanWeek(c, isoPlus(c.startDate, d - 1)));
      const bloomWochen = np.weekPhases.map((ph, i) => ph === 'bloom' ? i + 1 : null).filter(Boolean);
      // Jede Blütewoche des Plans muss auch vorkommen
      const fehlend = bloomWochen.filter(w => !wochen.includes(w));
      // Keine Woche darf länger als ein Drittel der Blüte am Stück laufen
      let maxLauf = 1, lauf = 1;
      for (let i = 1; i < wochen.length; i++) {
        if (wochen[i] === wochen[i - 1]) { lauf++; maxLauf = Math.max(maxLauf, lauf); } else lauf = 1;
      }
      return { erste: wochen[0], letzte: wochen[wochen.length - 1], fehlend, maxLauf, grenze: Math.ceil(bloomDays / 3) };
    };

    ['biobizz_master', 'hesi', 'canna_coco'].forEach(k => {
      [49, 85].forEach(bd => {
        const e = pruefe(k, bd);
        out[k + '_' + bd] = { erste: e.erste, letzte: e.letzte, maxLauf: e.maxLauf, fehlend: e.fehlend };
        if (e.fehlend.length) fehler.push(k + '/' + bd + ' Tage: Blütewochen ' + e.fehlend.join(',') + ' kommen nie vor');
        if (e.maxLauf > e.grenze) fehler.push(k + '/' + bd + ' Tage: Woche bleibt ' + e.maxLauf + ' Tage stehen (Grenze ' + e.grenze + ')');
      });
    });

    // 3) Die Spülwoche des Plans fällt mit der Spülphase des Zyklus zusammen
    c.bloomDays = 85; c.flushWetDays = 4; c.iceDryDays = 3; _syncFlushPhase(c); saveS();
    const flushIso = isoPlus(c.startDate, 21 + 85);      // erster Spültag
    const wFlush = fertPlanWeek(c, flushIso);
    const plan = getPlanForCycle(c);
    out.spuelwoche = { woche: wFlush, etikett: plan.weekPhases[wFlush - 1] };
    if (plan.weekPhases[wFlush - 1] !== 'flush') fehler.push('Spülphase trifft nicht die Spülwoche des Plans (Woche ' + wFlush + ')');
    return JSON.stringify({ out, fehler });
  })()`));
  Object.entries(r.out).forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  console.log(r.fehler.length ? 'FAIL\n  ' + r.fehler.join('\n  ') : 'OK planrueckgrat');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(r.fehler.length ? 1 : 0);
})();
