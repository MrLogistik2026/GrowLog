// (v1.5.478) Anfänger-Prüfung 29.10.2026, Punkt 5: „Hebe-Test“ und „RLF“ bekommen ihre Erklärung (INFO_TERMS) und die automatische
// Verlinkung (_LINKIFY_PATTERNS). Der Hebe-Test steht auf fast jedem Bildschirm; ein Anfänger fand kein ⓘ dazu. Geprüft: beide
// Einträge da, linkifyTerms verlinkt sie (nur beim ersten Vorkommen, mit Merker auch über mehrere Texte), die Überschrift „Hebe-Test“
// im Tageseintrag eines Gießtags ab Tag 25 trägt ein ⓘ, die Schrittliste der Startseiten-Karte (Sprühtag) verlinkt den Hebe-Test genau einmal.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');

(async () => {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => null; w.navigator.vibrate = () => true; w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {}; w.alert = () => {}; w.print = () => {}; },
  });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  w.toast = () => {};
  const E = (s) => w.eval(s);
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const info = JSON.parse(E('JSON.stringify({ h: INFO_TERMS.hebetest || null, r: INFO_TERMS.rlf || null, gp: GIESSPUNKT })'));
  pruefe(!!info.h && !!info.r, 'INFO_TERMS: hebetest/rlf fehlen');
  if (info.h) {
    const t = info.h.title + ' ' + info.h.text + ' ' + (info.h.tip || '');
    pruefe(/Hebe-Test/.test(info.h.title), 'Hebe-Test: Titel: ' + info.h.title);
    pruefe(t.includes(info.gp.erde.knopf) && t.includes(info.gp.coco.knopf), 'Hebe-Test: Gießpunkt-Knöpfe „' + info.gp.erde.knopf + '“/„' + info.gp.coco.knopf + '“ fehlen im Text');
  }
  if (info.r) pruefe(/relative Luftfeuchte/.test(info.r.text) && /RLF/.test(info.r.title), 'RLF: Titel/Text nennen „relative Luftfeuchte“ nicht');

  const lk = (t, set) => E(`linkifyTerms(${JSON.stringify(t)}${set ? ', ' + set : ''})`);
  const a = lk('Heb den Topf: der Hebe-Test sagt es. Der zweite Hebe-Test bleibt Text. RLF unter 60 %.');
  pruefe(/showInfoPopover\('hebetest'\)[^>]*>Hebe-Test</.test(a), 'linkifyTerms: Hebe-Test nicht verlinkt: ' + a.slice(0, 160));
  pruefe(/showInfoPopover\('rlf'\)[^>]*>RLF</.test(a), 'linkifyTerms: RLF nicht verlinkt');
  pruefe((a.match(/showInfoPopover\('hebetest'\)/g) || []).length === 1, 'linkifyTerms: Hebe-Test mehrfach verlinkt');
  E('window.__schon = new Set()');
  const b1 = lk('Erst der Hebe-Test.', 'window.__schon'), b2 = lk('Dann wieder Hebe-Test.', 'window.__schon');
  pruefe(/showInfoPopover/.test(b1) && !/showInfoPopover/.test(b2), 'linkifyTerms mit Merker: erst ja, dann nein: ' + b1.length + '/' + b2.length);
  const c = lk('<button title="Hebe-Test">x</button> Hebe-Tests');
  pruefe(!/title="<a/.test(c), 'linkifyTerms: Treffer im Attribut verlinkt');

  // Tageseintrag eines Gießtags ab Tag 25
  const eintrag = JSON.parse(E(`(function(){ for (let tag = 25; tag < 45; tag++) { S.cycles = []; S.entries = {}; S.beginnerMode = true; const h = todayISO();
    const c = addCyc({ name: 'Gies', startDate: isoPlus(h, -(tag - 1)), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated', weightMode: 'lift' }, { still: true }); S.cycles = [c]; selId = c.id;
    const act = getAction(h, c); if (act !== 'giess') continue;
    openEntry(h); const html = document.getElementById('scr-entry').innerHTML;
    return JSON.stringify({ tag, act, html }); }
    return JSON.stringify({ tag: 0 }); })()`));
  pruefe(eintrag.tag >= 25, 'Prüflage: kein Gießtag ab Tag 25 gefunden');
  pruefe(/Hebe-Test<button[^>]*showInfoPopover\('hebetest'\)/.test(eintrag.html || ''), 'Tageseintrag Tag ' + eintrag.tag + ': „Hebe-Test“ ohne ⓘ');

  // Startseite: Sprühtag (Tag 3) nennt den Hebe-Test in den Schritten
  const dash = JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S.beginnerMode = true; const h = todayISO();
    const c = addCyc({ name: 'Spr', startDate: isoPlus(h, -2), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id;
    renderDash(); const html = document.getElementById('scr-dash').innerHTML;
    return JSON.stringify({ a: getAction(h, c), html, text: document.getElementById('scr-dash').textContent }); })()`));
  pruefe(dash.a === 'sprueh' && /kein Hebe-Test/.test(dash.text), 'Prüflage: Sprühtag-Karte mit „kein Hebe-Test“: ' + dash.a);
  const nDash = (dash.html.match(/showInfoPopover\('hebetest'\)/g) || []).length;
  pruefe(nDash === 1, 'Startseite: Hebe-Test in der Schrittliste ' + nDash + '× verlinkt statt 1×');

  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
