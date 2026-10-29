// (v1.5.456) Tag 1 nennt die Mittel mit ihrer Menge, nicht nur mit dem Namen.
//
// Startseite und Tageskarte sagten an Tag 1 „Wasser anmischen … laut Plan: CalMag, Root·Juice, Bio·Heaven, Acti·Vera“ — ohne
// eine einzige Menge, obwohl der Plan sie kennt. Ein Anfänger rät dann oder lässt die Mittel weg. Gefunden bei der
// Anfänger-Prüfung am 29.10.2026.
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
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };

  E(`S.cycles = []; S.entries = {}; S.fertPlans = []; S._seedlingProtocolShown = true; loadPreset('rainbow_auto');`);
  await warte(30);
  E(`typeof _modalResolve === 'function' && _modalResolve(true)`);
  await warte(50);
  const r = JSON.parse(E(`(function(){
    const c = addCyc({ name: 'Test', startDate: todayISO(), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; c.fertPlanId = S.fertPlans[0] && S.fertPlans[0].id;
    const p = phase(todayISO(), c);
    const dosen = getWeekDoses(c.id, fertPlanWeek(c, todayISO(), p), c) || {};
    const mitDosis = Object.keys(dosen).filter(k => dosen[k] > 0).map(k => ({ name: (_produktFuer(c, k) || {}).name, dosis: dosen[k] }));
    return JSON.stringify({ text: _tag1MittelText(c, todayISO()), mitDosis }); })()`));
  pruefe(r.mitDosis.length > 0, 'Prüflage: der Plan sieht an Tag 1 Mittel vor (' + r.mitDosis.length + ')');
  for (const m of r.mitDosis) {
    const zahl = String(Math.round(m.dosis * 100) / 100).replace('.', ',');
    pruefe(r.text.includes(m.name + ' ' + zahl + ' '), `„${m.name}“ mit Menge ${zahl} — ${r.text}`);
  }
  pruefe(/je Liter|je Guss/.test(r.text), 'Bezug genannt (je Liter / je Guss)');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
