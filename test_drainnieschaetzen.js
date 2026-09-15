/**
 * (v1.5.177) Ein Drain wird nie geschätzt — und ein eingetragener Drain zählt immer.
 *
 * Patrick am 15.09.2026: „Wenn ich den Drain nicht eingegeben habe, können wir diesen nicht automatisch ausfüllen
 * lassen. Die Werte sind zu wichtig, um diese zu schätzen. Am Drain sieht man sofort, ob die Salzkonzentration
 * erhöht ist."
 *
 * Geprüft wird beides:
 *  1. Kein Weg der App füllt Drain-Menge, Drain-pH oder Drain-EC aus — weder „Tag automatisch ausfüllen" noch
 *     „Erledigt". Das Drain-Feld zeigt als Platzhalter das Ziel (15–20 % der Gießmenge), keinen Schätzwert.
 *  2. Ein vom User eingetragener Drain zählt für die Gießmenge auch dann, wenn die Gießmenge selbst per „Erledigt"
 *     übernommen wurde. Bis v1.5.176 übersprang drainAdjust solche Einträge — der Regelkreis aus v1.5.112 lief
 *     damit ausgerechnet für den nie, der der App folgt.
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
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

const T104 = '2026-08-27';   // Tag 104: Düngerguss, 9000 ml, Blüte
const T107 = '2026-08-30';   // Tag 107: erster Spülgang
const DRAIN = ['drainMl', 'runoffPh', 'runoffEc'];

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`setDebugDate('${T104}')`);

  console.log('\nA - Die App füllt nie einen Drain aus');
  {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0];
      const keys = (iso) => Object.keys(getAutoFillTemplate(c, phase(iso, c), getAction(iso, c), iso) || {});
      return JSON.stringify({ guss: keys('${T104}'), spuelen: keys('${T107}') }); })()`));
    const drin = [...r.guss, ...r.spuelen].filter(k => DRAIN.includes(k));
    pruef('„Tag automatisch ausfüllen": die Vorlage kennt keine Drain-Felder (Guss und Spülen)', drin.length === 0, drin.join(', '));

    const erledigt = JSON.parse(E(`(function(){ const c = S.cycles[0];
      delete S.entries['${T104}'].cycleData[c.id];
      markTodayDone(c.id, '${T104}');
      const cd = S.entries['${T104}'].cycleData[c.id];
      return JSON.stringify({ water: cd.water, drain: ${JSON.stringify(DRAIN)}.filter(k => cd[k] != null && cd[k] !== '') }); })()`));
    pruef('„Erledigt": Gießmenge vorgeschlagen, Drain bleibt leer', !!erledigt.water && erledigt.drain.length === 0, JSON.stringify(erledigt));

    E(`S.beginnerMode = false; openEntry('${T104}')`);
    await warte(150);
    const wk = E(`fertPlanWeek(S.cycles[0], '${T104}', phase('${T104}', S.cycles[0]))`);
    await E(`applyRecommended(S.cycles[0].id, ${wk})`);
    await warte(150);
    const nachAuto = JSON.parse(E(`(function(){ const cd = S.entries['${T104}'].cycleData[S.cycles[0].id];
      return JSON.stringify(${JSON.stringify(DRAIN)}.filter(k => cd[k] != null && cd[k] !== '')); })()`));
    pruef('„Empfehlung übernehmen": Drain bleibt leer', nachAuto.length === 0, nachAuto.join(', '));
  }

  console.log('\nB - Ein eingetragener Drain zählt auch bei übernommener Gießmenge');
  {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0];
      const cd = S.entries['${T104}'].cycleData[c.id];
      cd.water = '9000'; cd._suggested = { water: true }; cd.drainMl = '450';
      return JSON.stringify(drainAdjust(c, '${T104}')); })()`));
    pruef('Gießmenge per „Erledigt", 450 ml Drain (5 %): die Menge geht hoch (Faktor 1,152)', !!r && r.richtung === 'mehr' && Math.abs(r.faktor - 1.1515) < 0.001, JSON.stringify(r));
  }

  console.log('\nC - Das Drain-Feld zeigt keinen Schätzwert, der Hinweis darunter das Ziel');
  {
    E(`(function(){ const cd = S.entries['${T104}'].cycleData[S.cycles[0].id]; delete cd.drainMl; cd.water = '9000'; openEntry('${T104}'); })()`);
    await warte(150);
    const r = JSON.parse(E(`(function(){ const f = document.getElementById('runoff-ml-' + S.cycles[0].id);
      const t = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
      return JSON.stringify({ ph: f ? f.getAttribute('placeholder') : '(kein Feld)', hinweis: (t.match(/Auffangen, messen[^.]*\\.[^.]*\\./) || [''])[0] }); })()`));
    const soll = E(`Math.round(9000 * DRAIN_ZIEL.min / 100) + '–' + Math.round(9000 * DRAIN_ZIEL.max / 100)`);
    pruef('Platzhalter ohne Zahl (das schmale Feld schnitt „1350–1800" ab, eine Zahl sähe wie ein Wert aus)', !/\d/.test(r.ph), r.ph);
    pruef(`Hinweis nennt das Ziel: 15–20 %, bei 9000 ml also ${soll} ml, und dass Drain-pH/-EC erst ab 15 % etwas sagen`,
      r.hinweis.includes('15–20 %') && r.hinweis.includes(soll + ' ml') && /ab 15 %/.test(r.hinweis) && !/Fünftel/.test(r.hinweis), r.hinweis);
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
