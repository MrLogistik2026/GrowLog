/**
 * (v1.5.179) Die Wochenfrage kommt nur, wenn Blüte ist.
 *
 * Befund der ersten Prüfrunde (E7), gegengeprüft: _planWeekQuestion fragte bei jedem Plan-Wochenwechsel „Woche N ist
 * durch. Weiter zu Woche N+1? … Werden die Blüten noch sichtbar dicker und sind die Blätter noch satt grün" — bei
 * Automatics schon an Tag 9 in der Anzucht, samt Angebot, Plan und Ernte zu verschieben. Ein Anfänger soll dort ein
 * Merkmal beurteilen, das es an der Pflanze noch gar nicht gibt. Jetzt wird nur gefragt, wenn die alte und die neue
 * Plan-Woche Blüte sind.
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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler (leerer Speicher)', errors.length === 0, errors[0]);
  E(`loadPreset('biobizz_light')`); await warte(30);
  E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(60);

  // Frage am ersten Tag der Plan-Woche wk
  const frage = (wk) => JSON.parse(E(`(function(){
    const plan = S.fertPlans.find(p => p.presetKey === 'biobizz_light');
    S.cycles = []; S.entries = {};
    const c = addCyc({ name: 'Auto', seedType: 'auto', medium: 'erde' });
    c.startDate = '2026-03-01'; c.fertPlanId = plan.id; c.bloomDays = 63; c.anzuchtDays = 21;
    S._activePlanId = plan.id; syncActivePlanToGlobals(); saveS();
    const b = planWeekBounds(c);
    const iso = isoPlus(c.startDate, b[${wk} - 2]);
    setDebugDate(iso);
    const html = _planWeekQuestion(c, iso) || '';
    return JSON.stringify({ tag: isoDiff(iso, c.startDate) + 1, woche: fertPlanWeek(c, iso, phase(iso, c)), alt: plan.weekPhases[${wk} - 2], neu: plan.weekPhases[${wk} - 1],
      frage: /ist durch\\. Weiter zu Woche/.test(html), bluete: /Blüten noch sichtbar dicker/.test(html), knoepfe: /holdPlanWeek|confirmPlanWeek/.test(html),
      text: html.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').slice(0, 110) });
  })()`));

  console.log('\nA - BioBizz Light, Automatic, 63 Blütetage');
  const zeig = (r) => `Tag ${r.tag}, Plan-Woche ${r.woche} (${r.alt} → ${r.neu}): ${r.text ? '„' + r.text.trim() + '"' : 'keine Karte'}`;
  const ohneFrage = (r) => !r.frage && !r.bluete && !r.knoepfe;
  const w2 = frage(2), w3 = frage(3), w4 = frage(4), w5 = frage(5), w11 = frage(11);
  pruef('Woche 2 (Anzucht): keine Blüten-Frage, kein Verschieben', w2.woche === 2 && ohneFrage(w2), zeig(w2));
  pruef('Woche 3 (Anzucht): keine Blüten-Frage, kein Verschieben', w3.woche === 3 && ohneFrage(w3), zeig(w3));
  pruef('Woche 4 (Übergang in die Blüte): keine Frage — es gibt noch nichts, das dicker werden könnte', w4.woche === 4 && ohneFrage(w4), zeig(w4));
  pruef('Gegenprobe Woche 5 (Blüte → Blüte): die Frage kommt, mit Weiter und Dranbleiben', w5.woche === 5 && w5.frage && w5.bluete && w5.knoepfe, zeig(w5));
  pruef('Woche 11 (Spülen): keine Frage — die Endspurt-Kette setzt den Termin', w11.woche === 11 && ohneFrage(w11), zeig(w11));

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
