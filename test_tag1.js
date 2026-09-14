/**
 * (v1.5.161) Tag 1 (Sättigungsguss) nennt Menge, pH, Mittel und Referenz-Schritt aus dem Zustand.
 *
 * Der Fehler (Befund der Prüf-Agenten, gegengeprüft): Startseite und Autofill füllten fest 700 ml je
 * Topf, während waterSuggestion und Gieß-Fahrplan für 7 L Erde 450 ml, für Coco 350 ml rechnen. Der
 * Einsteiger-Satz nannte „pH 6.3–6.5 … trockenen Torf" auch für Coco, alle Texte „CalMag + leichte
 * Bio-Heaven, kein Bio-Grow" auch bei CANNA oder ohne Plan, und „Nach 1–2 h den Topf wiegen" auch ohne
 * Waage und ohne Hebe-Test. Was „Tag 1" bedeutet (Keimung oder Einpflanzen), bleibt Patricks
 * Entscheidung und ist hier nicht berührt.
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
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

const LAGE = (key, medium, pot, mode) => `(function(){
  const plan = S.fertPlans.find(p => p.presetKey === '${key}');
  S.cycles = []; S.entries = {}; S.beginnerMode = true;
  const c = addCyc({ name: 'Tag1', seedType: 'auto', medium: '${medium}' });
  c.startDate = '2026-06-01'; c.startMethod = 'saturated'; c.potSize = ${pot}; c.weightMode = ${mode ? `'${mode}'` : 'undefined'};
  c.fertPlanId = plan.id; S._activePlanId = plan.id; syncActivePlanToGlobals(); saveS();
  const iso = c.startDate; const p = phase(iso, c); setDebugDate(iso);
  const soll = waterSuggestion(c, p, iso);
  const k = getTodayAction(c, p, getAction(iso, c), iso) || {};
  const tpl = getAutoFillTemplate(c, p, getAction(iso, c), iso) || {};
  const satz = plainSentence(getAction(iso, c), c, p, soll);
  openEntry(iso);
  const eintrag = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
  const d = getWeekDoses(c.id, fertPlanWeek(c, iso, p), c) || {};
  const namen = Object.keys(d).filter(x => d[x] > 0).map(x => (_produktFuer(c, x) || {}).name).filter(Boolean);
  return JSON.stringify({ a: getAction(iso, c), soll, schritte: (k.steps || []).join(' | '), wasserAuto: tpl.water, notiz: tpl.notePlaceholder || '',
    satz: satz.replace(/<[^>]+>/g, ''), kopf: (eintrag.match(/3 Etappen je[^]{0,160}/) || [''])[0], namen, ph: phTargetFor('${medium}') });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  for (const key of ['biobizz_light', 'canna_coco']) {
    E(`loadPreset('${key}')`); await warte(30); E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(60);
  }

  console.log('\nA - Erde 11 L, BioBizz Light, Hebe-Test');
  {
    const r = JSON.parse(E(LAGE('biobizz_light', 'erde', 11, 'lift')));
    console.log('    ' + r.soll + ' ml · ' + r.schritte);
    pruef('Prüflage: Tag 1 ist der Sättigungsguss', r.a === 'saettigung', r.a);
    pruef('Karte und Autofill nennen die gerechnete Menge', r.schritte.includes(`${r.soll} ml in 3 Etappen`) && r.wasserAuto === String(r.soll), r.schritte.split(' | ')[1] + ' / ' + r.wasserAuto);
    pruef('Die Mittel kommen aus dem Plan', r.namen.length > 0 && r.namen.every(n => r.schritte.includes(n)) && !/kein Bio-Grow/.test(r.schritte + r.satz), r.schritte.split(' | ')[0]);
    pruef('Einsteiger-Satz: pH ' + r.ph.label + ', nicht „6.3–6.5"', r.satz.includes('pH ' + r.ph.label) && !/6\.3–6\.5/.test(r.satz), r.satz.slice(0, 140));
    pruef('Hebe-Test: „anheben", nicht „wiegen"', /anheben/.test(r.schritte) && !/wiegen/.test(r.schritte + r.satz), r.schritte.split(' | ').pop());
  }

  console.log('\nB - Erde 7 L, Waage');
  {
    const r = JSON.parse(E(LAGE('biobizz_light', 'erde', 7, 'scale')));
    const etappe = Math.max(50, Math.round(r.soll / 3 / 50) * 50);
    console.log('    ' + r.soll + ' ml · Kopfzeile: „' + r.kopf + '"');
    pruef('Prüflage: der kleinere Topf braucht weniger als 700 ml', r.soll > 0 && r.soll < 700, r.soll);
    pruef('Karte und Autofill: ' + r.soll + ' ml statt 700', r.schritte.includes(`${r.soll} ml in 3 Etappen`) && r.wasserAuto === String(r.soll), r.schritte.split(' | ')[1] + ' / ' + r.wasserAuto);
    pruef('Kopfzeile im Eintrag: je ~' + etappe + ' ml', r.kopf.includes(`je ~${etappe} ml`) && !/je ~250 ml/.test(r.kopf), r.kopf);
    pruef('Waage: „wiegen"', /wiegen/.test(r.schritte) && /wiegen/.test(r.notiz), r.schritte.split(' | ').pop() + ' / ' + r.notiz);
  }

  console.log('\nC - Coco 11 L, CANNA Coco, keine Gewichts-Methode');
  {
    const r = JSON.parse(E(LAGE('canna_coco', 'coco', 11, null)));
    const alles = r.schritte + ' ' + r.satz + ' ' + r.kopf + ' ' + r.notiz;
    console.log('    ' + r.schritte.split(' | ')[0]);
    pruef('Keine BioBizz-Namen bei CANNA', !/Bio-Heaven|Bio-Grow|Bio·Heaven/.test(alles), alles.match(/[^|]{0,40}Bio[-·][A-Z][^|]{0,20}/));
    pruef('Die CANNA-Mittel stehen da', r.namen.length > 0 && r.namen.every(n => r.schritte.includes(n)), JSON.stringify(r.namen));
    pruef('Einsteiger-Satz: pH ' + r.ph.label + ', „Substrat" statt „Torf"', r.satz.includes('pH ' + r.ph.label) && !/Torf/.test(r.satz), r.satz.slice(0, 180));
    pruef('Ohne Gewichts-Methode kein „wiegen" und kein „anheben"', !/wiegen|anheben/.test(alles), alles.match(/[^.]{0,40}(wiegen|anheben)[^.]{0,20}/));
    pruef('Karte und Autofill nennen die gerechnete Menge', r.schritte.includes(`${r.soll} ml in 3 Etappen`) && r.wasserAuto === String(r.soll), r.soll + ' / ' + r.wasserAuto);
  }

  console.log('\nD - Die festen Tag-1-Angaben stehen nirgends mehr');
  {
    const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n')
      .map((z, i) => ({ nr: i + 1, z })).filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.z));
    ['700 * plants', 'CalMag + leichte Bio-Heaven', 'CalMag und etwas Bio-Heaven', 'je ~250 ml mit 15 min Pause', 'Kanäle in den trockenen Torf', 'pH 6.3–6.5'].forEach(alt => {
      const treffer = quelle.filter(x => x.z.includes(alt)).map(x => 'Zeile ' + x.nr);
      pruef('Nirgends: „' + alt + '"', treffer.length === 0, treffer.join(', '));
    });
  }

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
