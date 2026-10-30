// (v1.5.497) Ein höheres Bernstein-Ziel ergibt nie ein früheres Erntefenster.
//
// harvestWindow fiel ohne Vorhersage (Ziel mehr als 60 Tage voraus, laut Kurve unerreichbar, Kurve passt nicht) auf Samentüte oder
// Plan zurück — die lagen früher als das, was die frische Messung sagt. Gemessen am 30.10.2026: Ziel 25 % → Tag 135–154, Ziel 40 %
// → Samentüte Tag 70–77, schon vorbei. Bewertung vom 17.09.2026, Hebel 4. Zu früh ernten ist der teuerste Fehler (ANBAU.md 11).
// Gegenprobe: ohne frische Messung bleibt die Samentüte die Grundlage.
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

  // Zyklus an Tag 96, Samentüte 10–11 Wochen; Trichom-Messungen alle 3 Tage (Klar fällt, Bernstein steigt langsam)
  const fenster = (ziel, alterTage) => JSON.parse(E(`(function(){ S._seedlingProtocolShown = true; S.cycles = []; S.entries = {};
    const c = addCyc({ name: 'E', seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11, plantCount: 1, startDate: isoPlus(todayISO(), -95) }, { still: true });
    S.cycles = [c]; c.targetAmber = ${ziel}; c.seedWeeksLo = 10; c.seedWeeksHi = 11;
    for (let i = 9 + ${alterTage}; i >= ${alterTage}; i -= 3) { const iso = isoPlus(todayISO(), -i); S.entries[iso] = { cycleData: {} };
      const k = 9 + ${alterTage} - i; const t = { clear: Math.max(0, 30 - k * 2), amber: 2 + k * 0.4 }; t.milky = 100 - t.clear - t.amber;
      S.entries[iso].cycleData[c.id] = { trichomes: t }; }
    const hw = harvestWindow(c, todayISO());
    return JSON.stringify(hw ? { lo: hw.lo, hi: hw.hi, basis: hw.basis } : null); })()`));

  const heute = 96;
  const ziele = [10, 15, 25, 40];
  const f = ziele.map(z => fenster(z, 0));
  console.log('    ' + ziele.map((z, i) => z + ' % → ' + (f[i] ? `Tag ${f[i].lo}–${f[i].hi} (${f[i].basis})` : 'kein Fenster')).join(' · '));
  pruefe(f[0] && f[0].basis === 'trichome', 'Prüflage: Ziel 10 % hat ein Fenster aus den Trichomen');
  for (let i = 1; i < f.length; i++) {
    const vorher = f[i - 1], jetzt = f[i];
    pruefe(!jetzt || !vorher || jetzt.lo >= vorher.lo, `Ziel ${ziele[i]} % liegt nicht vor Ziel ${ziele[i - 1]} % (${JSON.stringify(vorher)} → ${JSON.stringify(jetzt)})`);
  }
  pruefe(f.every(x => !x || x.hi > heute), 'Kein Fenster, das schon vorbei ist, solange das Ziel nicht erreicht ist: ' + JSON.stringify(f));
  pruefe(f[3] === null || f[3].lo >= f[2].lo, 'Ziel 40 %: kein Fenster aus der Samentüte (Tag 70–77) — ' + JSON.stringify(f[3]));
  // Gegenprobe: Messung älter als 3 Tage — die Samentüte bleibt die Grundlage
  const alt = fenster(40, 6);
  pruefe(alt && alt.basis === 'packung', 'Ohne frische Messung: Samentüte als Grundlage — ' + JSON.stringify(alt));

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const x of fehler) console.log('  FEHL ' + x);
  process.exit(fehler.length ? 1 : 0);
})();
