// (v1.5.476) Jede Schnellhilfe-Karte (SYMPTOMS, showSymptomDetail) hat am Ende „Genauer eingrenzen →“ und führt in den
// Diagnose-Assistenten; „Pflanze hängt“ startet mit der Form „Hängend“ gewählt, mit Zyklus-Kontext, wenn einer läuft.
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
  E(`(function(){ S.cycles = []; S.entries = {}; const c = addCyc({ name: 'Test', startDate: isoPlus(todayISO(), -20), seedType: 'auto', growType: 'indoor',
    medium: 'erde', potSize: 11, plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id; })()`);
  const cid = E(`S.cycles[0].id`);
  const ids = JSON.parse(E(`JSON.stringify(SYMPTOMS.map(x => x.id))`));
  pruefe(ids.length >= 10 && ids.includes('wilting') && ids.includes('bud_rot'), 'Vorbedingung: SYMPTOMS unvollständig: ' + ids.join());
  for (const id of ids) {
    E(`showSymptomDetail('${id}')`);
    const k = w.document.querySelector('[data-symptom] [data-symptom-diag]');
    pruefe(!!k && /Genauer eingrenzen/.test(k.textContent), id + ': Knopf „Genauer eingrenzen“ fehlt');
    if (k) { k.click(); }
    pruefe(!!w.document.getElementById('diag-wizard'), id + ': Assistent öffnet nicht');
    pruefe(!w.document.querySelector('[data-symptom]'), id + ': Schnellhilfe-Karte bleibt offen');
    pruefe(E(`diagState.cycleId`) === cid, id + ': kein Zyklus-Kontext');
    E(`closeDiagnostics()`);
  }
  // wilting -> Form „hängend“ gewählt
  E(`showSymptomDetail('wilting')`);
  const k = w.document.querySelector('[data-symptom] [data-symptom-diag]'); if (k) k.click();
  pruefe(E(`diagState.shapes.includes('wilting')`) === true, 'wilting: Form „hängend“ nicht vorbelegt');
  pruefe(E(`diagState.step`) === 2, 'wilting: Assistent startet nicht bei Schritt 2: ' + E(`diagState.step`));
  pruefe(/Wie schwer ist der Topf/.test(w.document.getElementById('diag-wizard') ? w.document.getElementById('diag-wizard').textContent : ''), 'wilting: Topf-Frage fehlt im Assistenten');
  E(`closeDiagnostics()`);
  // Karte ohne Vorbelegung: leer, Schritt 1
  E(`showSymptomDetail('slow_growth')`);
  const k2 = w.document.querySelector('[data-symptom] [data-symptom-diag]'); if (k2) k2.click();
  pruefe(E(`diagState.step === 1 && diagState.location.length === 0 && diagState.shapes.length === 0 && diagState.colors.length === 0`) === true, 'slow_growth: Assistent nicht leer');
  E(`closeDiagnostics()`);
  // ohne Zyklus: Assistent läuft ohne Kontext
  E(`S.cycles = []`);
  E(`showSymptomDetail('wilting')`);
  const k3 = w.document.querySelector('[data-symptom] [data-symptom-diag]'); if (k3) k3.click();
  pruefe(E(`diagState.cycleId`) === null && !!w.document.getElementById('diag-wizard'), 'ohne Zyklus: Assistent öffnet nicht ohne Kontext');

  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '?') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.slice(0, 12).forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
