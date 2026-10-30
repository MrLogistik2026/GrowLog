// (v1.5.482) Gießtag-Prüfung 29.10.2026, Punkt 4: Die Karte „Woche N ist durch. Weiter zu Woche N+1?“ (~2000 Zeichen) stand im Eintrag
// vor dem Hebe-Test und den Gießfeldern, obwohl Mengen und Düngertabelle schon mit der neuen Woche rechnen (Vorschlag und Bestätigung
// vertauscht). Jetzt: einzeilige Kopfzeile („Plan-Woche N+1 gilt ab heute — Mengen sind schon angepasst“ · „Passt“ · „Noch ein paar
// Tage in Woche N bleiben“) VOR dem Hebe-Test; der lange Erklärtext zugeklappt in einem <details> NACH den Gießfeldern. Die Knöpfe
// rufen dieselben Funktionen wie vorher (confirmPlanWeek / holdPlanWeek(…, 3)).
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

  const info = JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S.beginnerMode = true;
    const heute = todayISO();
    const c = addCyc({ name: 'Test', startDate: isoPlus(heute, -45), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id;
    return JSON.stringify({ id: c.id, heute }); })()`));
  E(`loadPreset('rainbow_auto')`); await warte(40);
  E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(80);
  const cid = info.id;

  // Ersten Blüte-Wochenwechsel suchen, an dem die Frage kommt (Wechseltag = erster Tag der neuen Woche).
  const wechsel = JSON.parse(E(`(function(){ const c = S.cycles[0]; const b = planWeekBounds(c); let aus = null;
    for (let i = 3; i < b.length && !aus; i++) {
      c.startDate = isoPlus(todayISO(), -b[i]); delete c.planWeekAck; delete c.planHoldUntil;
      const t = _planWeekQuestion(c, todayISO());
      if (/ist durch\\. Weiter zu Woche/.test(t)) aus = { tag: b[i] + 1, wk: i + 2 };
    }
    return JSON.stringify(aus); })()`));
  pruefe(!!wechsel, 'Vorbereitung: ein Wochenwechsel mit Wochenfrage gefunden');
  if (!wechsel) { console.log('TZ=' + (process.env.TZ || '(System)') + ' · 0/' + (n + 1) + ' OK\n  FEHL ' + fehler.join('\n  FEHL ')); process.exit(1); }
  const wk = wechsel.wk;
  const iso = E('todayISO()');
  E(`openEntry('${iso}')`); await warte(150);
  const root = w.document.getElementById('scr-entry');
  const html = root.innerHTML;

  // --- A: Kopfzeile ---
  const iKopf = html.indexOf(`Plan-Woche ${wk} gilt ab heute`);
  pruefe(iKopf >= 0, 'A1 Kopfzeile „Plan-Woche ' + wk + ' gilt ab heute — …“ fehlt');
  const kopfText = (() => { const m = html.slice(iKopf).match(/^[^<]*/); return m ? m[0] : ''; })();
  pruefe(/Mengen sind schon angepasst|Mengen bleiben gleich/.test(kopfText) && kopfText.length < 100, 'A2 Kopfzeile ehrlich und kurz: „' + kopfText + '“ (' + kopfText.length + ' Zeichen)');
  const btns = [...root.querySelectorAll('button')];
  const passt = btns.find(b => /confirmPlanWeek\(/.test(b.getAttribute('onclick') || ''));
  const bleib = btns.find(b => /holdPlanWeek\(/.test(b.getAttribute('onclick') || '') && /bleiben/.test(b.textContent));
  pruefe(!!passt && passt.textContent.trim() === 'Passt', 'A3 Knopf „Passt“: ' + (passt ? passt.textContent.trim() : 'fehlt'));
  pruefe(!!bleib && bleib.textContent.trim() === `Noch ein paar Tage in Woche ${wk - 1} bleiben`, 'A4 Knopf „Noch ein paar Tage in Woche ' + (wk - 1) + ' bleiben“: ' + (bleib ? bleib.textContent.trim() : 'fehlt'));
  pruefe(!!passt && passt.getAttribute('onclick').includes(`confirmPlanWeek('${cid}')`), 'A5 „Passt“ ruft confirmPlanWeek(Zyklus)');
  pruefe(!!bleib && bleib.getAttribute('onclick').includes(`holdPlanWeek('${cid}',3)`), 'A6 „Noch ein paar Tage …“ ruft holdPlanWeek(Zyklus, 3)');

  // --- B: Reihenfolge Kopfzeile -> Hebe-Test -> Gießfelder -> <details> ---
  const iHebe = html.indexOf('setLiftFeel(');
  const iWasser = html.search(/inp-label[^>]*>[^<]*(Wasser|Menge)/);
  const details = [...root.querySelectorAll('details')].find(d => /ist durch\. Weiter zu Woche/.test(d.textContent));
  const iDetails = details ? html.indexOf(details.outerHTML.slice(0, 120)) : -1;
  pruefe(iHebe > 0, 'B1 Hebe-Test im Eintrag gefunden');
  pruefe(iKopf >= 0 && iHebe > 0 && iKopf < iHebe, `B2 Kopfzeile steht VOR dem Hebe-Test (${iKopf} < ${iHebe})`);
  pruefe(!!details, 'B3 langer Text steht in einem <details>');
  pruefe(details && !details.open, 'B4 <details> ist zugeklappt');
  pruefe(iDetails > iHebe && iHebe > 0, `B5 <details> steht NACH dem Hebe-Test (${iDetails} > ${iHebe})`);
  pruefe(iWasser < 0 || iDetails > iWasser, `B6 <details> steht NACH den Gießfeldern (${iDetails} > ${iWasser})`);
  const dt = details ? details.textContent.replace(/\s+/g, ' ') : '';
  pruefe(/Schau die Pflanze an/.test(dt) && /Wenn du weitergehst/.test(dt) && /Wenn du dranbleibst/.test(dt) && /rückgängig machen/.test(dt), 'B7 Erklärtext, beide Folgen und Hinweis auf Umkehrbarkeit im <details>');
  pruefe(details && !details.querySelector('button'), 'B8 keine zweiten Knöpfe im <details>');
  pruefe(root.querySelectorAll('[onclick*="confirmPlanWeek"]').length === 1 && root.querySelectorAll('[onclick*="holdPlanWeek"]').length >= 1, 'B9 „Passt“ genau einmal im Eintrag');
  const vorKopf = html.slice(0, iKopf).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  pruefe(!/Schau die Pflanze an|Wenn du weitergehst/.test(vorKopf), 'B10 vor dem Hebe-Test steht kein Erklärtext der Wochenfrage');

  // --- C: Verhalten der Knöpfe ---
  if (passt) passt.click();
  await warte(150);
  const ack = E(`S.cycles[0].planWeekAck`);
  pruefe(ack === wk, 'C1 „Passt“ setzt planWeekAck = ' + wk + ' (ist ' + ack + ')');
  pruefe(!/gilt ab heute/.test(root.innerHTML) && !root.querySelector('[onclick*="confirmPlanWeek"]'), 'C2 nach „Passt“ ist die Frage weg');

  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach(f => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})().catch((e) => { console.log('  FEHL abgebrochen: ' + ((e && e.stack) || e)); process.exit(1); });
