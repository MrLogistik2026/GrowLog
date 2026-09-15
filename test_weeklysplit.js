/**
 * (v1.5.163) Wochendosis-Pläne (weekly-split) rechnen mit der Plan-Woche, nicht mit der Kalenderwoche.
 *
 * Zwei Befunde der Prüf-Agenten, gegengeprüft:
 *  1. weekGussCounts zählte die Tage (w−1)·7 … w·7, feedDayCompFactor bekam aber die gedehnte
 *     Plan-Woche. BioBizz Official, 105 Blütetage, Woche 3: Faktor 1,00 statt 1,33 — Kalenderwoche 3
 *     war noch Anzucht, Plan-Woche 3 schon Blüte. Bis 38 % daneben, in beide Richtungen.
 *  2. getWeekDoses wählte das Intervall mit `w <= 2 ? Anzucht : Blüte`. BioBizz Outdoor führt drei
 *     Anzucht-Wochen; Woche 3 wurde durch das Blüte-Intervall geteilt (bei 2/3 Tagen +50 % je Guss).
 *
 * Bewusst NICHT geändert: dass die Konzentration je Guss grundsätzlich vom Gießintervall abhängt — das
 * ist die Bauart von weekly-split und steht als Entscheidung in der Übergabe.
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

const ZYKLUS = (key, bloom, intA, intB) => `(function(){
  const plan = S.fertPlans.find(p => p.presetKey === '${key}');
  S.cycles = []; S.entries = {};
  const c = addCyc({ name: '${key}', seedType: 'auto', medium: 'erde' });
  c.startDate = '2026-03-01'; c.fertPlanId = plan.id; c.bloomDays = ${bloom}; c.anzuchtDays = 21;
  c.intAnzucht = ${intA}; c.intBloom = ${intB};
  S._activePlanId = plan.id; syncActivePlanToGlobals(); saveS();
  return c;
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  for (const key of ['biobizz_official']) {
    E(`loadPreset('${key}')`); await warte(30); E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(60);
  }

  console.log('\nA - BioBizz Official: die Gusszählung gehört zur Plan-Woche');
  for (const bloom of [42, 85, 105]) {
    const r = JSON.parse(E(`(function(){
      const c = ${ZYKLUS('biobizz_official', bloom, 3, 3)};
      const abw = [];
      for (let w = 1; w <= 9; w++) {
        let soll = 0;
        for (let d = 0; d < 200; d++) {
          const iso = isoPlus(c.startDate, d); const p = phase(iso, c); if (!p) continue;
          if (fertPlanWeek(c, iso, p) !== w) continue;
          const a = getAction(iso, c); if (a === 'giess' || a === 'giess_anz') soll++;
        }
        const ist = weekGussCounts(c, w).total;
        if (ist !== soll) abw.push('W' + w + ': ' + ist + ' statt ' + soll);
      }
      return JSON.stringify(abw);
    })()`));
    pruef(`${bloom} Blütetage: Güsse je Plan-Woche 1–9 stimmen`, r.length === 0, r.join(' · '));
  }

  // (v1.5.178) Bis hier prüfte B die BioBizz-Outdoor-Vorlage (drei Anzucht-Wochen). Sie ist entfernt; derselbe
  // Mechanismus — der Teiler folgt dem Rückgrat des Plans — wird an einer Official-Kopie mit drei Anzucht-Wochen geprüft.
  console.log('\nB - Plan mit drei Anzucht-Wochen: Woche 3 wird durch das Anzucht-Intervall geteilt');
  {
    const r = JSON.parse(E(`(function(){
      const plan = S.fertPlans.find(p => p.presetKey === 'biobizz_official');
      plan.weekPhases = plan.weekPhases.slice(); plan.weekPhases[2] = 'anzucht';
      const dosis = (intB, w) => { const c = ${ZYKLUS('biobizz_official', 63, 2, '__B__')}; return getWeekDoses(c.id, w, c); };
      const s3 = plan.schedule.w3 || {};
      const fish = plan.products.find(p => (s3[p.id] || 0) > 0) || plan.products[0];
      const bloomWoche = plan.weekPhases.findIndex(ph => ph === 'bloom') + 2;
      const sb = plan.schedule['w' + bloomWoche] || {};
      const pidB = Object.keys(sb).find(k => sb[k] > 0);
      return JSON.stringify({ phase3: plan.weekPhases[2], name: fish.name, roh3: (plan.schedule.w3 || {})[fish.id],
        w3_b3: dosis(3, 3)[fish.id], w3_b5: dosis(5, 3)[fish.id], bw: bloomWoche, wb_b3: dosis(3, bloomWoche)[pidB], wb_b5: dosis(5, bloomWoche)[pidB] });
    })()`.replace(/__B__/g, 'intB')));
    console.log(`    ${r.name}: Woche 3 (${r.phase3}) roh ${r.roh3} → bei Blüte-Intervall 3: ${r.w3_b3}, bei 5: ${r.w3_b5} · Woche ${r.bw} (Blüte): ${r.wb_b3} / ${r.wb_b5}`);
    pruef('Prüflage: Woche 3 ist laut Plan Anzucht', r.phase3 === 'anzucht', r.phase3);
    pruef('Woche 3 hängt nicht am Blüte-Intervall', r.w3_b3 === r.w3_b5 && r.w3_b3 > 0, r.w3_b3 + ' / ' + r.w3_b5);
    pruef('… und ist durch das Anzucht-Intervall geteilt (roh × 2/7)', Math.abs(r.w3_b3 - Math.round(r.roh3 / (7 / 2) * 100) / 100) < 0.011, r.w3_b3 + ' statt ' + (Math.round(r.roh3 / (7 / 2) * 100) / 100));
    pruef('Gegenprobe: eine Blüte-Woche hängt am Blüte-Intervall', r.wb_b3 !== r.wb_b5, r.wb_b3 + ' / ' + r.wb_b5);
  }

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
