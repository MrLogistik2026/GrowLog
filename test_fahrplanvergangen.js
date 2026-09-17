/**
 * (v1.5.283) Gieß-Fahrplan: Die Liste zeigt bei vergangenen Güssen die eingetragene Menge.
 *
 * Der Fehler (Bewertung vom 17.09.2026, Hebel 1 #14): Die Zeile rechnete den Vorschlag des Tages neu — bei Patrick 15 von 29
 * vergangenen Güssen mehr als 5 % neben der eingetragenen Menge.
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

async function ladeMitSicherung() {
  const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
  const vc = new VirtualConsole();
  const fehler = [];
  vc.on('jsdomError', (e) => { const m = String((e && e.message) || e); if (!/Not implemented/i.test(m)) fehler.push(m); });
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.print = () => {};
      w.localStorage.setItem('growsmart_v4', BACKUP);
    },
  });
  const window = dom.window;
  if (window.document.readyState !== 'complete') {
    await new Promise((r) => { window.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  }
  await new Promise((r) => setTimeout(r, 80));
  return { E: (s) => window.eval(s), fehler };
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  console.log('\nA - Patricks Sicherung am 04.09.2026: vergangene Güsse zeigen die eingetragene Menge');
  const { E, fehler } = await ladeMitSicherung();
  const r = JSON.parse(E(`(function(){
    setDebugDate('2026-09-04');
    S.beginnerMode = false;
    const c = S.cycles.find(x => x.active);
    goTo('gussplan');
    const text = document.getElementById('scr-gussplan').textContent;
    const wasser = {};
    Object.keys(S.entries).forEach(k => { const cd = S.entries[k].cycleData && S.entries[k].cycleData[c.id]; if (cd) wasser[isoDiff(k, c.startDate) + 1] = { w: parseFloat(cd.water) || 0, vorschlag: !!(cd._suggested && cd._suggested.water) }; });
    return JSON.stringify({ text, wasser, heuteTag: isoDiff(todayISO(), c.startDate) + 1 });
  })()`));
  const t = r.text.replace(/\s+/g, ' ');
  const zeilen = [];
  const re = /Tag (\d+) [A-Z][a-z]\., \d\d\.\d\d\.( · heute)? (gegossen (\d+) ml( · Vorschlag übernommen)?|nicht eingetragen|Crushed Ice, kein Guss|etwa (\d+) ml)/g;
  let m;
  while ((m = re.exec(t))) zeilen.push({ tag: Number(m[1]), text: m[3], ml: m[4] ? Number(m[4]) : null, vorschlag: !!m[5], etwa: m[6] ? Number(m[6]) : null });
  const vorbei = zeilen.filter(z => z.tag < r.heuteTag);
  pruef('Vergangene Güsse in der Liste gefunden', vorbei.length >= 20, vorbei.length);
  const falsch = vorbei.filter(z => {
    const e = r.wasser[z.tag] || { w: 0, vorschlag: false };
    if (e.w > 0) return !(z.ml === Math.round(e.w) && z.vorschlag === e.vorschlag);
    return z.ml !== null || z.etwa !== null;
  });
  pruef('Jede vergangene Zeile nennt die eingetragene Menge (keine nachgerechnete)', falsch.length === 0, falsch.slice(0, 4).map(z => 'Tag ' + z.tag + ': ' + z.text + ' / eingetragen ' + (r.wasser[z.tag] || {}).w).join(' | '));
  pruef('Kein „etwa … ml" mehr bei vergangenen Güssen', !vorbei.some(z => z.etwa !== null), vorbei.filter(z => z.etwa !== null).map(z => z.tag).join(', '));
  pruef('Übernommene Vorschläge sind gekennzeichnet', vorbei.some(z => z.vorschlag) === Object.keys(r.wasser).some(k => Number(k) < r.heuteTag && r.wasser[k].vorschlag && r.wasser[k].w > 0 && vorbei.some(z => z.tag === Number(k))),
    vorbei.filter(z => z.vorschlag).map(z => z.tag).join(', '));
  const kommend = zeilen.filter(z => z.tag > r.heuteTag);
  pruef('Kommende Güsse zeigen weiter „etwa … ml"', kommend.length === 0 || kommend.some(z => z.etwa !== null || /Crushed Ice/.test(z.text)), kommend.slice(0, 3).map(z => z.tag + ': ' + z.text).join(' | '));
  pruef('Keine JS-Fehler', fehler.length === 0, fehler[0]);

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
