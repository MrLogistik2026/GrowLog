/**
 * (v1.5.157) pH-Zahlen in Texten kommen aus phTargetFor.
 *
 * Der Fehler (Befund der Prüf-Agenten, gegengeprüft): Freitexte trugen eigene, ältere pH-Spannen,
 * die dem Ziel des pH-Feldes widersprachen. Ablauf-Auswertung Erde: „Weiter bei pH 6.2–6.8 gießen"
 * (17 von 24 Ablaufmessungen Patricks), während das Feld bei 6,6 warnte; zu niedriger Ablauf:
 * „Input-pH leicht anheben (6.5–6.8)", Coco „6.0–6.3", Hydro „5.8–6.2" — phTargetFor sagt 6.2–6.4 /
 * 5.8–6.2 / 5.5–6.0. Tipp beim Spülen fest „pH 6.4" auch für Coco, pH-Diagramm fest 6,2–6,4 für jedes
 * Substrat. Beim Nachsuchen dazu: das Lexikon nannte als normalen Drain-pH in Erde 6,0–6,5 — nach
 * ANBAU.md 4.1 sind 6,8–7,2 in gekalkter Erde das erwartete Gleichgewicht.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

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
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  const r = JSON.parse(E(`(function(){
    const ziel = m => phTargetFor(m);
    const hoch = m => T.runoff.phWarningHigh({ inputPh: 6.3, runoffPh: 7.1, medium: m });
    const tief = m => T.runoff.phWarningLow({ inputPh: 6.3, runoffPh: 5.6, medium: m });
    const tipp = m => (getSmartTip({ medium: m }, { ph: 'flush', day: 100 }) || {}).text || '';
    return JSON.stringify({ ziel: { erde: ziel('erde'), coco: ziel('coco'), hydro: ziel('hydro') },
      hoch: { erde: hoch('erde'), coco: hoch('coco'), hydro: hoch('hydro') },
      tief: { erde: tief('erde'), coco: tief('coco'), hydro: tief('hydro') },
      tipp: { erde: tipp('erde'), coco: tipp('coco') } });
  })()`));

  console.log('\nA - Ablauf-pH-Auswertung nennt das Ziel des Substrats');
  pruef('Erde, Ablauf höher: Zulauf im Ziel ' + r.ziel.erde.label + ', nicht „6.2–6.8"', r.hoch.erde.includes(r.ziel.erde.label) && !/6\.2–6\.8/.test(r.hoch.erde), r.hoch.erde.slice(0, 200));
  pruef('Coco, Ablauf höher: „Coco ' + r.ziel.coco.label + '"', r.hoch.coco.includes('Coco ' + r.ziel.coco.label), r.hoch.coco.slice(-80));
  pruef('Hydro, Ablauf höher: „Hydro ' + r.ziel.hydro.label + '"', r.hoch.hydro.includes('Hydro ' + r.ziel.hydro.label), r.hoch.hydro.slice(-80));
  pruef('Erde, Ablauf tiefer: obere Zielgrenze ' + r.ziel.erde.hi + ', nicht „6.5–6.8"', r.tief.erde.includes(r.ziel.erde.hi.toFixed(1)) && !/6\.5–6\.8/.test(r.tief.erde), r.tief.erde.slice(-120));
  pruef('Coco, Ablauf tiefer: Ziel ' + r.ziel.coco.label + ', nicht „6.0–6.3"', r.tief.coco.includes(r.ziel.coco.label) && !/6\.0–6\.3/.test(r.tief.coco), r.tief.coco.slice(-120));
  pruef('Hydro, Ablauf tiefer: Ziel ' + r.ziel.hydro.label + ', nicht „5.8–6.2"', r.tief.hydro.includes(r.ziel.hydro.label) && !/5\.8–6\.2/.test(r.tief.hydro), r.tief.hydro.slice(-120));

  console.log('\nB - Tipp beim Spülen');
  pruef('Coco: „pH ' + r.ziel.coco.label + '"', r.tipp.coco.includes(r.ziel.coco.label), r.tipp.coco);
  pruef('Erde: „pH ' + r.ziel.erde.label + '"', r.tipp.erde.includes(r.ziel.erde.label), r.tipp.erde);

  console.log('\nC - Keine festen pH-Spannen mehr, die phTargetFor oder ANBAU.md 4.1 widersprechen');
  {
    const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n')
      .map((z, i) => ({ nr: i + 1, z })).filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.z));
    ['pH 6.2–6.8', '(6.5–6.8)', 'Coco 6.0–6.3', "'Hydro 5.8–6.2'", '5.5–6.5 für Hydro', "'Nur klares Wasser. pH 6.4.'",
     'sollte 6.0–6.5 sein (Erde)', 'Grüner Bereich: 6.2–6.4 (Erde, ideal)', 'zones: [{ from: 6.2, to: 6.4',
     'Eisen/Mangan/Phosphor werden blockiert', 'pH immer 6.2–6.4 (Erde), Ziel: 6.4', '6.0–6.5 (Erde) / 5.5–6.0 (Coco/Hydro)'].forEach(alt => {
      const treffer = quelle.filter(x => x.z.includes(alt)).map(x => 'Zeile ' + x.nr);
      pruef('Nirgends: „' + alt + '"', treffer.length === 0, treffer.join(', '));
    });
  }

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
