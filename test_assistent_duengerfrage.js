// (v1.5.470) Düngeplan-Schritt im Assistenten fragt „Welchen Dünger hast du oder willst du kaufen?" und nennt die Einsteiger-Empfehlung aus EINSTEIGER_VORLAGE.
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
  const schrittHTML = (step, ans) => E(`(function(){ _wizAnswers = ${JSON.stringify(ans)}; _wizStep = ${step}; _renderWiz(); return document.getElementById('wiz-body').innerHTML; })()`);
  const schritt = (step, ans) => { schrittHTML(step, ans); return E("document.getElementById('wiz-body').textContent.replace(/\\s+/g, ' ')"); };
  E('S.fertPlans = []');
  const name = (m) => E('FERT_PRESETS[EINSTEIGER_VORLAGE.' + m + '].name');
  const erde = schritt(5, { growType: 'indoor', seedType: 'auto', medium: 'erde' });
  pruefe(erde.includes('Welchen Dünger hast du oder willst du kaufen?'), 'A neue Überschrift fehlt: ' + erde.slice(0, 120));
  pruefe(!/Düngeplan\?/.test(erde), 'B alte Überschrift „Düngeplan?" steht noch da');
  pruefe(erde.includes('Hast du noch keinen, passt ' + name('erde')), 'C Empfehlungssatz mit dem Vorlagennamen (' + name('erde') + ') fehlt: ' + erde.slice(0, 260));
  const coco = schritt(5, { growType: 'indoor', seedType: 'auto', medium: 'coco' });
  pruefe(coco.includes('Hast du noch keinen, passt ' + name('coco')) && name('coco') !== name('erde'), 'D Coco nennt nicht den Coco-Vorlagennamen (' + name('coco') + ')');
  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
