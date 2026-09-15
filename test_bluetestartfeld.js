/**
 * (v1.5.182) Das Feld „Blüte-Start" in den Einstellungen zeigt den Tag, mit dem die App rechnet.
 *
 * Beim Beheben von v1.5.181 gesehen: Für Outdoor-Photos leitet _computeBloomStartDate den Blütestart aus dem
 * 17. August (Südhalbkugel 17. Februar) ab, frühestens 4 Wochen nach dem Start. Die Einstellungen hatten eine eigene
 * Kopie der Regel mit der Sonnenwende (21.06.) und 6 Wochen — das Feld zeigte einen Blütestart, den keine Rechnung
 * benutzte, bis zu einem Jahr daneben.
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

const FAELLE = [
  { name: 'Nordhalbkugel, Start 01.04.', start: '2026-04-01', hemisphere: 'north', erwartet: '2026-08-17' },
  { name: 'Nordhalbkugel, Start 01.08. — 4 Wochen Mindest-Vegi', start: '2026-08-01', hemisphere: 'north', erwartet: '2026-08-29' },
  { name: 'Südhalbkugel, Start 01.10.', start: '2026-10-01', hemisphere: 'south', erwartet: '2027-02-17' },
];

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler (leerer Speicher)', errors.length === 0, errors[0]);

  for (const f of FAELLE) {
    console.log('\n' + f.name);
    const r = JSON.parse(E(`(function(){
      S.cycles = []; S.entries = {};
      const c = addCyc({ name: 'Draußen', seedType: 'fem', medium: 'erde' });
      c.growType = 'outdoor'; c.startDate = '${f.start}'; c.hemisphere = '${f.hemisphere}'; delete c.bloomStartDate; saveS();
      selId = c.id; draft = {}; draftTouched = {};
      S._setUI = Object.assign({}, S._setUI, { cyc_bloomstart: true });
      goTo('set'); renderSet();
      const feld = document.querySelector('#scr-set input[oninput*="bloomStartDate"]');
      const wrap = feld ? feld.closest('.inp-wrap') : null;
      const app = _computeBloomStartDate(c);
      return JSON.stringify({ feld: feld ? feld.value : null, app, hinweis: wrap ? wrap.textContent.replace(/\\s+/g, ' ').trim() : '',
        vorher: (phase(isoPlus(app, -1), c) || {}).ph, am: (phase(app, c) || {}).ph });
    })()`));
    pruef(`App rechnet mit ${f.erwartet} (Tag davor ${r.vorher}, am Tag ${r.am})`, r.app === f.erwartet && r.am === 'bloom' && r.vorher !== 'bloom', `${r.app} · ${r.vorher} → ${r.am}`);
    pruef(`Feld „Blüte-Start" zeigt denselben Tag`, r.feld === r.app, `Feld ${r.feld}, App ${r.app}`);
    pruef('Hinweis beschreibt die Regel, nach der gerechnet wird', !/Sonnenwende/.test(r.hinweis) && /17\. August/.test(r.hinweis), r.hinweis);
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
