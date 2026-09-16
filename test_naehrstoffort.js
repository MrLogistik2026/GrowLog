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

  // (v1.5.233) Dieselbe Frage wird an zwei Orten beantwortet: in PROBLEMS (Diagnose, oben geprueft)
  // und in SYMPTOMS — den Schnellhilfe-Karten, die ein Anfaenger ZUERST sieht. Die Karte zum
  // Magnesium-Mangel riet zu CalMag und zu einer festen Mischreihenfolge. Beides war falsch
  // (ANBAU.md 6.2 und 10); die Diagnose sagte seit v1.5.107 laengst das Richtige.
  console.log('\n--- Schnellhilfe-Karten (SYMPTOMS) gegen die Diagnose ---');
  const SYM = JSON.parse(w.eval('JSON.stringify(SYMPTOMS)'));
  const karten = SYM.reduce((a, g) => a.concat((g.causes || []).map(c => Object.assign({ gruppe: g.id }, c))), []);
  const mgK = karten.find(k => /Magnesium-Mangel/.test(k.verdict || ''));
  ok(!!mgK, 'Es gibt eine Schnellhilfe-Karte "Magnesium-Mangel"');
  ok(!!mgK && !/CalMag dazu/.test(mgK.text), 'Sie raet nicht mehr zu CalMag gegen Magnesium-Mangel');
  ok(!!mgK && /Kalium/.test(mgK.text), 'Sie nennt Kalium als die haeufigere Ursache in der Bluete (ANBAU 6.2)');
  ok(!!mgK && /Bittersalz/.test(mgK.text), 'Sie nennt Bittersalz als Mittel, und erst nach der Ursache');
  ok(!!mgK && /unten/.test(mgK.text), 'Sie nennt den Ort: unten, weil Magnesium beweglich ist (ANBAU 6.1)');
  ok(!!mgK && !/immer zuerst ins Wasser/.test(mgK.text),
     'Keine feste Mischreihenfolge mehr auf der Karte — die gehoert zum Plan (ANBAU 10, v1.5.109)');

  // (v1.5.234) Dieselbe Prüfung für die Calcium-Karte. Sie hieß „oft zuerst unten" und widersprach damit
  // ca_deficiency (location: newLeaves, seit v1.5.107) — und sie steht VOR der Diagnose.
  const caK = karten.find(k => /Calcium-Mangel/.test(k.verdict || ''));
  ok(!!caK, 'Es gibt eine Schnellhilfe-Karte "Calcium-Mangel"');
  ok(!!caK && !/oft zuerst unten/.test(caK.heading || ''), 'Ihre Ueberschrift schickt nicht mehr nach unten');
  ok(!!caK && /oben/.test(caK.text), 'Sie nennt den Ort oben — Calcium ist unbeweglich (ANBAU 6.1)');
  ok(!!caK && /Magnesium, nicht Calcium/.test(caK.text), 'Sie liefert die Abgrenzung zu Magnesium mit');
  ok(!!caK && /Verdunstungsstrom/.test(caK.text), 'Sie nennt den Transportweg (ANBAU 1)');
  ok(!!caK && /Umluft und Luftfeuchte pr(ü|ue)fen, dann den pH, und erst danach CalMag/.test(caK.text),
     'Reihenfolge wie in der Diagnose: erst Klima, dann pH, dann CalMag');
  // (v1.5.235) Es gibt ZWEI Magnesium-Karten in SYMPTOMS, in verschiedenen Symptom-Gruppen.
  // v1.5.233 hat nur die erste berichtigt, weil die Suche mit find lief — und find nimmt die erste
  // Fundstelle. Deshalb zaehlen diese Pruefungen ueber ALLE Karten, statt eine zu suchen.
  console.log('\n--- Gegenprobe ueber alle Karten, nicht nur die erste ---');
  const mgAlle = karten.filter(k => /Magnesium-Mangel/.test(k.verdict || ''));
  ok(mgAlle.length === 2, 'Es gibt zwei Magnesium-Karten (gefunden: ' + mgAlle.length + ')');
  ok(mgAlle.length > 0 && mgAlle.every(k => /Bittersalz/.test(k.text || '')),
     'Beide nennen Bittersalz als Mittel, nicht CalMag');
  ok(mgAlle.length > 0 && mgAlle.every(k => /Kalium/.test(k.text || '')),
     'Beide nennen den Kalium-Antagonismus als haeufigere Ursache (ANBAU 6.2)');
  ok(!karten.some(k => /CalMag dazu/.test(k.text || '')),
     'Keine Karte raet mehr "CalMag dazu" gegen Magnesium-Mangel');
  ok(!karten.some(k => /immer zuerst ins Wasser/.test(k.text || '')),
     'Keine einzige Karte nennt mehr eine feste Mischreihenfolge (ANBAU 10, v1.5.109)');
  ok(!karten.some(k => /unter 6\.0 wird Magnesium blockiert/.test(k.text || '')),
     'Keine feste pH-Zahl mehr — das Ziel haengt am Substrat (phTargetFor)');
  ok(mgAlle.some(k => /Ziel deines Substrats/.test(k.text || '')),
     'Stattdessen steht dort das pH-Ziel des jeweiligen Substrats');

  console.log('\n' + (fail.length ? 'FEHLGESCHLAGEN: ' + fail.length : 'ALLE PRUEFUNGEN GRUEN') + '  (TZ=' + (process.env.TZ || 'System') + ')');
  process.exit(fail.length ? 1 : 0);
})();
