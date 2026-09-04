/**
 * Sichert Befund 06 (Pruefung vom 04.09.2026) und das dabei gefundene
 * Substrat-Problem ab.
 *
 * Ausgangslage: Der Assistent bot ausschliesslich BioBizz an — auch Coco-
 * Growern, fuer die ein organischer Erdduenger schlicht falsch ist. Die Plaene
 * fuer CANNA Terra, Hesi und Plagron lagen fertig im Code, wurden aber nirgends
 * angeboten; im Duengeplan-Bildschirm standen sie als ausgegraute "· bald"-
 * Knoepfe. Umgekehrt war "CANNA Coco A+B" dort fuer jeden waehlbar, auch im
 * Erd-Grow, ohne jede Warnung.
 *
 * Der wichtigste Teil dieses Tests ist die Substrat-Zuordnung. Ein Coco-Plan in
 * Erde bedeutet Ueberduengung und pH-Absturz, ein Erd-Plan in Coco einen
 * schleichenden Mangel — beides kostet Ertrag. Das darf nie durchrutschen.
 */
const { loadApp } = require('./harness');

const NL = String.fromCharCode(10);
const ERLAUBTE_MEDIEN = ['erde', 'coco', 'hydro'];

// Grobe Obergrenze fuer eine einzelne Gabe. Der hoechste Wert im Bestand ist 25
// (Aloe Vera, ein Biostimulator — bei denen sind hohe Raten gewollt und
// ungefaehrlich). Diese Schranke faengt nur noch grobe Ausreisser ab.
const MAX_ML_EINZELGABE = 30;

// Fingerabdruck jedes Plans, aufgenommen am 04.09.2026.
//
// Der Sinn: Die Dosierungen stammen von den Herstellern und wurden geprueft.
// Eine unbeabsichtigte Aenderung daran — beim Umbauen, Umformatieren oder
// Zusammenfuehren — waere genau der Fehler, der den Nutzer Ertrag kostet und
// den man beim Durchlesen am leichtesten uebersieht. Faellt dieser Test, ist
// eine Dosierung verrutscht: nachsehen, und die Zahl hier nur dann anpassen,
// wenn die Aenderung wirklich gewollt war.
const FINGERABDRUCK = {
  biobizz_konservativ: { medium: 'erde', produkte: 9,  wochen: 12, gaben: 55,  summe: 255.4 },
  biobizz_light:       { medium: 'erde', produkte: 8,  wochen: 12, gaben: 54,  summe: 47.4 },
  biobizz_master:      { medium: 'erde', produkte: 8,  wochen: 12, gaben: 54,  summe: 88.6 },
  biobizz_official:    { medium: 'erde', produkte: 7,  wochen: 12, gaben: 56,  summe: 112 },
  biobizz_outdoor:     { medium: 'erde', produkte: 8,  wochen: 12, gaben: 34,  summe: 100 },
  canna:               { medium: 'erde', produkte: 5,  wochen: 10, gaben: 22,  summe: 67 },
  canna_coco:          { medium: 'coco', produkte: 7,  wochen: 12, gaben: 45,  summe: 91.7 },
  cup_sieger:          { medium: 'erde', produkte: 11, wochen: 12, gaben: 67,  summe: 160.55 },
  ghe_flora:           { medium: 'coco', produkte: 6,  wochen: 12, gaben: 44,  summe: 62.5 },
  hesi:                { medium: 'erde', produkte: 7,  wochen: 10, gaben: 23,  summe: 63 },
  plagron:             { medium: 'erde', produkte: 5,  wochen: 10, gaben: 22,  summe: 54 },
  sensi_amnesia_auto:  { medium: 'erde', produkte: 10, wochen: 17, gaben: 105, summe: 109.25 },
};

