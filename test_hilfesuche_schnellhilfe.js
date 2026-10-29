// (v1.5.459) Befund 2: helpSearch durchsuchte die 13 Schnellhilfe-Karten (SYMPTOMS) nicht, „Problem“ führte nur auf die Tipps-Seite, „diagnose“ fand nichts. Jetzt Treffer „Schnellhilfe“ mit Sprung showSymptomDetail und Befehl „Problem-Diagnose starten“.
// Gefunden: UX-Prüfung „Hilfe finden und Navigation“ 29.10.2026 (.claude/notizen/ux/hilfe_2026-10-29.txt, Punkt 2).
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
  const such = (q) => JSON.parse(E(`JSON.stringify(helpSearch(${JSON.stringify(q)}))`));
  let r = such('diagnose');
  pruefe(r.some(x => x.art === 'Aktion' && /Diagnose/.test(x.titel)), 'A „diagnose": kein Befehl „Problem-Diagnose starten": ' + r.map(x => x.titel));
  for (const q of ['problem', 'krank']) {
    r = such(q);
    pruefe(r.some(x => x.art === 'Aktion' && /Diagnose/.test(x.titel)), 'B „' + q + '": Diagnose-Befehl fehlt');
  }
  r = such('weiß');
  pruefe(r.some(x => x.art === 'Schnellhilfe' && /showSymptomDetail\('bleaching'\)/.test(x.go)), 'C „weiß": Karte „Top-Blüten werden weißlich" fehlt mit Sprung');
  r = such('ausgebleicht');
  pruefe(r.some(x => /showSymptomDetail\('bleaching'\)/.test(x.go)), 'D „ausgebleicht": Karte bleaching fehlt');
  r = such('hängt');
  pruefe(r.some(x => /showSymptomDetail\('wilting'\)/.test(x.go)), 'E „hängt": Karte wilting fehlt');
  r = such('gelbe blätter');
  pruefe(r.some(x => /showSymptomDetail\('yellow_leaves'\)/.test(x.go)), 'F „gelbe blätter": Karte yellow_leaves fehlt');
  // Befehl läuft auch ohne Zyklus und ruft die Diagnose auf
  const lauf = E(`(function(){ S.cycles = []; let g = 0; const alt = window.openDiagnostics; openDiagnostics = function(){ g++; };
    const i = COMMANDS.findIndex(c => /Diagnose/.test(c.t)); if (i < 0) return -1; runCommand(i); openDiagnostics = alt; return g; })()`);
  pruefe(lauf === 1, 'G Befehl ruft openDiagnostics nicht genau 1x auf (Ergebnis ' + lauf + ')');
  // Sprung: die Karte öffnet sich
  E(`showSymptomDetail('wilting')`);
  pruefe(w.document.querySelector('[data-symptom]') !== null, 'H showSymptomDetail öffnet keine Karte');
  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '-') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
