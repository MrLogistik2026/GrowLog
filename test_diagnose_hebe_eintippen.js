// (v1.5.487) Diagnose-Ergebnis: Der Hebe-Test wird mit einem Tipp eingetragen, und die Auswertung rechnet sofort mit ihm.
//
// Vorher führte „Hebe-Test eintragen“ in den Eintrag, wo dieselbe Antwort noch einmal getippt werden musste (8 Taps), und die
// Diagnose sah die Messung danach nicht mehr. Bedien-Prüfung 30.10.2026, Befund 2. Der Eindruck aus der Topf-Frage bleibt ein
// Vorschlag: Er markiert zwei Knöpfe, gespeichert wird erst auf Tipp (ANBAU.md 15).
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
  const q = (sel) => w.document.querySelectorAll(sel);

  E(`(function(){ S.cycles = []; S.entries = {}; S._seedlingProtocolShown = true; const c = addCyc({ name: 'Test', startDate: isoPlus(todayISO(), -40),
    seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11, plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id; })()`);
  const cid = E(`S.cycles[0].id`);
  const ergebnis = (topf) => E(`openDiagnostics('${cid}'); diagState.location = ['allLeaves']; diagState.colors = []; diagState.shapes = ['wilting'];
    diagState.topf = ${topf ? "'" + topf + "'" : 'null'}; diagState.step = 3; renderDiagWizard();`);

  // 1. „leicht“ aus der Topf-Frage: fünf Knöpfe, „Knapp“ und „Trocken“ markiert, nichts gespeichert
  ergebnis('leicht');
  const knoepfe = [...q('#diag-wizard [data-diag-hebe-knopf]')];
  pruefe(knoepfe.length === 5, 'Fünf Hebe-Knöpfe im Ergebnis (' + knoepfe.length + ')');
  const markiert = knoepfe.filter(b => /var\(--blue\)/.test(b.getAttribute('style') || '')).map(b => b.getAttribute('data-diag-hebe-knopf')).sort().join(',');
  pruefe(markiert === 'dry,low', '„leicht“ markiert Knapp und Trocken (' + markiert + ')');
  pruefe(!/restPct/.test(E(`JSON.stringify(S.entries)`)), 'Ohne Tipp wird nichts gespeichert');
  pruefe(q('#diag-wizard [data-diag-eintrag]').length === 1, 'Zweiter Weg „Im Eintrag öffnen“ bleibt');
  // (v1.5.488) Der Satz über den Knöpfen meint die Knöpfe — nicht mehr „was du dort (im Eintrag) eingibst“
  pruefe(!/dort eingibst/.test(w.document.getElementById('diag-wizard').textContent) && /tipp, wie er sich anfühlt/.test(w.document.getElementById('diag-wizard').textContent), 'Satz über den Knöpfen: „tipp, wie er sich anfühlt“ statt „was du dort eingibst“');
  // 2. Tipp auf „Trocken“ (unter dem Gießpunkt; „Knapp“ ist bei Erde der Gießpunkt selbst): eingetragen, Auswertung mit der Messung
  const knapp = w.document.querySelector('#diag-wizard [data-diag-hebe-knopf="dry"]');
  if (knapp) knapp.click();
  const cd = E(`JSON.stringify((S.entries[todayISO()] || {}).cycleData?.['${cid}'] || {})`);
  pruefe(E(`(S.entries[todayISO()]?.cycleData?.['${cid}'] || {}).restPct`) === E('LIFT_FEEL_VALUES.dry'), 'Trocken als Hebe-Test von heute eingetragen — ' + cd);
  pruefe(E(`!!(S.entries[todayISO()]?.cycleData?.['${cid}'] || {})._restPctUserSet`), 'als selbst gemessen gekennzeichnet');
  pruefe(!!w.document.getElementById('diag-wizard'), 'Assistent bleibt offen');
  pruefe(E(`diagState.topf`) === null, 'Der Eindruck aus der Topf-Frage ist durch die Messung ersetzt');
  const kx = JSON.parse(E(`JSON.stringify((function(){ const k = _diagKontext().ctx; return { restHeute: !!k.restHeute, restLow: !!k.restLow, angabe: k._topfAngabe || null }; })())`));
  pruefe(kx.restHeute && kx.restLow && !kx.angabe, 'Auswertung rechnet mit der Messung (restHeute, restLow, keine Topf-Angabe) — ' + JSON.stringify(kx));
  pruefe(q('#diag-wizard [data-diag-hebe-knopf]').length === 0, 'Nach der Messung keine Hebe-Knöpfe mehr');
  const top = E(`JSON.stringify(diagnoseProblems({ location: diagState.location, colors: diagState.colors, shapes: diagState.shapes }, _diagKontext().ctx).slice(0, 5).map(x => x.problem.id))`);
  pruefe(!/overwatering/.test(top), 'Leichter Topf gemessen: Überwässerung fällt heraus — ' + top);
  // 3. Ohne Topf-Antwort: Knöpfe da, keiner markiert
  E(`S.entries = {}; closeDiagnostics();`);
  ergebnis(null);
  const mark2 = [...q('#diag-wizard [data-diag-hebe-knopf]')].filter(b => /var\(--blue\)/.test(b.getAttribute('style') || '')).length;
  pruefe(q('#diag-wizard [data-diag-hebe-knopf]').length === 5 && mark2 === 0, 'Ohne Topf-Antwort: fünf Knöpfe, keiner markiert (' + mark2 + ')');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
