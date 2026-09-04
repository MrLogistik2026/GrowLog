// Der Einstellungs-Entwurf darf nur zurückschreiben, was der Nutzer dort angefasst hat.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-09-02');
  const out = {}, fehler = [];
  ev(`(function(){
    const c = S.cycles[0];
    c.startDate = isoPlus(todayISO(), -109); c.anzuchtDays = 21; c.bloomDays = 86;
    c.iceDays = 2; c.harvestDays = 1; c.dryDays = 7; c.intFlush = 3;
    c.flushWetDays = 4; c.iceDryDays = 3; _syncFlushPhase(c);
    c.flushDryDays = 0; c._flushDryOff = true; delete c.flushDryFrom;
    S.entries = {}; [94, 97, 100, 103].forEach(i => S.entries[isoPlus(c.startDate, i)] = { cycleData: { [c.id]: { water: 12000 } } });
    saveS(); S.beginnerMode = false;
    selId = c.id; draft = {}; draftTouched = {};
    goTo('set'); renderSet();          // Entwurf als Momentaufnahme mit bloomDays 86
  })()`);
  out.beimOeffnen = ev(`S.cycles[0].bloomDays`);

  // Woanders etwas ändern: letzter Guss im Endspurt
  ev(`setEndspurtGuss(S.cycles[0].id, 104)`);
  await new Promise(x => setTimeout(x, 50));
  ev(`_modalResolve && _modalResolve(true)`);
  await new Promise(x => setTimeout(x, 60));
  out.nachEndspurt = ev(`S.cycles[0].bloomDays`);
  if (out.nachEndspurt !== 85) fehler.push('Endspurt-Änderung hat nicht gegriffen (' + out.nachEndspurt + ')');

  // Danach in den Einstellungen ein ANDERES Feld ändern und sichern
  ev(`goTo('set'); renderSet(); dd('intBloom', 3);`);
  ev(`saveDraft()`);
  await new Promise(x => setTimeout(x, 60));
  ev(`_modalResolve && _modalResolve(true)`);
  await new Promise(x => setTimeout(x, 60));
  const nach = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const st = endspurtState(c, todayISO()); const f = [];
    if (c.bloomDays !== 85) f.push('Sichern hat die Blütedauer zurückgesetzt (' + c.bloomDays + ')');
    if (st.spuelStart !== 107) f.push('Spülstart zurückgesprungen (' + st.spuelStart + ')');
    if (c.intBloom !== 3) f.push('das angefasste Feld wurde nicht gespeichert');
    return JSON.stringify({ out: { bloom: c.bloomDays, spuel: st.spuelStart, intBloom: c.intBloom }, fehler: f });
  })()`));
  Object.assign(out, nach.out); fehler.push(...nach.fehler);

  // Ein im Entwurf angefasstes Feld muss weiterhin ankommen
  ev(`(function(){ goTo('set'); renderSet(); dd('bloomDays', 90); })()`);
  ev(`saveDraft()`);
  await new Promise(x => setTimeout(x, 60));
  ev(`_modalResolve && _modalResolve(true)`);
  await new Promise(x => setTimeout(x, 60));
  out.bewusstGeaendert = ev(`S.cycles[0].bloomDays`);
  if (out.bewusstGeaendert !== 90) fehler.push('bewusst geänderte Blütedauer kam nicht an (' + out.bewusstGeaendert + ')');

  Object.entries(out).forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  console.log(fehler.length ? 'FAIL\n  ' + fehler.join('\n  ') : 'OK entwurf');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(fehler.length ? 1 : 0);
})();
