// (v1.5.501) IceFlush 0 Tage heißt „kein IceFlush“ und bleibt 0.
//
// iceLenFor las `c.iceDays || 3` — aus der 0 wurde still eine 3. Der Endspurt erlaubt 0–5 Tage: Der Knopf sprang von 1 über 0 auf
// 3, und die Wirkungs-Vorschau meldete die Ernte einen Tag später statt früher. Bewertung vom 30.10.2026, Profi-Befund 5.
// Geprüft: Ernte rückt je weggenommenem Eistag einen Tag vor, bei 0 gibt es keine IceFlush-Phase und keinen Eistag, Endspurt und
// Erntezähler nennen denselben Tag; über setEndspurtPhase gesetzt bleibt die 0 stehen.
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

  const r = JSON.parse(E(`(function(){ S._seedlingProtocolShown = true; const out = [];
    for (const ice of [3, 2, 1, 0]) { S.cycles = []; S.entries = {};
      const c = addCyc({ name: 'I', seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11, plantCount: 1, startDate: isoPlus(todayISO(), -60) }, { still: true });
      S.cycles = [c]; c.iceDays = ice;
      const st = endspurtState(c, todayISO()); const hc = harvestCountdown(c, todayISO());
      let eisPhase = 0, eisAktion = 0, ernte = 0;
      for (let d = 1; d <= 140; d++) { const iso = isoPlus(c.startDate, d - 1); const a = getAction(iso, c); const p = phase(iso, c);
        if (p && p.ph === 'ice') eisPhase++; if (a === 'ice') eisAktion++; if (a === 'ernte') ernte++; }
      out.push({ ice, ernteTag: st && st.ernteTag, zaehler: hc && isoDiff(hc.harvestISO, c.startDate) + 1, eisPhase, eisAktion, ernte });
    }
    S.cycles = []; const c2 = addCyc({ name: 'K', seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11, plantCount: 1, startDate: isoPlus(todayISO(), -60) }, { still: true });
    S.cycles = [c2]; c2.iceDays = 1; setEndspurtPhase(c2.id, 'iceDays', 0);
    return JSON.stringify({ out, knopf: { gespeichert: c2.iceDays, laenge: iceLenFor(c2) } }); })()`));
  const t = Object.fromEntries(r.out.map(x => [x.ice, x]));
  console.log('    ' + r.out.map(x => `IceFlush ${x.ice} → Ernte Tag ${x.ernteTag} (Zähler ${x.zaehler}, Eistage ${x.eisPhase})`).join(' · '));
  pruefe(t[2].ernteTag === t[3].ernteTag - 1 && t[1].ernteTag === t[2].ernteTag - 1 && t[0].ernteTag === t[1].ernteTag - 1, 'Ernte rückt je Eistag einen Tag vor (3 → 0): ' + [3, 2, 1, 0].map(k => t[k].ernteTag).join(', '));
  pruefe(r.out.every(x => x.ernteTag === x.zaehler), 'Endspurt und Erntezähler nennen denselben Tag');
  pruefe(t[0].eisPhase === 0 && t[0].eisAktion === 0, 'IceFlush 0: keine Eis-Phase, kein Eistag — ' + JSON.stringify(t[0]));
  pruefe(t[0].ernte === 1 && t[3].ernte === 1, 'Erntetag bleibt in der Kette');
  pruefe(r.knopf.gespeichert === 0 && r.knopf.laenge === 0, 'Endspurt-Knopf auf 0: bleibt 0 — ' + JSON.stringify(r.knopf));

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
