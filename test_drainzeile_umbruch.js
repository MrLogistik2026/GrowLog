// (v1.5.502) Die Drain-Zeile im Profi-Eintrag (Drain-pH, Drain-EC, Ablauf, Hinweis) bricht auf schmalen Handys um.
//
// Auf 390 px stand der Gießtag-Eintrag im Profi-Modus 46 px über und scrollte seitlich (gemessen in Chrome von der Bewertung am
// 30.10.2026, Technik-Befund 3; auf v1.5.497 schon genauso). jsdom rechnet kein Layout — geprüft wird, dass die Zeile umbrechen darf
// und der Hinweis eine Mindestbreite hat. Im Browser nachgemessen auf 320 und 390 px (Tag 101–113, beide Modi): keine Überbreite.
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

  // Profi, Gießtag ab Tag 25 (die Drain-Zeile erscheint nur, wo Drain entstehen kann)
  const r = JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S._seedlingProtocolShown = true; S.beginnerMode = false;
    let c; for (let t = 40; t <= 50; t++) { S.cycles = []; c = addCyc({ name: 'D', startDate: isoPlus(todayISO(), -(t - 1)), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11, plantCount: 1 }, { still: true }); S.cycles = [c]; if (getAction(todayISO(), c) === 'giess') break; }
    entryFrom = 'dash'; openEntry(todayISO());
    const ph = document.getElementById('runoff-ph-' + c.id); if (!ph) return JSON.stringify({ fehlt: true });
    let zeile = ph.parentElement; while (zeile && !/display:\s*flex/.test(zeile.getAttribute('style') || '') || (zeile && !zeile.querySelector('#runoff-ml-' + c.id))) zeile = zeile.parentElement;
    const hinweis = document.getElementById('runoff-delta-' + c.id);
    return JSON.stringify({ zeile: zeile ? zeile.getAttribute('style') : null, hinweis: hinweis ? hinweis.getAttribute('style') : null });
  })()`));
  pruefe(!r.fehlt, 'Prüflage: Drain-Zeile im Profi-Eintrag am Gießtag vorhanden');
  pruefe(/flex-wrap:\s*wrap/.test(r.zeile || ''), 'Drain-Zeile darf umbrechen — ' + r.zeile);
  pruefe(/min-width:\s*\d+px/.test(r.hinweis || ''), 'Drain-Hinweis hat eine Mindestbreite (bricht als Ganzes um) — ' + r.hinweis);

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
