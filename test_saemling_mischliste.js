// (v1.5.455) Sämlings-Pflege: „die Mengen stehen in der Mischliste“ nur an Gießtagen, sonst der nächste Gießtag.
//
// Vorher stand der Satz an jedem Sämlingstag mit Plan-Dünger — auch an Sprüh- und Ruhetagen, an denen der Eintrag keine
// Mischliste hat. Gefunden bei der Anfänger-Prüfung am 29.10.2026 (Tag 3 und Tag 10).
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

  E(`S.cycles = []; S.entries = {}; S.fertPlans = []; S._seedlingProtocolShown = true; S.beginnerMode = true; loadPreset('rainbow_auto');`);
  await warte(30);
  E(`typeof _modalResolve === 'function' && _modalResolve(true)`);
  await warte(50);
  const r = JSON.parse(E(`(function(){
    const c = addCyc({ name: 'Test', startDate: isoPlus(todayISO(), -2), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; c.fertPlanId = S.fertPlans[0] && S.fertPlans[0].id;
    const out = [];
    for (let d = 0; d <= 14; d++) {
      const iso = isoPlus(c.startDate, d);
      try { renderEntry(iso); } catch (e) { out.push({ d: d + 1, fehler: String(e) }); continue; }
      const el = document.getElementById('scr-entry');
      const txt = (el || document.body).textContent || '';
      out.push({ d: d + 1, pflege: /Sämlings-Pflege/.test(txt), giess: isGiessTag(iso, c),
        liste: /in der Mischliste/.test(txt), naechster: /am nächsten Gießtag/.test(txt) });
    }
    return JSON.stringify(out); })()`));
  const mitPflege = r.filter((x) => x.pflege);
  pruefe(mitPflege.length >= 5, 'Prüflage: Sämlings-Pflege an mehreren Tagen (' + mitPflege.length + ')');
  const falsch = mitPflege.filter((x) => x.liste && !x.giess);
  pruefe(falsch.length === 0, 'Mischliste nur an Gießtagen genannt — falsch an Tag ' + falsch.map((x) => x.d).join(', '));
  pruefe(mitPflege.some((x) => !x.giess && x.naechster), 'An Tagen ohne Guss: „am nächsten Gießtag“');
  pruefe(!r.some((x) => x.fehler), 'Eintrag rendert ohne Fehler: ' + ((r.find((x) => x.fehler) || {}).fehler || ''));

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
