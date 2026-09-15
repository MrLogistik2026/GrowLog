/**
 * (v1.5.174) Die Gießanleitungen nennen das Ablaufziel aus DRAIN_ZIEL.
 *
 * Seit v1.5.112 ist das Ziel 15–20 % Ablauf (ANBAU.md 5.1), seit v1.5.153 steht es an einer Stelle
 * (DRAIN_ZIEL). Zwei Anleitungen sagten weiter „Langsam gießen bis 10–15% Drain" — die Gießanleitung im
 * Eintrag sogar zwei Zeilen über ihrer eigenen Zeile „15–20% Drain bei jedem Guss". Befund der
 * Prüf-Agentin zur Gießmenge (15.09.2026).
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
  const ziel = E('DRAIN_ZIEL.min + "–" + DRAIN_ZIEL.max + " %"');

  console.log('\nA - Quelltext');
  {
    const zeilen = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split(/\r?\n/)
      .map((z, i) => ({ nr: i + 1, z })).filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.z) && /10\s?[–-]\s?15\s?% Drain/.test(x.z));
    pruef('Kein „10–15 % Drain" mehr', zeilen.length === 0, zeilen.map(x => 'Zeile ' + x.nr).join(', '));
  }

  console.log('\nB - Gerendert');
  {
    const tipps = E(`(function(){ S._tipsOpen = Object.assign(S._tipsOpen || {}, { guss: true }); goTo('tips'); renderTips();
      return document.getElementById('scr-tips').textContent.replace(/\\s+/g, ' '); })()`);
    const t = (tipps.match(/① Vollsättigung.{0,120}/) || ['(Leitfaden nicht gefunden)'])[0];
    pruef(`Tipps, Gieß-Leitfaden: „${ziel} unten ablaufen"`, t.includes(`bis ${ziel} unten ablaufen`), t);

    E(`setDebugDate('2026-08-27'); S.beginnerMode = false; openEntry('2026-08-27')`);
    await warte(200);
    const eintrag = E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
    const g = (eintrag.match(/① Vollsättigung:.{0,110}/) || ['(Gießanleitung nicht gefunden)'])[0];
    pruef(`Eintrag, Gießanleitung: „${ziel} unten ablaufen", passend zur eigenen Drain-Zeile`, g.includes(`bis ${ziel} unten ablaufen`) && /15–20% Drain bei jedem Guss/.test(eintrag), g);
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
