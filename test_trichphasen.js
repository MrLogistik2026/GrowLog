// Der Trichom-Check muss bis zum Schnitt sichtbar bleiben — er entscheidet über die Ernte.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-09-03');
  const r = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const out = {}, fehler = [];
    c.startDate = isoPlus(todayISO(), -110); c.anzuchtDays = 21; c.bloomDays = 85;
    c.iceDays = 2; c.harvestDays = 1; c.dryDays = 7; c.intFlush = 3;
    c.flushWetDays = 4; c.iceDryDays = 3; _syncFlushPhase(c);
    c.flushDryDays = 0; c._flushDryOff = true;
    S.entries = {}; saveS();
    const da = (d) => { openEntry(isoPlus(c.startDate, d - 1));
      return /Trichom-Check/.test(document.getElementById('scr-entry').textContent); };
    const ph = (d) => phase(isoPlus(c.startDate, d - 1), c).ph;

    [[104,'bloom'],[107,'flush'],[110,'flush'],[113,'flush'],[114,'ice'],[116,'harvest']].forEach(([d, soll]) => {
      if (ph(d) !== soll) fehler.push('Testfall: Tag ' + d + ' ist ' + ph(d) + ' statt ' + soll);
      if (!da(d)) fehler.push('Trichom-Check fehlt an Tag ' + d + ' (' + soll + ')');
    });
    // Nach dem Schnitt nicht mehr
    [117, 120].forEach(d => { if (da(d)) fehler.push('Trichom-Check erscheint nach dem Schnitt an Tag ' + d); });
    // Vor Blütewoche 7 weiterhin nicht
    if (da(40)) fehler.push('Trichom-Check erscheint schon vor Blütewoche 7');

    // Kopfzeile nennt die Phase statt einer leeren Blütewoche
    openEntry(isoPlus(c.startDate, 106));
    const t = document.getElementById('scr-entry').textContent;
    out.kopfSpuel = /Spülphase/.test(t);
    if (!out.kopfSpuel) fehler.push('Kopfzeile nennt die Spülphase nicht');
    openEntry(isoPlus(c.startDate, 113));
    out.kopfIce = /IceFlush/.test(document.getElementById('scr-entry').textContent);
    if (!out.kopfIce) fehler.push('Kopfzeile nennt den IceFlush nicht');
    // In der Blüte weiterhin die Wochennummer
    openEntry(isoPlus(c.startDate, 103));
    out.kopfBluete = /Blüte Wo\\./.test(document.getElementById('scr-entry').textContent);
    if (!out.kopfBluete) fehler.push('Blütewoche fehlt in der Kopfzeile');
    // Eintragen funktioniert auch in der Spülphase
    const iso = isoPlus(c.startDate, 109);
    // Ausgangswerte anlegen — uTrich korrigiert einen bestehenden Stand.
    S.entries[iso] = { cycleData: { [c.id]: { trichomes: { clear: 20, milky: 75, amber: 5 } } } };
    saveS();
    editISO = iso; openEntry(iso);
    uTrich(c.id, 'amber', 6, iso);
    out.eintragFlush = S.entries[iso].cycleData[c.id].trichomes.amber;
    if (out.eintragFlush !== 6) fehler.push('Trichom-Eingabe in der Spülphase kommt nicht an');
    editISO = null;
    return JSON.stringify({ out, fehler });
  })()`));
  Object.entries(r.out).forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  console.log(r.fehler.length ? 'FAIL\n  ' + r.fehler.join('\n  ') : 'OK trichphasen');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(r.fehler.length ? 1 : 0);
})();
