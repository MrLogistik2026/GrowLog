/**
 * (v1.5.178) Die BioBizz-Outdoor-Vorlage ist entfernt — ohne dass ein laufender Zyklus seinen Plan verliert.
 *
 * Patrick am 15.09.2026: „Den Outdoorplan würde ich erst mal rausnehmen, bis wir einen richtigen Outdoorbereich in der
 * App einbauen. Bis dahin konzentrieren wir uns auf Indoor."
 *
 * Geprüft wird: Die Vorlage ist weg (Vorlagen-Liste, Assistent, Dünger-Bildschirm). Eine gespeicherte Kopie, an der ein
 * Zyklus hängt, bleibt und rechnet unverändert mit der Wochendosis — sie bekommt den Dosis-Modus eingestempelt, der
 * bisher aus der Vorlage kam. Eine unbenutzte Kopie verschwindet. Das Aufräumen der Sensi-Pläne (v1.5.133/135) läuft
 * über dieselbe neue Funktion und verhält sich wie vorher.
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

const RUECKGRAT = ['anzucht', 'anzucht', 'anzucht', 'bloom', 'bloom', 'bloom', 'bloom', 'bloom', 'bloom', 'bloom', 'flush', 'ice'];

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
      const st = JSON.parse(BACKUP);
      // Eine Outdoor-Kopie mit Zyklus, eine ohne, dazu eine unbenutzte Sensi-Kopie
      const kopie = (id) => ({ id, name: 'BioBizz Outdoor', presetKey: 'biobizz_outdoor', createdAt: 1, mixOrder: [], mixInfo: '', drainInfo: null,
        products: [{ id: id + '_p1', name: 'Bio·Grow', unit: 'ml/L', color: '#4caf70' }], schedule: { w5: { [id + '_p1']: 4 } }, weekPhases: RUECKGRAT.slice() });
      st.fertPlans.push(kopie('fp_out_benutzt'), kopie('fp_out_frei'));
      st.fertPlans.push({ id: 'fp_sensi_frei', name: 'Sensi Amnesia XXL Auto (Test)', presetKey: 'sensi_amnesia_auto', createdAt: 1, products: [{ id: 'ps_x', name: 'X', unit: 'ml/L' }], schedule: {} });
      const zyk = JSON.parse(JSON.stringify(st.cycles[0]));
      Object.assign(zyk, { id: 'zyk_out', name: 'Draußen', fertPlanId: 'fp_out_benutzt', active: false, intBloom: 3, useWaterDays: false });
      delete zyk.gussPlan;
      st.cycles.push(zyk);
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
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  console.log('\nA - Die Vorlage ist weg');
  {
    pruef('FERT_PRESETS kennt keine BioBizz-Outdoor-Vorlage mehr', E(`typeof FERT_PRESETS.biobizz_outdoor`) === 'undefined');
    const wiz = E(`_wizStepFertPlan({ growType: 'outdoor', medium: 'erde', seedType: 'auto' })`);
    pruef('Assistent (draußen): keine Outdoor-Vorlage im Angebot', !/biobizz_outdoor|Fish·Mix in Vegi/.test(wiz), (wiz.match(/.{0,60}(biobizz_outdoor|Fish·Mix in Vegi).{0,40}/) || [''])[0]);
    const dueng = E(`(function(){ goTo('duenger'); renderDuenger(); return document.getElementById('scr-duenger').innerHTML; })()`);
    pruef('Dünger-Bildschirm: kein „Vorlage laden" für BioBizz Outdoor', !/loadPreset\('biobizz_outdoor'\)/.test(dueng));
  }

  console.log('\nB - Gespeicherte Kopien');
  {
    const r = JSON.parse(E(`(function(){
      const p = S.fertPlans.find(x => x.id === 'fp_out_benutzt');
      const c = S.cycles.find(x => x.id === 'zyk_out');
      const d = (p && c) ? getWeekDoses(c.id, 5, c) : {};
      return JSON.stringify({ da: !!p, modus: p && p.doseMode, dosis: d['fp_out_benutzt_p1'], frei: !!S.fertPlans.find(x => x.id === 'fp_out_frei'),
        sensiFrei: !!S.fertPlans.find(x => x.id === 'fp_sensi_frei'), v347: !!S.fertPlans.find(x => /V3\\.4\\.7/.test(x.name || '')) });
    })()`));
    pruef('Kopie mit Zyklus bleibt und behält den Modus „Wochendosis"', r.da && r.modus === 'weekly-split', JSON.stringify(r));
    pruef('… und rechnet unverändert: 4 ml/L Wochendosis bei Intervall 3 → 1,71 je Guss', r.dosis === 1.71, 'Dosis ' + r.dosis);
    pruef('Unbenutzte Outdoor-Kopie ist entfernt', !r.frei, JSON.stringify(r));
    pruef('Sensi-Aufräumen wie vorher: unbenutzte Sensi-Kopie weg', !r.sensiFrei, JSON.stringify(r));
    pruef('… Patricks V3.4.7 (steckt in seinen Einträgen) bleibt', r.v347, JSON.stringify(r));
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
