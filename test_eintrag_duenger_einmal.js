// (v1.5.480) Gießtag-Prüfung 29.10.2026, Punkt 5: Dünger doppelt im Einsteiger-Eintrag. Die Tabelle „Dünger diese Woche“ (Ist-Felder, uDose)
// und die Mischreihenfolge (Mengenfelder, uMixDoseTotal) schreiben beide cd.doses — 16 Felder für dasselbe; uDose zeichnete nicht neu.
// Geprüft: Einsteiger-Gießtag hat keine Ist-Felder mehr und die Mischreihenfolge steht da; Profi behält beides, und eine Eingabe in der
// Ist-Tabelle erscheint danach in der Mischzeile; ein leeres Ist-Feld löscht die eigene Dosis (Plan gilt wieder).
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

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
  await warte(80);
  w.toast = () => {};
  const E = (s) => w.eval(s);
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const q = (sel) => [...w.document.querySelectorAll('#scr-entry ' + sel)];

  const tage = JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S.beginnerMode = true;
    const heute = todayISO();
    const c = addCyc({ name: 'Test', startDate: isoPlus(heute, -45), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id;
    return JSON.stringify({ id: c.id, heute }); })()`));
  E(`loadPreset('rainbow_auto')`); await warte(40);
  E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(80);
  const cid = tage.id;
  const tag = JSON.parse(E(`(function(){ const c = S.cycles[0]; let gefunden = null;
    for (let i = 40; i >= 0 && !gefunden; i--) { const iso = isoPlus(todayISO(), -i); const p = phase(iso, c);
      if (!p || !isGiessTag(iso, c)) continue; const a = getAction(iso, c); if (a !== 'giess' && a !== 'giess_anz') continue;
      if (getFeedWaterEffective(c, p, iso, {}) === 'water') continue;
      const d = getWeekDoses(c.id, fertPlanWeek(c, iso, p), c) || {};
      if (Object.values(d).filter(x => x > 0).length >= 3) gefunden = iso; }
    return JSON.stringify(gefunden); })()`));
  pruefe(!!tag, 'Vorbereitung: Düngertag mit mindestens 3 Produkten gefunden');
  const oeffnen = async () => { E(`setDebugDate('${tag}')`); E(`openEntry('${tag}')`); await warte(150); };

  // --- A: Einsteiger ---
  E(`S.beginnerMode = true`);
  await oeffnen();
  const kopf = (w.document.getElementById('scr-entry').textContent.replace(/\s+/g, ' ').match(/Dünger diese Woche/) || [])[0];
  pruefe(q('.nt-inp').length === 0, 'A1 Einsteiger: keine „Ist“-Felder mehr (' + q('.nt-inp').length + ')');
  pruefe(q('.nut-tbl-head').length === 0, 'A2 Einsteiger: keine Tabellen-Kopfzeile „Produkt/Plan/Berechnet/Ist“');
  const mixA = q('.mix-calc');
  pruefe(mixA.length >= 3, 'A3 Einsteiger: Mischreihenfolge mit Mengenfeldern da (' + mixA.length + ')');
  pruefe(q('.mix-step').length >= 3, 'A4 Einsteiger: Mischzeilen da');
  pruefe(!!kopf, 'A5 Einsteiger: Überschrift „Dünger diese Woche“ steht noch');
  pruefe(q('button').some(b => /openDuenger/.test(b.getAttribute('onclick') || '') && /Plan/.test(b.textContent)), 'A6 Einsteiger: „Plan ✏“ bleibt');
  const feldA = q('input[type=number]').length;

  // --- B: Profi ---
  E(`S.beginnerMode = false`);
  await oeffnen();
  const ist = q('.nt-inp');
  pruefe(ist.length >= 3, 'B1 Profi: Ist-Felder bleiben (' + ist.length + ')');
  pruefe(q('.mix-calc').length >= 3, 'B2 Profi: Mischreihenfolge bleibt');
  pruefe(q('input[type=number]').length - feldA >= 3, 'B3 Profi hat mehr Felder als Einsteiger (' + q('input[type=number]').length + ' gegen ' + feldA + ')');
  const feld = ist[0];
  const pid = (feld.getAttribute('oninput').match(/uDose\('[^']*','([^']*)'/) || [])[1];
  const mixVorher = q(`.mix-calc[data-prod="${pid}"]`)[0].value;
  feld.value = '9.9';
  feld.dispatchEvent(new w.Event('input', { bubbles: true }));
  feld.dispatchEvent(new w.Event('change', { bubbles: true }));
  await warte(700);
  const mixNachher = (q(`.mix-calc[data-prod="${pid}"]`)[0] || {}).value;
  pruefe(parseFloat(mixNachher) === 9.9, `B4 Profi: Ist-Eingabe 9.9 -> Mischzeile zeigt den Wert (vorher ${mixVorher}, nachher ${mixNachher})`);
  const gespeichert = E(`String(S.entries['${tag}'].cycleData['${cid}'].doses['${pid}'])`);
  pruefe(gespeichert === '9.9', 'B5 Wert steht in cd.doses: ' + gespeichert);
  // leeres Ist-Feld -> Plan gilt wieder
  const feld2 = q('.nt-inp')[0];
  feld2.value = '';
  feld2.dispatchEvent(new w.Event('input', { bubbles: true }));
  feld2.dispatchEvent(new w.Event('change', { bubbles: true }));
  await warte(700);
  const nachLeer = E(`JSON.stringify(S.entries['${tag}'].cycleData['${cid}'].doses['${pid}'] === undefined)`);
  pruefe(nachLeer === 'true', 'B6 leeres Ist-Feld löscht die eigene Dosis');
  pruefe((q(`.mix-calc[data-prod="${pid}"]`)[0] || {}).value === mixVorher, 'B7 Mischzeile zeigt wieder den Planwert ' + mixVorher);

  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach(f => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})().catch((e) => { console.log('  FEHL abgebrochen: ' + ((e && e.stack) || e)); process.exit(1); });
