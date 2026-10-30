// (v1.5.XXX) Erde-pH unter 6,0 warnt auch unter dem Eingabefeld, mit dem Grund der Erde (Mikroflora), ANBAU.md 4.
//
// Befund (Gegenprüfer 30.10.2026): getCriticalWarning('ph', 5.6) war für Erde null — die Meldung unter dem Feld kam erst unter 5,5,
// während getEntryWarnings schon ab 6,0 warnt. ANBAU.md 4: nie unter 6,0 in organischen Substraten, die Mikroflora bricht ein. Die Schwelle
// kommt jetzt aus phTargetFor (6,2 − 0,2). Coco und Hydro bleiben bei ihren Schwellen.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');
async function lade() {
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
  return { w, E: (s) => w.eval(s), errors };
}

(async () => {
  const { w, E, errors } = await lade();
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  E(`S._seedlingProtocolShown = true; S.cycles = []; S.entries = {}; S.beginnerMode = false;`);
  const kw = (medium, ph) => JSON.parse(E(`(function(){ S.cycles = []; const c = addCyc({ name: 'T', startDate: isoPlus(todayISO(), -40), seedType: 'auto', growType: 'indoor', medium: '${medium}', potSize: 11, plantCount: 1 }, { still: true }); S.cycles = [c];
    const p = phase(todayISO(), c); return JSON.stringify(getCriticalWarning('ph', ${ph}, p, c)); })()`));
  // Erde
  for (const v of [5.6, 5.9]) { const r = kw('erde', v); pruefe(r && r.level === 'high', 'Erde pH ' + v + ': Warnung unter dem Feld (' + JSON.stringify(r && r.level) + ')'); }
  const k58 = kw('erde', 5.8) || {}, k52 = kw('erde', 5.2) || {}, k56 = kw('erde', 5.6) || {};
  const vorUnter55 = (t) => String(t || '').split('Unter 5,5')[0];
  pruefe(/Bodenleben/.test(k58.action || '') && !/Calcium|Magnesium|Mangan|Aluminium/.test(vorUnter55(k58.action)), 'Erde pH 5,8: Text nennt das Bodenleben, Ca/Mg/Mn/Al erst im „Unter 5,5“-Satz');
  pruefe(/unter dem Ziel für Erde/.test(k58.title || '') && !/Aufnahme-Fenster/.test(k58.title || ''), 'Erde pH 5,8: Titel „unter dem Ziel für Erde“ (' + k58.title + ')');
  pruefe(/Bodenleben/.test(k56.action || '') && !/Calcium|Magnesium/.test(vorUnter55(k56.action)), 'Erde pH 5,6: kein Ca/Mg-Satz für 5,5–5,99');
  pruefe(/Mangan und Aluminium/.test(k52.action || '') && /Calcium und Magnesium/.test(k52.action || '') && /Aufnahme-Fenster/.test(k52.title || ''), 'Erde pH 5,2 (unter 5,5): Mn/Al und Ca/Mg genannt, Titel „Aufnahme-Fenster“ (' + k52.title + ')');
  pruefe(kw('erde', 6.0) === null, 'Erde pH 6,0: keine Warnung (Grenze)');
  pruefe(kw('erde', 6.2) === null && kw('erde', 6.4) === null, 'Erde pH 6,2 und 6,4 (Ziel): keine Warnung');
  pruefe(kw('erde', 5.2) && kw('erde', 5.2).level === 'high', 'Erde pH 5,2: weiter eine Warnung');
  pruefe(kw('erde', 4.2) && kw('erde', 4.2).level === 'critical', 'Erde pH 4,2: weiter kritisch');
  // Coco: unverändert
  pruefe(kw('coco', 5.6) === null && kw('coco', 5.9) === null, 'Coco pH 5,6 und 5,9: unverändert keine Warnung (Ziel 5,8–6,2)');
  pruefe(kw('coco', 5.2) && kw('coco', 5.2).level === 'high' && !/Mikroflora/.test(kw('coco', 5.2).action), 'Coco pH 5,2: Warnung ohne Erde-Text');
  // Eintrag: Profi-Text je Substrat
  const ew = (medium, ph) => JSON.parse(E(`(function(){ S.beginnerMode = false; S.cycles = []; const c = addCyc({ name: 'T', startDate: isoPlus(todayISO(), -40), seedType: 'auto', growType: 'indoor', medium: '${medium}', potSize: 11, plantCount: 1 }, { still: true }); S.cycles = [c];
    const p = phase(todayISO(), c); return JSON.stringify(getEntryWarnings({ ph: '${ph}', water: '1000' }, p, {}, c, todayISO()).filter(function (x) { return /pH/.test(x.text); }).map(function (x) { return x.text; })); })()`));
  pruefe(ew('erde', 5.6).some(t => /Bodenleben/.test(t) && !/Ca\/Mg/.test(t)), 'Eintrag Erde pH 5,6: Bodenleben, ohne Ca/Mg-Satz');
  pruefe(ew('coco', 5.2).some(t => /Lockout/.test(t)) && !ew('coco', 5.2).some(t => /Bodenleben/.test(t)), 'Eintrag Coco pH 5,2: Lockout-Text, kein Bodenleben');
  const HTMLQ = require('fs').readFileSync(process.env.GS_INDEX || require('path').join(__dirname, 'index.html'), 'utf8');
  pruefe(/Ist der pH zu niedrig \(in Erde unter 5,5\)/.test(HTMLQ) && /über 6,8\), gehen <b>Eisen, Mangan, Zink und Bor<\/b>/.test(HTMLQ) && !/Fällt der pH unter 6\.0 → <b>Calcium/.test(HTMLQ), 'Lexikon pH-Wert nach ANBAU.md 4 (unter 5,5 / über 6,8)');
  // Die Meldung steht im Eintrag unter dem Feld
  E(`S.cycles = []; S.beginnerMode = false; const c = addCyc({ name: 'T', startDate: isoPlus(todayISO(), -40), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11, plantCount: 1 }, { still: true }); c.weightMode = 'lift'; S.cycles = [c];
    S.entries[todayISO()] = { cycleData: { [c.id]: { ph: '5.6', water: '1000' } } };`);
  try { E('openEntry(todayISO())'); } catch (e) { pruefe(false, 'openEntry: ' + e.message); }
  const txt = ((w.document.getElementById('scr-entry') || w.document.body).textContent || '').replace(/\s+/g, ' ');
  pruefe(/Bodenleben/.test(txt), 'Eintrag mit Erde-pH 5,6 zeigt die Bodenleben-Meldung');
  pruefe(errors.length === 0, 'Keine JS-Fehler: ' + errors.slice(0, 2).join(' | '));
  console.log(fehler.length ? 'FEHLER (' + fehler.length + ' von ' + n + '):\n - ' + fehler.join('\n - ') : 'OK (' + n + ' Prüfungen)');
  process.exit(fehler.length ? 1 : 0);
})();
