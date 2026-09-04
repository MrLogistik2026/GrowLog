// Endspurt: eine Kette, an beiden Enden anfassbar, alles andere ergibt sich.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-08-25');
  const setup = () => ev(`(function(){
    const c = S.cycles[0];
    c.startDate = isoPlus(todayISO(), -101);   // heute = Tag 102
    c.anzuchtDays = 21; c.bloomDays = 82; c.flushDays = 8; c.iceDays = 3; c.harvestDays = 1; c.dryDays = 7;
    // Ausgangslage mit EINGESCHALTETER Abtrockenphase — die Standardeinstellung ist aus.
    c.flushDryDays = 4; c._flushDryOff = true; delete c.flushDryFrom; delete c.gussMoves;
    S.entries = {};
    [94, 97, 100].forEach(i => S.entries[isoPlus(c.startDate, i)] = { cycleData: { [c.id]: { water: 12000 } } });
    saveS(); S.beginnerMode = false;
  })()`);
  setup();
  const fehler = [], out = {};
  const st = () => JSON.parse(ev(`JSON.stringify(endspurtState(S.cycles[0], todayISO()))`));

  out.start = st();
  if (out.start.letzterGuss !== 101 || out.start.spuelStart !== 104) fehler.push('Ausgangslage falsch');
  if (out.start.ernteTag !== 115 || out.start.trockenBis !== 122) fehler.push('abgeleitete Kette falsch');
  if (out.start.abstand !== 3) fehler.push('Abstand falsch');

  // Karte da, mit Warnzeile weil 3 < 4

  ev(`goTo('gussplan'); renderGussplan();`);
  const tg = ev(`document.getElementById('scr-gussplan').textContent`);
  out.karte = /Endspurt/.test(tg) && /Letzter Guss/.test(tg) && /Spülen ab/.test(tg);
  out.warnung = /bleiben nur 3 Tage bis zum Spülen/.test(tg);
  if (!out.karte) fehler.push('Endspurt-Karte fehlt im Fahrplan');
  if (!out.warnung) fehler.push('Warnzeile bei zu kurzem Abstand fehlt');

  // Kette vorne anfassen: letzten Guss auf Tag 104 (ein Rhythmus-Schritt später)
  ev(`setEndspurtGuss(S.cycles[0].id, 104)`);
  await new Promise(x => setTimeout(x, 80));
  out.nachPlus = st();
  const a = out.nachPlus;
  if (a.letzterGuss !== 104) fehler.push('letzter Guss nicht auf 104 (' + a.letzterGuss + ')');
  if (a.spuelStart !== 108) fehler.push('Spülstart nicht 108 (' + a.spuelStart + ')');
  if (a.iceStart !== 116 || a.ernteTag !== 119) fehler.push('Kette hinten falsch: ' + a.iceStart + '/' + a.ernteTag);
  if (a.abstand !== 4) fehler.push('Abstand nach dem Setzen nicht 4');
  const akt = (d) => ev(`getAction(isoPlus(S.cycles[0].startDate, ${d} - 1), S.cycles[0]) || '-'`);
  out.tage = [101, 104, 105, 107, 108].map(d => d + ':' + akt(d));
  if (akt(104) !== 'giess') fehler.push('Guss an Tag 104 fehlt');
  if (akt(107) !== '-') fehler.push('Guss nach dem letzten wurde nicht ausgesetzt');
  if (akt(108) !== 'spuelen') fehler.push('Spülstart fehlt an Tag 108');
  if (akt(101) !== 'giess') fehler.push('Vergangenheit verändert');

  // Abtrockenzeit auf 5 → Spülstart 109, letzter Guss bleibt
  ev(`setEndspurtDry(S.cycles[0].id, 5)`);
  await new Promise(x => setTimeout(x, 90));
  out.nachDry = st();
  if (out.nachDry.dry !== 5) fehler.push('Abtrockenzeit nicht übernommen');
  if (out.nachDry.letzterGuss !== 104) fehler.push('letzter Guss hat sich mitverschoben');
  if (out.nachDry.spuelStart !== 109) fehler.push('Spülstart nicht 109 (' + out.nachDry.spuelStart + ')');
  if (out.nachDry.ernteTag !== 120) fehler.push('Erntetag nicht mitgewandert');

  // Kette hinten anfassen: Ernte auf Tag 124
  ev(`setEndspurtErnte(S.cycles[0].id)`);
  await new Promise(x => setTimeout(x, 40));
  ev(`(function(){ document.getElementById('input-modal-field').value='124'; document.getElementById('input-modal-ok').click(); })()`);
  await new Promise(x => setTimeout(x, 90));
  out.nachErnte = st();
  const b = out.nachErnte;
  if (b.ernteTag !== 124) fehler.push('Erntetag nicht gesetzt (' + b.ernteTag + ')');
  if (b.spuelStart !== 113) fehler.push('Spülstart rechnet nicht rückwärts (' + b.spuelStart + ')');
  if (b.abstand < b.dry) fehler.push('nach dem Rückwärtsrechnen fehlt Abtrockenzeit (' + b.abstand + ' statt ' + b.dry + ')');

  // Zurücksetzen: Rhythmus läuft wieder bis zum Spülstart durch
  ev(`clearEndspurt(S.cycles[0].id)`);
  await new Promise(x => setTimeout(x, 40));
  out.nachReset = { dryFrom: ev(`S.cycles[0].flushDryFrom || null`), tag: akt(111) };
  if (out.nachReset.dryFrom) fehler.push('Zurücksetzen entfernt die Abtrockenphase nicht');

  // Schutz: Spülstart darf nicht in die Vergangenheit rutschen
  setup();
  ev(`setEndspurtGuss(S.cycles[0].id, 96)`);
  await new Promise(x => setTimeout(x, 60));
  out.schutz = st();
  if (out.schutz.spuelStart < out.schutz.heuteTag + 2) fehler.push('Spülstart wurde in die Vergangenheit gelegt');

  // (v1.5.73) Spüldauer und IceFlush direkt in der Kette · Karte nur im Fahrplan
  setup();
  const vorPhase = st();
  ev(`setEndspurtPhase(S.cycles[0].id, 'flushWetDays', 4)`);
  await new Promise(x => setTimeout(x, 40));
  const nachPhase = st();
  out.spuelDauer = vorPhase.spuelDauer + ' -> ' + nachPhase.spuelDauer;
  out.kette = { ice: nachPhase.iceStart, ernte: nachPhase.ernteTag };
  if (nachPhase.spuelDauer !== 4) fehler.push('Spüldauer nicht übernommen');
  if (nachPhase.spuelStart !== vorPhase.spuelStart) fehler.push('Spülstart hat sich mitverschoben');
  // IceFlush startet nach Spültagen PLUS Hard-Dryback
  if (nachPhase.iceStart !== vorPhase.spuelStart + 4 + nachPhase.iceDry) fehler.push('IceFlush wandert nicht mit (' + nachPhase.iceStart + ')');
  if (nachPhase.ernteTag !== nachPhase.iceStart + nachPhase.ic) fehler.push('Erntetag falsch');
  if (nachPhase.letzterGuss !== vorPhase.letzterGuss) fehler.push('letzter Guss hat sich verändert');
  ev(`setEndspurtPhase(S.cycles[0].id, 'iceDays', 2)`);
  await new Promise(x => setTimeout(x, 40));
  const nachIce = st();
  if (nachIce.iceDauer !== 2) fehler.push('IceFlush-Dauer nicht übernommen');
  if (nachIce.ernteTag !== nachIce.iceStart + 2) fehler.push('Ernte folgt der IceFlush-Dauer nicht');
  // Grenzen
  ev(`setEndspurtPhase(S.cycles[0].id, 'flushDays', 0)`);
  await new Promise(x => setTimeout(x, 30));
  out.untergrenze = st().spuelDauer;
  if (st().spuelDauer < 1) fehler.push('Spüldauer unter 1 möglich');

  // Karte NUR im Gieß-Fahrplan, nicht im Tageseintrag — auf sauberem Stand prüfen
  setup();
  ev(`S.beginnerMode = false; openEntry(todayISO());`);
  out.imEintrag = ev(`/Endspurt/.test(document.getElementById('scr-entry').textContent)`);


  ev(`goTo('gussplan'); renderGussplan();`);
  out.imFahrplan = ev(`/Endspurt/.test(document.getElementById('scr-gussplan').textContent)`);
  // (v1.5.78) Im Eintrag steht nur noch der einzeilige Wegweiser, nicht die ganze Kette.
  out.ketteImEintrag = ev(`/Du bestimmst zwei Dinge/.test(document.getElementById('scr-entry').textContent)`);
  if (out.ketteImEintrag) fehler.push('die ganze Endspurt-Kette steht wieder im Tageseintrag');
  if (!out.imFahrplan) fehler.push('Endspurt fehlt im Gieß-Fahrplan');
  // Über die Befehlssuche erreichbar
  out.befehl = ev(`helpSearch('endspurt').filter(x => x.art === 'Aktion').length`);
  out.befehlSpuel = ev(`helpSearch('spüldauer').filter(x => x.art === 'Aktion').length || helpSearch('spülen dauer').filter(x => x.art === 'Aktion').length`);
  if (!out.befehl) fehler.push('kein Befehl für den Endspurt');
  if (!out.befehlSpuel) fehler.push('kein Befehl für die Spüldauer');

  // (v1.5.74) Hard-Dryback vor dem IceFlush ist sichtbar und einstellbar — er bestimmt,
  //           wie viele Spülgänge in die Spülphase passen.
  const kombi = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const out = {}, fehler = [];
    c.startDate = isoPlus(todayISO(), -105); c.anzuchtDays = 21; c.bloomDays = 86; c.iceDays = 2; c.harvestDays = 1;
    c.flushDryFrom = isoPlus(c.startDate, 103); S.entries = {};
    [94, 97, 100, 103].forEach(i => S.entries[isoPlus(c.startDate, i)] = { cycleData: { [c.id]: { water: 12000 } } });
    const probe = (fl, iv, dr) => { c.flushDays = fl; c.intFlush = iv; c.iceDryDays = dr; saveS();
      const st = endspurtState(c, todayISO()); return { gaenge: st.spuelGaenge, ice: st.iceStart, dry: st.iceDry }; };
    // (v1.5.75) „Spülen N Tage" meint N SPÜLTAGE; der Hard-Dryback kommt hinten drauf.
    const probe2 = (wet, iv, dr) => { c.flushWetDays = wet; c.intFlush = iv; c.iceDryDays = dr;
      _syncFlushPhase(c); saveS();
      const st = endspurtState(c, todayISO());
      return { gaenge: st.spuelGaenge, ice: st.iceStart, dry: st.iceDry, phase: c.flushDays, dauer: st.spuelDauer }; };
    out.a = probe2(4, 3, 3); out.b = probe2(4, 3, 0); out.c = probe2(8, 4, 3);
    if (out.a.phase !== 7) fehler.push('Phasenlänge ist nicht Spültage + Dryback (' + out.a.phase + ')');
    if (out.a.dauer !== 4) fehler.push('angezeigte Spüldauer ist nicht 4');
    if (out.a.gaenge.length !== 2) fehler.push('4 Spültage bei Intervall 3 ergeben nicht zwei Spülgänge: ' + JSON.stringify(out.a.gaenge));
    if (out.a.ice !== out.a.gaenge[0] + 7) fehler.push('IceFlush startet nicht nach Spültagen + Dryback');
    if (out.b.gaenge.length !== 2) fehler.push('ohne Dryback nicht zwei Spülgänge');
    if (out.b.ice !== out.b.gaenge[0] + 4) fehler.push('ohne Dryback startet der IceFlush falsch');
    if (out.c.gaenge.length !== 2) fehler.push('8 Spültage bei Intervall 4 ergeben nicht zwei Spülgänge');
    if (out.a.dry !== 3) fehler.push('Hard-Dryback nicht übernommen');
    // Grenzen
    setEndspurtPhase(c.id, 'iceDryDays', 9);
    out.grenze = iceDryDays(c);
    if (out.grenze > 6) fehler.push('Hard-Dryback über der Obergrenze');
    setEndspurtPhase(c.id, 'iceDryDays', 3);
    // In der Karte sichtbar
    goTo('gussplan'); renderGussplan();
    const t = document.getElementById('scr-gussplan').textContent;
    out.inKarte = /Hard-Dryback/.test(t) && /Spülgänge/.test(t);
    if (!out.inKarte) fehler.push('Hard-Dryback oder Spülgänge fehlen in der Karte');
    return JSON.stringify({ out, fehler });
  })()`));
  Object.assign(out, kombi.out); fehler.push(...kombi.fehler);

  // (v1.5.77) Der Spülstart hängt am letzten Guss plus Abtrockenzeit — auch wenn Spültage
  //           und Hard-Dryback nacheinander geändert werden.
  ev(`(function(){
    const c = S.cycles[0];
    c.startDate = isoPlus(todayISO(), -105); c.anzuchtDays = 21; c.bloomDays = 86;
    c.iceDays = 2; c.harvestDays = 1; c.dryDays = 7; c.intFlush = 3;
    c.flushWetDays = 8; c.iceDryDays = 3; _syncFlushPhase(c);
    c.flushDryFrom = isoPlus(c.startDate, 103); c.flushDryDays = 4;
    S.entries = {}; [94, 97, 100, 103].forEach(i => S.entries[isoPlus(c.startDate, i)] = { cycleData: { [c.id]: { water: 12000 } } });
    saveS(); setEndspurtDry(c.id, 3);
  })()`);
  await new Promise(x => setTimeout(x, 80));
  ev(`setEndspurtPhase(S.cycles[0].id, 'flushWetDays', 4)`);
  await new Promise(x => setTimeout(x, 50));
  ev(`setEndspurtPhase(S.cycles[0].id, 'iceDryDays', 4)`);
  await new Promise(x => setTimeout(x, 50));
  const kette = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const st = endspurtState(c, todayISO()); const fehler = [];
    if (st.letzterGuss !== 104) fehler.push('letzter Guss verschoben (' + st.letzterGuss + ')');
    if (st.dry !== 3) fehler.push('Abtrockenzeit nicht 3');
    if (st.spuelStart !== 107) fehler.push('Spülstart nicht letzter Guss + Abtrockenzeit (' + st.spuelStart + ')');
    if (st.spuelDauer !== 4) fehler.push('Spültage nicht 4');
    if (JSON.stringify(st.spuelGaenge) !== JSON.stringify([107, 110])) fehler.push('Spülgänge falsch: ' + JSON.stringify(st.spuelGaenge));
    if (st.iceDry !== 4) fehler.push('Hard-Dryback nicht 4');
    if (st.iceStart !== 115) fehler.push('IceFlush nicht 115 (' + st.iceStart + ')');
    if (getAction(isoPlus(c.startDate, 103), c) !== 'giess') fehler.push('letzter Düngerguss verloren');
    return JSON.stringify({ out: { letzterGuss: st.letzterGuss, spuelStart: st.spuelStart, gaenge: st.spuelGaenge, ice: st.iceStart, ernte: st.ernteTag }, fehler });
  })()`));
  Object.assign(out, { kette: kette.out }); fehler.push(...kette.fehler);

  // (v1.5.78) Ein Tipp zurück in den normalen Rhythmus
  ev(`(function(){
    const c = S.cycles[0];
    c.startDate = isoPlus(todayISO(), -105); c.anzuchtDays = 21; c.bloomDays = 86;
    c.iceDays = 2; c.harvestDays = 1; c.dryDays = 7; c.intFlush = 3;
    c.flushWetDays = 8; c.iceDryDays = 3; _syncFlushPhase(c);
    c.flushDryFrom = isoPlus(c.startDate, 103); c.flushDryDays = 4;
    S.entries = {}; [94, 97, 100, 103].forEach(i => S.entries[isoPlus(c.startDate, i)] = { cycleData: { [c.id]: { water: 12000 } } });
    saveS(); S.beginnerMode = false; goTo('gussplan'); renderGussplan();
  })()`);
  out.knopfDa = ev(`/Auf normalen Rhythmus stellen/.test(document.getElementById('scr-gussplan').textContent)`);
  if (!out.knopfDa) fehler.push('Knopf „normaler Rhythmus" fehlt bei abweichendem Abstand');
  ev(`endspurtNormal(S.cycles[0].id)`);
  await new Promise(x => setTimeout(x, 40));
  ev(`_modalResolve && _modalResolve(true)`);
  await new Promise(x => setTimeout(x, 80));
  const norm = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const s = endspurtState(c, todayISO()); const f = [];
    if (s.abstand !== s.iv) f.push('Abstand nicht auf das Gieß-Intervall gesetzt (' + s.abstand + ')');
    if (s.spuelStart !== 107) f.push('Spülstart nicht 107 (' + s.spuelStart + ')');
    if (s.letzterGuss !== 104) f.push('letzter Guss verschoben');
    if (s.spuelDauer !== 8 || s.iceDry !== 3) f.push('Spültage oder Hard-Dryback wurden mitverändert');
    if (getAction(isoPlus(c.startDate, 103), c) !== 'giess') f.push('letzter Düngerguss verloren');
    renderGussplan();
    const weg = !/Auf normalen Rhythmus stellen/.test(document.getElementById('scr-gussplan').textContent);
    if (!weg) f.push('Knopf bleibt sichtbar, obwohl der Rhythmus passt');
    openEntry(todayISO());
    const wegweiser = /Endspurt: Spülen ab/.test(document.getElementById('scr-entry').textContent);
    if (!wegweiser) f.push('Wegweiser im Tageseintrag fehlt');
    return JSON.stringify({ out: { abstand: s.abstand, spuelStart: s.spuelStart, gaenge: s.spuelGaenge, ice: s.iceStart }, fehler: f });
  })()`));
  Object.assign(out, { normal: norm.out }); fehler.push(...norm.fehler);
  out.befehlRhythmus = ev(`helpSearch('rhythmus zurücksetzen').filter(x => x.art === 'Aktion').length`);
  if (!out.befehlRhythmus) fehler.push('Befehl „Rhythmus zurücksetzen" fehlt');

  // (v1.5.79) Abtrocknen vor dem Spülen ist abschaltbar und standardmäßig aus.
  ev(`(function(){
    const c = S.cycles[0];
    c.startDate = isoPlus(todayISO(), -106); c.anzuchtDays = 21; c.bloomDays = 86;
    c.iceDays = 2; c.harvestDays = 1; c.dryDays = 7; c.intFlush = 3;
    c.flushWetDays = 4; c.iceDryDays = 4; _syncFlushPhase(c);
    c.flushDryDays = 4; c.flushDryFrom = isoPlus(c.startDate, 103); delete c._flushDryOff;
    S.entries = {}; [94, 97, 100, 103].forEach(i => S.entries[isoPlus(c.startDate, i)] = { cycleData: { [c.id]: { water: 12000 } } });
    saveS(); loadS();
  })()`);
  const aus = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const f = []; const st = endspurtState(c, todayISO());
    if (c.flushDryDays !== 0) f.push('Migration schaltet nicht ab');
    if (c.flushDryFrom) f.push('erzwungene Abtrockenphase besteht weiter');
    // Der Rhythmus läuft durch: Tag 107 ist wieder ein Guss
    if (getAction(isoPlus(c.startDate, 106), c) !== 'giess') f.push('Rhythmus läuft nicht bis zum Spülstart durch');
    // Kein „Heute kein Guss — mit Absicht" mehr vor dem Spülen
    openEntry(isoPlus(c.startDate, 106));
    if (/kein Guss — mit Absicht/.test(document.getElementById('scr-entry').textContent)) f.push('Kein-Guss-Karte erscheint weiterhin');
    goTo('gussplan'); renderGussplan();
    const t = document.getElementById('scr-gussplan').textContent;
    // (v1.5.80) Ist die Phase aus, steht die Zeile gar nicht mehr in der Karte —
    // sie lebt nur noch in den Einstellungen für die, die sie brauchen.
    if (/Abtrocknen vor dem Spülen/.test(t)) f.push('Zeile steht in der Karte, obwohl die Phase aus ist');
    // Und kein Düngerguss direkt vor dem ersten Spülgang
    const st2 = endspurtState(c, todayISO());
    if (getAction(isoPlus(c.startDate, st2.spuelStart - 2), c) === 'giess') f.push('Düngerguss direkt vor dem ersten Spülgang');
    if (st2.spuelStart !== st2.letzterGuss + st2.iv) f.push('Spülstart rastet nicht auf den Rhythmus ein (' + st2.spuelStart + ')');
    return JSON.stringify({ out: { dry: c.flushDryDays, spuelStart: st.spuelStart, gaenge: st.spuelGaenge, iceDry: st.iceDry, ice: st.iceStart }, fehler: f });
  })()`));
  Object.assign(out, { ausgeschaltet: aus.out }); fehler.push(...aus.fehler);

  // Ohne Abtrockenphase legt „letzter Guss" den Spülstart einen Rhythmus-Schritt später
  ev(`setEndspurtGuss(S.cycles[0].id, 107)`);
  await new Promise(x => setTimeout(x, 70));
  const anker = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const st = endspurtState(c, todayISO()); const f = [];
    if (st.spuelStart !== 110) f.push('Spülstart nicht letzter Guss + Intervall (' + st.spuelStart + ')');
    if (c.flushDryFrom) f.push('Abtrockenphase wurde wieder gesetzt, obwohl aus');
    if (getAction(isoPlus(c.startDate, 106), c) !== 'giess') f.push('Guss an Tag 107 verloren');
    if (JSON.stringify(st.spuelGaenge) !== JSON.stringify([110, 113])) f.push('Spülgänge falsch: ' + JSON.stringify(st.spuelGaenge));
    if (st.iceDry !== 4) f.push('Hard-Dryback nicht mehr 4');
    return JSON.stringify({ out: { spuelStart: st.spuelStart, gaenge: st.spuelGaenge, ice: st.iceStart, ernte: st.ernteTag }, fehler: f });
  })()`));
  Object.assign(out, { ohneAbtrocknen: anker.out }); fehler.push(...anker.fehler);

  // Wieder einschalten geht
  ev(`setEndspurtDry(S.cycles[0].id, 2)`);
  await new Promise(x => setTimeout(x, 70));
  const an = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const st = endspurtState(c, todayISO()); const f = [];
    if (st.dry !== 2) f.push('Wiedereinschalten greift nicht');
    if (!c.flushDryFrom) f.push('Abtrockenphase nicht gesetzt');
    if (st.spuelStart !== st.letzterGuss + 2) f.push('Spülstart nicht letzter Guss + 2');
    return JSON.stringify({ out: { dry: st.dry, spuelStart: st.spuelStart }, fehler: f });
  })()`));
  Object.assign(out, { wiederAn: an.out }); fehler.push(...an.fehler);

  // (v1.5.81) Tage direkt eingeben: Spülstart und IceFlush-Tag
  ev(`(function(){
    const c = S.cycles[0];
    c.startDate = isoPlus(todayISO(), -105); c.anzuchtDays = 21; c.bloomDays = 86;
    c.iceDays = 2; c.harvestDays = 1; c.dryDays = 7; c.intFlush = 3;
    c.flushWetDays = 8; c.iceDryDays = 3; _syncFlushPhase(c);
    c.flushDryDays = 0; c._flushDryOff = true; delete c.flushDryFrom;
    S.entries = {}; [94, 97, 100, 103].forEach(i => S.entries[isoPlus(c.startDate, i)] = { cycleData: { [c.id]: { water: 12000 } } });
    saveS(); S.beginnerMode = false;
  })()`);
  ev(`setEndspurtSpuelStart(S.cycles[0].id)`);
  await new Promise(x => setTimeout(x, 40));
  ev(`(function(){document.getElementById('input-modal-field').value='107';document.getElementById('input-modal-ok').click();})()`);
  await new Promise(x => setTimeout(x, 60));
  ev(`setEndspurtIceStart(S.cycles[0].id)`);
  await new Promise(x => setTimeout(x, 40));
  ev(`(function(){document.getElementById('input-modal-field').value='114';document.getElementById('input-modal-ok').click();})()`);
  await new Promise(x => setTimeout(x, 60));
  const direkt = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const f = []; const st = endspurtState(c, todayISO());
    const akt = (d) => getAction(isoPlus(c.startDate, d - 1), c) || '-';
    if (akt(104) !== 'giess') f.push('letzter Düngerguss an Tag 104 fehlt');
    if (akt(107) !== 'spuelen') f.push('erster Spülgang nicht an Tag 107 (' + akt(107) + ')');
    if (akt(110) !== 'spuelen') f.push('zweiter Spülgang nicht an Tag 110 (' + akt(110) + ')');
    if (akt(113) === 'spuelen') f.push('dritter Spülgang an Tag 113 — Hard-Dryback greift nicht');
    if (akt(114) !== 'ice') f.push('IceFlush nicht an Tag 114 (' + akt(114) + ')');
    if (akt(105) === 'giess' || akt(106) === 'giess') f.push('Düngerguss zwischen 104 und dem Spülstart');
    if (st.spuelStart !== 107 || st.iceStart !== 114) f.push('Kette stimmt nicht: Spülen ' + st.spuelStart + ' Ice ' + st.iceStart);
    // Befehle erreichbar
    if (!helpSearch('spülstart').filter(x => x.art === 'Aktion').length) f.push('Befehl „Spülstart" fehlt');
    if (!helpSearch('iceflush tag').filter(x => x.art === 'Aktion').length) f.push('Befehl „IceFlush-Tag" fehlt');
    return JSON.stringify({ out: { spuel: st.spuelStart, gaenge: st.spuelGaenge, ice: st.iceStart, ernte: st.ernteTag, wet: c.flushWetDays, iceDry: c.iceDryDays }, fehler: f });
  })()`));
  Object.assign(out, { direkteingabe: direkt.out }); fehler.push(...direkt.fehler);

  // (v1.5.82) Nie ein Düngerguss direkt vor dem Spülstart — der Spülstart rastet nach,
  //           sobald ein Guss den Rhythmus-Anker verschiebt.
  const snap = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const f = []; const out = {};
    c.startDate = isoPlus(todayISO(), -106); c.anzuchtDays = 21; c.bloomDays = 86;
    c.iceDays = 2; c.harvestDays = 1; c.dryDays = 7; c.intFlush = 3;
    c.flushWetDays = 8; c.iceDryDays = 3; _syncFlushPhase(c);
    c.flushDryDays = 0; c._flushDryOff = true; delete c.flushDryFrom;
    S.entries = {}; [94, 97, 100].forEach(i => S.entries[isoPlus(c.startDate, i)] = { cycleData: { [c.id]: { water: 12000 } } });
    saveS();
    const st0 = endspurtState(c, todayISO());
    out.vorher = { spuelStart: st0.spuelStart, letzterGuss: st0.letzterGuss };
    if (getAction(isoPlus(c.startDate, st0.spuelStart - 2), c) !== 'giess') f.push('Testfall greift nicht — kein Guss vor dem Spülstart');

    // Guss an Tag 104 eintragen (verschiebt den Anker)
    const iso = isoPlus(c.startDate, 103);
    S.entries[iso] = { cycleData: { [c.id]: { water: 12000, plantsAtWatering: 4 } } };
    _snapFlushToRhythm(c); saveS();
    const st1 = endspurtState(c, todayISO());
    out.nachher = { spuelStart: st1.spuelStart, letzterGuss: st1.letzterGuss, gaenge: st1.spuelGaenge };
    if (getAction(isoPlus(c.startDate, st1.spuelStart - 2), c) === 'giess') f.push('Düngerguss liegt weiterhin direkt vor dem Spülstart');
    if (st1.spuelStart !== st1.letzterGuss + st1.iv) f.push('Spülstart nicht auf dem Rhythmus (' + st1.spuelStart + ' vs ' + (st1.letzterGuss + st1.iv) + ')');
    // Vergangene Güsse unangetastet
    if (getAction(isoPlus(c.startDate, 100), c) !== 'giess') f.push('vergangener Guss verloren');
    return JSON.stringify({ out, fehler: f });
  })()`));
  Object.assign(out, { einrasten: snap.out }); fehler.push(...snap.fehler);

  // (v1.5.83) Ganze Zeile klickbar · Spülstart und Ernte ab HEUTE erlaubt
  ev(`(function(){
    const c = S.cycles[0];
    c.startDate = isoPlus(todayISO(), -108);      // heute = Tag 109
    c.anzuchtDays = 21; c.bloomDays = 86; c.iceDays = 2; c.harvestDays = 1; c.dryDays = 7; c.intFlush = 3;
    c.flushWetDays = 4; c.iceDryDays = 3; _syncFlushPhase(c);
    c.flushDryDays = 0; c._flushDryOff = true; delete c.flushDryFrom;
    S.entries = {}; [94, 97, 100, 103, 106].forEach(i => S.entries[isoPlus(c.startDate, i)] = { cycleData: { [c.id]: { water: 12000 } } });
    saveS(); S.beginnerMode = false; goTo('gussplan'); renderGussplan();
  })()`);
  const flaechen = ev(`(function(){
    const el = document.getElementById('scr-gussplan');
    return [...el.querySelectorAll('[onclick]')]
      .filter(x => /setEndspurt(SpuelStart|IceStart|Ernte)/.test(x.getAttribute('onclick') || ''))
      .map(x => x.textContent.replace(/\s+/g, ' ').trim());
  })()`);
  out.klickflaechen = flaechen.length;
  if (flaechen.length !== 3) fehler.push('nicht alle drei Zeilen sind klickbar (' + flaechen.length + ')');
  if (!flaechen.every(t => /ändern/.test(t))) fehler.push('„ändern ›" liegt außerhalb der Klickfläche');
  if (!flaechen.every(t => /Tag \d+/.test(t))) fehler.push('Tageszahl liegt außerhalb der Klickfläche');

  ev(`setEndspurtSpuelStart(S.cycles[0].id)`);
  await new Promise(x => setTimeout(x, 40));
  out.dialogMin = ev(`parseInt(document.getElementById('input-modal-field').getAttribute('min'),10)`);
  ev(`(function(){document.getElementById('input-modal-field').value='109';document.getElementById('input-modal-ok').click();})()`);
  await new Promise(x => setTimeout(x, 60));
  const heuteOk = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const st = endspurtState(c, todayISO()); const f = [];
    if (st.spuelStart !== st.heuteTag) f.push('Spülstart heute wurde abgelehnt (' + st.spuelStart + ')');
    if (getAction(todayISO(), c) !== 'spuelen') f.push('heute ist kein Spültag');
    return JSON.stringify({ out: { spuel: st.spuelStart, heute: st.heuteTag, gaenge: st.spuelGaenge }, fehler: f });
  })()`));
  Object.assign(out, { spuelstartHeute: heuteOk.out }); fehler.push(...heuteOk.fehler);
  // (v1.5.84) Die Untergrenze liegt jetzt am Ende der Anzucht, nicht bei heute —
  // rückwirkende Spülstarts sollen möglich sein.
  if (out.dialogMin > heuteOk.out.heute) fehler.push('Dialog erlaubt heute nicht als Wert');

  // (v1.5.84) Rückwirkend ist erlaubt — mit Rückfrage, und Einträge bleiben erhalten.
  ev(`(function(){
    const c = S.cycles[0];
    c.bloomDays = 86; c.flushWetDays = 4; c.iceDryDays = 3; _syncFlushPhase(c);
    const iso = isoPlus(c.startDate, 106);           // Tag 107
    S.entries[iso] = { cycleData: { [c.id]: { water: 11000, ph: 6.3, note: 'gespült' } } };
    saveS();
  })()`);
  ev(`setEndspurtSpuelStart(S.cycles[0].id)`);
  await new Promise(x => setTimeout(x, 40));
  ev(`(function(){document.getElementById('input-modal-field').value='107';document.getElementById('input-modal-ok').click();})()`);
  await new Promise(x => setTimeout(x, 50));
  out.rueckfrage = ev(`/Spülstart rückwirkend setzen/.test(document.body.textContent)`);
  if (!out.rueckfrage) fehler.push('keine Rückfrage beim rückwirkenden Setzen');
  ev(`_modalResolve && _modalResolve(true)`);
  await new Promise(x => setTimeout(x, 60));
  const rueck = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const st = endspurtState(c, todayISO()); const f = [];
    const akt = (d) => getAction(isoPlus(c.startDate, d - 1), c) || '-';
    if (st.spuelStart !== 107) f.push('Spülstart nicht rückwirkend auf 107 (' + st.spuelStart + ')');
    if (akt(107) !== 'spuelen') f.push('Tag 107 ist kein Spültag');
    if (akt(104) !== 'giess') f.push('letzter Düngerguss an Tag 104 verloren');
    if (akt(110) !== 'spuelen') f.push('zweiter Spülgang nicht an Tag 110');
    if (akt(114) !== 'ice') f.push('IceFlush nicht an Tag 114');
    const e = S.entries[isoPlus(c.startDate, 106)];
    if (!e || !e.cycleData[c.id] || e.cycleData[c.id].water !== 11000) f.push('Eintrag von Tag 107 ging verloren');
    if (!e || e.cycleData[c.id].note !== 'gespült') f.push('Notiz von Tag 107 ging verloren');
    return JSON.stringify({ out: { spuel: st.spuelStart, gaenge: st.spuelGaenge, ice: st.iceStart, ernte: st.ernteTag }, fehler: f });
  })()`));
  Object.assign(out, { rueckwirkend: rueck.out }); fehler.push(...rueck.fehler);

  // Abbrechen ändert nichts
  ev(`setEndspurtSpuelStart(S.cycles[0].id)`);
  await new Promise(x => setTimeout(x, 40));
  ev(`(function(){document.getElementById('input-modal-field').value='102';document.getElementById('input-modal-ok').click();})()`);
  await new Promise(x => setTimeout(x, 50));
  ev(`_modalResolve && _modalResolve(false)`);
  await new Promise(x => setTimeout(x, 50));
  out.abgebrochen = ev(`endspurtState(S.cycles[0], todayISO()).spuelStart`);
  if (out.abgebrochen !== 107) fehler.push('Abbrechen hat trotzdem geändert (' + out.abgebrochen + ')');

  // (v1.5.85) „Letzter Guss" auch rückwirkend — der − darf nicht wegen Vergangenheit sperren
  ev(`(function(){
    const c = S.cycles[0];
    c.startDate = isoPlus(todayISO(), -109);      // heute = Tag 110
    c.anzuchtDays = 21; c.bloomDays = 86; c.iceDays = 2; c.harvestDays = 1; c.dryDays = 7; c.intFlush = 3;
    c.flushWetDays = 4; c.iceDryDays = 3; _syncFlushPhase(c);
    c.flushDryDays = 0; c._flushDryOff = true; delete c.flushDryFrom;
    S.entries = {}; [94, 97, 100, 103, 106].forEach(i => S.entries[isoPlus(c.startDate, i)] = { cycleData: { [c.id]: { water: 12000 } } });
    saveS(); S.beginnerMode = false; goTo('gussplan'); renderGussplan();
  })()`);
  out.minusNutzbar = ev(`(function(){
    const b = [...document.getElementById('scr-gussplan').querySelectorAll('button')]
      .find(x => (x.getAttribute('onclick') || '').includes('setEndspurtGuss') && (x.getAttribute('onclick') || '').includes(',104)'));
    return !!b && !b.disabled;
  })()`);
  if (!out.minusNutzbar) fehler.push('„Letzter Guss −" ist gesperrt, obwohl der Tag nach der Anzucht liegt');
  ev(`setEndspurtGuss(S.cycles[0].id, 104)`);
  await new Promise(x => setTimeout(x, 50));
  out.rueckfrageGuss = ev(`/Rückwirkend setzen/.test(document.body.textContent)`);
  if (!out.rueckfrageGuss) fehler.push('keine Rückfrage beim rückwirkenden letzten Guss');
  ev(`_modalResolve && _modalResolve(true)`);
  await new Promise(x => setTimeout(x, 60));
  const zielkette = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const st = endspurtState(c, todayISO()); const f = [];
    const akt = (d) => getAction(isoPlus(c.startDate, d - 1), c) || '-';
    if (st.letzterGuss !== 104) f.push('letzter Guss nicht 104 (' + st.letzterGuss + ')');
    if (st.spuelStart !== 107) f.push('Spülstart nicht 107 (' + st.spuelStart + ')');
    if (JSON.stringify(st.spuelGaenge) !== JSON.stringify([107, 110])) f.push('Spülgänge falsch: ' + JSON.stringify(st.spuelGaenge));
    if (st.iceStart !== 114) f.push('IceFlush nicht 114 (' + st.iceStart + ')');
    if (akt(104) !== 'giess') f.push('Tag 104 ist kein Gießtag');
    if (akt(107) !== 'spuelen') f.push('Tag 107 ist kein Spültag');
    // Eingetragene Werte der Vergangenheit bleiben
    if (!S.entries[isoPlus(c.startDate, 106)]) f.push('Eintrag von Tag 107 verloren');
    return JSON.stringify({ out: { guss: st.letzterGuss, spuel: st.spuelStart, gaenge: st.spuelGaenge, ice: st.iceStart, ernte: st.ernteTag }, fehler: f });
  })()`));
  Object.assign(out, { zielkette: zielkette.out }); fehler.push(...zielkette.fehler);

  Object.entries(out).forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  console.log(fehler.length ? 'FAIL\n  ' + fehler.join('\n  ') : 'OK endspurt');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(fehler.length ? 1 : 0);
})();
