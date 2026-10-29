// (v1.5.457) Die Gießkarte der Startseite nennt Drain nur, wo er bei dieser Menge entstehen kann.
//
// Der Satz der Karte prüft seit v1.5.389, ob bei der heutigen Menge überhaupt Drain kommen kann (_drainZuErwarten) — die
// Schritte und der Hinweis darunter prüften nur, ob der Zyklus Tag 25 erreicht hat. Ergebnis an Tag 45: „… kommt bei dieser
// Menge unten noch nichts an“ direkt über „Ca. 1600 ml Wasser, bis 15–20 % unten ablaufen“ und „15–20 % Drain erzeugen“
// (ANBAU.md 1.1). Gefunden bei der Gießtag-Prüfung am 29.10.2026.
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
    const c = addCyc({ name: 'Test', startDate: isoPlus(todayISO(), -70), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; c.fertPlanId = S.fertPlans[0] && S.fertPlans[0].id;
    const out = [];
    for (let d = 24; d <= 70; d++) {
      const iso = isoPlus(c.startDate, d); const p = phase(iso, c); const a = getAction(iso, c);
      if (a !== 'giess' && a !== 'giess_anz') continue;
      const karte = getTodayAction(c, p, a, iso);
      if (!karte || !karte.steps) continue;
      const g = gussMengeJePflanze(c, p, iso);
      const erwartet = _drainMoeglich(p) && (!g || _drainZuErwarten(c, iso, g));
      const text = karte.steps.join(' ') + ' ' + (karte.hint || '');
      out.push({ tag: d + 1, erwartet, schritt: /unten ablaufen/.test(text), hinweis: /Drain erzeugen/.test(text) });
    }
    return JSON.stringify(out); })()`));
  pruefe(r.length >= 8, 'Prüflage: genug Gießtage ab Tag 25 (' + r.length + ')');
  pruefe(r.some((x) => !x.erwartet), 'Prüflage: Tage, an denen bei dieser Menge kein Drain entsteht');
  const falsch = r.filter((x) => (x.schritt || x.hinweis) && !x.erwartet);
  pruefe(falsch.length === 0, 'Kein „unten ablaufen“/„Drain erzeugen“, wo kein Drain entstehen kann — Tag ' + falsch.map((x) => x.tag).join(', '));
  const fehlt = r.filter((x) => x.erwartet && !x.schritt);
  pruefe(fehlt.length === 0, 'Wo Drain entsteht, nennt der Schritt ihn — fehlt an Tag ' + fehlt.map((x) => x.tag).join(', '));

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
