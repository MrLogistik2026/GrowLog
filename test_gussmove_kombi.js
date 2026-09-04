// Zusammenspiel: Verschieben + Vorziehen, Entfernen, echter Guss, Phasengrenzen, Plan-Shift.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-08-22');
  const r = JSON.parse(ev(`(function(){
    const c = S.cycles[0];
    c.anzuchtDays = 28; c.bloomDays = 77; c.flushDays = 7; c.iceDays = 2; c.harvestDays = 1; c.dryDays = 7;
    const out = {}, fehler = [];
    const heute = todayISO();
    const reset = () => { S.entries = {}; delete c.gussMoves; delete c.skippedDays; c.offsetHistory = [];
      S.entries[isoPlus(heute, -3)] = { cycleData: { [c.id]: { water: 12000 } } }; saveS(); };
    const act = (d) => getAction(isoPlus(heute, d), c) || '-';

    // 1) Verschieben, dann wieder vorziehen
    reset(); doShift(c.id, 1, heute);
    doShift(c.id, -1, isoPlus(heute, 1));
    out.k1 = { moves: (c.gussMoves || []).length, heute: act(0), morgen: act(1) };
    if (act(0) !== 'giess') fehler.push('1) Vorziehen stellt den Ausgangstag nicht wieder her');
    if ((c.gussMoves || []).length !== 0) fehler.push('1) leerer Vermerk bleibt liegen');

    // 2) Verschieben, dann den Zieltag entfernen
    reset(); doShift(c.id, 1, heute);
    if (!c.skippedDays) c.skippedDays = [];
    c.skippedDays.push(isoPlus(heute, 1)); saveS();
    out.k2 = { ziel: act(1) };
    if (act(1) !== '-') fehler.push('2) entfernter Zieltag zeigt trotzdem einen Guss');

    // 3) Verschieben, dann am Zieltag wirklich gießen -> Anker übernimmt
    reset(); doShift(c.id, 1, heute);
    S.entries[isoPlus(heute, 1)] = { cycleData: { [c.id]: { water: 12000 } } }; saveS();
    out.k3 = [0,1,2,3,4,5].map(act);
    if (out.k3[4] !== 'giess') fehler.push('3) nach echtem Guss am Zieltag kommt der nächste nicht 3 Tage später (' + out.k3.join(',') + ')');
    if (out.k3[3] === 'giess') fehler.push('3) doppelter Rhythmus nach echtem Guss');

    // 4) Verschieben über eine Phasengrenze: Ziel liegt im Trocken-Vorlauf vor dem IceFlush
    reset();
    const iceStart = c.anzuchtDays + c.bloomDays + c.flushDays + 1;
    const tagIso = (n) => isoPlus(c.startDate, n - 1);
    // Guss zwei Tage vor IceFlush künstlich anlegen und auf den Tag direkt davor schieben
    c.gussMoves = [{ from: tagIso(iceStart - 4), to: tagIso(iceStart - 1), act: 'giess' }]; saveS();
    out.k4 = { zielPhase: phase(tagIso(iceStart - 1), c).ph, aktion: getAction(tagIso(iceStart - 1), c) || '-' };
    if (out.k4.aktion !== '-') fehler.push('4) verschobener Guss landet im Trocken-Vorlauf vor dem IceFlush');

    // 5) Verschieben in die Ernte-/Trocknungsphase
    reset();
    const ernteTag = c.anzuchtDays + c.bloomDays + c.flushDays + c.iceDays + 1;
    c.gussMoves = [{ from: tagIso(ernteTag - 3), to: tagIso(ernteTag + 2), act: 'giess' }]; saveS();
    // In der Trocknung gibt es die reguläre Aktion „trocknen"; entscheidend ist, dass dort
    // kein GUSS auftaucht.
    out.k5 = { phase: phase(tagIso(ernteTag + 2), c).ph, aktion: getAction(tagIso(ernteTag + 2), c) || '-' };
    if (['giess', 'giess_anz', 'spuelen'].includes(out.k5.aktion)) fehler.push('5) verschobener Guss landet in der Trocknung');

    // 6) Verschieben während einer Topping-Pause
    reset();
    c.toppingDate = isoPlus(heute, -1); c.toppingPause = 2;
    c.gussMoves = [{ from: heute, to: isoPlus(heute, 1), act: 'giess' }]; saveS();
    out.k6 = { aktion: act(1) };
    if (act(1) !== '-') fehler.push('6) verschobener Guss ignoriert die Topping-Pause');
    delete c.toppingDate; delete c.toppingPause;

    // 7) Verschieben + Plan um 3 Tage schieben: Vermerk bleibt am Datum, Phasen wandern
    reset(); doShift(c.id, 1, heute);
    const bloomVor = c.bloomDays;
    holdPlanWeek(c.id, 3);
    out.k7 = { bloom: bloomVor + ' -> ' + c.bloomDays, ziel: act(1), moves: (c.gussMoves || []).length };
    if (act(1) !== 'giess') fehler.push('7) nach Plan-Verschiebung ist der Zieltag kein Gießtag mehr');
    if (c.bloomDays !== bloomVor + 3) fehler.push('7) Plan-Verschiebung hat nicht gegriffen');
    holdPlanWeek(c.id, -3);

    // 8) Zwei Verschiebungen an verschiedenen Tagen
    reset(); doShift(c.id, 1, heute);
    doShift(c.id, 1, isoPlus(heute, 4));
    out.k8 = { anzahl: (c.gussMoves || []).length, tage: [0,1,2,3,4,5,6,7].map(act) };
    if ((c.gussMoves || []).length !== 2) fehler.push('8) zweite unabhängige Verschiebung fehlt');

    // 9) Spültag verschieben behält seinen Typ
    reset();
    const spuelTag = c.anzuchtDays + c.bloomDays + 1;
    c.gussMoves = [{ from: tagIso(spuelTag), to: tagIso(spuelTag + 1), act: 'spuelen' }]; saveS();
    out.k9 = { alt: getAction(tagIso(spuelTag), c) || '-', neu: getAction(tagIso(spuelTag + 1), c) || '-' };
    if (out.k9.neu !== 'spuelen') fehler.push('9) verschobener Spültag verliert seinen Typ');

    // 9b) (v1.5.67) Eine Verschiebung IN das Abtrocken-Fenster vor dem Spülen muss gehen —
    //     der Nutzer entscheidet. Vor dem IceFlush bleibt es gesperrt.
    reset();
    c.flushDryDays = 4;
    const Fst = c.anzuchtDays + c.bloomDays + 1;
    const quelle = tagIso(Fst - 4);
    c.gussMoves = [{ from: quelle, to: tagIso(Fst - 2), act: 'giess' }]; saveS();
    out.k9b = { imFenster: getAction(tagIso(Fst - 2), c) || '-' };
    if (out.k9b.imFenster !== 'giess') fehler.push('9b) Verschiebung ins Abtrocken-Fenster wird geschluckt');
    // Warnung dazu
    S.beginnerMode = false; openEntry(tagIso(Fst - 2));
    out.k9bWarnung = /Abtrocken-Fenster vor dem Spülen/.test(document.getElementById('scr-entry').textContent);
    if (!out.k9bWarnung) fehler.push('9b) keine Warnung beim Guss im Abtrocken-Fenster');
    // Vor dem IceFlush bleibt es gesperrt
    const iceS = c.anzuchtDays + c.bloomDays + c.flushDays + 1;
    c.gussMoves = [{ from: tagIso(iceS - 5), to: tagIso(iceS - 1), act: 'spuelen' }]; saveS();
    out.k9c = { vorIce: getAction(tagIso(iceS - 1), c) || '-' };
    if (['giess','spuelen'].includes(out.k9c.vorIce)) fehler.push('9c) Verschiebung in den Hard-Dryback vor dem IceFlush ist möglich');

    // 10) Kalender und Fahrplan zeigen dasselbe
    reset(); doShift(c.id, 1, heute); S.beginnerMode = false;
    goTo('cal'); renderCal();
    goTo('gussplan'); renderGussplan();
    const gp = document.getElementById('scr-gussplan').textContent.replace(/\\s+/g, ' ');
    const zielTagNr = isoDiff(isoPlus(heute, 1), c.startDate) + 1;
    out.k10 = { fahrplanNennt: new RegExp('Tag ' + zielTagNr).test(gp) };
    if (!out.k10.fahrplanNennt) fehler.push('10) Fahrplan kennt den verschobenen Tag nicht');
    reset();
    return JSON.stringify({ out, fehler });
  })()`));
  Object.entries(r.out).forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  console.log(r.fehler.length ? 'FAIL\n  ' + r.fehler.join('\n  ') : 'OK gussmove-kombi');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(r.fehler.length ? 1 : 0);
})();
