// Kein Überbleibsel darf eine gesetzte Blütedauer überschreiben.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-09-03');
  const r = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const out = {}, fehler = [];
    const plan = getPlanForCycle(c);
    // Plan wie vor v1.5.51 — ohne Rückgrat, genau Patricks Fall
    delete plan.weekPhases; delete plan.phaseSkeleton;
    c.startDate = isoPlus(todayISO(), -110); c.anzuchtDays = 21; c.bloomDays = 85;
    c.iceDays = 2; c.harvestDays = 1; c.dryDays = 7; c.intFlush = 3;
    c.flushWetDays = 4; c.iceDryDays = 3; _syncFlushPhase(c);
    c.flushDryDays = 0; c._flushDryOff = true;
    c.planPause = { acc: 1, since: null, bloomBase: 85 };
    S.entries = {}; [103, 106, 109].forEach(i => S.entries[isoPlus(c.startDate, i)] = { cycleData: { [c.id]: { water: 11000 } } });
    saveS();
    out.rueckgrat = planHasSkeleton(c);

    // 1) Rendern darf die Blütedauer nicht anfassen
    for (let i = 0; i < 5; i++) fertPlanWeek(c, todayISO());
    out.nachRendern = c.bloomDays;
    if (c.bloomDays !== 85) fehler.push('Rendern hat die Blütedauer verändert (' + c.bloomDays + ')');
    if (c.planPause) fehler.push('planPause besteht nach dem Rendern weiter');

    // 2) Neu laden ebenfalls nicht — und der Rest bleibt vollständig unangetastet
    c.planPause = { acc: 1, since: null, bloomBase: 85 };
    saveS(); loadS();
    const cc = S.cycles[0];
    out.nachLaden = cc.bloomDays;
    if (cc.bloomDays !== 85) fehler.push('Laden hat die Blütedauer verändert (' + cc.bloomDays + ')');
    if (cc.planPause) fehler.push('planPause überlebt das Laden');

    // 3) Die Kette steht danach wie eingestellt
    const st = endspurtState(cc, todayISO());
    out.kette = { spuel: st.spuelStart, gaenge: st.spuelGaenge, ice: st.iceStart, ernte: st.ernteTag };
    if (st.spuelStart !== 107) fehler.push('Spülstart nicht 107 (' + st.spuelStart + ')');

    // 4) Auch mit Rückgrat unverändert
    const p2 = getPlanForCycle(cc);
    p2.weekPhases = FERT_PRESETS.sensi_amnesia_auto.weekPhases.slice();
    p2.phaseSkeleton = { ...FERT_PRESETS.sensi_amnesia_auto.phaseSkeleton };
    cc.bloomDays = 85; cc.planPause = { acc: 2, since: null, bloomBase: 85 }; saveS(); loadS();
    out.mitRueckgrat = S.cycles[0].bloomDays;
    if (S.cycles[0].bloomDays !== 85) fehler.push('mit Rückgrat verändert (' + S.cycles[0].bloomDays + ')');
    return JSON.stringify({ out, fehler });
  })()`));
  Object.entries(r.out).forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  console.log(r.fehler.length ? 'FAIL\n  ' + r.fehler.join('\n  ') : 'OK planpause');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(r.fehler.length ? 1 : 0);
})();