(async () => {
  const { window, errors } = await loadApp();
  const ev = (src) => window.eval(src);
  const fail = [];
  if (errors.length) fail.push('jsdom-Errors: ' + errors.join(' | '));

  // ---------- Jeder Plan kennt sein Substrat ----------
  const plaene = JSON.parse(ev(
    'JSON.stringify(Object.entries(FERT_PRESETS).map(function(e){' +
    '  var k = e[0], p = e[1];' +
    '  var summe = 0, anzahl = 0, hoechst = 0, hoechstProd = null;' +
    '  Object.keys(p.schedule || {}).forEach(function(w){' +
    '    var woche = p.schedule[w] || {};' +
    '    Object.keys(woche).forEach(function(prod){' +
    '      var v = Number(woche[prod]) || 0;' +
    '      summe += v; anzahl++;' +
    '      if (v > hoechst) { hoechst = v; hoechstProd = prod; }' +
    '    });' +
    '  });' +
    '  return { key: k, name: p.name, medium: p.medium || null, subtitle: p.subtitle || null,' +
    '           wochen: Object.keys(p.schedule || {}).length, produkte: (p.products || []).length,' +
    '           gaben: anzahl, summe: Math.round(summe * 1000) / 1000,' +
    '           hoechst: hoechst, hoechstProd: hoechstProd };' +
    '}))'
  ));

  for (const p of plaene) {
    if (!p.medium) fail.push('Plan "' + p.key + '" hat kein Substrat hinterlegt — er koennte im falschen Grow landen');
    else if (ERLAUBTE_MEDIEN.indexOf(p.medium) < 0) fail.push('Plan "' + p.key + '" hat ein unbekanntes Substrat: ' + p.medium);
    if (!p.produkte) fail.push('Plan "' + p.key + '" hat keine Produkte');
    if (!p.wochen) fail.push('Plan "' + p.key + '" hat keinen Wochenplan');
    if (p.hoechst > MAX_ML_EINZELGABE) {
      fail.push('Plan "' + p.key + '": ' + p.hoechstProd + ' mit ' + p.hoechst
        + ' liegt ueber der Plausibilitaetsgrenze von ' + MAX_ML_EINZELGABE);
    }

    // Fingerabdruck: sind die geprueften Dosierungen noch dieselben?
    const soll = FINGERABDRUCK[p.key];
    if (!soll) {
      fail.push('Plan "' + p.key + '" ist neu und hat keinen Fingerabdruck — Dosierungen pruefen und in FINGERABDRUCK eintragen');
    } else {
      if (soll.medium !== p.medium) fail.push('Plan "' + p.key + '": Substrat geaendert (' + soll.medium + ' -> ' + p.medium + ')');
      if (soll.produkte !== p.produkte) fail.push('Plan "' + p.key + '": Produktzahl geaendert (' + soll.produkte + ' -> ' + p.produkte + ')');
      if (soll.wochen !== p.wochen) fail.push('Plan "' + p.key + '": Wochenzahl geaendert (' + soll.wochen + ' -> ' + p.wochen + ')');
      if (soll.gaben !== p.gaben) fail.push('Plan "' + p.key + '": Anzahl der Gaben geaendert (' + soll.gaben + ' -> ' + p.gaben + ')');
      if (Math.abs(soll.summe - p.summe) > 0.001) {
        fail.push('Plan "' + p.key + '": DOSIERUNG VERAENDERT — Summe aller Gaben ' + soll.summe + ' -> ' + p.summe);
      }
    }
  }

  for (const key of Object.keys(FINGERABDRUCK)) {
    if (!plaene.some((p) => p.key === key)) fail.push('Plan "' + key + '" ist verschwunden');
  }

  // ---------- Die drei nachgereichten Plaene sind sichtbar ----------
  // Der Duengeplan-Bildschirm filtert auf Plaene mit Beschreibung. Ohne die
  // waeren CANNA Terra, Hesi und Plagron weiterhin unsichtbar.
  for (const key of ['canna', 'hesi', 'plagron']) {
    const p = plaene.find((x) => x.key === key);
    if (!p) { fail.push('Plan "' + key + '" fehlt komplett'); continue; }
    if (!p.subtitle) fail.push('Plan "' + key + '" ohne Beschreibung — er bliebe im Duengeplan-Bildschirm unsichtbar');
  }

  // ---------- Keine "bald"-Platzhalter mehr ----------
  const platzhalter = JSON.parse(ev(
    '(function(){ renderDuenger(); var t = document.getElementById("scr-duenger").textContent;' +
    '  return JSON.stringify({ bald: (t.match(/· bald/g) || []).length, text: t.slice(0, 0) }); })()'
  ));
  if (platzhalter.bald > 0) {
    fail.push(platzhalter.bald + ' ausgegraute "· bald"-Knoepfe im Duengeplan-Bildschirm — die Plaene gibt es inzwischen wirklich');
  }

  // ---------- Der Assistent bietet nur passende Plaene an ----------
  const wizard = {};
  for (const med of ['erde', 'coco']) {
    const html = ev('_wizStepFertPlan(' + JSON.stringify({ medium: med, growType: 'indoor' }) + ')');
    const angeboten = plaene.filter((p) => html.indexOf("'" + p.key + "'") >= 0).map((p) => p.key);
    wizard[med] = angeboten;
    if (angeboten.length === 0) fail.push('Assistent bietet fuer ' + med + ' gar keinen Plan an');
    for (const key of angeboten) {
      const p = plaene.find((x) => x.key === key);
      if (p && p.medium !== med) {
        fail.push('Assistent bietet bei Substrat "' + med + '" den ' + p.medium + '-Plan "' + p.name + '" an — genau das darf nicht passieren');
      }
    }
  }
  if (wizard.erde.indexOf('canna') < 0) fail.push('Assistent bietet CANNA Terra in Erde nicht an');
  if (wizard.erde.indexOf('hesi') < 0) fail.push('Assistent bietet Hesi in Erde nicht an');
  if (wizard.erde.indexOf('plagron') < 0) fail.push('Assistent bietet Plagron in Erde nicht an');
  if (wizard.coco.indexOf('canna_coco') < 0) fail.push('Assistent bietet CANNA Coco in Coco nicht an');

  // ---------- Das Sicherheitsnetz greift ----------
  const netz = JSON.parse(ev(
    '(function(){' +
    '  S.cycles = []; S.entries = {};' +
    '  var c = addCyc({ name: "Erdgrow", seedType: "auto", medium: "erde" });' +
    '  c.startDate = todayISO(); saveS();' +
    '  var inErde = { passend: presetMediumMismatch("biobizz_light"), unpassend: presetMediumMismatch("canna_coco") };' +
    '  c.medium = "coco"; saveS();' +
    '  var inCoco = { passend: presetMediumMismatch("canna_coco"), unpassend: presetMediumMismatch("biobizz_light") };' +
    '  return JSON.stringify({' +
    '    erdePassendStill: inErde.passend === null,' +
    '    erdeUnpassendWarnt: !!(inErde.unpassend && inErde.unpassend.text),' +
    '    erdeWarntext: inErde.unpassend ? inErde.unpassend.text : "",' +
    '    cocoPassendStill: inCoco.passend === null,' +
    '    cocoUnpassendWarnt: !!(inCoco.unpassend && inCoco.unpassend.text),' +
    '    cocoWarntext: inCoco.unpassend ? inCoco.unpassend.text : ""' +
    '  });' +
    '})()'
  ));
  if (!netz.erdePassendStill) fail.push('Warnung erscheint, obwohl der Plan zum Substrat passt (Erde)');
  if (!netz.cocoPassendStill) fail.push('Warnung erscheint, obwohl der Plan zum Substrat passt (Coco)');
  if (!netz.erdeUnpassendWarnt) fail.push('Coco-Plan im Erd-Grow loest KEINE Warnung aus');
  if (!netz.cocoUnpassendWarnt) fail.push('Erd-Plan im Coco-Grow loest KEINE Warnung aus');
  if (netz.erdeWarntext.indexOf('CalMag') >= 0) fail.push('Warntext fuer Erde nennt faelschlich das Coco-Argument CalMag');
  if (netz.cocoWarntext.indexOf('CalMag') < 0) fail.push('Warntext fuer Coco erwaehnt CalMag nicht — der zentrale Unterschied fehlt');

  // ---------- Abgelehnte Warnung laedt den Plan nicht ----------
  const abgelehnt = JSON.parse(ev(
    '(function(){' +
    '  S.cycles = []; S.entries = {}; S.fertPlans = []; S._activePlanId = null;' +
    '  var c = addCyc({ name: "Erdgrow", seedType: "auto", medium: "erde" });' +
    '  c.startDate = todayISO(); saveS();' +
    '  var vorher = (S.fertPlans || []).length;' +
    '  loadPreset("canna_coco");' +
    '  return JSON.stringify({ vorher: vorher, dialogOffen: document.getElementById("modal-overlay").classList.contains("show"),' +
    '    titel: document.getElementById("modal-title").textContent });' +
    '})()'
  ));
  if (!abgelehnt.dialogOffen) fail.push('loadPreset laedt den unpassenden Plan ohne Rueckfrage');
  if (abgelehnt.titel.indexOf('Substrat') < 0) fail.push('Der Rueckfrage-Dialog spricht nicht vom Substrat: ' + abgelehnt.titel);

  const nachAblehnung = JSON.parse(ev(
    '(function(){ document.getElementById("modal-cancel").click();' +
    '  return JSON.stringify({ plaene: (S.fertPlans || []).length, presetKey: S.presetKey || null }); })()'
  ));
  if (nachAblehnung.presetKey === 'canna_coco') fail.push('Nach "Abbrechen" wurde der unpassende Plan trotzdem geladen');

  // ---------- Ausgabe ----------
  console.log('Plan'.padEnd(22) + 'Substrat'.padEnd(9) + 'Wo'.padStart(3) + ' Prod'
    + ' Gaben' + '     Summe' + '   hoechste Einzelgabe');
  for (const p of plaene) {
    console.log(p.key.padEnd(22) + String(p.medium).padEnd(9) + String(p.wochen).padStart(3)
      + String(p.produkte).padStart(5) + String(p.gaben).padStart(6) + String(p.summe).padStart(10)
      + '   ' + p.hoechst + ' (' + p.hoechstProd + ')');
  }
  console.log(NL + 'Assistent bietet an:');
  console.log('  Erde: ' + wizard.erde.join(', '));
  console.log('  Coco: ' + wizard.coco.join(', '));
  console.log('Sicherheitsnetz: Coco-Plan in Erde ' + (netz.erdeUnpassendWarnt ? 'warnt' : 'STILL')
    + ' | Erd-Plan in Coco ' + (netz.cocoUnpassendWarnt ? 'warnt' : 'STILL')
    + ' | passende Plaene still: ' + (netz.erdePassendStill && netz.cocoPassendStill ? 'ja' : 'NEIN'));
  console.log(fail.length ? 'FAIL' + NL + '  ' + fail.join(NL + '  ') : 'OK duengeplaene');
  process.exit(fail.length ? 1 : 0);
})();
