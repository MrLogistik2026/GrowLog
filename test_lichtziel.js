// Lichtziele je Phase aus einer Quelle (LICHT_ZIEL, ANBAU.md 8): Lichtmesser, Lexikon und Werkzeug-Beschreibung.
//
//   L1 (v1.5.404)  Sämling 150–300, Wachstum 400–600, Blüte 600–900 µmol/m²/s; DLI aus den Lichtstunden.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');

function fakeCtx() {
  const noop = () => {};
  return { canvas: null, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '', globalAlpha: 1,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop, arcTo: noop, rect: noop, fill: noop, stroke: noop,
    fillRect: noop, clearRect: noop, strokeRect: noop, save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    setTransform: noop, fillText: noop, strokeText: noop, drawImage: noop, clip: noop, setLineDash: noop, quadraticCurveTo: noop,
    bezierCurveTo: noop, measureText: () => ({ width: 0 }), createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }), getImageData: () => ({ data: [] }) };
}
async function starte() {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.print = () => {};
    },
  });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  w.toast = () => {};
  return { w, errors, E: (s) => w.eval(s) };
}


(async () => {
  const fehler = [];
  let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const a = await starte();
  pruefe(!!a.E('typeof LICHT_ZIEL === "object"'), 'L1-0 LICHT_ZIEL fehlt');

  // L1 (v1.5.404) · Ziel je Phase im Lichtmesser
  {
    const r = JSON.parse(a.E(`(function(){ S.cycles = []; S.entries = {}; const heute = todayISO();
      const pid = _planFuerVorlage('rainbow_auto');
      const neu = (tage) => addCyc({ name: 'Licht', startDate: isoPlus(heute, -tage), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
        plantCount: 1, startMethod: 'saturated', fertPlanId: pid }, { still: true });
      const ziel = (tage, h) => { S.cycles = [neu(tage)]; selId = S.cycles[0].id; const t = _ppfdTargets(h);
        return { ph: phase(heute, S.cycles[0]).ph, ppfd: t.ppfd.join('–'), dli: t.dli.join('–'), label: t.label }; };
      return JSON.stringify({ s: ziel(4, 18), w: ziel(15, 18), b: ziel(45, 12) }); })()`));
    pruefe(r.s.ppfd === '150–300' && r.s.label === 'Sämling', `L1-1 Sämling Tag 5: ${JSON.stringify(r.s)}`);
    pruefe(r.w.ppfd === '400–600' && r.w.ph === 'anzucht', `L1-2 Anzucht Tag 16 ist Wachstum: ${JSON.stringify(r.w)}`);
    pruefe(r.b.ppfd === '600–900' && r.b.dli === '26–39', `L1-3 Blüte bei 12 h: DLI aus den Stunden (26–39): ${JSON.stringify(r.b)}`);
  }

  // L1 · Lexikon und ausgelieferter Text ohne die alten Zahlen
  {
    const lex = JSON.parse(a.E(`JSON.stringify(LEXIKON.flatMap(k => k.items || []).filter(x => x.t === 'PPFD & DLI (Licht-Matrix)').map(x => x.practice))`));
    pruefe(lex.length === 1 && /Sämling 150–300/.test(lex[0]) && /Wachstum 400–600/.test(lex[0]) && /Sämling 10–19/.test(lex[0]), `L1-4 Lexikon „PPFD & DLI": ${(lex[0] || '').slice(0, 200)}`);
    const zeilen = HTML.split(/\r?\n/).filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z) && /Anzucht:? 200[–-]400/.test(z));
    pruefe(zeilen.length === 0, `L1-5 „Anzucht 200–400" steht noch ${zeilen.length}× im ausgelieferten Text`);
  }

  pruefe(!a.errors.length, 'Skriptfehler: ' + a.errors.slice(0, 3).join(' | '));
  if (fehler.length) { console.log(`test_lichtziel: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_lichtziel: alle ${n} Prüfungen grün`);
  process.exit(0);
})().catch((e) => { console.log('test_lichtziel abgebrochen:', (e && e.stack) || e); process.exit(1); });
