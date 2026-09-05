/**
 * (v1.5.105/106) Zwei kleine, aber unangenehme Fehler aus der Restliste.
 *
 * A) LEERER DUENGEPLAN NACH DER ZURUECK-TASTE (v1.5.106)
 *    `goTo(t)` rendert dash, cal, tips, set und gussplan - `duenger` fehlte als einziger
 *    Bildschirm mit eigenem Inhalt. Wer im Giess-Fahrplan die Zurueck-Taste drueckte, landete
 *    ueber den Handler auf dem Duengeplan: sichtbar geschaltet, aber nie gefuellt, also leer
 *    bis auf die Kopfzeile. Die Befehlssuche kaschierte das, weil sie hinter goTo zusaetzlich
 *    renderDuenger() aufruft - ueber die Zurueck-Taste gab es diesen Zusatz nicht.
 *
 * B) BERICHTIGEN-LISTE SCHNITT AM ANGEZEIGTEN TAG AB (v1.5.105)
 *    `_trichHistoryEditor` holte die Messreihe mit `_trichHistory(c.id, c, iso)`, also nur bis
 *    zum geoeffneten Tag. Das Diagramm daneben zeigt seit v1.5.27 bewusst ALLE Messungen.
 *    An Tag 95 fehlten so 15 der 47 Messungen: Wer im Diagramm einen spaeteren Ausreisser sah,
 *    konnte ihn in der Liste darunter nicht berichtigen.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');

function fakeCtx() {
  const noop = () => {};
  return { canvas: null, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '',
    textBaseline: '', globalAlpha: 1, lineCap: '', lineJoin: '', shadowBlur: 0, shadowColor: '',
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop, arcTo: noop,
    rect: noop, fill: noop, stroke: noop, fillRect: noop, clearRect: noop, strokeRect: noop,
    save: noop, restore: noop, translate: noop, rotate: noop, scale: noop, setTransform: noop,
    fillText: noop, strokeText: noop, drawImage: noop, clip: noop, setLineDash: noop,
    quadraticCurveTo: noop, bezierCurveTo: noop, measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }), getImageData: () => ({ data: [] }) };
}

async function load() {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true;
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.print = () => {};
      w.localStorage.setItem('growsmart_v4', BACKUP);
    },
  });
  const window = dom.window;
  if (window.document.readyState !== 'complete') {
    await new Promise((r) => { window.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  }
  await new Promise((r) => setTimeout(r, 80));
  return { window, errors, E: (s) => window.eval(s) };
}

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info ? '  -> ' + info : '')); }
}

const inhalt = (E, id) =>
  E(`(document.getElementById('scr-${id}')||{textContent:''}).textContent.replace(/\\s+/g,' ').trim().length`);

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  console.log('');
  console.log('A - goTo fuellt jeden Bildschirm, den es sichtbar schaltet');
  {
    const { E, errors } = await load();
    pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
    E('S.beginnerMode = false');

    // Der eigentliche Fall: erst Giess-Fahrplan, dann per goTo auf den Duengeplan
    E("goTo('gussplan')");
    pruef('Giess-Fahrplan ist gefuellt', inhalt(E, 'gussplan') > 500, 'zeichen=' + inhalt(E, 'gussplan'));
    E("goTo('duenger')");
    pruef('Duengeplan ist nach goTo gefuellt', inhalt(E, 'duenger') > 500,
      'zeichen=' + inhalt(E, 'duenger'));
    pruef('Duengeplan ist aktiv',
      E("document.getElementById('scr-duenger').classList.contains('active')") === true);
    pruef('Der Planname steht drin',
      E("/BioBizz Official/.test(document.getElementById('scr-duenger').textContent)") === true);

    // Alle Bildschirme, die goTo direkt ansteuert, muessen Inhalt bekommen
    const leer = [];
    ['dash', 'cal', 'tips', 'set', 'duenger', 'gussplan'].forEach((t) => {
      E(`goTo('${t}')`);
      if (inhalt(E, t) < 100) leer.push(t + ' (' + inhalt(E, t) + ' Zeichen)');
    });
    pruef('Keiner der sechs Hauptbildschirme bleibt leer', leer.length === 0, leer.join(', '));
  }

  console.log('');
  console.log('B - Die Zurueck-Taste aus dem Giess-Fahrplan landet nicht im Leeren');
  {
    const { E } = await load();
    E('S.beginnerMode = false');
    E("goTo('gussplan')");
    // Denselben Weg gehen wie der Zurueck-Handler
    E("if (document.getElementById('scr-gussplan').classList.contains('active')) goTo('duenger');");
    pruef('Duengeplan aktiv', E("document.getElementById('scr-duenger').classList.contains('active')") === true);
    pruef('Und gefuellt', inhalt(E, 'duenger') > 500, 'zeichen=' + inhalt(E, 'duenger'));
  }

  console.log('');
  console.log('C - Berichtigen-Liste zeigt die ganze Messreihe, nicht nur bis heute');
  {
    const { E } = await load();
    E('S.beginnerMode = false');
    const gesamt = E('_trichHistory(S.cycles[0].id, S.cycles[0], null).length');
    pruef('Es gibt 47 Messungen insgesamt', gesamt === 47, 'n=' + gesamt);

    const anTag = (tag) => {
      E(`openEntry(isoPlus(S.cycles[0].startDate, ${tag - 1}))`);
      const t = E("document.getElementById('scr-entry').textContent.replace(/\\s+/g,' ')");
      const m = t.match(/Messungen berichtigen \((\d+)\)/);
      return m ? parseInt(m[1]) : null;
    };
    [95, 100, 105, 113].forEach((tag) => {
      const n = anTag(tag);
      pruef(`Tag ${tag}: alle ${gesamt} Messungen in der Liste`, n === gesamt, 'gefunden=' + n);
    });

    const bisTag95 = E("_trichHistory(S.cycles[0].id, S.cycles[0], isoPlus(S.cycles[0].startDate, 94)).length");
    pruef('Gegenprobe: bis Tag 95 waeren es nur 32 gewesen', bisTag95 === 32, 'n=' + bisTag95);
  }

  console.log('');
  console.log('D - Der geoeffnete Tag ist in der Liste markiert');
  {
    const { E } = await load();
    E('S.beginnerMode = false');
    E("openEntry(isoPlus(S.cycles[0].startDate, 94))");   // Tag 95
    const treffer = E(`(function(){
      const det = [...document.querySelectorAll('details')].find(d => /Messungen berichtigen/.test(d.textContent));
      if (!det) return '(keine Liste)';
      const hell = [...det.querySelectorAll('span')].filter(s => /font-weight:\\s*700/.test(s.getAttribute('style')||''));
      return hell.map(s => s.textContent).join(',');
    })()`);
    pruef('Genau Tag 95 ist hervorgehoben', treffer === 'T95', 'gefunden: ' + treffer);

    E("openEntry(isoPlus(S.cycles[0].startDate, 99))");   // Tag 100
    const treffer2 = E(`(function(){
      const det = [...document.querySelectorAll('details')].find(d => /Messungen berichtigen/.test(d.textContent));
      if (!det) return '(keine Liste)';
      const hell = [...det.querySelectorAll('span')].filter(s => /font-weight:\\s*700/.test(s.getAttribute('style')||''));
      return hell.map(s => s.textContent).join(',');
    })()`);
    pruef('Nach dem Wechsel ist Tag 100 hervorgehoben', treffer2 === 'T100', 'gefunden: ' + treffer2);
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
