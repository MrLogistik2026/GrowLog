/**
 * (v1.5.277) Gieß-Fahrplan am IceFlush: Crushed Ice je Topf statt einer Gießmenge.
 *
 * Der Fehler (Bewertung vom 17.09.2026, Hebel 1 #14): „🧊 IceFlush · etwa 700 ml" bzw. „2100 ml · 700 ml je Pflanze × 3" —
 * das Schmelzwasser, angezeigt wie ein Guss, während Startseite und Eintrag „kein Wasser dazu" sagen.
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

// Zyklus so datieren, dass heute + versatz der IceFlush-Tag ist; gibt den Text des Gieß-Fahrplans (Profi) zurück.
const LAGE = (opt) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = false;
  const c = addCyc({ name: 'Eisplan', seedType: 'auto', medium: 'erde' });
  c.potSize = ${opt.topf || 11}; c.plantCount = ${opt.pflanzen || 1};
  c.plants = Array.from({ length: ${opt.pflanzen || 1} }, (_, i) => ({ id: 'p' + i, label: 'Pflanze ' + (i + 1) }));
  let gefunden = false;
  for (let d = 60; d <= 120; d++) {
    c.startDate = isoPlus(todayISO(), -(d - 1 + ${opt.versatz || 0}));
    if (getAction(isoPlus(todayISO(), ${opt.versatz || 0}), c) === 'ice') { gefunden = true; break; }
  }
  if (!gefunden) return JSON.stringify({ fehlt: true });
  saveS();
  goTo('gussplan');
  return JSON.stringify({ text: document.getElementById('scr-gussplan').textContent, eisTag: phase(isoPlus(todayISO(), ${opt.versatz || 0}), c).day });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  const lauf = (opt) => {
    const r = JSON.parse(E(LAGE(opt)));
    if (r.fehlt) return r;
    const t = r.text.replace(/\s+/g, ' ');
    // Die Listenzeile: „Tag N Do., 17.09. · heute <Menge oder Crushed Ice> <Knopf>".
    const zeile = (t.match(new RegExp('Tag ' + r.eisTag + ' [A-Z][a-z]\\., \\d\\d\\.\\d\\d\\.[^🧊💧🌿]{0,60}')) || [''])[0];
    return { karte: (t.match(/Nächster Guss.{0,200}/) || [''])[0], zeile, eisTag: r.eisTag };
  };

  console.log('\nA - Heute IceFlush, 1 Pflanze, 11 L');
  const a = lauf({});
  pruef('Lage gefunden', !a.fehlt, JSON.stringify(a).slice(0, 80));
  if (!a.fehlt) {
    pruef('Karte: „1000 ml Crushed Ice je Topf an den Rand — kein Wasser dazu"', /IceFlush · etwa 1000 ml Crushed Ice je Topf an den Rand — kein Wasser dazu/.test(a.karte), a.karte);
    pruef('Karte ohne Gießmenge „etwa 700 ml"', !/etwa 700 ml/.test(a.karte), a.karte);
    pruef('Listenzeile: „Crushed Ice, kein Guss"', /Crushed Ice, kein Guss/.test(a.zeile) && !/etwa \d+ ml/.test(a.zeile), a.zeile);
  }

  console.log('\nB - Morgen IceFlush, 3 Pflanzen, 11 L');
  const b = lauf({ versatz: 1, pflanzen: 3 });
  if (!b.fehlt) pruef('Karte je Topf 1000 ml Eis, keine 2100 ml', /1000 ml Crushed Ice je Topf/.test(b.karte) && !/2100 ml/.test(b.karte) && !/700 ml je Pflanze/.test(b.karte), b.karte);

  console.log('\nC - Heute IceFlush, 15-L-Topf');
  const cc = lauf({ topf: 15 });
  if (!cc.fehlt) pruef('Eismenge folgt dem Topf: 1364 ml', /1364 ml Crushed Ice je Topf/.test(cc.karte), cc.karte);

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
