/**
 * (v1.5.100) Sichert ab, dass die Duenger-Dosen aus dem Plan DES ZYKLUS kommen.
 *
 * Der Fehler: `getWeekDoses` las die Dosen aus dem globalen `S.weekSchedule` und den
 * `doseMode` aus `getActivePlan()` - beides also aus dem GLOBAL aktiven Plan.
 * `switchFertPlan()` setzt diesen Plan aber schon dann um, wenn man im Duenger-Bildschirm
 * einen anderen Plan nur ANSIEHT; `c.fertPlanId` bleibt dabei unberuehrt.
 *
 * Folge: Wer zwei Plaene hatte, bekam im Tageseintrag die Produkte und Mengen des falschen
 * Plans. Bei Patricks Daten waeren das statt sechs BioBizz-Produkten neun Sensi-Produkte
 * gewesen, darunter POWHUMUS mit 10 ml/L, das in seinem laufenden Plan gar nicht vorkommt.
 * Bei unterschiedlichem doseMode kam zusaetzlich der Faktor 7/Intervall daneben.
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

async function load(mut) {
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
      const st = JSON.parse(BACKUP);
      if (mut) mut(st);
      w.localStorage.setItem('growsmart_v4', JSON.stringify(st));
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
  else { fail++; console.log('  FEHL ' + name + (info ? '  -> ' + info : '')); }
}

// Legt einen zweiten Zyklus an, der auf den Sensi-Plan zeigt, und misst dessen
// Wochendosen einmal mit dem einen und einmal mit dem anderen GLOBAL aktiven Plan.
const AUFBAU = `(function(){
  const sensi = S.fertPlans.find(p => p.presetKey === 'sensi_amnesia_auto');
  const bio   = S.fertPlans.find(p => p.presetKey === 'biobizz_official');
  if (!sensi || !bio) return JSON.stringify({ fehlt: true });
  const zwei = JSON.parse(JSON.stringify(S.cycles[0]));
  zwei.id = 'testzyklus_2';
  zwei.fertPlanId = sensi.id;
  S.cycles.push(zwei);
  const namen = {};
  (S.fertPlans||[]).forEach(pl => (pl.products||[]).forEach(pr => { namen[pr.id] = pr.name; }));
  const lesbar = (d) => { const l = {}; Object.entries(d||{}).forEach(([pid,v]) => { l[namen[pid]||pid] = v; }); return l; };
  const messen = (globalId, cyc) => {
    S._activePlanId = globalId;
    if (typeof syncActivePlanToGlobals === 'function') syncActivePlanToGlobals();
    return lesbar(getWeekDoses(cyc.id, 6, cyc));
  };
  const zweiMitSensiGlobal = messen(sensi.id, zwei);
  const zweiMitBioGlobal   = messen(bio.id, zwei);
  const echtMitBioGlobal   = messen(bio.id, S.cycles[0]);
  const echtMitSensiGlobal = messen(sensi.id, S.cycles[0]);
  S.cycles = S.cycles.filter(x => x.id !== 'testzyklus_2');
  return JSON.stringify({ zweiMitSensiGlobal, zweiMitBioGlobal, echtMitBioGlobal, echtMitSensiGlobal });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  console.log('');
  console.log('A - Ausgangslage: zwei Plaene mit unterschiedlichem doseMode');
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  pruef('Sensi-Plan ist per-watering',
    E("getPreset('sensi_amnesia_auto').doseMode") === 'per-watering');
  pruef('BioBizz-Plan ist weekly-split',
    E("getPreset('biobizz_official').doseMode") === 'weekly-split');
  pruef('Patricks Zyklus zeigt auf BioBizz',
    E("(getPlanForCycle(S.cycles.find(c=>c.active))||{}).presetKey") === 'biobizz_official');

  const r = JSON.parse(E(AUFBAU));
  pruef('Testaufbau steht', !r.fehlt);

  console.log('');
  console.log('B - Der Zyklus behaelt seine Dosen, egal welcher Plan global aktiv ist');
  {
    const a = JSON.stringify(r.zweiMitSensiGlobal);
    const b = JSON.stringify(r.zweiMitBioGlobal);
    pruef('Zweiter Zyklus liefert beide Male dasselbe', a === b,
      'Sensi-global: ' + a.slice(0, 90) + ' | BioBizz-global: ' + b.slice(0, 90));
    pruef('Es sind die Produkte SEINES Plans (POWHUMUS gehoert zu Sensi)',
      Object.prototype.hasOwnProperty.call(r.zweiMitBioGlobal, 'POWHUMUS'),
      Object.keys(r.zweiMitBioGlobal).join(', '));
    pruef('Kein Fremdprodukt aus dem BioBizz-Plan (Top·Max)',
      !Object.prototype.hasOwnProperty.call(r.zweiMitBioGlobal, 'Top·Max'),
      Object.keys(r.zweiMitBioGlobal).join(', '));
  }

  console.log('');
  console.log('C - Der echte Zyklus bleibt bei seinem BioBizz-Plan');
  {
    const a = JSON.stringify(r.echtMitBioGlobal);
    const b = JSON.stringify(r.echtMitSensiGlobal);
    pruef('Echter Zyklus liefert beide Male dasselbe', a === b,
      'BioBizz-global: ' + a.slice(0, 90) + ' | Sensi-global: ' + b.slice(0, 90));
    pruef('Es sind BioBizz-Produkte (Top·Max)',
      Object.prototype.hasOwnProperty.call(r.echtMitBioGlobal, 'Top·Max'),
      Object.keys(r.echtMitBioGlobal).join(', '));
    pruef('Kein POWHUMUS aus dem Sensi-Plan',
      !Object.prototype.hasOwnProperty.call(r.echtMitBioGlobal, 'POWHUMUS'),
      Object.keys(r.echtMitBioGlobal).join(', '));
  }

  console.log('');
  console.log('D - Der weekly-split-Teiler bleibt korrekt');
  {
    // BioBizz ist weekly-split: die Wochendosis wird durch die Guesse pro Woche geteilt.
    const roh = E("JSON.stringify((getPlanForCycle(S.cycles.find(c=>c.active)).schedule||{}).w6 || {})");
    const doses = E("JSON.stringify(getWeekDoses(S.cycles.find(c=>c.active).id, 6, S.cycles.find(c=>c.active)))");
    const rohO = JSON.parse(roh), dosO = JSON.parse(doses);
    const iv = E("S.cycles.find(c=>c.active).intBloom || 3");
    const proWoche = 7 / iv;
    const pid = Object.keys(rohO)[0];
    pruef('Wochenplan fuer Woche 6 ist nicht leer', pid !== undefined, 'keys=' + Object.keys(rohO).join(','));
    if (pid !== undefined) {
      const erwartet = Math.round((rohO[pid] / proWoche) * 100) / 100;
      // Die Feed-Tag-Kompensation kann zusaetzlich anheben - deshalb >= statt ==
      pruef('Tagesdosis ist kleiner als die Wochendosis', dosO[pid] < rohO[pid],
        'woche=' + rohO[pid] + ' tag=' + dosO[pid]);
      pruef('Tagesdosis liegt in der Groessenordnung Wochendosis/' + proWoche.toFixed(2),
        dosO[pid] >= erwartet * 0.95 && dosO[pid] <= erwartet * 2.5,
        'erwartet ~' + erwartet + ', bekommen ' + dosO[pid]);
    }
  }

  console.log('');
  console.log('E - Zyklus ohne eigenen Plan faellt sauber zurueck');
  {
    const { E: E2 } = await load((st) => {
      const c = st.cycles.find((x) => x.active);
      delete c.fertPlanId;
    });
    let abgestuerzt = false, d = null;
    try { d = E2("JSON.stringify(getWeekDoses(S.cycles.find(c=>c.active).id, 6, S.cycles.find(c=>c.active)))"); }
    catch (e) { abgestuerzt = true; }
    pruef('Kein Absturz ohne fertPlanId', !abgestuerzt);
    pruef('Liefert ein Objekt', d !== null && typeof JSON.parse(d) === 'object');
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
