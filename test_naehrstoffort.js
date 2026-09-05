/**
 * Prueft, dass die Diagnose-Datenbank den Symptomort nach der Naehrstoff-Mobilitaet
 * fuehrt (ANBAU.md 6.1): Magnesium ist beweglich -> Symptom UNTEN, Calcium ist
 * unbeweglich -> Symptom OBEN. Vorher lagen beide in einem Eintrag mit "oben",
 * wodurch der haeufigere Magnesium-Fall in der Bluete nicht gefunden wurde.
 */
const { loadApp } = require('./harness.js');

(async () => {
  const { window, errors } = await loadApp();
  const w = window;
  const fail = [];
  const ok = (b, t) => { if (!b) fail.push(t); console.log((b ? '  ok   ' : '  FEHL ') + t); };

  if (errors.length) fail.push('Startfehler: ' + errors.length);

  const rang = (sym, ctx, id) => {
    const r = w.diagnoseProblems(sym, ctx || {});
    const i = r.findIndex(x => x.problem.id === id);
    return { platz: i < 0 ? 99 : i + 1, score: i < 0 ? 0 : r[i].score, liste: r.map(x => x.problem.id) };
  };

  console.log('\n--- Magnesium: gelb zwischen den Adern, UNTEN, Bluete ---');
  const mgU = rang({ location: ['oldLeaves'], colors: ['yellow'], shapes: ['spotted'] }, { phase: 'bloom' }, 'mg_deficiency');
  console.log('  Reihenfolge:', mgU.liste.join(' > '));
  ok(mgU.platz === 1, 'Magnesium steht bei "unten + gelb + gefleckt" auf Platz 1 (ist ' + mgU.platz + ')');

  const mgU2 = rang({ location: ['oldLeaves'], colors: ['yellow'] }, { phase: 'bloom' }, 'mg_deficiency');
  console.log('  Reihenfolge:', mgU2.liste.join(' > '));
  ok(mgU2.platz <= 3, 'Magnesium ist bei "unten + gelb" unter den ersten drei (ist ' + mgU2.platz + ')');

  console.log('\n--- Calcium: braune Flecken OBEN ---');
  const caO = rang({ location: ['newLeaves'], colors: ['brown'], shapes: ['spotted'] }, { phase: 'bloom' }, 'ca_deficiency');
  console.log('  Reihenfolge:', caO.liste.join(' > '));
  ok(caO.platz <= 2, 'Calcium ist bei "oben + braun + gefleckt" unter den ersten zwei (ist ' + caO.platz + ')');

  console.log('\n--- Gegenprobe: Calcium darf unten NICHT vorn stehen ---');
  const caU = rang({ location: ['oldLeaves'], colors: ['yellow'], shapes: ['spotted'] }, { phase: 'bloom' }, 'ca_deficiency');
  ok(caU.platz > 1, 'Calcium steht bei einem Bild von unten nicht auf Platz 1 (ist ' + caU.platz + ')');
  const mgO = rang({ location: ['newLeaves'], colors: ['brown'], shapes: ['spotted'] }, { phase: 'bloom' }, 'mg_deficiency');
  ok(mgO.platz > 1, 'Magnesium steht bei einem Bild von oben nicht auf Platz 1 (ist ' + mgO.platz + ')');

  console.log('\n--- Inhalt der beiden Eintraege ---');
  const P = JSON.parse(w.eval('JSON.stringify(PROBLEMS)'));
  const mg = P.find(x => x.id === 'mg_deficiency');
  const ca = P.find(x => x.id === 'ca_deficiency');
  ok(!!mg && !!ca, 'Beide Eintraege existieren');
  ok(!P.some(x => x.id === 'calmag_deficiency'), 'Der alte Sammel-Eintrag ist weg');
  ok(mg.symptoms.location.includes('oldLeaves') && !mg.symptoms.location.includes('newLeaves'),
     'Magnesium steht unten, nicht oben');
  ok(ca.symptoms.location.includes('newLeaves') && !ca.symptoms.location.includes('oldLeaves'),
     'Calcium steht oben, nicht unten');
  ok(/Kalium/.test(mg.action), 'Magnesium-Handlung nennt Kalium als Ursache (Antagonismus, ANBAU 6.2)');
  ok(/Bittersalz|Epsom/.test(mg.action), 'Magnesium-Handlung nennt Bittersalz statt nur CalMag');
  ok(/Verdunstungsstrom|verdunstet/.test(ca.action), 'Calcium-Handlung nennt den Transportweg (ANBAU 1)');
  ok(/Abgrenzung/.test(mg.description) && /Abgrenzung/.test(ca.description),
     'Beide Eintraege liefern das Unterscheidungskriterium mit');

  console.log('\n--- Begruendung in Klartext (v1.5.108) ---');
  const r = w.diagnoseProblems(
    { location: ['oldLeaves'], colors: ['yellow'], shapes: ['spotted'] },
    { phase: 'flush', daysToHarvestLow: true });
  const gruende = r.map(x => x.matchedReasons.join('; ')).join(' | ');
  const kontext = r.map(x => x.contextReasons.join('; ')).join(' | ');
  console.log('  Symptome:', r[0].matchedReasons.join('; '));
  console.log('  Kontext: ', r[0].contextReasons.join('; '));
  ok(!/oldLeaves|newLeaves|allLeaves|paleGreen|darkGreen|curlUp|curlDown|burnTips/.test(gruende),
     'Keine internen Schluessel mehr in der Symptom-Begruendung');
  ok(/Alte Bl/.test(gruende), 'Die Symptom-Begruendung nennt "Alte Blaetter (unten)" im Klartext');
  ok(/Gelb/.test(gruende), 'Die Symptom-Begruendung nennt die Farbe im Klartext');
  ok(!/\(flush\)|\(bloom\)|\(anzucht\)/.test(kontext), 'Keine internen Phasennamen mehr im Kontext');
  ok(/Sp(ü|ue)len/.test(kontext), 'Die Phase steht als "Spuelen" da, nicht als "flush"');
  ok(w._diagWort('location', 'gibtesnicht') === 'gibtesnicht', 'Unbekannter Schluessel faellt sauber zurueck');
  ok(w._phasenWort('bloom') === 'Blüte', 'Phasenname kommt aus PN');

  console.log('\n' + (fail.length ? 'FEHLGESCHLAGEN: ' + fail.length : 'ALLE PRUEFUNGEN GRUEN') + '  (TZ=' + (process.env.TZ || 'System') + ')');
  process.exit(fail.length ? 1 : 0);
})();
