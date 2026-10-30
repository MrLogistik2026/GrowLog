// (v1.5.XXX) Drain-pH-Drift der Diagnose gilt nach Substrat: In gekalkter Erde ist 6,8–7,2 das Gleichgewicht (ANBAU.md 4.1).
//
// Befund (Profi- und Fachprüfung 30.10.2026): runoffDriftHigh hieß schon bei Erde-Drain 6,9 und Zulauf 6,3 „weit über dem Gießwasser“
// und gab dem pH-Lockout Punkte (80 % bei „neue Blätter gelb“), während der Eintrag für dieselbe Messung „Erde-Puffer, normal“ sagt.
// Jetzt: Erde nur über 7,2 oder über Wochen steigend; Coco und Hydro unverändert (inert, Abweichung ist ein Signal).
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
  return { w, E: (s) => w.eval(s), errors };
}

(async () => {
  const { E, errors } = await lade();
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  E(`S._seedlingProtocolShown = true; S.cycles = []; S.entries = {};`);
  // Zyklus in der Blüte (Tag 50); Einträge: Liste von [Tage zurück, Drain-pH, Zulauf-pH]
  const drift = (medium, eintraege) => JSON.parse(E(`(function(){ S.entries = {}; S.cycles = [];
    const c = addCyc({ name: 'T', startDate: isoPlus(todayISO(), -49), seedType: 'auto', growType: 'indoor', medium: ${JSON.stringify(medium)}, potSize: 11, plantCount: 1 }, { still: true }); S.cycles = [c];
    ${JSON.stringify(eintraege)}.forEach(function (e) { const iso = isoPlus(todayISO(), -e[0]); S.entries[iso] = { cycleData: { [c.id]: { ph: String(e[2]), ec: '1.3', water: '1000', drainMl: '200', runoffPh: String(e[1]), runoffEc: '1.6' } } }; });
    const x = buildDiagnosticContext(c); return JSON.stringify({ hoch: !!x.runoffDriftHigh, tief: !!x.runoffDriftLow }); })()`));
  // 1. Erde: Drain 6,9 bei Zulauf 6,3 (Differenz +0,6) = Gleichgewicht, kein Befund
  pruefe(drift('erde', [[0, 6.9, 6.3]]).hoch === false, 'Erde, Drain 6,9 bei Zulauf 6,3: kein Befund');
  pruefe(drift('erde', [[0, 7.2, 6.4]]).hoch === false, 'Erde, Drain 7,2 (Obergrenze des Normalbands): kein Befund');
  // 2. Erde über dem Normalband
  pruefe(drift('erde', [[0, 7.5, 6.3]]).hoch === true, 'Erde, Drain 7,5: Befund (über 7,2)');
  // 3. Erde steigt über Wochen
  pruefe(drift('erde', [[21, 6.6, 6.3], [14, 6.8, 6.3], [7, 6.9, 6.3], [0, 7.1, 6.3]]).hoch === true, 'Erde, steigend über drei Wochen (6,6 → 7,1): Befund');
  pruefe(drift('erde', [[21, 6.9, 6.3], [14, 7.0, 6.3], [7, 6.9, 6.3], [0, 6.9, 6.3]]).hoch === false, 'Erde, gleichbleibend um 6,9–7,0: kein Befund');
  pruefe(drift('erde', [[0, 6.9, 6.3], [1, 6.7, 6.3], [2, 6.6, 6.3]]).hoch === false, 'Erde, drei Messungen in drei Tagen: noch kein „über Wochen“');
  // 4. Coco und Hydro: inert, Abweichung bleibt ein Signal
  pruefe(drift('coco', [[0, 6.6, 6.0]]).hoch === true, 'Coco, Drain 6,6 bei Zulauf 6,0: Befund (inert, unverändert)');
  // 5. Ungültiger Ablauf (zu wenig Durchfluss) zählt nie
  const ung = JSON.parse(E(`(function(){ S.entries = {}; const c = S.cycles[0]; S.entries[todayISO()] = { cycleData: { [c.id]: { ph: '6.3', ec: '1.3', water: '1000', drainMl: '20', runoffPh: '7.6', runoffEc: '1.6' } } };
    const x = buildDiagnosticContext(c); return JSON.stringify(!!x.runoffDriftHigh); })()`));
  pruefe(ung === false, 'Erde, Drain 7,6 bei nur 2 % Ablauf: ungültige Messung, kein Befund');
  // 6. Diagnose: „Neue Blätter gelb“ in der Blüte mit Erde-Drain 6,9 gibt dem pH-Lockout keine Drift-Punkte
  const grund = JSON.parse(E(`(function(){ S.entries = {}; S.cycles = [];
    const c = addCyc({ name: 'T', startDate: isoPlus(todayISO(), -49), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11, plantCount: 1 }, { still: true }); S.cycles = [c];
    S.entries[todayISO()] = { cycleData: { [c.id]: { ph: '6.3', ec: '1.3', water: '1000', drainMl: '200', runoffPh: '6.9', runoffEc: '1.6' } } };
    const ctx = buildDiagnosticContext(c);
    const r = diagnoseProblems({ location: ['newLeaves'], colors: ['yellow'], shapes: [] }, ctx);
    return JSON.stringify(r.map(function (x) { return (x.problem ? x.problem.id : x.id) + ':' + JSON.stringify(x.contextReasons || x.reasons || []); })); })()`));
  pruefe(!grund.some(t => /Drain-pH weit über/.test(t)), 'Diagnose „neue Blätter gelb“ bei Erde-Drain 6,9: kein Grund „Drain-pH weit über dem Gießwasser“');
  // 7. Nachschlagetexte
  const Q = require('fs').readFileSync(process.env.GS_INDEX || require('path').join(__dirname, 'index.html'), 'utf8');
  pruefe(!/sollte 6\.0–6\.5 in Erde sein/.test(Q), 'Lexikon: Drain-pH in Erde nicht mehr „6.0–6.5“');
  pruefe(/6,8–7,2 normal/.test(Q), 'Lexikon nennt 6,8–7,2 als normal in gekalkter Erde');
  pruefe(!/Ziel in Erde 6,2–6,5, in Coco und Hydro 5,5–6,0/.test(Q), 'Lexikon pH-Einstellung: Coco nicht mehr mit Hydro-Wert');
  pruefe(errors.length === 0, 'Keine JS-Fehler: ' + errors.slice(0, 2).join(' | '));
  console.log(fehler.length ? 'FEHLER (' + fehler.length + ' von ' + n + '):\n - ' + fehler.join('\n - ') : 'OK (' + n + ' Prüfungen)');
  process.exit(fehler.length ? 1 : 0);
})();
