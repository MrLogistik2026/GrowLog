// (v1.5.XXX) Coco-Wörter: Sämlings-, Keim- und Gießtexte sagen bei Coco „Substrat“ statt „Erde“, die Hebe-Test-Zeilen folgen dem Gießpunkt.
//
// Befund (Fachprüfung 30.10.2026, S1): Ein Coco-Zyklus las am Tag 1 „Säst du direkt in die Erde“, am Sprühtag „Erde feucht halten“, im
// Sämlings-Hinweis „der Sämling lebt von der Erde“ (Coco hat keine Vordüngung, ANBAU.md 7.1, 13.2) und am Hebe-Test-Knopf „Knapp: guter
// Gieß-Zeitpunkt“ — das ist der Gießpunkt der Erde; in Coco ist „Mittel“ der Gießpunkt (GIESSPUNKT) und „Knapp“ schon zu trocken.
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
  E(`S._seedlingProtocolShown = true;`);
  const seite = (medium, tag, einsteiger) => {
    E(`S.cycles = []; S.entries = {}; S.beginnerMode = ${einsteiger}; const c = addCyc({ name: 'T', startDate: isoPlus(todayISO(), -${tag - 1}), seedType: 'auto', growType: 'indoor', medium: '${medium}', potSize: 11, plantCount: 1 }, { still: true }); c.weightMode = 'lift'; S.cycles = [c];`);
    const teile = [];
    for (const [f, id] of [['renderDash()', 'scr-dash'], ['openEntry(todayISO())', 'scr-entry']]) { try { E(f); } catch (e) { fehler.push('Fehler in ' + f + ': ' + e.message); } teile.push(((w.document.getElementById(id) || {}).textContent || '').replace(/\s+/g, ' ')); }
    return teile.join(' ‖ ');
  };
  // 1. Coco: kein „Erde“ in Sämlings- und Gießtexten (Tag 1, 2, 12, 85; Einsteiger und Profi)
  const erdeStellen = [];
  for (const t of [1, 2, 4, 12, 85]) for (const e of [true, false]) { const s = seite('coco', t, e); const re = /[^.!?]{0,40}\bErd(e|en|-|ober)[^.!?]{0,40}/g; let m; while ((m = re.exec(s))) erdeStellen.push('T' + t + (e ? 'E' : 'P') + ': ' + m[0].trim()); }
  pruefe(erdeStellen.length === 0, 'Coco: kein „Erde“ in Dashboard und Eintrag (' + erdeStellen.slice(0, 3).join(' | ') + ')');
  // 2. Erde bleibt unverändert
  const erde1 = seite('erde', 1, true);
  pruefe(/Säst du direkt in die Erde/.test(erde1), 'Erde Tag 1: „Säst du direkt in die Erde“ bleibt');
  const coco1 = seite('coco', 1, true);
  pruefe(/Säst du direkt ins Substrat/.test(coco1), 'Coco Tag 1: „Säst du direkt ins Substrat“');
  pruefe(/Direkt ins Substrat/.test(coco1), 'Coco Tag 1: Keimmethode „Direkt ins Substrat“');
  const coco2 = seite('coco', 2, true);
  pruefe(/Ein durchnässtes Substrat ohne aktive Wurzel/.test(coco2), 'Coco Tag 2: „Ein durchnässtes Substrat …“ (Artikel stimmt)');
  pruefe(/Wird es dort oben hell|sobald es dort oben hell/.test(coco1 + coco2), 'Coco: Pronomen „es“ passt zu „das Substrat“');
  pruefe(!/der Substrat|Eine durchnässtes|die Substrat/.test(coco1 + coco2), 'Coco: keine falschen Formen (der/die Substrat)');
  // 3. Sämlings-Hinweis ohne Dünger im Plan: Coco hat keine Vordüngung
  pruefe(/Reserven im Samen/.test(seite('coco', 3, false)) || !/lebt von der Erde/.test(seite('coco', 3, false)), 'Coco: „lebt von der Erde“ erscheint nicht');
  // 4. Hebe-Test-Zeilen
  const z = (feel, medium) => E(`typeof _liftZeile === 'function' ? _liftZeile('${feel}', { medium: '${medium}' }) : LIFT_FEEL_TEXTE['${feel}'].zeile`);
  pruefe(/guter Gieß-Zeitpunkt/.test(z('low', 'erde')), 'Erde: „Knapp“ bleibt der gute Gieß-Zeitpunkt');
  pruefe(!/guter Gieß-Zeitpunkt/.test(z('low', 'coco')) && /zu trocken für Coco/.test(z('low', 'coco')), 'Coco: „Knapp“ ist zu trocken für Coco');
  pruefe(/Gießpunkt für Coco/.test(z('medium', 'coco')), 'Coco: „Mittel“ ist der Gießpunkt');
  pruefe(z('full', 'coco') === z('full', 'erde'), '„Voll“ bleibt für beide gleich');
  // 5. Drain-Sätze ohne „Erde im Topf“
  const Q = require('fs').readFileSync(process.env.GS_INDEX || require('path').join(__dirname, 'index.html'), 'utf8');
  pruefe(!/etwas über die Erde im Topf/.test(Q), 'Drain-Hinweise sprechen von der Wurzelzone, nicht von „der Erde im Topf“');
  pruefe(errors.length === 0, 'Keine JS-Fehler: ' + errors.slice(0, 2).join(' | '));
  console.log(fehler.length ? 'FEHLER (' + fehler.length + ' von ' + n + '):\n - ' + fehler.join('\n - ') : 'OK (' + n + ' Prüfungen)');
  process.exit(fehler.length ? 1 : 0);
})();
