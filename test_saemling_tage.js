/**
 * Sichert die Korrektur von Befund 01 (Pruefung vom 04.09.2026) ab.
 *
 * getTodayAction() kannte sechs Aufgabenarten, aber weder 'saettigung' (Tag 1,
 * Saettigungsguss) noch 'sprueh' (Tag 2-8, nur spruehen). Fuer diese Tage gab
 * die Funktion null zurueck, die Startseite baute keine Handlungskarte und der
 * Einsteiger-Modus zeigte stattdessen "Heute alles ruhig" — acht Tage lang,
 * ausgerechnet in der empfindlichsten Phase des Saemlings.
 *
 * Geprueft wird der komplette Weg: Aufgabe -> Karte -> was auf dem Bildschirm
 * ankommt. Und dass der Weg 'direct' (Erde nicht vorbefeuchtet) unveraendert
 * funktioniert.
 */
const { loadApp } = require('./harness');

const NL = String.fromCharCode(10);

(async () => {
  const { window, errors } = await loadApp();
  const ev = (src) => window.eval(src);
  const fail = [];
  if (errors.length) fail.push('jsdom-Errors: ' + errors.join(' | '));

  // Legt einen frischen Zyklus an, bei dem "heute" der Tag `tag` ist.
  const aufTag = (tag, startMethod) => ev(
    'S.cycles = []; S.entries = {}; S.beginnerMode = true;' +
    'var c = addCyc({ name: "Saemlingstest", seedType: "auto", medium: "erde" });' +
    'c.startDate = isoPlus(todayISO(), -' + (tag - 1) + ');' +
    'c.plants = 1; c.potSize = 11;' +
    'c.startMethod = ' + JSON.stringify(startMethod) + ';' +
    'saveS(); c.id'
  );

  // ---------- Weg 1: vorbefeuchtet (Standard) ----------
  const tage = [];
  for (let tag = 1; tag <= 12; tag++) {
    aufTag(tag, 'saturated');
    const z = JSON.parse(ev(
      '(function(){' +
      '  var c = S.cycles[0], iso = todayISO(), p = phase(iso, c), a = getAction(iso, c);' +
      '  var td = getTodayAction(c, p, a, iso);' +
      '  return JSON.stringify({' +
      '    aktion: a || null,' +
      '    karte: !!td,' +
      '    titel: td ? td.titel || td.title : null,' +
      '    schritte: td && td.steps ? td.steps.length : 0,' +
      '    schritteText: td && td.steps ? td.steps.join(" | ") : "",' +
      '    hinweis: !!(td && td.hint),' +
      '    hinweisText: td && td.hint ? td.hint : "",' +
      '    erklaertext: (typeof plainSentence === "function") ? (plainSentence(a, c, p, 0) || "") : ""' +
      '  });' +
      '})()'
    ));
    tage.push(Object.assign({ tag }, z));
  }

  for (const t of tage) {
    if (t.tag >= 1 && t.tag <= 8) {
      if (!t.karte) fail.push('Tag ' + t.tag + ' (' + t.aktion + '): immer noch keine Handlungskarte');
      else {
        if (!t.schritte) fail.push('Tag ' + t.tag + ': Karte ohne Handlungsschritte');
        if (!t.hinweis) fail.push('Tag ' + t.tag + ': Karte ohne Erklaerung');
      }
    }
  }
  const t1 = tage[0];
  if (t1.aktion !== 'saettigung') fail.push('Tag 1 ist nicht der Saettigungsguss, sondern: ' + t1.aktion);
  if (t1.titel && t1.titel.indexOf('Sättigungsguss') < 0) fail.push('Tag-1-Karte heisst nicht nach dem Saettigungsguss: ' + t1.titel);
  const t3 = tage[2];
  if (t3.aktion !== 'sprueh') fail.push('Tag 3 ist kein Spruehtag, sondern: ' + t3.aktion);
  if (t3.titel && t3.titel.indexOf('sprühen') < 0) fail.push('Spruehtag-Karte spricht nicht vom Spruehen: ' + t3.titel);

  // Die Karte darf sich nicht selbst widersprechen: der Erklaertext nennt
  // "3 Etappen je ~250 ml", die Handlungsschritte muessen dieselbe Zahl nennen.
  const etappenImText = (t1.erklaertext.match(/je ~?(\d+)\s?ml/i) || [])[1];
  const etappenImSchritt = (t1.schritteText.match(/je ~?(\d+)\s?ml/i) || [])[1];
  if (!etappenImText) fail.push('Tag 1: Erklaertext nennt keine Etappen-Menge mehr — Pruefung ins Leere');
  else if (etappenImText !== etappenImSchritt) {
    fail.push('Tag 1: widerspruechliche Mengen auf einer Karte — Text sagt ' + etappenImText + ' ml, Schritt sagt ' + etappenImSchritt + ' ml');
  }

  // Der Hinweis auf den Spruehtagen zaehlt herunter, damit der Anfaenger weiss,
  // wie lange das noch so geht. Tag 2 -> 7 Tage, Tag 8 -> 1 Tag (Einzahl).
  const erwarteterRest = { 2: '7 Tage', 5: '4 Tage', 8: '1 Tag' };
  for (const tag of Object.keys(erwarteterRest)) {
    const t = tage[Number(tag) - 1];
    if (t.hinweisText.indexOf(erwarteterRest[tag]) < 0) {
      fail.push('Tag ' + tag + ': Hinweis sollte "' + erwarteterRest[tag] + '" nennen, sagt aber: ' + t.hinweisText);
    }
  }

  // ---------- Was der Einsteiger tatsaechlich auf dem Schirm liest ----------
  const schirm = [];
  for (const tag of [1, 3, 8]) {
    aufTag(tag, 'saturated');
    const r = JSON.parse(ev(
      '(function(){ renderDash();' +
      '  var txt = document.getElementById("scr-dash").textContent;' +
      '  return JSON.stringify({ allesRuhig: txt.indexOf("Heute alles ruhig") >= 0, laenge: txt.length,' +
      '    nenntGiessen: txt.indexOf("Sättigungsguss") >= 0, nenntSpruehen: txt.indexOf("sprühen") >= 0 });' +
      '})()'
    ));
    schirm.push(Object.assign({ tag }, r));
    if (r.allesRuhig) fail.push('Tag ' + tag + ': Startseite meldet weiterhin "Heute alles ruhig"');
  }
  if (!schirm[0].nenntGiessen) fail.push('Tag 1: "Sättigungsguss" steht nicht auf der Startseite');
  if (!schirm[1].nenntSpruehen) fail.push('Tag 3: vom Spruehen ist auf der Startseite keine Rede');

  // ---------- Weg 2: direkt einpflanzen darf sich nicht geaendert haben ----------
  aufTag(1, 'direct');
  const direkt = JSON.parse(ev(
    '(function(){ var c = S.cycles[0], iso = todayISO(), p = phase(iso, c), a = getAction(iso, c);' +
    '  return JSON.stringify({ aktion: a || null, karte: !!getTodayAction(c, p, a, iso) }); })()'
  ));
  if (direkt.aktion !== 'giess_anz') fail.push('Direkt-Einpflanzen: Tag 1 ist nicht giess_anz, sondern ' + direkt.aktion);
  if (!direkt.karte) fail.push('Direkt-Einpflanzen: Tag 1 ohne Handlungskarte');

  // ---------- Ausgabe ----------
  console.log('Vorbefeuchtet — Tag: Aufgabe -> Karte');
  for (const t of tage) {
    console.log('  Tag ' + String(t.tag).padStart(2) + '  ' + String(t.aktion || '—').padEnd(11) + ' -> ' + (t.karte ? 'ja' : 'nein'));
  }
  console.log('Startseite   : ' + schirm.map((s) => 'Tag ' + s.tag + (s.allesRuhig ? ' STUMM' : ' fuehrt')).join(' | '));
  console.log('Direkt-Weg   : Tag 1 = ' + direkt.aktion + ', Karte ' + (direkt.karte ? 'ja' : 'nein'));
  console.log(fail.length ? 'FAIL' + NL + '  ' + fail.join(NL + '  ') : 'OK saemling-tage');
  process.exit(fail.length ? 1 : 0);
})();
