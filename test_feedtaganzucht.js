/**
 * (v1.5.170) Der Feed-Tag-Ausgleich hebt in der Anzucht die Dosis nicht mehr an.
 *
 * feedDayCompFactor hebt an Düngergüssen die Dosis an, wenn es in der Woche Wasser-Tage gibt, damit die
 * Wochenmenge gleich bleibt. Sein Kommentar schliesst die Anzucht seit v1.1.90 ausdruecklich aus — geprueft
 * wurde aber nur die Wochennummer (1–9). Mit Patricks Zyklus (Wasser-Tage aus seinen Eintraegen) gemessen:
 * BioBizz Official Woche 2 ×1,333, BioBizz Outdoor Woche 3 ×1,467, BioBizz Light Woche 3 ×1,5 — alle drei
 * laut Plan Anzucht. Ein Saemling reagiert auf Konzentration am empfindlichsten (ANBAU.md 13.2).
 * Ein frischer Zyklus zeigt den Fehler nicht, weil dort in der Anzucht keine Wasser-Tage liegen.
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

// Kopie von Patricks Zyklus auf den Plan der Vorlage; w = Plan-Woche
const MISS = (key, anzW, bluW) => `(function(){
  const plan = S.fertPlans.find(p => p.presetKey === '${key}' && p.weekPhases);
  const c = JSON.parse(JSON.stringify(S.cycles[0])); c.id = 'kopie_${key}'; c.fertPlanId = plan.id;
  S.cycles.push(c);
  const pre = getPreset('${key}');
  const gA = weekGussCounts(c, ${anzW}), gB = weekGussCounts(c, ${bluW});
  const r = { phA: plan.weekPhases[${anzW} - 1], phB: plan.weekPhases[${bluW} - 1],
    gA: gA.feed + '/' + gA.total, gB: gB.feed + '/' + gB.total, wasserA: gA.feed < gA.total, wasserB: gB.feed < gB.total,
    fA: feedDayCompFactor(c, ${anzW}, pre), fB: feedDayCompFactor(c, ${bluW}, pre) };
  // Dosis in der Anzucht-Woche: aus dem Plan selbst gelesen (Plan nicht aktiv schalten)
  const aktiv = S._activePlanId; S._activePlanId = 'keiner';
  const roh = plan.schedule['w${anzW}'] || {};
  const pid = Object.keys(roh).find(k => roh[k] > 0);
  const d = getWeekDoses(c.id, ${anzW}, c) || {};
  S._activePlanId = aktiv;
  r.modus = pre.doseMode; r.roh = roh[pid]; r.dosis = d[pid]; r.intA = c.intAnzucht || RI.anzucht;
  S.cycles = S.cycles.filter(x => x.id !== c.id);
  return JSON.stringify(r);
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`setDebugDate('2026-09-15')`);
  for (const key of ['biobizz_official', 'biobizz_master', 'biobizz_light']) {
    E(`loadPreset('${key}')`); await warte(30);
    E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(60);
    E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(60);
  }

  for (const [key, anzW, bluW] of [['biobizz_official', 2, 3], ['biobizz_master', 3, 4], ['biobizz_light', 3, 4]]) {
    console.log(`\n${key}: Anzucht-Woche ${anzW}, Blüte-Woche ${bluW}`);
    const r = JSON.parse(E(MISS(key, anzW, bluW)));
    console.log(`    Anzucht ${r.gA} Düngergüsse f=${r.fA} · Blüte ${r.gB} f=${r.fB} · Dosis ${r.roh} → ${r.dosis} (${r.modus})`);
    pruef(`Prüflage: Woche ${anzW} ist Anzucht und hat einen Wasser-Tag (${r.gA})`, r.phA === 'anzucht' && r.wasserA, r.phA + ' ' + r.gA);
    pruef(`Woche ${anzW} (Anzucht): kein Ausgleich, Faktor 1`, r.fA === 1, 'f=' + r.fA);
    pruef(`Gegenprobe Woche ${bluW} (Blüte, ${r.gB}): der Ausgleich bleibt`, r.phB === 'bloom' && r.wasserB && r.fB > 1, r.phB + ' f=' + r.fB);
    if (key === 'biobizz_light') {
      pruef('Light (Dosis je Guss): Anzucht-Dosis ist die Plandosis', r.dosis === r.roh, r.roh + ' → ' + r.dosis);
    }
    // (v1.5.178) Die Outdoor-Vorlage ist entfernt; die Wochendosis prüft jetzt Official (Woche 2 ist Anzucht).
    if (key === 'biobizz_official') {
      // (v1.5.237) Der Teiler sind die echten Güsse der PLAN-Woche statt `7 / Intervall` — die
      // Kalenderwoche stimmte fast nie (Plan-Wochen sind gemessen 5 bis 14 Tage lang). Geteilt wird
      // hier durch `total`, nicht durch `feed`: In der Anzucht bleibt der Wasser-Tag-Ausgleich
      // bewusst aus (v1.5.170), die Wochenmenge verteilt sich also auf ALLE Güsse der Woche.
      // Damit ist die Dosis sogar niedriger als vorher — die sichere Richtung (ANBAU.md 15).
      const totalA = parseInt(String(r.gA).split('/')[1], 10);
      const soll = Math.round(r.roh / totalA * 100) / 100;
      pruef(`Official (Wochendosis): Anzucht-Dosis nur geteilt, nicht angehoben (${soll} bei ${r.gA} Güssen)`,
        r.dosis === soll, r.roh + ' → ' + r.dosis + ' statt ' + soll);
      pruef('… und damit niedriger als mit Ausgleich (der hier bewusst ausbleibt)',
        r.dosis <= Math.round(r.roh / parseInt(String(r.gA).split('/')[0], 10) * 100) / 100 + 0.0001,
        r.dosis + ' gegen ' + Math.round(r.roh / parseInt(String(r.gA).split('/')[0], 10) * 100) / 100);
    }
  }

  console.log('\nQuelltext');
  {
    const src = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    const kopie = /_phW \? _phW === 'anzucht' : w <= 2/.test(src);
    const nutzer = (src.match(/_planWocheIstAnzucht\(/g) || []).length;
    pruef('Eine Quelle für „Plan-Woche ist Anzucht" (Teiler und Ausgleich)', !kopie && nutzer >= 3, 'Kopie=' + kopie + ' Aufrufe=' + nutzer);
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
