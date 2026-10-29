// (v1.5.479) Nebenbefund der Anfänger-Prüfung 29.10.2026: Auf der Startseite stand oben „Anzucht · Tag 10“ und in der Zyklus-Karte
// „Sämling · Tag 10“. Das sind zwei Dinge (Phase des Plans vs. Entwicklungsstadium der Pflanze, stageForCycle), deshalb zeigt die
// Zyklus-Karte in der Anzucht jetzt „Anzucht · Tag 10 · Stadium Sämling“. Geprüft: Tag 10, Tag 3 und Tag 20 widersprechen sich nicht
// (jede Angabe „X · Tag N“ der Startseite trägt denselben Phasennamen); in der Blüte bleibt alles wie vorher.
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
  const seite = (tag) => JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S.beginnerMode = true; const h = todayISO();
    const c = addCyc({ name: 'Phase', startDate: isoPlus(h, -${tag - 1}), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id;
    renderDash(); const p = phase(h, c);
    return JSON.stringify({ text: document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' '), ph: p && p.ph, stg: STAGE_NAMES[stageForCycle(c, h)] }); })()`));
  const namenVorTag = (text, tag) => { const m = []; const re = new RegExp('([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß ]*?) · Tag ' + tag + '(?!'+String.fromCharCode(92)+'d)', 'g'); let x; while ((x = re.exec(text))) m.push(x[1].trim().split(' ').slice(-2).join(' ')); return m; };

  for (const [tag, stadium] of [[10, 'Sämling'], [3, 'Keimung'], [20, 'Vegetation']]) {
    const r = seite(tag);
    const namen = namenVorTag(r.text, tag);
    pruefe(r.ph === 'anzucht' && r.stg === stadium, 'Prüflage Tag ' + tag + ': Phase ' + r.ph + ', Stadium ' + r.stg);
    pruefe(namen.length >= 2, 'Tag ' + tag + ': Heute-Karte und Zyklus-Karte nennen den Tag nicht beide: ' + JSON.stringify(namen));
    pruefe(namen.every((x) => /Anzucht$/.test(x)), 'Tag ' + tag + ': die Startseite nennt dieselbe Phase verschieden: ' + JSON.stringify(namen));
    pruefe(r.text.includes('Anzucht · Tag ' + tag + ' · Stadium ' + stadium), 'Tag ' + tag + ': „Stadium ' + stadium + '“ fehlt in der Zyklus-Karte');
  }
  const b = seite(40);
  pruefe(b.ph === 'bloom' && !/ · Stadium /.test(b.text) && b.text.includes(b.stg + ' · Tag 40'), 'Blüte Tag 40 verändert: ' + b.ph + ' / ' + b.stg);

  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '(System)') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
