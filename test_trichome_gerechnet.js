// (v1.5.499) Gerechnete Trichom-Werte geben den Schnitt nicht frei.
//
// „Heutigen Stand berechnen“ (fillTrichToday) speicherte den Rechenwert wie eine Lupen-Messung; ernteFreigabe las ihn als Messung.
// Bei Lupenwerten 60/40/24/14 % klar (vor 9/6/3/1 Tagen) wurden daraus 8,3 % klar, und die Startseite sagte „Ernte möglich …
// gemessen heute“ statt „noch nicht schneiden“. Bewertung vom 30.10.2026 (Fach-Befund 1, schwer); UEBERGABE 0m.2 Schritt 2;
// ANBAU.md 11 und 15 (zu früh ernten ist der teuerste Fehler; Messwerte werden nie geschätzt und eingetragen).
// Geprüft: Kennzeichen beim Berechnen und Angleichen, Freigabe/Urteil/Prognose ohne Rechenwerte, Berichtigen-Liste zeigt sie mit
// „≈“, eine eigene Eingabe macht den Wert wieder zur Messung.
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
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const dash = () => ((w.document.getElementById('scr-dash') || w.document.body).textContent || '').replace(/\s+/g, ' ');

  // Zyklus am Plan-Erntetag, echte Lupen-Messungen vor 9/6/3/1 Tagen
  E(`(function(){ S.cycles = []; S.entries = {}; S._seedlingProtocolShown = true; S.beginnerMode = true;
    const c = addCyc({ name: 'T', startDate: todayISO(), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11, plantCount: 1 }, { still: true });
    S.cycles = [c]; const hc = harvestCountdown(c, todayISO()); c.startDate = isoPlus(todayISO(), -isoDiff(hc.harvestISO, c.startDate));
    const setT = (d, cl, am) => { const iso = isoPlus(todayISO(), -d); if (!S.entries[iso]) S.entries[iso] = { temp: '', humidity: '', cycleData: {} };
      S.entries[iso].cycleData[c.id] = { doses: {}, water: '', ph: '', ec: '', notes: '', photos: [], trichomes: { clear: cl, amber: am, milky: 100 - cl - am } }; };
    setT(9, 60, 1); setT(6, 40, 2); setT(3, 24, 3); setT(1, 14, 4); saveS(); })()`);
  const cid = E('S.cycles[0].id');
  const vorher = JSON.parse(E(`JSON.stringify(ernteFreigabe(S.cycles[0], todayISO()))`));
  pruefe(vorher.status === 'nochNicht' && vorher.klar === 14, 'Prüflage: vor dem Berechnen „noch nicht“ (14 % klar, gestern) — ' + JSON.stringify(vorher));

  // 1. Heutigen Stand berechnen: Kennzeichen, Freigabe bleibt bei der Lupen-Messung
  E(`window.customConfirm = async () => true; openEntry(todayISO());`); await warte(60);
  await E(`fillTrichToday('${cid}', todayISO())`); await warte(60);
  const t = JSON.parse(E(`JSON.stringify(S.entries[todayISO()].cycleData['${cid}'].trichomes)`));
  pruefe(t && t.gerechnet === true, 'Rechenwert trägt das Kennzeichen „gerechnet“ — ' + JSON.stringify(t));
  pruefe(t && t.clear < 14, 'Prüflage: der Rechenwert liegt unter dem letzten Lupenwert (' + (t && t.clear) + ' % klar)');
  const nach = JSON.parse(E(`JSON.stringify(ernteFreigabe(S.cycles[0], todayISO()))`));
  pruefe(nach.status !== 'reif' && nach.klar === 14, 'Freigabe liest weiter die Lupen-Messung (14 % klar), nicht den Rechenwert — ' + JSON.stringify(nach));
  E('renderDash()');
  pruefe(!/Ernte möglich/.test(dash()), 'Startseite sagt nicht „Ernte möglich“');
  pruefe(E(`_trichHistory('${cid}', S.cycles[0], todayISO()).every(h => !h.gerechnet)`), 'Prognose-Verlauf ohne Rechenwerte');
  pruefe(E(`_trichHistory('${cid}', S.cycles[0], todayISO(), true).some(h => h.gerechnet)`), 'mit „mitGerechnet“ sind die Rechenwerte da');
  // Berichtigen-Liste zeigt den Rechenwert mit „≈“
  E(`renderEntry(todayISO())`); await warte(40);
  const liste = E(`(document.getElementById('entry-body') || document.body).innerHTML`);
  pruefe(/title="gerechnet, nicht gemessen">≈T\d+/.test(liste), 'Berichtigen-Liste zeigt den Rechenwert mit „≈“');
  // Trichom-Karte urteilt nicht über den Rechenwert
  pruefe(!/Erntereif/.test(E(`(document.getElementById('entry-body') || document.body).textContent`)), 'Trichom-Karte urteilt nicht „Erntereif“ über den Rechenwert');

  // 2. Eigene Eingabe: Kennzeichen weg, der Wert zählt als Messung
  E(`uTrich('${cid}', 'clear', '9', todayISO())`);
  const t2 = JSON.parse(E(`JSON.stringify(S.entries[todayISO()].cycleData['${cid}'].trichomes)`));
  pruefe(!t2.gerechnet && t2.clear === 9, 'Eigene Eingabe 9 % klar: kein Kennzeichen mehr — ' + JSON.stringify(t2));
  const nach2 = JSON.parse(E(`JSON.stringify(ernteFreigabe(S.cycles[0], todayISO()))`));
  pruefe(nach2.status === 'reif' && nach2.klar === 9, 'Mit eigener Lupen-Messung 9 % klar: Freigabe „reif“ — ' + JSON.stringify(nach2));

  // 3. Verlauf angleichen kennzeichnet die Tage dazwischen
  E(`(function(){ S.entries = {}; const c = S.cycles[0];
    const setT = (d, cl, am) => { const iso = isoPlus(todayISO(), -d); S.entries[iso] = { temp: '', humidity: '', cycleData: {} };
      S.entries[iso].cycleData[c.id] = { doses: {}, water: '', ph: '', ec: '', notes: '', photos: [], trichomes: { clear: cl, amber: am, milky: 100 - cl - am } }; };
    setT(12, 60, 1); setT(10, 58, 1); setT(8, 56, 1); setT(6, 55, 1); setT(4, 54, 1); setT(1, 30, 3); saveS(); })()`);
  const step = E(`JSON.stringify(_trichStep(S.cycles[0], todayISO()))`);
  if (step && step !== 'null') {
    await E(`smoothTrichTail('${cid}', todayISO())`); await warte(60);
    const zwischen = JSON.parse(E(`JSON.stringify(Object.keys(S.entries).sort().map(k => (S.entries[k].cycleData['${cid}'] || {}).trichomes).filter(Boolean).map(t => !!t.gerechnet))`));
    pruefe(zwischen.some(Boolean) && zwischen[zwischen.length - 1] === false, 'Angleichen: Tage dazwischen gekennzeichnet, der letzte Lupenwert nicht — ' + JSON.stringify(zwischen));
  } else {
    pruefe(false, 'Prüflage: kein Sprung im Verlauf erkannt — ' + step);
  }

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
