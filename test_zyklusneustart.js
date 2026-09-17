/**
 * (v1.5.270) Neuer Zyklus und Demo-Zyklus: Die Kette bleibt nach einem Neustart dieselbe.
 *
 * Der Fehler: addCyc legte flushDays 8 ohne flushWetDays an. Die Umstellung aus v1.5.75 las beim nächsten Start die 8 als
 * Spültage und hängte 3 Tage Hard-Dryback an — Ernte drei Tage später, ohne dass jemand etwas eingestellt hatte.
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

// Öffnet die App mit einem vorhandenen Speicherstand — wie ein Neustart auf dem Handy.
async function ladeMit(speicher) {
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
      if (speicher) w.localStorage.setItem('growsmart_v4', speicher);
    },
  });
  const window = dom.window;
  if (window.document.readyState !== 'complete') {
    await new Promise((r) => { window.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  }
  await new Promise((r) => setTimeout(r, 80));
  return { E: (s) => window.eval(s), speicher: () => window.localStorage.getItem('growsmart_v4'), fehler };
}
const KETTE = `JSON.stringify(S.cycles.map(c => { const st = endspurtState(c, todayISO());
  return { name: c.name, flushDays: c.flushDays, wet: c.flushWetDays, dry: c.iceDryDays, spuelStart: st.spuelStart, ernteTag: st.ernteTag }; }))`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  console.log('\nA - Neuer Zyklus, dann Neustart');
  {
    const erst = await ladeMit(null);
    erst.E(`S.cycles = []; S.entries = {}; const c = addCyc({ name: 'Neu', seedType: 'auto', medium: 'erde' }); c.startDate = isoPlus(todayISO(), -10); saveS();`);
    const vorher = JSON.parse(erst.E(KETTE))[0];
    const zweit = await ladeMit(erst.speicher());
    const nachher = JSON.parse(zweit.E(KETTE))[0];
    pruef('Beim Anlegen: 5 Spültage + 3 Tage Dryback = 8', vorher.wet === 5 && vorher.dry === 3 && vorher.flushDays === 8, JSON.stringify(vorher));
    pruef('Nach dem Neustart unverändert: Spülen 8 Tage', nachher.flushDays === 8 && nachher.wet === 5, JSON.stringify(nachher));
    pruef('Erntetag bleibt derselbe', nachher.ernteTag === vorher.ernteTag, vorher.ernteTag + ' → ' + nachher.ernteTag);
    pruef('Keine JS-Fehler', erst.fehler.length === 0 && zweit.fehler.length === 0, erst.fehler.concat(zweit.fehler)[0]);
  }

  console.log('\nB - Demo-Zyklus, dann Neustart');
  {
    const erst = await ladeMit(null);
    erst.E(`S.cycles = []; S.entries = {}; welcomeStartDemo();`);
    const vorher = JSON.parse(erst.E(KETTE))[0];
    const zweit = await ladeMit(erst.speicher());
    const nachher = JSON.parse(zweit.E(KETTE))[0];
    pruef('Demo: Spülen 5 Tage (2 + 3)', !!vorher && vorher.flushDays === 5 && vorher.wet === 2, JSON.stringify(vorher));
    pruef('Demo nach dem Neustart unverändert', !!nachher && nachher.flushDays === 5 && nachher.ernteTag === vorher.ernteTag, JSON.stringify(nachher));
  }

  console.log('\nC - Altbestand ohne Spültage (vor v1.5.75): Umstellung wie bisher');
  {
    const erst = await ladeMit(null);
    erst.E(`S.cycles = []; S.entries = {}; const c = addCyc({ name: 'Alt', seedType: 'auto', medium: 'erde' }); c.startDate = isoPlus(todayISO(), -10);
      delete c.flushWetDays; delete c.iceDryDays; c.flushDays = 6; saveS();`);
    const zweit = await ladeMit(erst.speicher());
    const nachher = JSON.parse(zweit.E(KETTE))[0];
    pruef('Altbestand: eingetragene 6 sind Spültage, 3 Tage Dryback kommen dazu', nachher.wet === 6 && nachher.flushDays === 9, JSON.stringify(nachher));
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
