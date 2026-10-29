// (v1.5.474) Zurück aus dem Gieß-Fahrplan führt zur Herkunft (Einstellungen / Düngeplan), nicht immer in den Düngeplan.
// Pfeil oben und Hardware-Zurück (popstate). Befehlssuche öffnet ohne Herkunft: Rückfall wie bisher (Pfeil → Einstellungen, Zurück → Düngeplan).
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
  return { w, errors, E: (s) => w.eval(s) };
}

(async () => {
  const { w, errors, E } = await lade();
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  E(`(function(){ S.cycles = []; S.entries = {}; const c = addCyc({ name: 'Test', startDate: isoPlus(todayISO(), -20), seedType: 'auto', growType: 'indoor',
    medium: 'erde', potSize: 11, plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id; })()`);
  const aktiv = () => E(`(function(){ const a = document.querySelector('.screen.active'); return a ? a.id : ''; })()`);
  const zurueckPfeil = () => E(`document.querySelector('#scr-gussplan .topbar .icon-btn').click()`);
  const zurueckHw = () => w.dispatchEvent(new w.PopStateEvent('popstate'));

  for (const [name, von, tasten] of [['Pfeil', null, zurueckPfeil], ['Hardware', null, zurueckHw]]) {
    const pf = name === 'Pfeil';
    E(`goTo('set')`); E(`openGussplan()`);
    pruefe(aktiv() === 'scr-gussplan', name + ' A: Fahrplan nicht offen: ' + aktiv());
    tasten();
    pruefe(aktiv() === 'scr-set', name + ' A: Einstellungen → Fahrplan → Zurück landet nicht in den Einstellungen: ' + aktiv());
    E(`goTo('duenger')`); E(`openGussplan()`);
    tasten();
    pruefe(aktiv() === 'scr-duenger', name + ' B: Düngeplan → Fahrplan → Zurück landet nicht im Düngeplan: ' + aktiv());
    E(`goTo('dash')`); E(`openGussplan()`);
    tasten();
    pruefe(aktiv() === 'scr-dash', name + ' C: Startseite → Fahrplan → Zurück landet nicht auf der Startseite: ' + aktiv());
    // Befehlssuche: ohne Herkunft, Rückfall wie bisher
    E(`goTo('set')`); E(`openGussplan()`); E(`goTo('dash')`); E(`goTo('gussplan'); renderGussplan()`);
    tasten();
    pruefe(aktiv() === (pf ? 'scr-set' : 'scr-duenger'), name + ' D: Befehlssuche → Zurück nicht wie bisher: ' + aktiv());
  }

  if (errors.length) fehler.push('Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
  console.log('TZ=' + (process.env.TZ || '?') + ' · ' + (n - fehler.length) + '/' + n + ' OK');
  fehler.forEach((f) => console.log('  FEHL ' + f));
  process.exit(fehler.length ? 1 : 0);
})();
