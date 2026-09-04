// Die Gießmenge folgt dem, was die Pflanze wirklich trinkt — kein Sprung an der Phasengrenze.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-08-20');
  const r = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const out = {}, fehler = [];
    const aufbau = (range) => {
      c.startDate = isoPlus(todayISO(), -96);          // heute = Tag 97
      c.anzuchtDays = 21; c.bloomDays = 85; c.intBloom = 3;
      c.plants = [1, 2, 3].map(i => ({ id: 'p' + i, label: 'P' + i, addedAt: c.startDate }));
      c.scaleByPlants = true;
      S.entries = {};
      [82, 85, 88, 91, 94].forEach(d => {
        S.entries[isoPlus(c.startDate, d - 1)] = { cycleData: { [c.id]: { water: 9000, plantsAtWatering: 3 } } };
      });
      if (range) c.waterRange = range; else delete c.waterRange;
      saveS();
    };
    const menge = (d) => { const i = isoPlus(c.startDate, d - 1); return waterSuggestion(c, phase(i, c), i); };

    // 1) Gemessener Bedarf wird erkannt
    aufbau(null);
    out.gemessen = _measuredPerPlant(c, todayISO());
    if (out.gemessen !== 3000) fehler.push('gemessener Bedarf falsch (' + out.gemessen + ')');

    // 2) Der Standard-Korridor unterbietet die Messung nicht mehr
    const std = getPhaseRange(c, 'reife');
    out.standardKorridor = std ? std.min + '-' + std.max : null;
    out.vorschlag = menge(97);
    if (out.vorschlag < 8000) fehler.push('Vorschlag fällt unter den gemessenen Bedarf (' + out.vorschlag + ')');
    if (std && 3000 <= std.max) fehler.push('Testfall greift nicht — Messung liegt im Standard-Korridor');

    // 3) Kein Sprung über die Phasengrenze hinweg
    const reihe = [88, 91, 94, 97, 100, 103].map(menge);
    out.reihe = reihe;
    for (let i = 1; i < reihe.length; i++) {
      if (reihe[i - 1] > 0 && Math.abs(reihe[i] - reihe[i - 1]) / reihe[i - 1] > 0.15) {
        fehler.push('Sprung von ' + reihe[i - 1] + ' auf ' + reihe[i] + ' ml');
      }
    }

    // 4) Ein SELBST gesetzter Korridor bleibt die Steuerung — die Menge gleitet dorthin
    aufbau({ reife: { min: 500, max: 800 } });
    const verlauf = [];
    for (let d = 97; d <= 106; d += 3) {
      const i = isoPlus(c.startDate, d - 1);
      const ml = waterSuggestion(c, phase(i, c), i);
      verlauf.push(Math.round(ml / 3));
      S.entries[i] = { cycleData: { [c.id]: { water: ml, plantsAtWatering: 3 } } };
      saveS();
    }
    out.gleitet = verlauf;
    if (!(verlauf[0] > verlauf[verlauf.length - 1])) fehler.push('Menge gleitet nicht auf den eigenen Korridor zu');
    for (let i = 1; i < verlauf.length; i++) {
      if ((verlauf[i - 1] - verlauf[i]) / verlauf[i - 1] > 0.15) fehler.push('Absenkung zu ruckartig: ' + verlauf[i - 1] + ' → ' + verlauf[i]);
    }

    // 5) Ins Spülen darf die Menge springen — dort ist mehr Absicht
    aufbau(null);
    const vorFlush = menge(103);
    const imFlush = menge(112);
    out.flush = { vorher: vorFlush, imFlush };
    if (imFlush <= vorFlush) fehler.push('Spülmenge wird von der Rampe gebremst (' + imFlush + ')');

    // 6) Spül- und Anzuchttage zählen nicht als Messgrundlage
    aufbau(null);
    S.entries[isoPlus(c.startDate, 111)] = { cycleData: { [c.id]: { water: 30000, plantsAtWatering: 3 } } };
    saveS();
    out.gemessenNachFlush = _measuredPerPlant(c, isoPlus(c.startDate, 115));
    if (out.gemessenNachFlush > 4000) fehler.push('ein Spülgang verfälscht den gemessenen Bedarf');
    return JSON.stringify({ out, fehler });
  })()`));
  Object.entries(r.out).forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  console.log(r.fehler.length ? 'FAIL\n  ' + r.fehler.join('\n  ') : 'OK gussmenge');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(r.fehler.length ? 1 : 0);
})();
