/**
 * (v1.5.98) Sichert die Sortendauer-Angaben ab.
 *
 * Der Fehler: In `STRAINS` standen bei allen Automatics Zuechter-Bestwerte. Bei Sensi
 * Amnesia XXL waren es 75 Tage; Patricks Pflanze brauchte 116, der App-eigene Duengeplan
 * fuer dieselbe Sorte rechnet mit 17 Wochen. Wer den Chip antippte, bekam eine Ernte
 * 40 Tage zu frueh geplant. Dazu nannten drei Anzeigestellen dieselbe Zahl falsch:
 * Bei Autos zaehlt sie ab KEIMUNG, hiess aber "Bluete".
 *
 * Geprueft wird beides: die Rechnung (kommt ein realistischer Erntetag heraus?) und die
 * Beschriftung (steht ueberall dasselbe, und wird Ungeprueftes als solches gekennzeichnet?).
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
  else { fail++; console.log('  FEHL ' + name + (info ? '  -> ' + info : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  // ---- A: Der belegte Wert steht drin ----
  console.log('');
  console.log('A - Sensi Amnesia XXL traegt die belegte Spanne');
  {
    const d = JSON.parse(E(`JSON.stringify(strainDays(STRAINS.find(s=>s.name==='Sensi Amnesia XXL Auto')))`));
    pruef('Spanne ist als geprueft markiert', d.geprueft === true);
    pruef('Unteres Ende 105 Tage', d.lo === 105, 'lo=' + d.lo);
    pruef('Oberes Ende 120 Tage', d.hi === 120, 'hi=' + d.hi);
    pruef('Geplant wird mit dem OBEREN Ende', d.plan === d.hi, 'plan=' + d.plan);
    pruef('Zaehlt ab Keimung, nicht ab Bluete', d.was === 'bis Ernte' && /Keimung/.test(d.langform));
  }

  // ---- B: Die Rechnung kommt bei einem realistischen Erntetag heraus ----
  console.log('');
  console.log('B - Chip antippen plant keine 40 Tage zu frueh mehr');
  {
    const ernte = E(`(function(){
      const s = STRAINS.find(x=>x.name==='Sensi Amnesia XXL Auto');
      const hint = strainDays(s).plan;
      const over = PHASE_DEFAULTS.anzuchtDays + PHASE_DEFAULTS.flushDays + PHASE_DEFAULTS.iceDays;
      const bd = Math.max(21, hint - over);
      return PHASE_DEFAULTS.anzuchtDays + bd + PHASE_DEFAULTS.flushDays + PHASE_DEFAULTS.iceDays + 1;
    })()`);
    pruef('Erntetag liegt nicht mehr bei 76', ernte !== 76, 'ernte=' + ernte);
    pruef('Erntetag liegt bei mindestens 110', ernte >= 110, 'ernte=' + ernte);
    pruef('Erntetag liegt nicht ueber 130 (nicht ins Gegenteil gekippt)', ernte <= 130, 'ernte=' + ernte);
    pruef('Konservativ: nicht frueher als Patricks echte 116', ernte >= 116, 'ernte=' + ernte);
  }

  // ---- C: Ungeprueftes bleibt ungeprueft und wird gekennzeichnet ----
  console.log('');
  console.log('C - Zuechter-Werte werden als solche ausgewiesen');
  {
    const nl = JSON.parse(E(`JSON.stringify(strainDays(STRAINS.find(s=>s.name==='Northern Lights Auto')))`));
    pruef('Northern Lights hat (noch) keine Spanne', nl.geprueft === false);
    pruef('Ohne Spanne faellt lo auf den Einzelwert zurueck', nl.lo === nl.hi);
    const info = E(`_strainInfoHTML('Northern Lights Auto','indoor')`);
    pruef('Steckbrief kennzeichnet die Zuechter-Angabe', /Züchter-Angabe/.test(info));
    pruef('Steckbrief raet zur Wochen-Angabe von der Tuete', /Samentüte/.test(info));
    const infoS = E(`_strainInfoHTML('Sensi Amnesia XXL Auto','indoor')`);
    pruef('Geprueft: kein Zuechter-Hinweis', !/Züchter-Angabe/.test(infoS));
    pruef('Geprueft: nennt das obere Ende als Planungsgrundlage', /Geplant wird mit 120 Tagen/.test(infoS));
    pruef('Geprueft: zeigt die Spanne', /105–120 Tage/.test(infoS));
  }

  // ---- D: Beschriftung stimmt ueberall ----
  console.log('');
  console.log('D - Keine Anzeigestelle nennt den Gesamt-Zyklus mehr "Bluete"');
  {
    const info = E(`_strainInfoHTML('Sensi Amnesia XXL Auto','indoor')`);
    pruef('Auto-Steckbrief sagt "Reife", nicht "Blütephase"', /Reife:/.test(info) && !/Blütephase/.test(info));

    const fem = E(`_strainInfoHTML('Amnesia Haze','indoor')`);
    pruef('Photoperiode sagt weiterhin "Blütephase"', /Blütephase/.test(fem));

    // Suchliste
    const liste = E(`(function(){
      const s = STRAINS.find(x=>x.name==='Sensi Amnesia XXL Auto');
      const d = strainDays(s);
      return (d.geprueft ? d.lo+'–'+d.hi : '~'+d.hi) + ' d ' + d.was;
    })()`);
    pruef('Suchlisten-Beschriftung nennt "bis Ernte"', /bis Ernte/.test(liste), liste);
    pruef('Suchlisten-Beschriftung nennt die Spanne', /105–120/.test(liste), liste);
  }

  // ---- E: Photoperioden wurden nicht angefasst ----
  console.log('');
  console.log('E - Photoperiodische Sorten bleiben unveraendert');
  {
    const werte = JSON.parse(E(`JSON.stringify(STRAINS.filter(s=>s.type!=='auto').map(s=>({n:s.name,f:s.flowering})))`));
    pruef('Northern Lights weiterhin 56 Tage Bluete',
      werte.find(x => x.n === 'Northern Lights').f === 56);
    pruef('Amnesia Haze weiterhin 77 Tage Bluete',
      werte.find(x => x.n === 'Amnesia Haze').f === 77);
    pruef('Haze weiterhin 84 Tage Bluete', werte.find(x => x.n === 'Haze').f === 84);
    const ohneSpanne = JSON.parse(E(`JSON.stringify(STRAINS.filter(s=>s.type!=='auto' && (s.floweringLo!==undefined||s.floweringHi!==undefined)).map(s=>s.name))`));
    pruef('Keine Photoperiode hat eine Auto-Spanne bekommen', ohneSpanne.length === 0, ohneSpanne.join(', '));
  }

  // ---- F: Jede Sorte liefert ueberhaupt eine brauchbare Zahl ----
  console.log('');
  console.log('F - Keine Sorte ohne verwertbare Angabe');
  {
    const kaputt = JSON.parse(E(`JSON.stringify(STRAINS.filter(s=>{
      const d = strainDays(s);
      return !d || !isFinite(d.lo) || !isFinite(d.hi) || !isFinite(d.plan) || d.lo > d.hi || d.plan <= 0;
    }).map(s=>s.name))`));
    pruef('Alle Sorten liefern eine gueltige Spanne', kaputt.length === 0, kaputt.join(', '));
    const anzahl = E('STRAINS.length');
    pruef('Sortenliste ist vollstaendig geblieben', anzahl > 30, 'Sorten=' + anzahl);
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
