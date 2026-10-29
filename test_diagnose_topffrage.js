// (v1.5.462) Diagnose-Assistent: Bei „hängend“ ohne Hebe-Test von heute fragt er einmal, wie schwer der Topf ist.
//
// Bei „hängend“ stehen Überwässerung, Wassermangel und Wurzelfäule gleichauf; die Karten sagen „Erst den Topf anheben“, aber
// die Antwort kam nirgends zurück. Gemessen am 29.10.2026: ohne Topf-Angabe in 7 von 14 Ort-und-Phase-Fällen Platz 1 und 2
// punktgleich; mit „leicht“ fallen Überwässerung und Trauermücken heraus, mit „schwer“ der Wassermangel (ANBAU.md 1, 15;
// v1.5.439). Liegt heute schon ein Hebe-Test vor, fragt der Assistent nicht. Befund U4 der Diagnose-Prüfung vom 08.10.2026.
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
  // Ergebnis-IDs aus dem Assistenten (dieselbe Auswertung, die Schritt 3 zeigt)
  const ergebnis = () => JSON.parse(E(`JSON.stringify(diagnoseProblems({ location: diagState.location, colors: diagState.colors, shapes: diagState.shapes },
    (typeof _diagKontext === 'function' ? _diagKontext().ctx : {})).map(x => x.problem.id))`));
  const bisSchritt2 = (cycleId) => { E(`openDiagnostics(${cycleId ? JSON.stringify(cycleId) : 'null'}); diagToggle('location','allLeaves'); diagGoTo(2); diagToggle('shapes','wilting')`); };

  // 1. Ohne Zyklus: Frage erscheint bei „hängend“
  bisSchritt2(null);
  pruefe(/Wie schwer ist der Topf/.test(text()), 'Bei „hängend“: Frage „Wie schwer ist der Topf?“');
  // 2. „leicht“: Überwässerung und Trauermücken fallen heraus, Wassermangel bleibt
  E(`diagSetTopf('leicht')`);
  let r = ergebnis();
  pruefe(!r.includes('overwatering') && !r.includes('fungus_gnats') && r.includes('underwatering'), 'Leicht: ohne Überwässerung/Trauermücken, mit Wassermangel — ' + r.join(' | '));
  E(`diagGoTo(3)`);
  pruefe(/Topf leicht \(deine Angabe\)/.test(text()), 'Ergebnis nennt „Topf leicht (deine Angabe)“');
  // 3. „schwer“: Wassermangel fällt heraus
  bisSchritt2(null); E(`diagSetTopf('schwer')`);
  r = ergebnis();
  pruefe(!r.includes('underwatering') && r.includes('overwatering'), 'Schwer: ohne Wassermangel, mit Überwässerung — ' + r.join(' | '));
  // 4. „weiß nicht“ ändert nichts
  bisSchritt2(null); E(`diagSetTopf('weissnicht')`);
  r = ergebnis();
  pruefe(r.includes('underwatering') && r.includes('overwatering'), 'Weiß nicht: beide bleiben — ' + r.join(' | '));
  // 5. Ohne „hängend“ keine Frage
  E(`openDiagnostics(null); diagToggle('location','allLeaves'); diagGoTo(2); diagToggle('colors','yellow')`);
  pruefe(!/Wie schwer ist der Topf/.test(text()), 'Ohne „hängend“: keine Topf-Frage');
  // 6. Mit Hebe-Test von heute: keine Frage, die Messung steht da
  const cid = E(`(function(){ S.cycles = []; S.entries = {}; S._seedlingProtocolShown = true; const heute = todayISO();
    const c = addCyc({ name: 'Test', startDate: isoPlus(heute, -50), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c];
    S.entries[heute] = { cycleData: {} }; S.entries[heute].cycleData[c.id] = { restPct: 95 }; return c.id; })()`);
  bisSchritt2(cid);
  pruefe(!/Wie schwer ist der Topf/.test(text()) && /Hebe-Test von heute: Topf schwer/.test(text()), 'Hebe-Test von heute: keine Frage, Messung genannt');
  E(`closeDiagnostics()`);

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
