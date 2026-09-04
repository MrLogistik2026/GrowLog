/**
 * Testgeruest: laedt index.html in jsdom und gibt das fertige window zurueck.
 * Ersetzt die im Container verlorene Fassung. Aendert nichts an der App —
 * es stellt nur die Browser-Bausteine bereit, die jsdom von Haus aus fehlen
 * (Canvas-Zeichenflaeche, Vibration, Scrollen).
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = path.join(__dirname, 'index.html');

/** Zeichenflaeche, die alles annimmt und nichts tut — Diagramme brauchen sie nur zum Malen. */
function fakeCtx() {
  const noop = () => {};
  return {
    canvas: null,
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '',
    textBaseline: '', globalAlpha: 1, lineCap: '', lineJoin: '', shadowBlur: 0,
    shadowColor: '',
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop,
    arcTo: noop, rect: noop, fill: noop, stroke: noop, fillRect: noop,
    clearRect: noop, strokeRect: noop, save: noop, restore: noop,
    translate: noop, rotate: noop, scale: noop, setTransform: noop,
    fillText: noop, strokeText: noop, drawImage: noop, clip: noop,
    setLineDash: noop, quadraticCurveTo: noop, bezierCurveTo: noop,
    measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    getImageData: () => ({ data: [] }),
  };
}

async function loadApp(opts = {}) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  // Echte Skriptfehler zaehlen; "not implemented"-Meldungen von jsdom nicht.
  virtualConsole.on('jsdomError', (e) => {
    const msg = String((e && e.message) || e);
    if (/Not implemented/i.test(msg)) return;
    errors.push(msg);
  });
  virtualConsole.on('error', (...a) => {
    const msg = a.map(String).join(' ');
    if (/Not implemented/i.test(msg)) return;
    errors.push(msg);
  });

  const html = fs.readFileSync(HTML, 'utf8');
  const dom = new JSDOM(html, {
    url: opts.url || 'https://growsmart.test/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.HTMLCanvasElement.prototype.getContext = function () {
        const c = fakeCtx(); c.canvas = this; return c;
      };
      window.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      window.navigator.vibrate = () => true;
      window.scrollTo = () => {};
      window.HTMLElement.prototype.scrollIntoView = function () {};
      window.alert = () => {};
      window.print = () => {};
    },
  });

  const window = dom.window;
  window.addEventListener('error', (e) => {
    errors.push(String((e && (e.message || e.error)) || e));
  });

  // Auf das load-Ereignis warten, damit die Startsequenz der App durch ist.
  if (window.document.readyState !== 'complete') {
    await new Promise((resolve) => {
      window.addEventListener('load', resolve, { once: true });
      setTimeout(resolve, 3000);
    });
  }
  await new Promise((r) => setTimeout(r, 30));

  return { dom, window, errors };
}

module.exports = { loadApp };
