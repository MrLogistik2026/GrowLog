// (v1.5.472) „Damit ergibt sich" (Einstellungen): Der Hinweis „im Kalender weiterblättern" erscheint nur, wenn ein genanntes Datum in einem späteren Monat als dem aktuellen liegt.
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
  const hint = 'im Kalender weiterblättern';
  const html = (tageZurueck) => E('(function(){ S.cycles = []; S.entries = {}; const heute = todayISO();' +
    "const c = addCyc({ name: 'Test', startDate: isoPlus(heute, -" + tageZurueck + "), seedType: 'fem', growType: 'indoor', medium: 'erde', potSize: 11," +
    "plantCount: 1, startMethod: 'saturated', bloomDays: 56 }, { still: true }); S.cycles = [c]; selId = c.id;" +
    'return _kettenVorschauHTML(c, {}); })()');
  // Zyklus von vor über einem Jahr: alle genannten Tage liegen in der Vergangenheit, kein späterer Monat.
  const alt = html(400);
  pruefe(alt.includes('Damit ergibt sich'), 'A Vorschau fehlt (alter Zyklus): ' + alt.slice(0, 80));
  pruefe(!alt.includes(hint), 'B alter Zyklus: Hinweis steht trotzdem da');
  // Frischer Zyklus: Ernte liegt Monate weiter.
  const neu = html(0);
  pruefe(neu.includes('Damit ergibt sich') && neu.includes(hint), 'C frischer Zyklus: Hinweis fehlt');
  // Ernte genau heute: kein genannter Tag liegt nach heute, also auch in keinem späteren Monat.
  const ernteTag = E('endspurtState(S.cycles[0], todayISO()).ernteTag');
  const heute = html(ernteTag - 1);
  pruefe(heute.includes('Damit ergibt sich') && !heute.includes(hint), 'D Ernte heute: Hinweis steht trotzdem da');
  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
