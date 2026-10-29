// (v1.5.469) Der erste Schritt des Assistenten erklärt das Wort „Zyklus".
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
  E('S.beginnerMode = true');
  const t = schritt(0, {});
  pruefe(t.includes('Ein Zyklus ist ein Anbau-Durchgang — von der Keimung bis zur Ernte.'), 'A Erklärung des Wortes „Zyklus" fehlt im ersten Schritt: ' + t.slice(0, 160));
  pruefe(t.includes("Los geht's"), 'B Weiter-Knopf fehlt');
  E('S.beginnerMode = false');
  pruefe(schritt(0, {}).includes('Ein Zyklus ist ein Anbau-Durchgang'), 'C Erklärung fehlt im Profi-Modus');
  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
