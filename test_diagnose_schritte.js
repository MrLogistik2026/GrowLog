// (v1.5.461) Der Diagnose-Assistent hat drei Schritte: Ort, Aussehen, Ergebnis. „Seit wann tritt es auf?“ entfällt.
//
// Schritt 3 fragte „In den letzten Stunden / Seit einigen Tagen / Seit Wochen“ — diagnoseProblems bekam die Antwort nie
// (renderDiagStep4 übergab nur Ort, Farbe und Form). Ein Tap ohne Wirkung; die App fragt nichts, was sie nicht braucht
// (ANWEISUNG.md, „Regeln statt Regler“). Gefunden bei der Bedien-Prüfung „Hilfe finden“ am 29.10.2026.
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
  const text = () => (w.document.getElementById('diag-wizard') || {}).textContent || '';

  E(`openDiagnostics(null)`);
  pruefe(/Schritt 1 von 3/.test(text()), 'Kopf: „Schritt 1 von 3“ — ' + (text().match(/Schritt \d von \d/) || [''])[0]);
  E(`diagToggle('location','allLeaves'); diagGoTo(2)`);
  pruefe(/Schritt 2 von 3/.test(text()), 'Schritt 2 von 3');
  E(`diagToggle('colors','yellow')`);
  pruefe(/Auswerten →/.test(text()), 'Schritt 2: Knopf „Auswerten →“');
  E(`diagGoTo(3)`);
  pruefe(/Schritt 3 von 3/.test(text()) && /Wahrscheinlichste Ursachen/.test(text()), 'Schritt 3 ist das Ergebnis');
  pruefe(!/Seit wann/.test(text()) && E(`typeof diagSetTiming`) === 'undefined' && E(`typeof renderDiagStep3`) === 'undefined', 'Keine Frage „Seit wann“ mehr');
  E(`diagGoTo(2)`);
  pruefe(/Schritt 2 von 3/.test(text()) && E(`diagState.colors.includes('yellow')`), 'Zurück zu Schritt 2 behält die Auswahl');
  E(`closeDiagnostics()`);

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
