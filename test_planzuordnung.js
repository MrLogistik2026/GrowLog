// Ein geladener Plan muss auch der Plan sein, mit dem der Grow rechnet.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-09-02');
  const out = {}, fehler = [];
  ev(`(function(){
    const c = S.cycles[0];
    c.startDate = isoPlus(todayISO(), -109); c.anzuchtDays = 21; c.bloomDays = 85; c.intBloom = 3;
    saveS(); loadPreset('biobizz_master');
  })()`);
  await new Promise(x => setTimeout(x, 40));
  ev(`_modalResolve && _modalResolve(true)`);
  await new Promise(x => setTimeout(x, 80));
  const r = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const f = [], o = {};
    const plan = S.fertPlans.find(p => p.presetKey === 'biobizz_master');
    o.gleich = c.fertPlanId === S._activePlanId;
    o.zyklusPlan = plan && c.fertPlanId === plan.id;
    if (!plan) f.push('Plan wurde nicht angelegt');
    if (!o.gleich) f.push('Bearbeitungs-Plan und Zyklus-Plan gehen auseinander');
    if (!o.zyklusPlan) f.push('Der Zyklus rechnet nicht mit dem geladenen Plan');

    // Der Tageseintrag muss die Werte des geladenen Plans zeigen
    const pc = getPlanForCycle(c);
    o.planName = pc ? pc.name : null;
    if (!pc || pc.presetKey !== 'biobizz_master') f.push('getPlanForCycle liefert einen anderen Plan');
    if (pc) {
      const w = fertPlanWeek(c, isoPlus(c.startDate, 34));   // Tag 35
      o.woche = w;
      const row = pc.schedule['w' + w] || {};
      const nach = {}; pc.products.forEach(p => { if (row[p.id] != null) nach[p.name] = row[p.id]; });
      o.dosen = nach;
      const soll = FERT_PRESETS.biobizz_master.schedule[w] || {};
      Object.keys(soll).forEach(nm => {
        if (Math.abs((nach[nm] || 0) - soll[nm]) > 0.001) f.push('Woche ' + w + ' „' + nm + '": ' + (nach[nm] ?? '-') + ' statt ' + soll[nm]);
      });
    }
    return JSON.stringify({ o, f });
  })()`));
  Object.assign(out, r.o); fehler.push(...r.f);

  // Erneutes Laden desselben Presets (Wechsel-Zweig) darf die Zuordnung nicht lösen
  ev(`(function(){ S._activePlanId = S.fertPlans[0].id; S.cycles[0].fertPlanId = S.fertPlans[0].id; saveS(); loadPreset('biobizz_master'); })()`);
  await new Promise(x => setTimeout(x, 40));
  ev(`_modalResolve && _modalResolve(true)`);
  await new Promise(x => setTimeout(x, 80));
  const r2 = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const f = [];
    const plan = S.fertPlans.find(p => p.presetKey === 'biobizz_master');
    if (c.fertPlanId !== plan.id) f.push('nach dem Wechsel zeigt der Zyklus wieder woanders hin');
    if (S._activePlanId !== plan.id) f.push('Bearbeitungs-Plan nach dem Wechsel falsch');
    return JSON.stringify({ o: { nachWechsel: c.fertPlanId === plan.id }, f });
  })()`));
  Object.assign(out, r2.o); fehler.push(...r2.f);

  Object.entries(out).forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  console.log(fehler.length ? 'FAIL\n  ' + fehler.join('\n  ') : 'OK planzuordnung');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(fehler.length ? 1 : 0);
})();
