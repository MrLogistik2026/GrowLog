/**
 * Sichert die drei Korrekturen vom 04.09.2026 ab:
 *
 *   1. Dialog-Falle — der Kasten war unbegrenzt hoch, ohne Scrollen, ohne
 *      Escape und ohne Hintergrund-Klick. Auf Bildschirmen unter ~740 px
 *      lagen die Knoepfe ausserhalb und man kam nur per Neuladen wieder raus.
 *   2. Zeilenumbrueche — #modal-msg wird per textContent gefuellt. Ohne
 *      white-space:pre-line wurden 47 von 58 Dialogen zu einem Fliesstext.
 *   3. Aufgaben-Namen — die Anzeige griff auf PN (Phasen-Namen) zurueck,
 *      wodurch 5 von 8 Aufgaben als roher Programmtext erschienen.
 */
const { loadApp } = require('./harness');

const AKTIONEN = ['giess', 'giess_anz', 'spuelen', 'ice', 'ernte', 'trocknen', 'saettigung', 'sprueh'];

// 'giess' und 'giess_anz' hatten an den Anzeigestellen schon vorher eigene,
// korrekte Formulierungen — die bleiben absichtlich stehen und gehen ACT_NAME
// vor. Alle uebrigen Aufgaben landen auf ACT_NAME. Erwartet wird hier, was
// tatsaechlich auf dem Bildschirm stehen soll.
const ERWARTET_AUF_SCHIRM = { giess: 'Gießtag', giess_anz: 'Anzucht' };
const NL = String.fromCharCode(10);
const schlaf = (ms) => new Promise((r) => setTimeout(r, ms));

/** Holt die Deklarationen eines CSS-Blocks aus dem <style> der Seite. */
function cssBlock(quelltext, selektor) {
  const start = quelltext.indexOf(selektor + ' {');
  if (start < 0) return null;
  const auf = quelltext.indexOf('{', start);
  const zu = quelltext.indexOf('}', auf);
  if (auf < 0 || zu < 0) return null;
  return quelltext.slice(auf + 1, zu).replace(/\s+/g, ' ').trim();
}

