// (v1.5.475) Diagnose-Ergebnis: Knopf „Hebe-Test eintragen“ bei Wasser-Ursachen (mit Zyklus) -> öffnet den heutigen Eintrag,
// springt zum Hebe-Test, schließt den Assistenten und speichert NICHTS (auch „leicht“ aus dem Assistenten bleibt Vorschlag).
// Ohne Wasser-Ursache oder ohne Zyklus kein Knopf.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');

async function lade() {
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
  return { w, errors, E: (s) => w.eval(s) };
}

(async () => {
  const { w, errors, E } = await lade();
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));
  E(`(function(){ S.cycles = []; S.entries = {}; const c = addCyc({ name: 'Test', startDate: isoPlus(todayISO(), -20), seedType: 'auto', growType: 'indoor',
    medium: 'erde', potSize: 11, plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id; })()`);
  const cid = E(`S.cycles[0].id`);
  const knopf = () => w.document.querySelector('#diag-wizard [data-diag-hebe]');
  const ergebnis = (cycle, loc, shapes, topf, colors) => { E(`openDiagnostics(${cycle ? "'" + cid + "'" : 'null'}); diagState.location = ${JSON.stringify(loc)}; diagState.colors = ${JSON.stringify(colors || [])};
    diagState.shapes = ${JSON.stringify(shapes)}; diagState.topf = ${topf ? "'" + topf + "'" : 'null'}; diagState.step = 3; renderDiagWizard();`); };

  // A hängend mit Zyklus, ohne Topf-Antwort
  ergebnis(true, ['allLeaves'], ['wilting'], null);
  const top3 = E(`JSON.stringify(diagnoseProblems({location: diagState.location, colors: diagState.colors, shapes: diagState.shapes}, _diagKontext().ctx).slice(0,3).map(x => x.problem.id))`);
  pruefe(/overwatering|underwatering|root_rot|nutrient_burn/.test(top3), 'A Vorbedingung: keine Wasser-Ursache unter den ersten drei: ' + top3);
  pruefe(!!knopf(), 'A hängend mit Zyklus: Knopf fehlt');
  pruefe(/Hebe-Test eintragen/.test(w.document.getElementById('diag-wizard').textContent), 'A Knopftext fehlt');
  // Klick
  E(`window.__sprung = []; const _j = jumpToEntryField; jumpToEntryField = function(c, was) { window.__sprung.push(was); return _j.apply(this, arguments); };`);
  const vorher = E(`JSON.stringify(S.entries)`);
  if (knopf()) knopf().querySelector('button').click();
  await warte(300);
  pruefe(!w.document.getElementById('diag-wizard'), 'A Assistent nach Klick noch offen');
  pruefe(E(`document.getElementById('scr-entry').classList.contains('active')`), 'A Eintrag nicht geöffnet');
  pruefe(E(`editISO === todayISO()`), 'A nicht der heutige Eintrag');
  pruefe(E(`window.__sprung.join()`) === 'hebe', 'A Sprung zum Hebe-Test fehlt: ' + E(`window.__sprung.join()`));
  pruefe(!!w.document.querySelector('#entry-body [onclick^="setLiftFeel("], #entry-body [id^="weight-g-"], #entry-body input[type="range"]'), 'A im Eintrag gibt es kein Hebe-Test-Feld als Ziel');
  const ersatz = E(`JSON.stringify((S.entries[todayISO()] || {}).cycleData || {})`);
  pruefe(!/restPct/.test(ersatz) && !/restPct/.test(vorher), 'A es wurde etwas still gespeichert: ' + ersatz);

  // B „leicht“ aus dem Assistenten: Knopf da, kein stilles Speichern, Text nennt Vorschlag
  E(`goTo('dash')`);
  ergebnis(true, ['allLeaves'], ['wilting'], 'leicht');
  pruefe(!!knopf(), 'B leicht: Knopf fehlt');
  pruefe(knopf() && /Vorschlag/.test(knopf().textContent), 'B leicht: Hinweis „Vorschlag“ fehlt');
  if (knopf()) knopf().querySelector('button').click();
  await warte(300);
  pruefe(!/restPct/.test(E(`JSON.stringify(S.entries)`)), 'B leicht: Antwort wurde still gespeichert: ' + E(`JSON.stringify(S.entries)`));

  // C ohne Zyklus kein Knopf
  E(`goTo('dash')`);
  ergebnis(false, ['allLeaves'], ['wilting'], null);
  pruefe(!knopf(), 'C ohne Zyklus: Knopf erscheint');

  // D ohne Wasser-Ursache kein Knopf (Lichtbrand/Mangel o. ä.)
  ergebnis(true, ['topLeaves'], [], null, ['white']);
  const top3d = E(`JSON.stringify(diagnoseProblems({location: diagState.location, colors: diagState.colors, shapes: diagState.shapes}, _diagKontext().ctx).slice(0,3).map(x => x.problem.id))`);
  pruefe(!/overwatering|underwatering|root_rot|nutrient_burn/.test(top3d), 'D Vorbedingung: Wasser-Ursache unter den ersten drei: ' + top3d);
  pruefe(!knopf(), 'D ohne Wasser-Ursache: Knopf erscheint (' + top3d + ')');

  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '?') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
