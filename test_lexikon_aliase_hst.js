// (v1.5.494) Die Lexikon-Suchwörter „super cropping“, „supercrop“, „hst“ und „high stress training“ führen auf den Eintrag
// „HST (High Stress)“, der Super-Cropping Schritt für Schritt erklärt.
//
// Vorher zeigten „super cropping“ und „supercrop“ auf einen Titel „Supercropping“, den es nicht gibt — die Suche lief ins Leere —,
// und „hst“ nur auf „Topping“. Gefunden bei der Begriffe-Bereinigung am 30.10.2026. Geprüft wird außerdem, dass KEIN Suchwort mehr
// auf einen fehlenden Titel zeigt.
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
  const E = (s) => w.eval(s);
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };

  const r = JSON.parse(E(`(function(){
    const titel = new Set(LEXIKON.flatMap(k => k.items || []).map(i => i.t));
    const ohne = Object.entries(LEX_ALIASES).filter(([k, t]) => !titel.has(t)).map(([k, t]) => k + ' → ' + t);
    return JSON.stringify({ ohne, hstDa: titel.has('HST (High Stress)'),
      ziele: ['super cropping', 'supercrop', 'supercropping', 'super-cropping', 'hst', 'high stress training'].map(k => LEX_ALIASES[k] || null),
      training: (T.training && T.training.supercropping && T.training.supercropping.lex) || null });
  })()`));
  pruefe(r.hstDa, 'Prüflage: Lexikon-Eintrag „HST (High Stress)“ vorhanden');
  pruefe(r.ohne.length === 0, 'Kein Suchwort zeigt auf einen fehlenden Titel: ' + r.ohne.join(' | '));
  pruefe(r.ziele.every(z => z === 'HST (High Stress)'), 'Super-Cropping- und HST-Suchwörter führen auf „HST (High Stress)“: ' + JSON.stringify(r.ziele));
  pruefe(r.training === 'HST (High Stress)', 'Training „Super-Cropping“ verweist ins Lexikon: ' + r.training);

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
