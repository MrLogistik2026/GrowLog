// (v1.5.477) Anfänger-Prüfung 29.10.2026, Punkt 3: Die Tag-1-Anleitung kennt die Keimmethode. Die Karte „Sättigungsguss (Tag 1)“ und der
// Einsteiger-Satz sagten „Säst du direkt in die Erde: den Samen erst nach dem letzten Durchgang legen.“ auch bei Wasserglas und
// Papiertuch. Jetzt: Direktsaat behält den Satz; Glas/Tuch bekommen den passenden Satz mit den Zahlen aus KEIMUNG.
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
  const lage = (methode) => JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S.beginnerMode = true; const h = todayISO();
    const c = addCyc({ name: 'Tag1', startDate: h, seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11, plantCount: 1,
      startMethod: 'saturated' }, { still: true }); ${methode ? `c.germMethod = '${methode}';` : ''} S.cycles = [c]; selId = c.id;
    const p = phase(h, c), a = getAction(h, c);
    const k = getTodayAction(c, p, a, h) || {};
    return JSON.stringify({ a, tag: p && p.day, steps: (k.steps || []).join(' | '), satz: String(plainSentence(a, c, p, waterSuggestion(c, p)) || '').replace(/<[^>]+>/g, ' ') }); })()`));
  const K = JSON.parse(E('JSON.stringify(KEIMUNG)'));

  let r = lage('direct');
  pruefe(r.a === 'saettigung' && r.tag === 1, 'Prüflage: Tag 1 ist der Sättigungsguss: ' + r.a + '/' + r.tag);
  pruefe(/Säst du direkt in die Erde: den Samen erst nach dem letzten Durchgang legen/.test(r.steps), 'Direkt: Karte ohne den Direktsaat-Satz: ' + r.steps);
  pruefe(/Säst du direkt in die Erde/.test(r.satz), 'Direkt: Einsteiger-Satz ohne den Direktsaat-Satz: ' + r.satz.slice(-200));
  r = lage(null);
  pruefe(/Säst du direkt/.test(r.steps), 'Ohne Wahl (Vorgabe Direkt): Karte ohne Direktsaat-Satz');
  r = lage('water');
  pruefe(!/Säst du direkt/.test(r.steps) && !/Säst du direkt/.test(r.satz), 'Glas: „Säst du direkt“ steht noch da');
  pruefe(/Wasserglas/.test(r.steps) && r.steps.includes(`${K.glasStdVon}–${K.glasStdBis} Stunden`), 'Glas: Karte ohne Glas-Satz mit ' + K.glasStdVon + '–' + K.glasStdBis + ' Stunden: ' + r.steps);
  pruefe(/Wasserglas/.test(r.satz) && r.satz.includes(`${K.glasStdVon}–${K.glasStdBis} Stunden`), 'Glas: Einsteiger-Satz ohne Glas-Satz');
  r = lage('paper');
  pruefe(!/Säst du direkt/.test(r.steps) && !/Säst du direkt/.test(r.satz), 'Tuch: „Säst du direkt“ steht noch da');
  pruefe(/Papiertuch/.test(r.steps) && r.steps.includes(`${K.wurzelMmVon}–${K.wurzelMmBis} mm`), 'Tuch: Karte ohne Tuch-Satz mit ' + K.wurzelMmVon + '–' + K.wurzelMmBis + ' mm');
  pruefe(/Papiertuch/.test(r.satz), 'Tuch: Einsteiger-Satz ohne Tuch-Satz');

  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
