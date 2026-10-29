// (v1.5.468) Nach dem Assistenten kommt keine Modus-Frage mehr: Die App startet im Einsteiger-Modus (Hinweis nennt den Weg zum Profi-Modus).
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
  E("S.cycles = []; S.entries = {}; S._modeAsked = false; S.beginnerMode = undefined;");
  E("_wizAnswers = { name: 'Test', seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11 }; _wizFinish();");
  pruefe(E("document.querySelectorAll('[data-mode-dialog]').length") === 0, 'A nach dem Assistenten ist ein Modus-Dialog offen');
  pruefe(E("![...document.body.children].filter(e => e.tagName !== 'SCRIPT').some(e => e.textContent.includes('Wie möchtest du die App sehen'))"), 'B Frage „Wie möchtest du die App sehen?" steht auf dem Schirm');
  pruefe(E('S.beginnerMode') === true, 'C Einsteiger-Modus ist nicht aktiv');
  pruefe(E('S._modeAsked') === true, 'D Merkfeld _modeAsked nicht gesetzt (Frage könnte später kommen)');
  pruefe(E('S.cycles.length') === 1, 'E Zyklus wurde nicht angelegt');
  // Wer den Profi-Modus schon eingestellt hat, behält ihn.
  E("S.cycles = []; S._modeAsked = false; S.beginnerMode = false; _wizAnswers = { name: 'Test2', seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11 }; _wizFinish();");
  pruefe(E('S.beginnerMode') === false && E("document.querySelectorAll('[data-mode-dialog]').length") === 0, 'F gesetzter Profi-Modus wurde überschrieben oder Dialog offen');
  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
