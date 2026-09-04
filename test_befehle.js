// Befehlssuche: tippen, was man will — und die Handlung ausführen.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-08-26');
  const r = JSON.parse(ev(`(function(){
    const c = S.cycles[0];
    c.startDate = isoPlus(todayISO(), -101); c.anzuchtDays = 21; c.bloomDays = 82;
    c.flushDays = 8; c.iceDays = 3; c.harvestDays = 1; c.dryDays = 7;
    c.plants = [1,2,3,4].map(i => ({ id: 'p_' + i, label: 'P' + i, addedAt: c.startDate }));
    S.entries = {}; [94, 97, 100].forEach(i => S.entries[isoPlus(c.startDate, i)] = { cycleData: { [c.id]: { water: 12000 } } });
    saveS(); S.beginnerMode = false;
    const out = {}, fehler = [];

    // 1) Jeder Befehl ist über Alltagswörter erreichbar
    const proben = [
      ['später gießen', 'Guss auf morgen verschieben'],
      ['guss vorziehen', 'Guss vorziehen'],
      ['pflanze ernten', 'Pflanze einzeln ernten'],
      ['ertrag', 'Ertrag eintragen'],
      ['blüte länger', 'Blüte verlängern oder verkürzen'],
      ['bluete laenger', 'Blüte verlängern oder verkürzen'],
      ['ernte spaeter', 'Ernte verschieben'],
      ['dosis ändern', 'Dünger-Dosis ändern'],
      ['wasser menge', 'Gießmenge ändern'],
      ['gießtag entfernen', 'Gießtag entfernen'],
      ['abtrocknen', 'Abtrockenzeit vor dem Spülen'],
      ['plan wechseln', 'Düngeplan wechseln'],
      ['pflanzenzahl', 'Pflanzenzahl ändern'],
      ['sicherung', 'Sicherung erstellen'],
      ['profi modus', 'Einsteiger- oder Profi-Modus'],
      ['phasendauer', 'Phasendauern und Samentüte'],
      ['trichome', 'Trichome eintragen'],
    ];
    const daneben = proben.filter(([q, soll]) => {
      const tr = helpSearch(q).filter(x => x.art === 'Aktion');
      return !tr.some(x => x.titel === soll);
    }).map(([q, soll]) => q + ' → ' + soll);
    out.nichtGefunden = daneben;
    if (daneben.length) fehler.push('nicht gefunden: ' + daneben.join(' | '));

    // 2) Aktionen stehen VOR Erklärtexten
    const tr = helpSearch('ernte');
    out.ersterTreffer = tr[0] ? tr[0].art : null;
    if (!tr.length || tr[0].art !== 'Aktion') fehler.push('Aktionen stehen nicht zuerst');

    // 3) Jeder Befehl hat Titel, Hinweis und eine ausführbare Funktion
    out.anzahl = COMMANDS.length;
    COMMANDS.forEach((cmd, i) => {
      if (!cmd.t || !cmd.keys || !cmd.hint) fehler.push('Befehl ' + i + ' unvollständig');
      if (typeof cmd.run !== 'function') fehler.push('Befehl „' + cmd.t + '" ohne Handlung');
    });

    // 4) Kein Befehl ist unerreichbar (jeder Titel findet sich selbst)
    COMMANDS.forEach(cmd => {
      const wort = cmd.t.split(' ')[0].toLowerCase();
      if (!helpSearch(wort).some(x => x.titel === cmd.t)) fehler.push('„' + cmd.t + '" über „' + wort + '" nicht auffindbar');
    });
    return JSON.stringify({ out, fehler });
  })()`));
  // 5) Ausführen: „pflanze ernten" öffnet das Pflanzen-Blatt
  ev(`(function(){ openHelp(); const i = COMMANDS.findIndex(x => x.t === 'Pflanze einzeln ernten'); runCommand(i); })()`);
  await new Promise(x => setTimeout(x, 60));
  const r2 = JSON.parse(ev(`(function(){
    const out = {}, fehler = [];
    out.blattOffen = !!document.getElementById('plant-sheet-box');
    out.hilfeZu = !document.querySelector('[data-help-sheet]') || !(S._help && S._help.open);
    if (!out.blattOffen) fehler.push('Befehl öffnet das Pflanzen-Blatt nicht');
    if (!out.hilfeZu) fehler.push('Hilfe-Blatt bleibt offen');
    closePlantSheet();
    return JSON.stringify({ out, fehler });
  })()`));
  // 6) Ausführen: Guss verschieben
  ev(`(function(){ const c=S.cycles[0]; window._vor = getAction(todayISO(), c) || '-'; openHelp(); runCommand(COMMANDS.findIndex(x => x.t === 'Guss auf morgen verschieben')); })()`);
  await new Promise(x => setTimeout(x, 60));
  const r3 = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const out = {}, fehler = [];
    out.vorher = _vor;
    out.moves = (c.gussMoves || []).length;
    out.heute = getAction(todayISO(), c) || '-';
    if (_vor === 'giess' && out.heute === 'giess') fehler.push('Guss wurde nicht verschoben');
    return JSON.stringify({ out, fehler });
  })()`));
  [...Object.entries(r.out), ...Object.entries(r2.out), ...Object.entries(r3.out)].forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  const alle = [...r.fehler, ...r2.fehler, ...r3.fehler];
  console.log(alle.length ? 'FAIL\n  ' + alle.join('\n  ') : 'OK befehle');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(alle.length ? 1 : 0);
})();
