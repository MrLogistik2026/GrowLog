// (v1.5.471) Topf-Schritt: kein doppelter Knopf mit gleicher Literzahl, kein „Hydro · bald" im Einsteiger-Modus, Überschrift nennt auch die Erde.
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
  const knoepfe = (html) => [...html.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map((m) => m[1].trim());
  const liter = (html) => knoepfe(html).filter((k) => /^(Empfehlung|Standard|Groß): \d+L$/.test(k));
  E('S.beginnerMode = true');
  const auto = schrittHTML(4, { growType: 'indoor', seedType: 'auto', medium: 'erde' });
  const l = liter(auto);
  pruefe(l.length === 1 && l[0] === 'Empfehlung: 11L', 'A Automatic: ' + JSON.stringify(l) + ' statt nur „Empfehlung: 11L"');
  pruefe(new Set(l.map((k) => k.split(': ')[1])).size === l.length, 'B Knöpfe mit gleicher Literzahl');
  const foto = liter(schrittHTML(4, { growType: 'indoor', seedType: 'fem', medium: 'erde' }));
  pruefe(foto.length === 2 && foto[0] === 'Empfehlung: 19L' && foto[1] === 'Standard: 11L', 'C Photoperiode: ' + JSON.stringify(foto));
  const aus = liter(schrittHTML(4, { growType: 'outdoor', medium: 'erde' }));
  pruefe(aus.length === 2 && aus[1] === 'Groß: 50L', 'D Outdoor: ' + JSON.stringify(aus));
  pruefe(!/Hydro/.test(auto) && !/bald/.test(auto), 'E Einsteiger-Modus zeigt noch „Hydro · bald"');
  pruefe(/Erde/.test(auto) && /Coco/.test(auto), 'F Erde/Coco-Knöpfe fehlen');
  pruefe(/Topf und Erde/.test(auto) && !/Wie groß ist dein Topf\?/.test(auto), 'G Überschrift „Topf und Erde" fehlt');
  E('S.beginnerMode = false');
  pruefe(/Hydro/.test(schrittHTML(4, { growType: 'indoor', seedType: 'auto', medium: 'erde' })), 'H Profi-Modus hat den Hydro-Ausblick verloren');
  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
