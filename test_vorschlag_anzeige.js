// (v1.5.467) Gießtag-Prüfung 29.10.2026, Punkt 7: Rechenwerte sehen aus wie Messungen (ANBAU.md 15: Zielwerte als Platzhalter,
// nicht als Eintrag). Nach „✓ Erledigt" und „✨ Tag automatisch ausfüllen" zeigte der Eintrag „✓🧪 pH" für das Ziel-pH, grüne „✓" an
// allen Mischzeilen und die Profi-Startseite „Gesamt 1.8 L" aus einem Vorschlag.
// Geprüft: Vorschlag -> „~" (nie „✓") in Fortschritts-Chip, Mischzeile und Gesamt-Kachel; echte Eingabe/Antippen -> „✓".
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

  // Zyklus + Plan Rainbow, zwei Tage mit Düngerguss suchen (einer für „Erledigt", einer für „Ausfüllen").
  const tage = JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S.beginnerMode = false;
    const heute = todayISO();
    const c = addCyc({ name: 'Test', startDate: isoPlus(heute, -45), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id;
    return JSON.stringify({ id: c.id, heute }); })()`));
  E(`loadPreset('rainbow_auto')`); await warte(40);
  E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(80);
  const cid = tage.id;
  // Düngertage: Gießtag mit Plan-Dosis > 0 (Wasser-Tage und Spültage haben keine Dosen).
  const kandidaten = JSON.parse(E(`(function(){ const c = S.cycles[0]; const aus = [];
    for (let i = 40; i >= 0 && aus.length < 2; i--) { const iso = isoPlus(todayISO(), -i); const p = phase(iso, c);
      if (!p || !isGiessTag(iso, c)) continue; const a = getAction(iso, c); if (a !== 'giess' && a !== 'giess_anz') continue;
      if (getFeedWaterEffective(c, p, iso, {}) === 'water') continue;
      const d = getWeekDoses(c.id, fertPlanWeek(c, iso, p), c) || {};
      if (Object.values(d).some(x => x > 0)) aus.push(iso); }
    return JSON.stringify(aus); })()`));
  pruefe(kandidaten.length === 2, 'Vorbereitung: zwei Düngertage gefunden: ' + kandidaten.join(','));
  const [tagA, tagB] = kandidaten;

  const kette = (iso) => { E(`setDebugDate('${iso}')`); };
  const chipText = () => {
    const t = [...w.document.querySelectorAll('#scr-entry button')].filter(b => /Zum Feld|Vorschlag — noch nicht gemessen/.test(b.getAttribute('title') || ''))
      .map(b => b.textContent.trim().replace(/\s+/g, ' '));
    return t;
  };
  const mixZeichen = () => [...w.document.querySelectorAll('#scr-entry .mix-chk')].map(e => e.textContent.trim());
  const entryOeffnen = async (iso) => { E(`openEntry('${iso}')`); await warte(120); };

  // --- A: „✓ Erledigt" auf der Startseite ---
  kette(tagA);
  E(`markTodayDone('${cid}', '${tagA}')`); await warte(60);
  E(`S.beginnerMode = false; renderDash()`); await warte(60);
  const dash = w.document.getElementById('scr-dash').textContent.replace(/\s+/g, ' ');
  const sugg = JSON.parse(E(`JSON.stringify({ w: S.entries['${tagA}'].cycleData['${cid}']._suggested, d: S.entries['${tagA}'].cycleData['${cid}']._suggestedDoses })`));
  pruefe(sugg.w && sugg.w.water && sugg.d && Object.keys(sugg.d).length > 0, 'A0 Erledigt setzt Wasser- und Dosis-Vorschlag: ' + JSON.stringify(sugg));
  pruefe(/Gesamt 💧\s*~\d/.test(dash), 'A1 Startseite: „Gesamt" aus Vorschlag trägt „~": ' + (dash.match(/Gesamt 💧\s*\S+\s*\S*/) || [''])[0]);
  await entryOeffnen(tagA);
  const mixA = mixZeichen();
  pruefe(mixA.length > 0 && mixA.every(z => z === '~' || z === '∅' || z === '○'), 'A2 Mischzeilen nach Erledigt ohne „✓": ' + mixA.join(' '));
  pruefe(mixA.includes('~'), 'A3 Mischzeilen zeigen „~" für den Vorschlag: ' + mixA.join(' '));
  // Antippen der „~"-Zeile bestätigt: wird ein „✓".
  const prod = E(`Object.keys(S.entries['${tagA}'].cycleData['${cid}']._suggestedDoses)[0]`);
  E(`editISO = '${tagA}'; toggleMixCheck('${cid}', '${prod}')`); await warte(100);
  const nachTipp = JSON.parse(E(`JSON.stringify({ chk: !!S.entries['${tagA}'].cycleData['${cid}'].mixChecks['${prod}'], vor: !!(S.entries['${tagA}'].cycleData['${cid}']._suggestedDoses || {})['${prod}'] })`));
  pruefe(nachTipp.chk && !nachTipp.vor, 'A4 Antippen bestätigt die Dosis (Haken bleibt, Vorschlag weg): ' + JSON.stringify(nachTipp));
  const mixA2 = mixZeichen();
  pruefe(mixA2.includes('✓'), 'A5 bestätigte Zeile zeigt „✓": ' + mixA2.join(' '));

  // --- B: „✨ Tag automatisch ausfüllen" ---
  kette(tagB);
  await entryOeffnen(tagB);
  const wk = E(`fertPlanWeek(S.cycles[0], '${tagB}', phase('${tagB}', S.cycles[0]))`);
  await E(`applyRecommended('${cid}', ${wk})`); await warte(150);
  await entryOeffnen(tagB);
  const sB = JSON.parse(E(`JSON.stringify(S.entries['${tagB}'].cycleData['${cid}']._suggested || {})`));
  pruefe(sB.ph === true, 'B0 Ausfüllen setzt pH als Vorschlag: ' + JSON.stringify(sB));
  let chips = chipText();
  const phChip = chips.find(t => /pH/.test(t)) || '';
  pruefe(phChip && !/✓/.test(phChip) && /~/.test(phChip), 'B1 Chip pH nach Ausfüllen: „~", kein „✓": ' + chips.join(' | '));
  const zaehl = (w.document.getElementById('scr-entry').textContent.replace(/\s+/g, ' ').match(/(\d)\/6 eingetragen/) || [])[1];
  pruefe(zaehl !== undefined && Number(zaehl) <= 1, 'B3 pH zählt nicht als eingetragen (höchstens Wasser: 1/6): ' + zaehl + '/6');
  const mixB = mixZeichen();
  pruefe(mixB.every(z => z !== '✓'), 'B4 Mischzeilen nach Ausfüllen ohne „✓": ' + mixB.join(' '));
  // Echte Eingabe über die App-Funktion -> „✓".
  E(`editISO = '${tagB}'; uEF('${cid}', 'ph', '6.3'); renderEntry('${tagB}')`); await warte(120);
  chips = chipText();
  const phChip2 = chips.find(t => /pH/.test(t)) || '';
  pruefe(/✓/.test(phChip2) && !/~/.test(phChip2), 'B5 Chip pH nach echter Eingabe: „✓": ' + chips.join(' | '));

  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach(f => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})().catch((e) => { console.log('  FEHL abgebrochen: ' + ((e && e.stack) || e)); process.exit(1); });