(async () => {
  const { window, errors } = await loadApp();
  const ev = (src) => window.eval(src);
  const fail = [];
  if (errors.length) fail.push('jsdom-Errors: ' + errors.join(' | '));

  // ================= 3. Aufgaben-Namen =================
  const namen = JSON.parse(ev('JSON.stringify(typeof ACT_NAME !== "undefined" ? ACT_NAME : null)'));
  if (!namen) {
    fail.push('ACT_NAME fehlt komplett');
  } else {
    for (const a of AKTIONEN) {
      if (!namen[a]) { fail.push('ACT_NAME.' + a + ' fehlt'); continue; }
      if (namen[a] === a) fail.push('ACT_NAME.' + a + ' ist der rohe Schluessel');
    }
  }

  // Die Anzeige faellt zurueck auf ACT_NAME -> PN -> roher Schluessel.
  // Genau diese Kette pruefen: sie darf fuer keine Aufgabe beim Schluessel enden.
  const kette = JSON.parse(ev(
    'JSON.stringify(' + JSON.stringify(AKTIONEN) +
    '.map(a => ({ a, label: (typeof ACT_NAME !== "undefined" && ACT_NAME[a]) || PN[a] || a })))'
  ));
  for (const { a, label } of kette) {
    if (label === a) fail.push('Anzeige fuer "' + a + '" endet beim rohen Schluessel');
  }

  // Und im echten Rendern: jede Aufgabe einmal erzwingen und pruefen, dass der
  // deutsche Name tatsaechlich auf der Startseite ankommt.
  const gerendert = JSON.parse(ev('(function(){' +
    'var problems = [], gesehen = {};' +
    'var echt = getAction;' +
    'S.cycles = []; S.entries = {}; S.beginnerMode = true;' +
    'var c = addCyc({ name: "Testzyklus", seedType: "auto", medium: "erde" });' +
    'c.startDate = todayISO(); c.plants = 1; c.potSize = 11;' +
    'saveS();' +
    'var liste = ' + JSON.stringify(AKTIONEN) + ';' +
    'var erwartet = ' + JSON.stringify(ERWARTET_AUF_SCHIRM) + ';' +
    'for (var i = 0; i < liste.length; i++) {' +
    '  var a = liste[i];' +
    '  var soll = erwartet[a] || ACT_NAME[a];' +
    '  try {' +
    '    window.getAction = function () { return a; };' +
    '    renderDash();' +
    '    var txt = document.getElementById("scr-dash").textContent;' +
    '    gesehen[a] = txt.indexOf(soll) >= 0;' +
    '    if (!gesehen[a]) problems.push(a + ": erwarteter Text \\"" + soll + "\\" erscheint nicht auf der Startseite");' +
    // Nur als ganzes Wort suchen: "ernte" steckt sonst in "geerntet",' +
    // "ice" in "Service" und so weiter.' +
    '    var alsWort = new RegExp("(^|[^a-zA-Z_])" + a + "([^a-zA-Z_]|$)");' +
    '    if (alsWort.test(txt)) problems.push(a + ": roher Programmschluessel steht auf dem Bildschirm");' +
    '  } catch (e) { problems.push(a + ": Absturz beim Rendern — " + e.message); }' +
    '}' +
    'window.getAction = echt;' +
    'return JSON.stringify({ problems: problems, gesehen: gesehen });' +
    '})()'));
  fail.push(...gerendert.problems);

  // ================= 1. + 2. CSS des Dialogs =================
  const style = ev('document.querySelector("style").textContent');
  const box = cssBlock(style, '#modal-box');
  const msg = cssBlock(style, '#modal-msg');
  const btns = cssBlock(style, '.modal-btns');

  if (!box) {
    fail.push('#modal-box im CSS nicht gefunden');
  } else {
    if (!/max-height/.test(box)) fail.push('#modal-box ohne max-height — Dialog kann wieder ueber den Rand wachsen');
    if (!/display:\s*flex/.test(box)) fail.push('#modal-box ohne flex — Knoepfe bleiben nicht stehen');
    if (!/box-sizing:\s*border-box/.test(box)) fail.push('#modal-box ohne border-box — Polsterung sprengt die Hoehe');
  }
  if (!msg) {
    fail.push('#modal-msg im CSS nicht gefunden');
  } else {
    if (!/white-space:\s*pre-line/.test(msg)) fail.push('#modal-msg ohne pre-line — Dialoge werden wieder zu Fliesstext');
    if (!/overflow-y:\s*auto/.test(msg)) fail.push('#modal-msg ohne overflow-y:auto — langer Text laesst sich nicht scrollen');
  }
  if (btns && !/flex:\s*none/.test(btns)) fail.push('.modal-btns ohne flex:none — Knoepfe koennen gestaucht werden');

  // ================= 1. Fluchtwege, im echten Ablauf =================
  ev('window.__t = {};' +
    '(async function () {' +
    '  var ov = document.getElementById("modal-overlay");' +
    '  var kasten = document.getElementById("modal-box");' +
    '  var NL = String.fromCharCode(10);' +
    '  var p;' +
    // a) Escape-Taste
    '  p = customConfirm("Titel", "Zeile eins" + NL + "Zeile zwei", "Verstanden");' +
    '  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));' +
    '  window.__t.escapeAntwort = await p;' +
    '  window.__t.escapeZu = !ov.classList.contains("show");' +
    // b) Tippen auf den Hintergrund
    '  p = customConfirm("Titel", "Text", "Verstanden");' +
    '  ov.dispatchEvent(new MouseEvent("click", { bubbles: true }));' +
    '  window.__t.hintergrundAntwort = await p;' +
    '  window.__t.hintergrundZu = !ov.classList.contains("show");' +
    // c) Tippen IM Kasten darf NICHT schliessen
    '  p = customConfirm("Titel", "Text", "Verstanden");' +
    '  kasten.dispatchEvent(new MouseEvent("click", { bubbles: true }));' +
    '  await new Promise(function (r) { setTimeout(r, 5); });' +
    '  window.__t.kastenBleibtOffen = ov.classList.contains("show");' +
    '  document.getElementById("modal-cancel").click();' +
    '  await p;' +
    // d) Zeilenumbrueche kommen unveraendert im Textfeld an
    '  p = customConfirm("Titel", "Zeile A" + NL + "Zeile B", "Verstanden");' +
    '  window.__t.umbruchImText = document.getElementById("modal-msg").textContent.indexOf(NL) >= 0;' +
    '  document.getElementById("modal-ok").click();' +
    '  window.__t.okAntwort = await p;' +
    '  window.__t.fertig = true;' +
    '})();');

  for (let i = 0; i < 80 && !ev('window.__t.fertig'); i++) await schlaf(25);
  const t = JSON.parse(ev('JSON.stringify(window.__t)'));

  if (!t.fertig) fail.push('Dialog-Ablauf nicht durchgelaufen (haengt)');
  if (t.escapeAntwort !== false) fail.push('Escape liefert nicht "abgebrochen"');
  if (!t.escapeZu) fail.push('Escape schliesst den Dialog nicht');
  if (t.hintergrundAntwort !== false) fail.push('Hintergrund-Tipp liefert nicht "abgebrochen"');
  if (!t.hintergrundZu) fail.push('Hintergrund-Tipp schliesst den Dialog nicht');
  if (!t.kastenBleibtOffen) fail.push('Tippen im Kasten schliesst den Dialog faelschlich');
  if (t.okAntwort !== true) fail.push('OK-Knopf liefert nicht "bestaetigt"');
  if (!t.umbruchImText) fail.push('Zeilenumbruch kommt nicht im Textfeld an');

  console.log('Aufgaben-Namen:', AKTIONEN.map((a) => a + '=' + (namen ? namen[a] : '?')).join(', '));
  console.log('Auf der Startseite sichtbar:', AKTIONEN.filter((a) => gerendert.gesehen[a]).length + '/' + AKTIONEN.length);
  console.log('Dialog-CSS    : max-height', box && /max-height/.test(box) ? 'ok' : 'FEHLT',
    '| pre-line', msg && /pre-line/.test(msg) ? 'ok' : 'FEHLT',
    '| scrollbar', msg && /overflow-y:\s*auto/.test(msg) ? 'ok' : 'FEHLT');
  console.log('Fluchtwege    : Escape', t.escapeZu ? 'ok' : 'FEHLT',
    '| Hintergrund', t.hintergrundZu ? 'ok' : 'FEHLT',
    '| Kasten haelt', t.kastenBleibtOffen ? 'ok' : 'FEHLT');
  console.log(fail.length ? 'FAIL' + NL + '  ' + fail.join(NL + '  ') : 'OK dialog+namen');
  process.exit(fail.length ? 1 : 0);
})();
