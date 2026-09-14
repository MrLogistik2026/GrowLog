/**
 * (v1.5.156) Sorten-Chip und Wochen-Eingabe im Assistenten legen für dieselbe Dauer denselben Erntetag an.
 *
 * Der Fehler (Befund der Prüf-Agenten, gegengeprüft): _wizFinish zog beim Sorten-Chip
 * PHASE_DEFAULTS.anzuchtDays + flushDays + iceDays von der Planzahl ab — ohne den Tag 1 und ohne
 * iceLenFor, das draußen keine IceFlush-Tage kennt (v1.5.123). Für Sensi Amnesia XXL Auto (geplant
 * 120 Tage) ergab der Chip drinnen Tag 121, draußen Tag 118; die Wochen-Eingabe (120/7 Wochen)
 * beide Male Tag 120. Draußen lag die Ernte damit vor der Planzahl der Sorte (ANBAU.md 11).
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

// Einen Zyklus über den Assistenten anlegen — einmal über die Planzahl der Sorte (Chip), einmal über Wochen.
const ANLEGEN = (growType, weg, tage) => `(function(){
  S.cycles = []; S.entries = {}; saveS();
  const name = '${weg}-${growType}';
  _wizAnswers = Object.assign({ name, seedType: 'auto', growType: '${growType}', medium: 'erde', fertPresetKey: 'biobizz_official', potSize: 11, plants: 1 },
    '${weg}' === 'chip' ? { bloomDaysHint: ${tage} } : { seedWeeksLo: ${tage} / 7, seedWeeksHi: ${tage} / 7, seedWeeksKind: 'total' });
  _wizFinish();
  const c = S.cycles.find(x => x.name === name);
  const st = endspurtState(c, c.startDate);
  let aktion = null;
  for (let i = 0; i < 220; i++) { if (getAction(isoPlus(c.startDate, i), c) === 'ernte') { aktion = i + 1; break; } }
  return JSON.stringify({ bloomDays: c.bloomDays, ernte: st && st.ernteTag, aktion });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  const plan = JSON.parse(E(`(function(){ const s = STRAINS.find(x => /Amnesia XXL/i.test(x.name) && x.type === 'auto'); return JSON.stringify({ name: s && s.name, plan: s ? strainDays(s).plan : null }); })()`));
  console.log('    Sorte: ' + plan.name + ' · geplant ' + plan.plan + ' Tage');
  pruef('Prüflage: Planzahl der Sorte bekannt', plan.plan > 0, JSON.stringify(plan));
  const tage = plan.plan || 120;

  for (const growType of ['indoor', 'outdoor']) {
    console.log('\n' + (growType === 'indoor' ? 'A - Drinnen' : 'B - Draußen'));
    const chip = JSON.parse(E(ANLEGEN(growType, 'chip', tage)));
    const wochen = JSON.parse(E(ANLEGEN(growType, 'wochen', tage)));
    console.log('    Chip: Blüte ' + chip.bloomDays + ' Tage, Ernte Tag ' + chip.ernte + ' · Wochen: Blüte ' + wochen.bloomDays + ' Tage, Ernte Tag ' + wochen.ernte);
    pruef(growType + ': Chip und Wochen-Eingabe legen denselben Erntetag an', chip.ernte === wochen.ernte, chip.ernte + ' / ' + wochen.ernte);
    pruef(growType + ': Erntetag = Planzahl der Sorte (' + tage + ')', chip.ernte === tage, chip.ernte);
    pruef(growType + ': Endspurt und Kalender sagen dasselbe', chip.ernte === chip.aktion, chip.ernte + ' / ' + chip.aktion);
  }

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
