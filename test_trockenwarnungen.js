/**
 * (v1.5.194) Beim Trocknen und im Curing keine Pflanzen-Warnungen zur Temperatur.
 *
 * Der Fehler: getEntryWarnings warnte im Trockenraum bei 17 °C „Fällt die Wurzelzone unter 16 °C, brechen Phosphor- und
 * Wasseraufnahme ein", bei 14 °C „das Wachstum stockt", bei 30 °C „Stoffwechsel bremst. Ziel: 22–28 °C bei Licht an" und bei
 * 33 °C „Hitzestress (Taco-Blätter)" — die Pflanze ist da längst geschnitten. Die Temperatur beim Trocknen bewertet die
 * Zielzeile im Umgebungsblock (18–20 °C, TROCKNEN_KLIMA, ANBAU.md 12.1). In Dunkelphase und am Erntetag stand über 32 °C
 * ebenfalls „Taco-Blätter" statt des Terpen-Hinweises, den dieselben Tage ab 29 °C zeigen.
 *
 * Gegenproben: In der Blüte warnen 17 °C und 33 °C wie vorher; die Zielzeile beim Trocknen zeigt bei 17 °C weiter ⚠.
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
    const c = S.cycles[0]; const tage = {};
    for (let i = 60; i < 150; i++) { const iso = isoPlus(c.startDate, i); const p = phase(iso, c); if (!p) continue;
      const k = p.ph === 'ice' ? (klimaStufe(p) === 'dunkel' ? 'dunkel' : 'ice') : (p.ph === 'bloom' ? 'bloom_' + bluetestufe(p) : p.ph);
      if (!tage[k]) tage[k] = iso; }
    const temp = function (p, t) { return getEntryWarnings({}, p, { temp: String(t), humidity: '55' }, c, null)
      .filter(function (x) { return /🌡️/.test(x.text); }).map(function (x) { return x.type + ': ' + x.text; }); };
    const pDry = phase(tage.dry, c), pCure = phase(tage.cure, c), pDunkel = phase(tage.dunkel, c), pErnte = phase(tage.harvest, c), pSpaet = phase(tage.bloom_spaet, c);
    return JSON.stringify({ tage: tage,
      dry: [14, 17, 30, 33].map(function (t) { return temp(pDry, t); }),
      cure: [14, 17, 30, 33].map(function (t) { return temp(pCure, t); }),
      dunkel33: temp(pDunkel, 33), ernte33: temp(pErnte, 33),
      spaet17: temp(pSpaet, 17), spaet33: temp(pSpaet, 33),
      zielDry17: _klimaEntryTeile('17', '58', [c], tage.dry).tempZeile.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim() });
  })()`));

  pruef('Prüflage: Trocknen, Curing, Dunkelphase, Erntetag und späte Blüte gefunden',
    ['dry', 'cure', 'dunkel', 'harvest', 'bloom_spaet'].every(k => r.tage[k]), JSON.stringify(r.tage));

  console.log('\nA - Geschnittene Pflanze: keine Pflanzen-Warnungen zur Temperatur');
  pruef('Trocknen bei 14, 17, 30 und 33 °C: keine Temperatur-Warnung (Wurzelzone, Wachstum, Stoffwechsel, Taco-Blätter)',
    r.dry.every(w => w.length === 0), JSON.stringify(r.dry));
  pruef('Curing bei 14, 17, 30 und 33 °C: keine Temperatur-Warnung', r.cure.every(w => w.length === 0), JSON.stringify(r.cure));
  pruef('Die Zielzeile beim Trocknen zeigt 17 °C weiter mit ⚠ gegen 18–20 °C', /⚠/.test(r.zielDry17) && /18–20/.test(r.zielDry17), r.zielDry17);

  console.log('\nB - Dunkelphase und Erntetag über 32 °C: Terpen-Hinweis statt „Taco-Blätter"');
  pruef('Dunkelphase 33 °C: Fehler-Stufe mit Terpen-Hinweis, keine Taco-Blätter',
    r.dunkel33.length === 1 && /^err: .*Terpene/.test(r.dunkel33[0]) && !/Taco/.test(r.dunkel33[0]), JSON.stringify(r.dunkel33));
  pruef('Erntetag 33 °C: ebenso', r.ernte33.length === 1 && /^err: .*Terpene/.test(r.ernte33[0]) && !/Taco/.test(r.ernte33[0]), JSON.stringify(r.ernte33));

  console.log('\nC - Gegenprobe späte Blüte');
  pruef('17 °C: Warnung „kühl" mit Wurzelzone', r.spaet17.some(x => /^warn: .*kühl.*Wurzelzone/.test(x)), JSON.stringify(r.spaet17));
  pruef('33 °C: „Hitzestress (Taco-Blätter)" bleibt', r.spaet33.some(x => /^err: .*Taco-Blätter/.test(x)), JSON.stringify(r.spaet33));

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
