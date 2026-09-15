/**
 * (v1.5.202) „Lieber einen Tag länger warten" — der Rat, der die Pflanze in den Wasserstress schickte.
 *
 * Der Fehler (Befund der Gießmengen-Prüfung, Runde 3): Der Master-Tipp in den Tipps sagte „Unsicher ob trocken genug?
 * Warte einen Tag länger! Von leicht hängenden Blättern erholt sich die Pflanze in 2h", die Gießanleitung für Erde „Lieber
 * 1 Tag länger warten. Hängende Blätter = 2h Erholung". Die Diagnose „Überwässerung" riet „dann kleinere Mengen".
 *
 * Mechanismus: Hängen die Blätter, sind die Spaltöffnungen längst zu — die Photosynthese steht (ANBAU.md 2.2), und bei
 * Automatics ist jeder Stress ein dauerhafter Ertragsverlust (ANBAU.md 9). Staunässe entsteht durch verdrängte Luft, also
 * durch zu häufiges Gießen oder Wasser im Untersetzer (ANBAU.md 1, 13.1). In einem Topf mit Abfluss läuft, was über die
 * Wasserhaltekapazität geht, als Drain ab — eine kleinere Menge macht den Topf nicht luftiger, sie lässt nur den Drain weg.
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
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`S.beginnerMode = false`);

  E(`renderTips()`);
  const tipps = E(`document.getElementById('tips-body').textContent.replace(/\\s+/g, ' ')`);
  pruef('Tipps, Master-Tipp: „Morgen wieder anheben — nicht warten, bis die Blätter hängen"',
    /Master-Tipp: Unsicher, ob der Topf schon leicht genug ist\? Morgen wieder anheben — aber nicht warten, bis die Blätter hängen/.test(tipps) && !/Warte einen Tag länger/.test(tipps),
    (tipps.match(/Master-Tipp:.{0,160}/) || ['(fehlt)'])[0]);

  const d = E(`(function(){ const c = S.cycles[0]; for (let i = 40; i < 100; i++) { const x = isoPlus(c.startDate, i - 1); if (getAction(x, c) === 'giess') return x; } return null; })()`);
  E(`setDebugDate('${d}'); openEntry('${d}')`);
  await warte(200);
  const erde = E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
  pruef('Gießanleitung Erde: „Morgen wieder anheben", nicht „Lieber 1 Tag länger warten"',
    /Unsicher\? Morgen wieder anheben — nicht warten, bis die Blätter hängen/.test(erde) && !/1 Tag länger warten|2h Erholung/.test(erde),
    (erde.match(/Unsicher\?.{0,120}/) || ['(fehlt)'])[0]);

  E(`S.cycles[0].medium = 'coco'; openEntry('${d}')`);
  await warte(200);
  const coco = E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
  pruef('Gießanleitung Coco unverändert: „In Coco lieber etwas früher gießen als zu spät"', /In Coco lieber etwas früher gießen als zu spät/.test(coco));
  E(`S.cycles[0].medium = 'erde'`);

  const nass = E(`PROBLEMS.find(function (p) { return p.id === 'overwatering'; }).action`);
  pruef('Diagnose „Überwässerung": Häufigkeit statt „dann kleinere Mengen"', !/kleinere Mengen/.test(nass) && /nicht öfter gießen, als der Hebe-Test sagt/.test(nass), nass);

  const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
  const alt = ['Warte einen Tag länger', '2h Erholung', 'Lieber 1 Tag länger warten', 'erholt sich die Pflanze in 2h', 'dann kleinere Mengen'].filter(s => code.includes(s));
  pruef('Kein „einen Tag länger warten" und keine „2h Erholung" mehr im Code', alt.length === 0, alt.join(' | '));

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
