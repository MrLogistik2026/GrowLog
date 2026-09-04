// Guss verschieben: Zieltag bekommt den vollen Gießtag samt Düngeplan, Vergangenheit bleibt.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-08-22');
  const r = JSON.parse(ev(`(function(){
    const c = S.cycles[0];
    c.anzuchtDays = 28; c.bloomDays = 77; c.flushDays = 7; c.iceDays = 2; c.harvestDays = 1;
    S.entries = {}; S.beginnerMode = false; delete c.gussMoves; saveS();
    const heute = todayISO();
    S.entries[isoPlus(heute, -3)] = { cycleData: { [c.id]: { water: 12000, plantsAtWatering: 4 } } };
    saveS();
    const out = {}, fehler = [];
    const raster = () => [-3,-2,-1,0,1,2,3,4,5,6].map(d => (getAction(isoPlus(heute, d), c) || '-'));
    out.vorher = raster();
    if (out.vorher[3] !== 'giess') fehler.push('Testfall: heute ist kein Gießtag');

    doShift(c.id, 1, heute);
    out.nachher = raster();
    out.moves = JSON.parse(JSON.stringify(c.gussMoves));   // Kopie: doShift verändert das Original später
    if (out.nachher[3] !== '-') fehler.push('Ausgangstag ist weiterhin Gießtag');
    if (out.nachher[4] !== 'giess') fehler.push('Zieltag ist kein Gießtag');
    // Vergangenheit unberührt
    if (JSON.stringify(out.vorher.slice(0,3)) !== JSON.stringify(out.nachher.slice(0,3))) fehler.push('Vergangenheit hat sich geändert');
    // Folgerhythmus wandert mit: nächster Guss 3 Tage nach dem Zieltag
    if (out.nachher[7] !== 'giess') fehler.push('Folgerhythmus wandert nicht mit (' + out.nachher.join(',') + ')');
    if (out.nachher[6] === 'giess') fehler.push('alter Rhythmus läuft daneben weiter');

    // Zieltag hat den vollen Tag: Plan-Woche, Dosen, Menge
    const zielIso = isoPlus(heute, 1);
    openEntry(zielIso);
    const t = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
    out.zielHatPlan = /Düngeplan: Woche/.test(t);
    out.zielHatMenge = /Vorschlag: ~\\d+ ml/.test(t);
    out.zielHatDosen = /Plan\\/L/.test(t) || /Mischreihenfolge/.test(t);
    out.zielKarte = /Verschobener Guss von Tag/.test(t);
    if (!out.zielHatPlan) fehler.push('Zieltag ohne Düngeplan-Zeile');
    if (!out.zielHatMenge) fehler.push('Zieltag ohne Mengenvorschlag');
    if (!out.zielHatDosen) fehler.push('Zieltag ohne Dosen');
    if (!out.zielKarte) fehler.push('Zieltag ohne Erklärung');
    // Dosis-Woche = die des Zieltags
    if (getWeekDoses(c.id, fertPlanWeek(c, zielIso), c) == null) fehler.push('keine Wochendosen am Zieltag');

    // Ausgangstag erklärt sich und bietet Rückweg
    openEntry(heute);
    const t2 = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
    out.quelleKarte = /Guss verschoben/.test(t2) && /Zurücklegen auf Tag/.test(t2);
    if (!out.quelleKarte) fehler.push('Ausgangstag ohne Erklärung oder Rückweg');
    if (/Später gießen\\?/.test(t2)) fehler.push('alter Hinweis-Dialog erscheint noch');

    // Zweites Verschieben verlängert denselben Vermerk
    doShift(c.id, 1, zielIso);
    out.nachZweitem = JSON.parse(JSON.stringify(c.gussMoves));
    if (c.gussMoves.length !== 1) fehler.push('zweite Verschiebung legt eine Kette an');
    if (c.gussMoves[0].to !== isoPlus(heute, 2)) fehler.push('Ziel nach zweitem Schieben falsch');
    if (c.gussMoves[0].from !== heute) fehler.push('Ursprung ging verloren');

    // Zurücklegen
    undoGussMove(c.id, isoPlus(heute, 2));
    out.nachUndo = (c.gussMoves || []).length;
    if (out.nachUndo !== 0) fehler.push('Zurücklegen entfernt den Vermerk nicht');
    if ((getAction(heute, c) || '-') !== 'giess') fehler.push('nach dem Zurücklegen ist der Ausgangstag kein Gießtag');

    // Schutz: Tag mit echtem Guss wird nicht verschoben
    S.entries[heute] = { cycleData: { [c.id]: { water: 11000 } } }; saveS();
    const ok = moveGussDay(c.id, heute, 1);
    out.schutzGuss = ok === false;
    if (ok !== false) fehler.push('ein Tag mit eingetragenem Guss ließ sich verschieben');
    delete S.entries[heute]; saveS();

    // Schutz: nicht in die Vergangenheit
    const ok2 = moveGussDay(c.id, heute, -5);
    out.schutzVergangenheit = ok2 === false;
    if (ok2 !== false) fehler.push('Verschieben in die Vergangenheit war möglich');
    delete c.gussMoves; saveS();
    return JSON.stringify({ out, fehler });
  })()`));
  Object.entries(r.out).forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  console.log(r.fehler.length ? 'FAIL\n  ' + r.fehler.join('\n  ') : 'OK gussmove');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(r.fehler.length ? 1 : 0);
})();
