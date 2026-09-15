/**
 * (v1.5.203) Die Mischen-Zeile der Gießanleitung aus dem Plan des Zyklus.
 *
 * Der Fehler (Befund der Gießmengen-Prüfung, Runde 3; v1.5.109 an einer weiteren Stelle): Die Gießanleitung im Eintrag
 * sagte fest „CalMag zuerst → umrühren → Basisdünger → Additive", der Coco-Hinweis „CalMag zuerst einrühren", und die
 * Vorlage für eigene Pläne „CalMag zuerst". Für jeden Plan mit Silikat ist das die falsche Reihenfolge: Silikat ist stark
 * alkalisch und fällt mit Calcium sofort als Calciumsilikat aus (ANBAU.md 10). Der Rainbow-Plan führt Silica Force zuerst.
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

  const d = E(`(function(){ const c = S.cycles[0]; for (let i = 40; i < 100; i++) { const x = isoPlus(c.startDate, i - 1); if (getAction(x, c) === 'giess') return x; } return null; })()`);
  const erst = E(`(_planAnsicht(S.cycles[0]).mixOrder || [])[0] || null`);
  pruef('Prüflage: Gießtag und erstes Produkt der Mischreihenfolge von Patricks Plan', !!d && !!erst, d + ' / ' + erst);
  E(`setDebugDate('${d}'); openEntry('${d}')`);
  await warte(200);
  const mischen = () => (E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`).match(/🧪 Mischen:.{0,110}/) || ['(fehlt)'])[0];
  const a = mischen();
  pruef(`Patricks Plan: „${erst} zuerst → umrühren → dann der Rest in der Reihenfolge deines Plans"`, a.includes(`${erst} zuerst → umrühren → dann der Rest in der Reihenfolge deines Plans`), a);

  // Ein Plan mit Silikat an erster Stelle (wie der Rainbow-Plan): Die Zeile muss ihm folgen.
  E(`(function(){ const alt = _planAnsicht; window._planAnsichtAlt = alt; _planAnsicht = function (c) { const p = alt(c); return { products: p.products, mixOrder: ['Silica Force'].concat(p.mixOrder || []) }; }; openEntry('${d}'); })()`);
  await warte(200);
  const b = mischen();
  pruef('Plan mit Silikat an erster Stelle: „Silica Force zuerst", nicht „CalMag zuerst"', b.includes('Silica Force zuerst') && !/CalMag zuerst/.test(b), b);
  E(`_planAnsicht = window._planAnsichtAlt`);

  E(`S.cycles[0].medium = 'coco'; openEntry('${d}')`);
  await warte(200);
  const coco = E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
  pruef('Coco-Hinweis: CalMag Pflicht, ohne „zuerst einrühren"', /Coco: CalMag gehört in jede Mischung/.test(coco) && !/CalMag zuerst einrühren/.test(coco), (coco.match(/🥥 Coco:.{0,80}/) || ['(fehlt)'])[0]);
  E(`S.cycles[0].medium = 'erde'`);

  const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
  const alt = ['CalMag zuerst → umrühren → Basisdünger', 'CalMag zuerst einrühren', "Reihenfolge wie oben — CalMag zuerst"].filter(s => code.includes(s));
  pruef('Keine feste „CalMag zuerst"-Regel mehr außerhalb der Pläne', alt.length === 0, alt.join(' | '));

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
