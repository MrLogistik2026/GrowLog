/**
 * (v1.5.102) Sichert ab, dass Trainingsmethoden zur Phase passen muessen.
 *
 * Der Fehler: `openTrainingPicker` zeigte alle acht Methoden ungefiltert, und
 * `pickTrainingType` speicherte die Wahl kommentarlos ab. An Tag 113 - Spuelphase, IceFlush
 * am naechsten Tag, Ernte in wenigen Tagen - bot die App also unveraendert die
 * Saemlings-Haube, FIM, Mainlining und SCROG an. Ein Schnitt in der Spuelphase kostet die
 * Ernte; ein Anfaenger konnte das der App nicht ansehen.
 *
 * Das Merkwuerdige daran: Jede Methode traegt in `T.training` laengst ein `phase`-Feld
 * ('anzucht', 'vegi', 'vegi-bloom', 'bloom', 'harvest'). Es wurde nur nirgends ausgewertet.
 *
 * Wichtigste Gegenprobe unten in Abschnitt D: Patricks SIEBEN echte Trainings aus der
 * Sicherung muessen alle als passend gelten. Eine Regel, die die reale Praxis blockiert,
 * waere schlimmer als keine Regel.
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

async function load(mut) {
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
      const st = JSON.parse(BACKUP);
      if (mut) mut(st);
      w.localStorage.setItem('growsmart_v4', JSON.stringify(st));
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

const fitAn = (E, tag, typ) =>
  JSON.parse(E(`JSON.stringify(_trainingFit(S.cycles[0], isoPlus(S.cycles[0].startDate, ${tag - 1}), '${typ}'))`));

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  console.log('');
  console.log('A - In der Spuelphase ist kein Training mehr dran (Tag 113)');
  {
    const typen = ['haube', 'fim', 'lst', 'mainlining', 'supercropping', 'defoliation', 'lollipopping', 'scrog'];
    const schlecht = typen.filter(t => {
      const f = fitAn(E, 113, t);
      return !f || f.passt !== 'vorbei';
    });
    pruef('Alle acht Methoden gelten als "zu spaet"', schlecht.length === 0,
      'nicht abgefangen: ' + schlecht.join(', '));
    const f = fitAn(E, 113, 'fim');
    pruef('Der Grund nennt den Endspurt', /Endspurt/.test(f.warum), f.warum);
    pruef('Der Rat erklaert, warum es schadet', /Schimmel/.test(f.rat) && /Kraft/.test(f.rat));
    pruef('Phase an Tag 113 ist tatsaechlich flush',
      E("(phase(isoPlus(S.cycles[0].startDate,112), S.cycles[0])||{}).ph") === 'flush');
  }

  console.log('');
  console.log('B - In der Wachstumsphase ist Training willkommen (Tag 20)');
  {
    ['fim', 'lst', 'mainlining', 'supercropping', 'defoliation', 'scrog'].forEach(t => {
      const f = fitAn(E, 20, t);
      pruef(`${t} passt an Tag 20`, f && f.passt === 'jetzt', f && (f.passt + ': ' + f.warum));
    });
    const h = fitAn(E, 20, 'haube');
    pruef('Saemlings-Haube ist an Tag 20 nur noch "spaet"', h.passt === 'spaet', h.passt);
    pruef('Haube-Grund nennt das Alter', /20 Tage/.test(h.warum), h.warum);
    pruef('Haube-Rat warnt vor Schimmel', /Schimmel/.test(h.rat));
  }

  console.log('');
  console.log('C - Die Saemlings-Haube passt genau am Anfang');
  {
    pruef('Tag 3: passt', fitAn(E, 3, 'haube').passt === 'jetzt');
    pruef('Tag 10: passt', fitAn(E, 10, 'haube').passt === 'jetzt');
    pruef('Tag 14: passt gerade noch', fitAn(E, 14, 'haube').passt === 'jetzt');
    pruef('Tag 15: nur noch spaet', fitAn(E, 15, 'haube').passt === 'spaet');
    pruef('Tag 40: vorbei', fitAn(E, 40, 'haube').passt === 'vorbei');
  }

  console.log('');
  console.log('D - Patricks sieben echte Trainings bleiben alle erlaubt');
  {
    // Die wichtigste Gegenprobe: Eine Regel, die reale Praxis blockiert, waere schlimmer
    // als keine Regel.
    const echte = JSON.parse(E(`JSON.stringify((S.cycles[0].trainingEvents||[]).map(e => {
      const f = _trainingFit(S.cycles[0], e.date, e.type);
      return { datum: e.date, typ: e.type, tag: isoDiff(e.date, S.cycles[0].startDate)+1, passt: f && f.passt, warum: f && f.warum };
    }))`));
    pruef('Es sind sieben Eintraege', echte.length === 7, 'n=' + echte.length);
    const blockiert = echte.filter(e => e.passt !== 'jetzt');
    pruef('Keiner davon wuerde heute beanstandet', blockiert.length === 0,
      blockiert.map(e => `${e.typ} Tag ${e.tag}: ${e.passt} (${e.warum})`).join(' | '));
  }

  console.log('');
  console.log('E - Bud-Trimmen gehoert zur Ernte, nicht ins Training');
  {
    pruef('Tag 20: zu frueh', fitAn(E, 20, 'schucking').passt === 'zufrueh');
    pruef('Tag 113 (Spuelen): zu frueh', fitAn(E, 113, 'schucking').passt === 'zufrueh');
    const spaet = fitAn(E, 125, 'schucking');
    pruef('Nach der Ernte: passt', spaet.passt === 'jetzt', spaet.passt + ' / ' + spaet.warum);
  }

  console.log('');
  console.log('F - Der Picker sortiert und beschriftet');
  {
    const { E: E2 } = await load();
    E2('S.beginnerMode = false');
    E2(`openTrainingPicker(S.cycles[0].id, isoPlus(S.cycles[0].startDate, 19))`);
    await new Promise((r) => setTimeout(r, 200));
    const txt = E2("(document.querySelector('[data-day-picker]')||{textContent:''}).textContent.replace(/\\s+/g,' ')");
    pruef('Ueberschrift nennt das Passende zuerst', /Was jetzt sinnvoll ist/.test(txt), txt.slice(0, 80));
    pruef('Es gibt eine Trennlinie fuer Unpassendes', /Heute nicht dran/.test(txt));
    pruef('Die Haube traegt die Marke "spät"', /spät/.test(txt));

    // Und an Tag 113 gibt es gar nichts Passendes
    E2("document.querySelectorAll('[data-day-picker]').forEach(e=>e.remove())");
    E2(`openTrainingPicker(S.cycles[0].id, isoPlus(S.cycles[0].startDate, 112))`);
    await new Promise((r) => setTimeout(r, 200));
    const txt2 = E2("(document.querySelector('[data-day-picker]')||{textContent:''}).textContent.replace(/\\s+/g,' ')");
    pruef('An Tag 113 sagt die Ueberschrift, dass nichts passt',
      /passt keine dieser Methoden/.test(txt2), txt2.slice(0, 100));
    pruef('Jede Methode traegt dort "zu spät"', (txt2.match(/zu spät/g) || []).length >= 8,
      'gefunden: ' + (txt2.match(/zu spät/g) || []).length);
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
