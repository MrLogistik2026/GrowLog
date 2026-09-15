/**
 * (v1.5.176) Der natürliche Mengen-Korridor hebt die Sämlingsrampe nicht mehr an.
 *
 * Befund der Prüf-Agentin zur Gießmenge (15.09.2026), nachgemessen: Ein frischer Zyklus (11 L Erde, Automatic,
 * keine Einträge) bekam an Tag 21 550 ml und an Tag 22 1450 ml je Pflanze. Die eigene Rampe der App sagt 650 ml.
 * Ursache: `_naturalPhaseRange` rechnet den Stretch-Korridor aus Tag 31 (1450–2150), und `_klemm` in
 * `waterSuggestion` hob damit schon Blütetag 1 auf die Untergrenze — bis Tag 25 festgeklemmt. Ohne eigene
 * Korridore hätte die App Patrick an Tag 22 7250 ml für fünf Pflanzen vorgeschlagen; gegossen hat er 3500.
 * Nach ANBAU.md 1 und 13.1 ist ein dauernasser Topf mit kleinem Wurzelballen der Weg zur toten Pflanze.
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

// Frischer Zyklus ohne Einträge; eigenerKorridor optional
const KURVE = (eigen) => `(function(){
  S.cycles = []; S.entries = {};
  const c = addCyc({ name: 'Frisch', seedType: 'auto', medium: 'erde' });
  c.startDate = '2026-03-01'; c.potSize = 11; c.plantCount = 1; c.bloomDays = 63; c.anzuchtDays = 21;
  ${eigen ? `c.waterRange = { stretch: { min: ${eigen[0]}, max: ${eigen[1]} } };` : 'delete c.waterRange;'}
  saveS();
  const out = [];
  for (let d = 15; d <= 40; d++) {
    const iso = isoPlus(c.startDate, d - 1); const p = phase(iso, c);
    const key = waterPhaseKey(c, p); const rng = getPhaseRange(c, key);
    out.push({ d, key, raw: Math.round(_waterSuggestionRaw(c, p)), sug: waterSuggestion(c, p, iso), max: rng ? rng.max : null });
  }
  return JSON.stringify(out);
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler (leerer Speicher)', errors.length === 0, errors[0]);

  console.log('\nA - Frischer Zyklus, 11 L Erde, ohne eigene Korridore');
  {
    const k = JSON.parse(E(KURVE(null)));
    const tag = (d) => k.find(x => x.d === d);
    console.log('    ' + k.filter(x => x.d >= 19 && x.d <= 30).map(x => x.d + ':' + x.sug).join(' · '));
    pruef('Tag 22 folgt der eigenen Rampe (roh ' + tag(22).raw + ' ml), höchstens 700 ml', tag(22).sug === tag(22).raw && tag(22).sug <= 700, 'Vorschlag ' + tag(22).sug);
    pruef('Tag 21 → 22 höchstens +25 %', tag(22).sug <= tag(21).sug * 1.25, tag(21).sug + ' → ' + tag(22).sug);
    let bruch = null;
    for (let i = 1; i < k.length; i++) if (k[i].d <= 35 && k[i].sug < k[i - 1].sug) bruch = k[i - 1].d + ':' + k[i - 1].sug + ' → ' + k[i].d + ':' + k[i].sug;
    pruef('Tag 15–35 steigt die Menge nie ab', bruch === null, bruch);
    const drueber = k.filter(x => x.max != null && x.sug > x.max).map(x => x.d + ':' + x.sug + '>' + x.max);
    pruef('Nach oben begrenzt der Korridor weiter (Tag 22–40)', drueber.length === 0, drueber.join(' '));
  }

  console.log('\nB - Ein selbst gesetzter Korridor hebt weiter an');
  {
    const k = JSON.parse(E(KURVE([1000, 2000])));
    const t22 = k.find(x => x.d === 22);
    pruef('Eigener Stretch-Korridor 1000–2000: Tag 22 = 1000 ml', t22.sug === 1000, 'Vorschlag ' + t22.sug);
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
